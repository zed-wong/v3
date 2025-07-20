import { describe, test, expect, beforeAll, beforeEach, mock } from 'bun:test'
import * as ccxt from 'ccxt'
import {
  createExchange,
  loadMarkets,
  getSymbols,
  formatPrice,
  formatAmount,
  formatOrderValues,
  interpretExchangeError,
  withExchangeErrorHandler,
  exchangeHas,
  getExchangeCapabilities
} from '../../exchange/base'
import { ExchangeError, ExchangeNotFoundError } from '../../../types/exchange'

// Mock environment
process.env.EXCHANGE_SANDBOX = 'false'

describe('Exchange Base', () => {
  beforeEach(() => {
    // Clear any cached state
  })
  
  // Mock exchange config
  const mockConfig = {
    exchangeId: 'binance',
    apiKey: 'test-api-key',
    secret: 'test-secret'
  }

  describe('createExchange', () => {
    test('should create exchange instance for valid exchange', async () => {
      const exchange = await createExchange(mockConfig)
      expect(exchange).toBeDefined()
      expect(exchange.id).toBe('binance')
      expect(exchange.apiKey).toBe('test-api-key')
    })

    test('should throw ExchangeNotFoundError for invalid exchange', async () => {
      const invalidConfig = { ...mockConfig, exchangeId: 'non-existent-exchange' }
      await expect(createExchange(invalidConfig)).rejects.toThrow(ExchangeNotFoundError)
    })

    test('should set sandbox mode when enabled', async () => {
      process.env.EXCHANGE_SANDBOX = 'true'
      
      const exchange = await createExchange(mockConfig)
      expect(exchange).toBeDefined()
      
      process.env.EXCHANGE_SANDBOX = 'false'
    })

    test('should include optional credentials', async () => {
      const configWithOptionals = {
        ...mockConfig,
        password: 'test-password',
        uid: 'test-uid',
        privateKey: 'test-private-key',
        walletAddress: 'test-wallet',
        options: { defaultType: 'future' }
      }
      
      const exchange = await createExchange(configWithOptionals)
      expect(exchange.password).toBe('test-password')
      expect(exchange.uid).toBe('test-uid')
    })
  })

  describe('loadMarkets', () => {
    test('should load markets for exchange', async () => {
      const exchange = await createExchange(mockConfig)
      const mockLoadMarkets = mock(() => Promise.resolve())
      exchange.loadMarkets = mockLoadMarkets
      
      await loadMarkets(exchange)
      expect(mockLoadMarkets).toHaveBeenCalled()
    })

    test('should handle reload parameter', async () => {
      const exchange = await createExchange(mockConfig)
      const mockLoadMarkets = mock(() => Promise.resolve())
      exchange.loadMarkets = mockLoadMarkets
      
      await loadMarkets(exchange, true)
      expect(mockLoadMarkets).toHaveBeenCalledWith(true)
    })

    test('should throw ExchangeError on failure', async () => {
      const exchange = await createExchange(mockConfig)
      exchange.loadMarkets = mock(() => Promise.reject(new Error('Network error')))
      
      await expect(loadMarkets(exchange)).rejects.toThrow(ExchangeError)
    })
  })

  describe('getSymbols', () => {
    test('should return exchange symbols', async () => {
      const exchange = await createExchange(mockConfig)
      exchange.markets = {
        'BTC/USDT': {} as any,
        'ETH/USDT': {} as any,
        'BNB/USDT': {} as any
      }
      
      const symbols = await getSymbols(exchange)
      expect(symbols).toEqual(['BTC/USDT', 'ETH/USDT', 'BNB/USDT'])
    })

    test('should load markets if not loaded', async () => {
      const exchange = await createExchange(mockConfig)
      const mockLoadMarkets = mock(() => {
        exchange.markets = { 'BTC/USDT': {} as any }
        return Promise.resolve()
      })
      exchange.loadMarkets = mockLoadMarkets
      
      const symbols = await getSymbols(exchange)
      expect(mockLoadMarkets).toHaveBeenCalled()
      expect(symbols).toEqual(['BTC/USDT'])
    })
  })

  describe('formatPrice', () => {
    test('should format price according to exchange precision', () => {
      const exchange = {
        id: 'test',
        markets: {
          'BTC/USDT': { precision: { price: 2 } }
        },
        priceToPrecision: mock((symbol: string, price: number) => price.toFixed(2))
      } as any
      
      const formatted = formatPrice(exchange, 'BTC/USDT', 1234.5678)
      expect(exchange.priceToPrecision).toHaveBeenCalledWith('BTC/USDT', 1234.5678)
      expect(formatted).toBe('1234.57')
    })

    test('should throw error for unknown market', () => {
      const exchange = {
        id: 'test',
        markets: {}
      } as any
      
      expect(() => formatPrice(exchange, 'UNKNOWN/PAIR', 100))
        .toThrow(ExchangeError)
    })
  })

  describe('formatAmount', () => {
    test('should format amount according to exchange precision', () => {
      const exchange = {
        id: 'test',
        markets: {
          'BTC/USDT': { precision: { amount: 8 } }
        },
        amountToPrecision: mock((symbol: string, amount: number) => amount.toFixed(8))
      } as any
      
      const formatted = formatAmount(exchange, 'BTC/USDT', 0.12345678)
      expect(exchange.amountToPrecision).toHaveBeenCalledWith('BTC/USDT', 0.12345678)
      expect(formatted).toBe('0.12345678')
    })
  })

  describe('formatOrderValues', () => {
    test('should format both price and amount', () => {
      const exchange = {
        id: 'test',
        markets: {
          'BTC/USDT': { precision: { price: 2, amount: 8 } }
        },
        priceToPrecision: mock(() => '1234.56'),
        amountToPrecision: mock(() => '0.12345678')
      } as any
      
      const formatted = formatOrderValues(exchange, 'BTC/USDT', 1234.5678, 0.123456789)
      expect(formatted).toEqual({
        price: '1234.56',
        amount: '0.12345678'
      })
    })
  })

  describe('interpretExchangeError', () => {
    test('should handle NetworkError', () => {
      const networkError = new ccxt.NetworkError('Connection failed')
      const result = interpretExchangeError(networkError, 'binance')
      
      expect(result).toBeInstanceOf(ExchangeError)
      expect(result.message).toContain('Network error')
      expect(result.exchangeId).toBe('binance')
    })

    test('should handle ExchangeError from CCXT', () => {
      const exchangeError = new ccxt.ExchangeError('Invalid API key')
      const result = interpretExchangeError(exchangeError, 'binance')
      
      expect(result).toBeInstanceOf(ExchangeError)
      expect(result.message).toContain('Exchange error')
    })

    test('should return existing ExchangeError as-is', () => {
      const customError = new ExchangeError('Custom error', 'binance')
      const result = interpretExchangeError(customError, 'binance')
      
      expect(result).toBe(customError)
    })

    test('should handle unknown errors', () => {
      const unknownError = new Error('Unknown error')
      const result = interpretExchangeError(unknownError, 'binance')
      
      expect(result).toBeInstanceOf(ExchangeError)
      expect(result.message).toContain('Unknown error')
    })
  })

  describe('withExchangeErrorHandler', () => {
    test('should execute function successfully', async () => {
      const mockFn = mock(async (exchange: any, value: number) => value * 2)
      const wrappedFn = withExchangeErrorHandler(mockFn)
      
      const exchange = { id: 'test' } as any
      const result = await wrappedFn(exchange, 5)
      
      expect(result).toBe(10)
      expect(mockFn).toHaveBeenCalledWith(exchange, 5)
    })

    test('should handle errors and convert to ExchangeError', async () => {
      const mockFn = mock(async () => {
        throw new Error('Test error')
      })
      const wrappedFn = withExchangeErrorHandler(mockFn)
      
      const exchange = { id: 'test' } as any
      
      await expect(wrappedFn(exchange)).rejects.toThrow(ExchangeError)
    })
  })

  describe('exchangeHas', () => {
    test('should return true for supported features', () => {
      const exchange = {
        has: {
          fetchTicker: true,
          fetchOHLCV: true,
          fetchBalance: false
        }
      } as any
      
      expect(exchangeHas(exchange, 'fetchTicker')).toBe(true)
      expect(exchangeHas(exchange, 'fetchOHLCV')).toBe(true)
    })

    test('should return false for unsupported features', () => {
      const exchange = {
        has: {
          fetchBalance: false
        }
      } as any
      
      expect(exchangeHas(exchange, 'fetchBalance')).toBe(false)
      expect(exchangeHas(exchange, 'nonExistentFeature')).toBe(false)
    })
  })

  describe('getExchangeCapabilities', () => {
    test('should return list of supported features', () => {
      const exchange = {
        has: {
          fetchTicker: true,
          fetchOHLCV: true,
          fetchBalance: false,
          createOrder: true,
          cancelOrder: false
        }
      } as any
      
      const capabilities = getExchangeCapabilities(exchange)
      expect(capabilities).toContain('fetchTicker')
      expect(capabilities).toContain('fetchOHLCV')
      expect(capabilities).toContain('createOrder')
      expect(capabilities).not.toContain('fetchBalance')
      expect(capabilities).not.toContain('cancelOrder')
    })
  })
})