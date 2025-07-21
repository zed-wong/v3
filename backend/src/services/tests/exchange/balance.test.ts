import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { Big } from 'big.js'
import {
  fetchExchangeBalance,
  getExchangeBalance,
  calculateBalanceFromTransactions,
  getIncrementalTransactions,
  mergeTransactions,
  getLatestTimestamp,
  formatBalance,
  formatBalances,
  validateSufficientBalance
} from '../../exchange/balance/balance'
import { cache } from '../../exchange/cache'
import { ExchangeError, TransactionType, TransactionStatus } from '../../../types/exchange'
import type { TransactionData } from '../../../types/exchange'

describe('Balance Service', () => {
  const mockExchange = {
    id: 'binance',
    fetchBalance: mock(() => Promise.resolve({
      BTC: { free: 1.5, used: 0.5, total: 2 },
      ETH: { free: 10, used: 0, total: 10 },
      USDT: { free: 1000, used: 500, total: 1500 }
    }))
  } as any

  beforeEach(() => {
    cache.clear()
    mockExchange.fetchBalance.mockClear()
  })

  describe('fetchExchangeBalance', () => {
    test('should fetch all balances', async () => {
      const balances = await fetchExchangeBalance(mockExchange)
      
      expect(mockExchange.fetchBalance).toHaveBeenCalled()
      expect(balances).toHaveProperty('BTC')
      expect(balances).toHaveProperty('ETH')
      expect(balances).toHaveProperty('USDT')
    })

    test('should filter by currencies', async () => {
      const balances = await fetchExchangeBalance(mockExchange, ['BTC', 'ETH'])
      
      expect(balances).toHaveProperty('BTC')
      expect(balances).toHaveProperty('ETH')
      expect(balances).not.toHaveProperty('USDT')
    })

    test('should handle exchange errors', async () => {
      mockExchange.fetchBalance.mockRejectedValueOnce(new Error('API Error'))
      
      await expect(fetchExchangeBalance(mockExchange))
        .rejects.toThrow(ExchangeError)
    })
  })

  describe('getExchangeBalance', () => {
    const command = {
      userId: 'user123',
      exchangeId: 'binance',
      currencies: ['BTC', 'ETH']
    }

    test('should fetch and cache balance', async () => {
      const balances = await getExchangeBalance(mockExchange, command, 60)
      
      expect(mockExchange.fetchBalance).toHaveBeenCalledTimes(1)
      expect(balances).toHaveProperty('BTC')
      
      // Second call should use cache
      const cachedBalances = await getExchangeBalance(mockExchange, command, 60)
      expect(mockExchange.fetchBalance).toHaveBeenCalledTimes(1) // Not called again
      expect(cachedBalances).toEqual(balances)
    })

    test('should use cache key with userId', async () => {
      await getExchangeBalance(mockExchange, command, 60)
      
      const cacheKey = `balance-binance-user123`
      expect(cache.get(cacheKey)).toBeTruthy()
    })
  })

  describe('calculateBalanceFromTransactions', () => {
    test('should calculate balance from deposit and withdrawal transactions', () => {
      const transactions: TransactionData[] = [
        {
          id: '1',
          timestamp: 1000,
          symbol: 'BTC',
          amount: '2.5',
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.OK,
          exchange: 'binance'
        },
        {
          id: '2',
          timestamp: 2000,
          symbol: 'BTC',
          amount: '0.5',
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.OK,
          exchange: 'binance'
        },
        {
          id: '3',
          timestamp: 3000,
          symbol: 'ETH',
          amount: '10',
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.OK,
          exchange: 'binance'
        }
      ]
      
      const result = calculateBalanceFromTransactions(transactions)
      
      expect(result.BTC).toEqual({
        deposit: '2.5',
        withdrawal: '0.5',
        total: '2',
        exchange: 'binance'
      })
      
      expect(result.ETH).toEqual({
        deposit: '10',
        withdrawal: '0',
        total: '10',
        exchange: 'binance'
      })
    })

    test('should ignore non-OK transactions', () => {
      const transactions: TransactionData[] = [
        {
          id: '1',
          timestamp: 1000,
          symbol: 'BTC',
          amount: '1',
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.OK
        },
        {
          id: '2',
          timestamp: 2000,
          symbol: 'BTC',
          amount: '0.5',
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING
        },
        {
          id: '3',
          timestamp: 3000,
          symbol: 'BTC',
          amount: '0.3',
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.FAILED
        }
      ]
      
      const result = calculateBalanceFromTransactions(transactions)
      
      expect(result.BTC.total).toBe('1') // Only OK transaction counted
    })

    test('should handle empty transactions', () => {
      const result = calculateBalanceFromTransactions([])
      expect(result).toEqual({})
    })

    test('should use Big for precise calculations', () => {
      const transactions: TransactionData[] = [
        {
          id: '1',
          timestamp: 1000,
          symbol: 'BTC',
          amount: '0.1',
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.OK
        },
        {
          id: '2',
          timestamp: 2000,
          symbol: 'BTC',
          amount: '0.2',
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.OK
        },
        {
          id: '3',
          timestamp: 3000,
          symbol: 'BTC',
          amount: '0.05',
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.OK
        }
      ]
      
      const result = calculateBalanceFromTransactions(transactions)
      
      // 0.1 + 0.2 - 0.05 = 0.25 (avoiding floating point errors)
      expect(result.BTC.total).toBe('0.25')
    })
  })

  describe('getIncrementalTransactions', () => {
    const mockFetchFn = mock((since?: number) => {
      if (since) {
        return Promise.resolve([
          { id: '3', timestamp: 3000 },
          { id: '4', timestamp: 4000 }
        ])
      }
      return Promise.resolve([
        { id: '1', timestamp: 1000 },
        { id: '2', timestamp: 2000 },
        { id: '3', timestamp: 3000 },
        { id: '4', timestamp: 4000 }
      ])
    })

    test('should fetch all transactions when no lastTimestamp', async () => {
      const transactions = await getIncrementalTransactions(mockFetchFn)
      
      expect(mockFetchFn).toHaveBeenCalledWith()
      expect(transactions).toHaveLength(4)
    })

    test('should fetch only new transactions with lastTimestamp', async () => {
      const transactions = await getIncrementalTransactions(mockFetchFn, 2000)
      
      expect(mockFetchFn).toHaveBeenCalledWith(2001)
      expect(transactions).toHaveLength(2)
      expect(transactions[0].id).toBe('3')
    })
  })

  describe('mergeTransactions', () => {
    test('should merge and deduplicate transactions', () => {
      const existing: TransactionData[] = [
        { id: '1', timestamp: 1000, symbol: 'BTC', amount: '1', type: TransactionType.DEPOSIT, status: TransactionStatus.OK },
        { id: '2', timestamp: 2000, symbol: 'BTC', amount: '1', type: TransactionType.DEPOSIT, status: TransactionStatus.OK }
      ]
      
      const newTxs: TransactionData[] = [
        { id: '2', timestamp: 2000, symbol: 'BTC', amount: '1.1', type: TransactionType.DEPOSIT, status: TransactionStatus.OK }, // Updated
        { id: '3', timestamp: 3000, symbol: 'BTC', amount: '1', type: TransactionType.DEPOSIT, status: TransactionStatus.OK }
      ]
      
      const merged = mergeTransactions(existing, newTxs)
      
      expect(merged).toHaveLength(3)
      expect(merged.find(tx => tx.id === '2')?.amount).toBe('1.1') // Updated value
      expect(merged[0].id).toBe('1') // Sorted by timestamp
      expect(merged[2].id).toBe('3')
    })
  })

  describe('getLatestTimestamp', () => {
    const transactions: TransactionData[] = [
      { id: '1', timestamp: 1000, symbol: 'BTC', amount: '1', type: TransactionType.DEPOSIT, status: TransactionStatus.OK },
      { id: '2', timestamp: 3000, symbol: 'ETH', amount: '1', type: TransactionType.DEPOSIT, status: TransactionStatus.OK },
      { id: '3', timestamp: 2000, symbol: 'BTC', amount: '1', type: TransactionType.DEPOSIT, status: TransactionStatus.OK }
    ]

    test('should get latest timestamp from all transactions', () => {
      const latest = getLatestTimestamp(transactions)
      expect(latest).toBe(3000)
    })

    test('should get latest timestamp for specific symbol', () => {
      const latest = getLatestTimestamp(transactions, 'BTC')
      expect(latest).toBe(2000)
    })

    test('should return undefined for empty array', () => {
      const latest = getLatestTimestamp([])
      expect(latest).toBeUndefined()
    })

    test('should return undefined for non-existent symbol', () => {
      const latest = getLatestTimestamp(transactions, 'USDT')
      expect(latest).toBeUndefined()
    })
  })

  describe('formatBalance', () => {
    test('should format balance to strings', () => {
      const balance = { free: 1.5, used: 0.5, total: 2, currency: 'BTC' }
      const formatted = formatBalance(balance)
      
      expect(formatted).toEqual({
        free: '1.5',
        used: '0.5',
        total: '2'
      })
    })

    test('should handle undefined values', () => {
      const balance = { currency: 'BTC' } as any
      const formatted = formatBalance(balance)
      
      expect(formatted).toEqual({
        free: '0',
        used: '0',
        total: '0'
      })
    })
  })

  describe('formatBalances', () => {
    test('should format all balances and filter zero balances', () => {
      const balances = {
        BTC: { free: 1.5, used: 0.5, total: 2 },
        ETH: { free: 0, used: 0, total: 0 },
        USDT: { free: 1000, used: 0, total: 1000 },
        info: {} // Should be skipped
      } as any
      
      const formatted = formatBalances(balances)
      
      expect(formatted).toHaveProperty('BTC')
      expect(formatted).toHaveProperty('USDT')
      expect(formatted).not.toHaveProperty('ETH') // Zero balance filtered out
      expect(formatted).not.toHaveProperty('info')
    })
  })

  describe('validateSufficientBalance', () => {
    test('should pass validation for sufficient balance', () => {
      const balance = { free: 10, used: 0, total: 10 }
      
      expect(() => validateSufficientBalance(balance, 5, 'BTC')).not.toThrow()
    })

    test('should throw error for insufficient balance', () => {
      const balance = { free: 5, used: 5, total: 10 }
      
      expect(() => validateSufficientBalance(balance, 10, 'BTC'))
        .toThrow('Insufficient BTC balance. Required: 10, Available: 5')
    })

    test('should handle undefined free balance', () => {
      const balance = { used: 5, total: 10 } as any
      
      expect(() => validateSufficientBalance(balance, 1, 'BTC'))
        .toThrow('Insufficient BTC balance. Required: 1, Available: 0')
    })
  })
})