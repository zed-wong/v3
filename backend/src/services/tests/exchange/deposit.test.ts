import { describe, test, expect, beforeEach, mock } from 'bun:test'
import {
  getDepositAddress,
  getCachedDepositAddress,
  fetchDeposits,
  getUserDeposits,
  calculateTotalDeposited,
  getLatestDepositTimestamp,
  validateDepositAddress
} from '../../exchange/deposit/deposit'
import { cache } from '../../exchange/cache'
import { ExchangeError, TransactionStatus } from '../../../types/exchange'
import type { DepositTransaction, DepositCommand } from '../../../types/exchange'

describe('Deposit Service', () => {
  const mockExchange = {
    id: 'binance',
    has: {
      fetchDepositAddress: true,
      createDepositAddress: true,
      fetchDeposits: true
    },
    fetchDepositAddress: mock(() => Promise.resolve({
      currency: 'BTC',
      address: 'bc1qtest123',
      tag: null,
      network: 'bitcoin'
    })),
    createDepositAddress: mock(() => Promise.resolve({
      currency: 'ETH',
      address: '0xtest456',
      tag: null,
      network: 'ethereum'
    })),
    fetchDeposits: mock(() => Promise.resolve([
      {
        id: 'dep1',
        txid: 'tx123',
        timestamp: 1000000,
        datetime: '2024-01-01T00:00:00Z',
        currency: 'BTC',
        amount: 0.5,
        address: 'bc1qtest123',
        tag: null,
        status: 'ok',
        fee: { currency: 'BTC', cost: 0.0001 },
        info: { network: 'bitcoin' }
      },
      {
        id: 'dep2',
        txid: 'tx456',
        timestamp: 2000000,
        datetime: '2024-01-02T00:00:00Z',
        currency: 'ETH',
        amount: 5,
        address: '0xtest456',
        tag: null,
        status: 'pending',
        fee: null,
        network: 'ethereum'
      }
    ]))
  } as any

  beforeEach(() => {
    cache.clear()
    mockExchange.fetchDepositAddress.mockClear()
    mockExchange.createDepositAddress.mockClear()
    mockExchange.fetchDeposits.mockClear()
  })

  describe('getDepositAddress', () => {
    test('should fetch deposit address when supported', async () => {
      const address = await getDepositAddress(mockExchange, 'BTC')
      
      expect(mockExchange.fetchDepositAddress).toHaveBeenCalledWith('BTC', {})
      expect(address).toEqual({
        currency: 'BTC',
        address: 'bc1qtest123',
        tag: null,
        network: 'bitcoin'
      })
    })

    test('should fetch deposit address with network', async () => {
      await getDepositAddress(mockExchange, 'USDT', 'TRC20')
      
      expect(mockExchange.fetchDepositAddress).toHaveBeenCalledWith('USDT', { network: 'TRC20' })
    })

    test('should fall back to createDepositAddress on fetch failure', async () => {
      mockExchange.fetchDepositAddress.mockRejectedValueOnce(new Error('Not found'))
      
      const address = await getDepositAddress(mockExchange, 'ETH')
      
      expect(mockExchange.createDepositAddress).toHaveBeenCalledWith('ETH', {})
      expect(address.address).toBe('0xtest456')
    })

    test('should create address when fetch not supported', async () => {
      const exchangeNoFetch = {
        ...mockExchange,
        has: { ...mockExchange.has, fetchDepositAddress: false }
      }
      
      const address = await getDepositAddress(exchangeNoFetch, 'ETH')
      
      expect(mockExchange.createDepositAddress).toHaveBeenCalled()
      expect(address.address).toBe('0xtest456')
    })

    test('should throw error when neither method supported', async () => {
      const limitedExchange = {
        id: 'limited',
        has: {
          fetchDepositAddress: false,
          createDepositAddress: false
        }
      } as any
      
      await expect(getDepositAddress(limitedExchange, 'BTC'))
        .rejects.toThrow('Exchange limited does not support deposit address operations')
    })
  })

  describe('getCachedDepositAddress', () => {
    const command: DepositCommand = {
      userId: 'user123',
      exchangeId: 'binance',
      currency: 'BTC',
      network: 'bitcoin'
    }

    test('should cache deposit address', async () => {
      const address = await getCachedDepositAddress(mockExchange, command, 3600)
      
      expect(mockExchange.fetchDepositAddress).toHaveBeenCalledTimes(1)
      
      // Second call should use cache
      const cachedAddress = await getCachedDepositAddress(mockExchange, command, 3600)
      expect(mockExchange.fetchDepositAddress).toHaveBeenCalledTimes(1)
      expect(cachedAddress).toEqual(address)
    })

    test('should use proper cache key', async () => {
      await getCachedDepositAddress(mockExchange, command, 3600)
      
      const cacheKey = 'deposit-address-binance-user123-BTC-bitcoin'
      expect(cache.get(cacheKey)).toBeTruthy()
    })

    test('should handle network-less deposits', async () => {
      const commandNoNetwork = { ...command, network: undefined }
      await getCachedDepositAddress(mockExchange, commandNoNetwork, 3600)
      
      const cacheKey = 'deposit-address-binance-user123-BTC-default'
      expect(cache.get(cacheKey)).toBeTruthy()
    })
  })

  describe('fetchDeposits', () => {
    test('should fetch all deposits', async () => {
      const deposits = await fetchDeposits(mockExchange)
      
      expect(mockExchange.fetchDeposits).toHaveBeenCalledWith(undefined, undefined, undefined, {})
      expect(deposits).toHaveLength(2)
    })

    test('should fetch deposits with parameters', async () => {
      await fetchDeposits(mockExchange, 'BTC', 1000000, 10)
      
      expect(mockExchange.fetchDeposits).toHaveBeenCalledWith('BTC', 1000000, 10, { limit: 10 })
    })

    test('should map deposit status correctly', async () => {
      const deposits = await fetchDeposits(mockExchange)
      
      expect(deposits[0].status).toBe(TransactionStatus.OK)
      expect(deposits[1].status).toBe(TransactionStatus.PENDING)
    })

    test('should handle missing data gracefully', async () => {
      mockExchange.fetchDeposits.mockResolvedValueOnce([{
        // Minimal deposit data
        currency: 'BTC',
        amount: 1
      }])
      
      const deposits = await fetchDeposits(mockExchange)
      
      expect(deposits[0]).toMatchObject({
        id: '',
        timestamp: 0,
        currency: 'BTC',
        amount: 1,
        address: '',
        status: TransactionStatus.PENDING
      })
    })

    test('should throw error when not supported', async () => {
      const limitedExchange = {
        id: 'limited',
        has: { fetchDeposits: false }
      } as any
      
      await expect(fetchDeposits(limitedExchange))
        .rejects.toThrow('Exchange limited does not support fetching deposits')
    })
  })

  describe('getUserDeposits', () => {
    test('should fetch and cache user deposits', async () => {
      const deposits = await getUserDeposits(mockExchange, 'user123', 'BTC')
      
      expect(mockExchange.fetchDeposits).toHaveBeenCalledTimes(1)
      expect(deposits).toHaveLength(2)
      
      // Second call should use cache
      const cachedDeposits = await getUserDeposits(mockExchange, 'user123', 'BTC')
      expect(mockExchange.fetchDeposits).toHaveBeenCalledTimes(1)
      expect(cachedDeposits).toEqual(deposits)
    })

    test('should use proper cache key', async () => {
      await getUserDeposits(mockExchange, 'user123', 'BTC', 1000000)
      
      const cacheKey = 'deposits-binance-user123-BTC-1000000'
      expect(cache.get(cacheKey)).toBeTruthy()
    })

    test('should handle all currencies', async () => {
      await getUserDeposits(mockExchange, 'user123')
      
      const cacheKey = 'deposits-binance-user123-all-all'
      expect(cache.get(cacheKey)).toBeTruthy()
    })
  })

  describe('calculateTotalDeposited', () => {
    const deposits: DepositTransaction[] = [
      {
        id: '1',
        timestamp: 1000000,
        datetime: '2024-01-01',
        currency: 'BTC',
        amount: 0.5,
        address: 'addr1',
        type: 'deposit' as any,
        status: TransactionStatus.OK
      },
      {
        id: '2',
        timestamp: 2000000,
        datetime: '2024-01-02',
        currency: 'BTC',
        amount: 0.3,
        address: 'addr1',
        type: 'deposit' as any,
        status: TransactionStatus.OK
      },
      {
        id: '3',
        timestamp: 3000000,
        datetime: '2024-01-03',
        currency: 'ETH',
        amount: 5,
        address: 'addr2',
        type: 'deposit' as any,
        status: TransactionStatus.OK
      },
      {
        id: '4',
        timestamp: 4000000,
        datetime: '2024-01-04',
        currency: 'BTC',
        amount: 0.2,
        address: 'addr1',
        type: 'deposit' as any,
        status: TransactionStatus.PENDING // Should be ignored
      }
    ]

    test('should calculate total for all currencies', () => {
      const totals = calculateTotalDeposited(deposits)
      
      expect(totals).toEqual({
        BTC: '0.8', // 0.5 + 0.3
        ETH: '5'
      })
    })

    test('should filter by currency', () => {
      const totals = calculateTotalDeposited(deposits, 'BTC')
      
      expect(totals).toEqual({
        BTC: '0.8'
      })
      expect(totals).not.toHaveProperty('ETH')
    })

    test('should only include OK status deposits', () => {
      const depositsWithFailed = [
        ...deposits,
        {
          id: '5',
          timestamp: 5000000,
          datetime: '2024-01-05',
          currency: 'BTC',
          amount: 1,
          address: 'addr1',
          type: 'deposit' as any,
          status: TransactionStatus.FAILED
        }
      ]
      
      const totals = calculateTotalDeposited(depositsWithFailed, 'BTC')
      expect(totals.BTC).toBe('0.8') // Failed deposit not included
    })

    test('should handle empty deposits', () => {
      const totals = calculateTotalDeposited([])
      expect(totals).toEqual({})
    })

    test('should use Big for precise calculations', () => {
      const precisionDeposits: DepositTransaction[] = [
        {
          id: '1',
          timestamp: 1000000,
          datetime: '2024-01-01',
          currency: 'BTC',
          amount: 0.1,
          address: 'addr',
          type: 'deposit' as any,
          status: TransactionStatus.OK
        },
        {
          id: '2',
          timestamp: 2000000,
          datetime: '2024-01-02',
          currency: 'BTC',
          amount: 0.2,
          address: 'addr',
          type: 'deposit' as any,
          status: TransactionStatus.OK
        }
      ]
      
      const totals = calculateTotalDeposited(precisionDeposits)
      expect(totals.BTC).toBe('0.3') // Avoiding floating point errors
    })
  })

  describe('getLatestDepositTimestamp', () => {
    const deposits: DepositTransaction[] = [
      {
        id: '1',
        timestamp: 1000000,
        datetime: '2024-01-01',
        currency: 'BTC',
        amount: 0.5,
        address: 'addr1',
        type: 'deposit' as any,
        status: TransactionStatus.OK
      },
      {
        id: '2',
        timestamp: 3000000,
        datetime: '2024-01-03',
        currency: 'ETH',
        amount: 5,
        address: 'addr2',
        type: 'deposit' as any,
        status: TransactionStatus.OK
      },
      {
        id: '3',
        timestamp: 2000000,
        datetime: '2024-01-02',
        currency: 'BTC',
        amount: 0.3,
        address: 'addr1',
        type: 'deposit' as any,
        status: TransactionStatus.OK
      }
    ]

    test('should get latest timestamp from all deposits', () => {
      const latest = getLatestDepositTimestamp(deposits)
      expect(latest).toBe(3000000)
    })

    test('should get latest timestamp for specific currency', () => {
      const latest = getLatestDepositTimestamp(deposits, 'BTC')
      expect(latest).toBe(2000000)
    })

    test('should return undefined for empty array', () => {
      const latest = getLatestDepositTimestamp([])
      expect(latest).toBeUndefined()
    })

    test('should return undefined for non-existent currency', () => {
      const latest = getLatestDepositTimestamp(deposits, 'USDT')
      expect(latest).toBeUndefined()
    })
  })

  describe('validateDepositAddress', () => {
    test('should validate non-empty address', () => {
      expect(validateDepositAddress('bc1qtest123', 'BTC')).toBe(true)
      expect(validateDepositAddress('0x1234567890abcdef', 'ETH')).toBe(true)
    })

    test('should reject empty address', () => {
      expect(validateDepositAddress('', 'BTC')).toBe(false)
    })

    test('should handle network parameter', () => {
      expect(validateDepositAddress('TTest123', 'USDT', 'TRC20')).toBe(true)
    })
  })
})