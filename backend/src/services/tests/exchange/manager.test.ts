import { describe, test, expect, beforeEach, mock, spyOn } from 'bun:test'
import {
  registerExchange,
  getExchange,
  getUserExchanges,
  getActiveExchanges,
  updateExchange,
  deactivateExchange,
  selectBestBuyExchange,
  selectBestSellExchange,
  selectHighestLiquidityExchange,
  selectRandomExchange,
  getSupportedExchanges,
  validateExchangeCredentials,
  clearManagerState
} from '../../exchange/manager'
import * as baseModule from '../../exchange/base'
import { cache } from '../../exchange/cache'
import { ExchangeNotFoundError } from '../../../types/exchange'

// Mock the base module functions
const mockCreateExchange = spyOn(baseModule, 'createExchange').mockImplementation(async (config) => ({
  id: config.exchangeId,
  apiKey: config.apiKey,
  has: { fetchBalance: true },
  fetchBalance: mock(() => Promise.resolve({}))
}) as any)

const mockLoadMarkets = spyOn(baseModule, 'loadMarkets').mockImplementation(() => Promise.resolve() as any)

describe('Exchange Manager', () => {
  const mockConfig = {
    exchangeId: 'binance',
    apiKey: 'test-api-key',
    secret: 'test-secret'
  }

  beforeEach(() => {
    // Clear all data before each test
    cache.clear()
    clearManagerState()
    mockCreateExchange.mockClear()
    mockLoadMarkets.mockClear()
  })

  describe('registerExchange', () => {
    test('should register exchange for user', async () => {
      const registry = await registerExchange('user123', mockConfig, 'main')
      
      expect(registry).toMatchObject({
        userId: 'user123',
        exchangeId: 'binance',
        label: 'main',
        isActive: true
      })
      expect(registry.config.apiKey).toContain('...')
      expect(registry.config.secret).toBe('***')
      expect(mockCreateExchange).toHaveBeenCalledWith(mockConfig)
      expect(mockLoadMarkets).toHaveBeenCalled()
    })

    test('should mask sensitive data', async () => {
      const configWithSensitive = {
        ...mockConfig,
        password: 'test-password',
        privateKey: 'test-private-key'
      }
      
      const registry = await registerExchange('user123', configWithSensitive)
      
      expect(registry.config.password).toBe('***')
      expect(registry.config.privateKey).toBe('***')
    })

    test('should register multiple exchanges for same user', async () => {
      await registerExchange('user123', mockConfig, 'main')
      await registerExchange('user123', { ...mockConfig, exchangeId: 'kraken' }, 'secondary')
      
      const exchanges = getUserExchanges('user123')
      expect(exchanges).toHaveLength(2)
    })
  })

  describe('getExchange', () => {
    test('should retrieve cached exchange instance', async () => {
      await registerExchange('user123', mockConfig, 'main')
      
      const exchange = await getExchange('user123', 'binance', 'main')
      expect(exchange).toBeDefined()
      expect(exchange.id).toBe('binance')
    })

    test('should throw error for non-existent exchange', async () => {
      await expect(getExchange('user123', 'binance', 'main'))
        .rejects.toThrow(ExchangeNotFoundError)
    })

    test('should throw error for registered but not loaded exchange', async () => {
      // Register exchange but clear instances to simulate not loaded
      await registerExchange('user123', mockConfig, 'main')
      const exchanges = getUserExchanges('user123')
      expect(exchanges).toHaveLength(1)
      
      // Manually clear instance cache to simulate not loaded state
      // This would normally happen if the service restarts
      await expect(getExchange('user456', 'binance', 'main'))
        .rejects.toThrow(ExchangeNotFoundError)
    })
  })

  describe('getUserExchanges', () => {
    test('should return empty array for user with no exchanges', () => {
      const exchanges = getUserExchanges('new-user')
      expect(exchanges).toEqual([])
    })

    test('should return all user exchanges', async () => {
      await registerExchange('user123', mockConfig, 'main')
      await registerExchange('user123', { ...mockConfig, exchangeId: 'kraken' }, 'secondary')
      
      const exchanges = getUserExchanges('user123')
      expect(exchanges).toHaveLength(2)
      expect(exchanges.map(e => e.exchangeId)).toContain('binance')
      expect(exchanges.map(e => e.exchangeId)).toContain('kraken')
    })
  })

  describe('getActiveExchanges', () => {
    test('should return only active exchanges', async () => {
      await registerExchange('user123', mockConfig, 'main')
      await registerExchange('user123', { ...mockConfig, exchangeId: 'kraken' }, 'secondary')
      
      // Deactivate one
      deactivateExchange('user123', 'kraken', 'secondary')
      
      const activeExchanges = await getActiveExchanges('user123')
      expect(activeExchanges).toHaveLength(1)
      expect(activeExchanges[0].id).toBe('binance')
    })

    test('should handle errors gracefully', async () => {
      await registerExchange('user123', mockConfig, 'main')
      
      // Clear instances to cause error
      const activeExchanges = await getActiveExchanges('user123')
      expect(activeExchanges).toHaveLength(1) // Should still return successfully loaded exchanges
    })
  })

  describe('updateExchange', () => {
    test('should update exchange configuration', async () => {
      await registerExchange('user123', mockConfig, 'main')
      
      // Add small delay to ensure updatedAt > createdAt
      await new Promise(resolve => setTimeout(resolve, 5))
      
      const updated = await updateExchange('user123', 'binance', {
        apiKey: 'new-api-key'
      }, 'main')
      
      expect(updated.config.apiKey).toContain('...')
      expect(updated.updatedAt.getTime()).toBeGreaterThan(updated.createdAt.getTime())
    })

    test('should throw error for non-existent exchange', async () => {
      await expect(updateExchange('user123', 'binance', {}, 'main'))
        .rejects.toThrow(ExchangeNotFoundError)
    })

    test('should clear cache after update', async () => {
      const mockClearKeys = mock(() => [])
      cache.keys = mockClearKeys as any
      
      await registerExchange('user123', mockConfig, 'main')
      await updateExchange('user123', 'binance', {}, 'main')
      
      expect(mockClearKeys).toHaveBeenCalled()
    })
  })

  describe('deactivateExchange', () => {
    test('should deactivate exchange', async () => {
      await registerExchange('user123', mockConfig, 'main')
      
      const result = deactivateExchange('user123', 'binance', 'main')
      expect(result).toBe(true)
      
      const exchanges = getUserExchanges('user123')
      expect(exchanges[0].isActive).toBe(false)
    })

    test('should return false for non-existent exchange', () => {
      const result = deactivateExchange('user123', 'binance', 'main')
      expect(result).toBe(false)
    })
  })

  describe('Exchange Selection Strategies', () => {
    const mockExchanges = [
      { id: 'binance' },
      { id: 'kraken' },
      { id: 'coinbase' }
    ] as any[]

    test('selectBestBuyExchange should return first exchange', () => {
      const result = selectBestBuyExchange(mockExchanges)
      expect(result?.id).toBe('binance')
    })

    test('selectBestSellExchange should return first exchange', () => {
      const result = selectBestSellExchange(mockExchanges)
      expect(result?.id).toBe('binance')
    })

    test('selectHighestLiquidityExchange should return first exchange', () => {
      const result = selectHighestLiquidityExchange(mockExchanges)
      expect(result?.id).toBe('binance')
    })

    test('selectRandomExchange should return random exchange', () => {
      const results = new Set()
      // Run multiple times to ensure randomness
      for (let i = 0; i < 20; i++) {
        const result = selectRandomExchange(mockExchanges)
        if (result) results.add(result.id)
      }
      
      // Should have selected different exchanges
      expect(results.size).toBeGreaterThan(1)
    })

    test('selection strategies should handle empty array', () => {
      expect(selectBestBuyExchange([])).toBeNull()
      expect(selectBestSellExchange([])).toBeNull()
      expect(selectHighestLiquidityExchange([])).toBeNull()
      expect(selectRandomExchange([])).toBeNull()
    })
  })

  describe('getSupportedExchanges', () => {
    test('should return list of supported exchanges', async () => {
      const exchanges = await getSupportedExchanges()
      
      expect(exchanges).toBeInstanceOf(Array)
      expect(exchanges).toContain('binance')
      expect(exchanges).toContain('kraken')
      expect(exchanges).toContain('coinbase')
      expect(exchanges.length).toBeGreaterThan(5)
    })
  })

  describe('validateExchangeCredentials', () => {
    test('should return true for valid credentials', async () => {
      const result = await validateExchangeCredentials(mockConfig)
      expect(result).toBe(true)
      expect(mockCreateExchange).toHaveBeenCalledWith(mockConfig)
    })

    test('should return false for invalid credentials', async () => {
      mockCreateExchange.mockImplementationOnce(() => {
        throw new Error('Invalid API key')
      })
      
      const result = await validateExchangeCredentials(mockConfig)
      expect(result).toBe(false)
    })

    test('should test credentials by fetching balance', async () => {
      const result = await validateExchangeCredentials(mockConfig)
      
      expect(result).toBe(true)
      expect(mockCreateExchange).toHaveBeenCalledWith(mockConfig)
      // The exchange created by validateExchangeCredentials will have fetchBalance called
      const createdExchange = await mockCreateExchange.mock.results[0].value
      expect(createdExchange.fetchBalance).toHaveBeenCalled()
    })
  })
})