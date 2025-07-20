import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { Decimal } from 'decimal.js'
import {
  createWithdrawal,
  withdraw,
  fetchWithdrawals,
  getUserWithdrawals,
  calculateTotalWithdrawn,
  getLatestWithdrawalTimestamp,
  getWithdrawalFees,
  validateWithdrawalAddress,
  calculateNetWithdrawalAmount
} from '../../exchange/withdraw/withdraw'
import { cache } from '../../exchange/cache'
import { ExchangeError, InsufficientBalanceError, TransactionStatus } from '../../../types/exchange'
import type { WithdrawalTransaction, WithdrawalCommand } from '../../../types/exchange'

describe('Withdraw Service', () => {
  const mockExchange = {
    id: 'binance',
    has: {
      withdraw: true,
      fetchWithdrawals: true,
      fetchCurrencies: true
    },
    fetchBalance: mock(() => Promise.resolve({
      BTC: { free: 1, used: 0, total: 1 },
      ETH: { free: 10, used: 0, total: 10 },
      USDT: { free: 1000, used: 0, total: 1000 }
    })),
    withdraw: mock(() => Promise.resolve({
      id: 'wd123',
      txid: 'tx789',
      status: 'pending',
      info: { network: 'bitcoin' },
      fee: { currency: 'BTC', cost: 0.0005 }
    })),
    fetchWithdrawals: mock(() => Promise.resolve([
      {
        id: 'wd1',
        txid: 'tx123',
        timestamp: 1000000,
        datetime: '2024-01-01T00:00:00Z',
        currency: 'BTC',
        amount: 0.5,
        address: 'bc1qtest123',
        tag: null,
        status: 'ok',
        fee: { currency: 'BTC', cost: 0.0005 },
        info: { network: 'bitcoin' }
      },
      {
        id: 'wd2',
        txid: 'tx456',
        timestamp: 2000000,
        datetime: '2024-01-02T00:00:00Z',
        currency: 'ETH',
        amount: 5,
        address: '0xtest456',
        tag: null,
        status: 'pending',
        fee: { currency: 'ETH', cost: 0.01 },
        network: 'ethereum'
      }
    ])),
    fetchCurrencies: mock(() => Promise.resolve({
      BTC: { fee: 0.0005 },
      ETH: { fee: 0.01 },
      USDT: { fee: 1 }
    }))
  } as any

  beforeEach(() => {
    cache.clear()
    mockExchange.fetchBalance.mockClear()
    mockExchange.withdraw.mockClear()
    mockExchange.fetchWithdrawals.mockClear()
    mockExchange.fetchCurrencies.mockClear()
  })

  describe('createWithdrawal', () => {
    test('should create withdrawal with balance check', async () => {
      const result = await createWithdrawal(
        mockExchange,
        'BTC',
        0.5,
        'bc1qtest123',
        undefined,
        {}
      )
      
      expect(mockExchange.fetchBalance).toHaveBeenCalled()
      expect(mockExchange.withdraw).toHaveBeenCalledWith('BTC', 0.5, 'bc1qtest123', undefined, {})
      expect(result).toMatchObject({
        id: 'wd123',
        txid: 'tx789',
        currency: 'BTC',
        amount: 0.5,
        address: 'bc1qtest123',
        status: 'pending'
      })
    })

    test('should include withdrawal fee', async () => {
      const result = await createWithdrawal(
        mockExchange,
        'BTC',
        0.5,
        'bc1qtest123'
      )
      
      expect(result.fee).toEqual({
        currency: 'BTC',
        cost: 0.0005
      })
    })

    test('should throw InsufficientBalanceError', async () => {
      await expect(createWithdrawal(
        mockExchange,
        'BTC',
        2, // More than available
        'bc1qtest123'
      )).rejects.toThrow(InsufficientBalanceError)
    })

    test('should handle missing balance data', async () => {
      mockExchange.fetchBalance.mockResolvedValueOnce({})
      
      // Should not throw when balance data missing (exchange handles it)
      await expect(createWithdrawal(
        mockExchange,
        'XRP',
        1,
        'rTest123'
      )).resolves.toBeTruthy()
    })

    test('should throw error when withdraw not supported', async () => {
      const limitedExchange = {
        id: 'limited',
        has: { withdraw: false }
      } as any
      
      await expect(createWithdrawal(limitedExchange, 'BTC', 0.1, 'addr'))
        .rejects.toThrow('Exchange limited does not support withdrawals')
    })

    test('should handle withdrawal with tag', async () => {
      await createWithdrawal(
        mockExchange,
        'XRP',
        100,
        'rTest123',
        '12345',
        {}
      )
      
      expect(mockExchange.withdraw).toHaveBeenCalledWith(
        'XRP',
        100,
        'rTest123',
        '12345',
        {}
      )
    })
  })

  describe('withdraw', () => {
    const command: WithdrawalCommand = {
      userId: 'user123',
      exchangeId: 'binance',
      currency: 'BTC',
      amount: 0.5,
      address: 'bc1qtest123',
      network: 'bitcoin'
    }

    test('should process withdrawal command', async () => {
      const result = await withdraw(mockExchange, command)
      
      expect(mockExchange.withdraw).toHaveBeenCalledWith(
        'BTC',
        0.5,
        'bc1qtest123',
        undefined,
        { network: 'bitcoin' }
      )
      expect(result.network).toBe('bitcoin')
    })

    test('should handle withdrawal with tag', async () => {
      const commandWithTag = { ...command, tag: '12345' }
      
      await withdraw(mockExchange, commandWithTag)
      
      expect(mockExchange.withdraw).toHaveBeenCalledWith(
        'BTC',
        0.5,
        'bc1qtest123',
        '12345',
        { network: 'bitcoin' }
      )
    })
  })

  describe('fetchWithdrawals', () => {
    test('should fetch all withdrawals', async () => {
      const withdrawals = await fetchWithdrawals(mockExchange)
      
      expect(mockExchange.fetchWithdrawals).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        {}
      )
      expect(withdrawals).toHaveLength(2)
    })

    test('should fetch withdrawals with parameters', async () => {
      await fetchWithdrawals(mockExchange, 'BTC', 1000000, 10)
      
      expect(mockExchange.fetchWithdrawals).toHaveBeenCalledWith(
        'BTC',
        1000000,
        10,
        { limit: 10 }
      )
    })

    test('should map withdrawal status correctly', async () => {
      const withdrawals = await fetchWithdrawals(mockExchange)
      
      expect(withdrawals[0].status).toBe(TransactionStatus.OK)
      expect(withdrawals[1].status).toBe(TransactionStatus.PENDING)
    })

    test('should handle missing data gracefully', async () => {
      mockExchange.fetchWithdrawals.mockResolvedValueOnce([{
        currency: 'BTC',
        amount: 1,
        address: 'addr'
      }])
      
      const withdrawals = await fetchWithdrawals(mockExchange)
      
      expect(withdrawals[0]).toMatchObject({
        id: '',
        timestamp: 0,
        currency: 'BTC',
        amount: 1,
        address: 'addr',
        status: TransactionStatus.PENDING
      })
    })

    test('should throw error when not supported', async () => {
      const limitedExchange = {
        id: 'limited',
        has: { fetchWithdrawals: false }
      } as any
      
      await expect(fetchWithdrawals(limitedExchange))
        .rejects.toThrow('Exchange limited does not support fetching withdrawals')
    })
  })

  describe('getUserWithdrawals', () => {
    test('should fetch and cache user withdrawals', async () => {
      const withdrawals = await getUserWithdrawals(mockExchange, 'user123', 'BTC')
      
      expect(mockExchange.fetchWithdrawals).toHaveBeenCalledTimes(1)
      
      // Second call should use cache
      const cachedWithdrawals = await getUserWithdrawals(mockExchange, 'user123', 'BTC')
      expect(mockExchange.fetchWithdrawals).toHaveBeenCalledTimes(1)
      expect(cachedWithdrawals).toEqual(withdrawals)
    })

    test('should use proper cache key', async () => {
      await getUserWithdrawals(mockExchange, 'user123', 'BTC', 1000000)
      
      const cacheKey = 'withdrawals-binance-user123-BTC-1000000'
      expect(cache.get(cacheKey)).toBeTruthy()
    })
  })

  describe('calculateTotalWithdrawn', () => {
    const withdrawals: WithdrawalTransaction[] = [
      {
        id: '1',
        timestamp: 1000000,
        datetime: '2024-01-01',
        currency: 'BTC',
        amount: 0.5,
        address: 'addr1',
        type: 'withdrawal' as any,
        status: TransactionStatus.OK,
        fee: { currency: 'BTC', cost: 0.0005 }
      },
      {
        id: '2',
        timestamp: 2000000,
        datetime: '2024-01-02',
        currency: 'BTC',
        amount: 0.3,
        address: 'addr2',
        type: 'withdrawal' as any,
        status: TransactionStatus.OK,
        fee: { currency: 'BTC', cost: 0.0005 }
      },
      {
        id: '3',
        timestamp: 3000000,
        datetime: '2024-01-03',
        currency: 'ETH',
        amount: 5,
        address: 'addr3',
        type: 'withdrawal' as any,
        status: TransactionStatus.OK,
        fee: { currency: 'ETH', cost: 0.01 }
      },
      {
        id: '4',
        timestamp: 4000000,
        datetime: '2024-01-04',
        currency: 'BTC',
        amount: 0.2,
        address: 'addr4',
        type: 'withdrawal' as any,
        status: TransactionStatus.PENDING // Should be ignored
      }
    ]

    test('should calculate total including fees', () => {
      const totals = calculateTotalWithdrawn(withdrawals)
      
      expect(totals).toEqual({
        BTC: '0.801', // 0.5 + 0.3 + 0.0005 + 0.0005 (fees)
        ETH: '5.01'   // 5 + 0.01 (fee)
      })
    })

    test('should filter by currency', () => {
      const totals = calculateTotalWithdrawn(withdrawals, 'BTC')
      
      expect(totals).toEqual({
        BTC: '0.801'
      })
      expect(totals).not.toHaveProperty('ETH')
    })

    test('should handle fee in different currency', () => {
      const withdrawalsWithDiffFee: WithdrawalTransaction[] = [
        {
          id: '1',
          timestamp: 1000000,
          datetime: '2024-01-01',
          currency: 'BTC',
          amount: 1,
          address: 'addr',
          type: 'withdrawal' as any,
          status: TransactionStatus.OK,
          fee: { currency: 'USDT', cost: 5 } // Fee in different currency
        }
      ]
      
      const totals = calculateTotalWithdrawn(withdrawalsWithDiffFee)
      expect(totals.BTC).toBe('1') // Fee not added to BTC total
    })

    test('should handle no fee', () => {
      const withdrawalsNoFee: WithdrawalTransaction[] = [
        {
          id: '1',
          timestamp: 1000000,
          datetime: '2024-01-01',
          currency: 'BTC',
          amount: 1,
          address: 'addr',
          type: 'withdrawal' as any,
          status: TransactionStatus.OK
        }
      ]
      
      const totals = calculateTotalWithdrawn(withdrawalsNoFee)
      expect(totals.BTC).toBe('1')
    })
  })

  describe('getLatestWithdrawalTimestamp', () => {
    const withdrawals: WithdrawalTransaction[] = [
      {
        id: '1',
        timestamp: 1000000,
        datetime: '2024-01-01',
        currency: 'BTC',
        amount: 0.5,
        address: 'addr1',
        type: 'withdrawal' as any,
        status: TransactionStatus.OK
      },
      {
        id: '2',
        timestamp: 3000000,
        datetime: '2024-01-03',
        currency: 'ETH',
        amount: 5,
        address: 'addr2',
        type: 'withdrawal' as any,
        status: TransactionStatus.OK
      },
      {
        id: '3',
        timestamp: 2000000,
        datetime: '2024-01-02',
        currency: 'BTC',
        amount: 0.3,
        address: 'addr3',
        type: 'withdrawal' as any,
        status: TransactionStatus.OK
      }
    ]

    test('should get latest timestamp from all withdrawals', () => {
      const latest = getLatestWithdrawalTimestamp(withdrawals)
      expect(latest).toBe(3000000)
    })

    test('should get latest timestamp for specific currency', () => {
      const latest = getLatestWithdrawalTimestamp(withdrawals, 'BTC')
      expect(latest).toBe(2000000)
    })

    test('should return undefined for empty array', () => {
      const latest = getLatestWithdrawalTimestamp([])
      expect(latest).toBeUndefined()
    })
  })

  describe('getWithdrawalFees', () => {
    test('should fetch withdrawal fees from currencies', async () => {
      const fees = await getWithdrawalFees(mockExchange)
      
      expect(mockExchange.fetchCurrencies).toHaveBeenCalled()
      expect(fees).toEqual({
        BTC: 0.0005,
        ETH: 0.01,
        USDT: 1
      })
    })

    test('should handle missing fee data', async () => {
      mockExchange.fetchCurrencies.mockResolvedValueOnce({
        BTC: { fee: 0.0005 },
        ETH: {}, // No fee property
        USDT: { fee: null }, // Null fee
        XRP: { fee: 0 } // Zero fee
      })
      
      const fees = await getWithdrawalFees(mockExchange)
      
      expect(fees).toEqual({
        BTC: 0.0005,
        USDT: 0,
        XRP: 0
      })
      expect(fees).not.toHaveProperty('ETH') // No fee property means excluded
    })

    test('should throw error when not supported', async () => {
      const limitedExchange = {
        id: 'limited',
        has: { fetchCurrencies: false }
      } as any
      
      await expect(getWithdrawalFees(limitedExchange))
        .rejects.toThrow('Exchange limited does not support fetching withdrawal fees')
    })
  })

  describe('validateWithdrawalAddress', () => {
    test('should validate non-empty address', () => {
      expect(validateWithdrawalAddress('bc1qtest123', 'BTC')).toBe(true)
      expect(validateWithdrawalAddress('0x1234567890abcdef', 'ETH')).toBe(true)
    })

    test('should reject empty address', () => {
      expect(validateWithdrawalAddress('', 'BTC')).toBe(false)
    })

    test('should handle network parameter', () => {
      expect(validateWithdrawalAddress('TTest123', 'USDT', 'TRC20')).toBe(true)
    })
  })

  describe('calculateNetWithdrawalAmount', () => {
    test('should subtract fee from amount when same currency', () => {
      const net = calculateNetWithdrawalAmount(1, 0.0005, 'BTC', 'BTC')
      expect(net).toBe(0.9995)
    })

    test('should not subtract fee when different currency', () => {
      const net = calculateNetWithdrawalAmount(1, 5, 'USDT', 'BTC')
      expect(net).toBe(1)
    })

    test('should handle decimal precision', () => {
      const net = calculateNetWithdrawalAmount(0.1, 0.0005, 'BTC', 'BTC')
      expect(net).toBe(0.0995)
    })
  })
})