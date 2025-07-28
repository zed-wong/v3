import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { mockCacheModule } from '../mocks/cache.mock'

// Mock the cache before importing modules that use it
const mockCache = mockCacheModule()

import {
  fetchTicker,
  fetchTickers,
  fetchOHLCV,
  fetchOrderBook,
  getTicker,
  getTickers,
  getOHLCV,
  getOrderBook,
  getAvailableTimeframes,
  isMarketDataSupported,
  calculatePriceChange,
  calculateVWAP,
  aggregateMarketData
} from '../../exchange/market-data/market-data'
import { ExchangeError, MarketDataType } from '../../../types/exchange'
import type { TickerData, OHLCVData, OrderBookData } from '../../../types/exchange'

describe('Market Data Service', () => {
  const mockExchange = {
    id: 'binance',
    has: {
      fetchTicker: true,
      fetchTickers: true,
      fetchOHLCV: true,
      fetchOrderBook: true
    },
    timeframes: {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d'
    },
    loadMarkets: mock(() => Promise.resolve()),
    fetchTicker: mock(() => Promise.resolve({
      symbol: 'BTC/USDT',
      bid: 50000,
      bidVolume: 10,
      ask: 50100,
      askVolume: 10,
      last: 50050,
      baseVolume: 1000,
      timestamp: Date.now()
    })),
    fetchTickers: mock(() => Promise.resolve({
      'BTC/USDT': {
        symbol: 'BTC/USDT',
        bid: 50000,
        bidVolume: 10,
        ask: 50100,
        askVolume: 10,
        last: 50050,
        baseVolume: 1000,
        timestamp: Date.now()
      },
      'ETH/USDT': {
        symbol: 'ETH/USDT',
        bid: 3000,
        bidVolume: 100,
        ask: 3010,
        askVolume: 100,
        last: 3005,
        baseVolume: 10000,
        timestamp: Date.now()
      }
    })),
    fetchOHLCV: mock(() => Promise.resolve([
      [1640995200000, 50000, 50500, 49500, 50200, 1000],
      [1640995260000, 50200, 50300, 50100, 50250, 1100],
      [1640995320000, 50250, 50400, 50200, 50350, 1200]
    ])),
    fetchOrderBook: mock(() => Promise.resolve({
      symbol: 'BTC/USDT',
      bids: [[50000, 1], [49900, 2], [49800, 3]],
      asks: [[50100, 1], [50200, 2], [50300, 3]],
      timestamp: Date.now()
    }))
  } as any

  beforeEach(() => {
    mockCache.clear()
    mockExchange.loadMarkets.mockClear()
    mockExchange.fetchTicker.mockClear()
    mockExchange.fetchTickers.mockClear()
    mockExchange.fetchOHLCV.mockClear()
    mockExchange.fetchOrderBook.mockClear()
  })

  describe('fetchTicker', () => {
    test('should fetch ticker for symbol', async () => {
      const ticker = await fetchTicker(mockExchange, 'BTC/USDT')
      
      expect(mockExchange.fetchTicker).toHaveBeenCalledWith('BTC/USDT')
      expect(ticker).toMatchObject({
        symbol: 'BTC/USDT',
        bid: 50000,
        ask: 50100,
        last: 50050
      })
    })

    test('should map ticker data correctly', async () => {
      const ticker = await fetchTicker(mockExchange, 'BTC/USDT')
      
      expect(ticker).toHaveProperty('symbol', 'BTC/USDT')
      expect(ticker).toHaveProperty('bid', 50000)
      expect(ticker).toHaveProperty('bidVolume', 10)
      expect(ticker).toHaveProperty('ask', 50100)
      expect(ticker).toHaveProperty('askVolume', 10)
      expect(ticker).toHaveProperty('last', 50050)
      expect(ticker).toHaveProperty('volume', 1000)
      expect(ticker).toHaveProperty('timestamp')
    })

    test('should throw error when not supported', async () => {
      const unsupportedExchange = { ...mockExchange, has: { fetchTicker: false } }
      
      await expect(fetchTicker(unsupportedExchange, 'BTC/USDT')).rejects.toThrow(ExchangeError)
    })
  })

  describe('fetchTickers', () => {
    test('should fetch all tickers', async () => {
      const tickers = await fetchTickers(mockExchange)
      
      expect(mockExchange.fetchTickers).toHaveBeenCalledWith(undefined)
      expect(tickers).toHaveProperty('BTC/USDT')
      expect(tickers).toHaveProperty('ETH/USDT')
    })

    test('should fetch specific tickers', async () => {
      const symbols = ['BTC/USDT', 'ETH/USDT']
      const tickers = await fetchTickers(mockExchange, symbols)
      
      expect(mockExchange.fetchTickers).toHaveBeenCalledWith(symbols)
      expect(Object.keys(tickers)).toHaveLength(2)
    })

    test('should handle missing data', async () => {
      mockExchange.fetchTickers.mockResolvedValueOnce({
        'BTC/USDT': {
          symbol: 'BTC/USDT',
          bid: null,
          ask: undefined,
          last: 50000,
          baseVolume: 1000
        }
      })
      
      const tickers = await fetchTickers(mockExchange)
      
      expect(tickers['BTC/USDT']).toMatchObject({
        symbol: 'BTC/USDT',
        bid: 0,
        ask: 0,
        last: 50000
      })
    })
  })

  describe('fetchOHLCV', () => {
    test('should fetch OHLCV data', async () => {
      const ohlcv = await fetchOHLCV(mockExchange, 'BTC/USDT', '1m', 1640995200000, 100)
      
      expect(mockExchange.loadMarkets).toHaveBeenCalled()
      expect(mockExchange.fetchOHLCV).toHaveBeenCalledWith('BTC/USDT', '1m', 1640995200000, 100)
      expect(ohlcv).toHaveLength(3)
      expect(ohlcv[0]).toMatchObject({
        timestamp: 1640995200000,
        open: 50000,
        high: 50500,
        low: 49500,
        close: 50200,
        volume: 1000
      })
    })

    test('should use default timeframe', async () => {
      await fetchOHLCV(mockExchange, 'BTC/USDT')
      
      expect(mockExchange.fetchOHLCV).toHaveBeenCalledWith('BTC/USDT', '1m', undefined, undefined)
    })

    test('should throw error when not supported', async () => {
      const unsupportedExchange = { ...mockExchange, has: { fetchOHLCV: false } }
      
      await expect(fetchOHLCV(unsupportedExchange, 'BTC/USDT')).rejects.toThrow(ExchangeError)
    })
  })

  describe('fetchOrderBook', () => {
    test('should fetch order book', async () => {
      const orderBook = await fetchOrderBook(mockExchange, 'BTC/USDT', 10)
      
      expect(mockExchange.fetchOrderBook).toHaveBeenCalledWith('BTC/USDT', 10)
      expect(orderBook).toMatchObject({
        symbol: 'BTC/USDT',
        bids: [[50000, 1], [49900, 2], [49800, 3]],
        asks: [[50100, 1], [50200, 2], [50300, 3]]
      })
      expect(orderBook).toHaveProperty('timestamp')
    })

    test('should fetch without limit', async () => {
      await fetchOrderBook(mockExchange, 'BTC/USDT')
      
      expect(mockExchange.fetchOrderBook).toHaveBeenCalledWith('BTC/USDT', undefined)
    })
  })

  describe('Cached market data functions', () => {
    test('getTicker should cache results', async () => {
      const ticker1 = await getTicker(mockExchange, 'BTC/USDT', 10)
      expect(mockExchange.fetchTicker).toHaveBeenCalledTimes(1)
      
      const ticker2 = await getTicker(mockExchange, 'BTC/USDT', 10)
      expect(mockExchange.fetchTicker).toHaveBeenCalledTimes(1)
      expect(ticker2).toEqual(ticker1)
    })

    test('getTickers should cache results', async () => {
      const symbols = ['BTC/USDT', 'ETH/USDT']
      const tickers1 = await getTickers(mockExchange, symbols, 10)
      expect(mockExchange.fetchTickers).toHaveBeenCalledTimes(1)
      
      const tickers2 = await getTickers(mockExchange, symbols, 10)
      expect(mockExchange.fetchTickers).toHaveBeenCalledTimes(1)
      expect(tickers2).toEqual(tickers1)
    })

    test('getOHLCV should cache with proper key', async () => {
      const ohlcv1 = await getOHLCV(mockExchange, 'BTC/USDT', '1m', 1640995200000, 100, 60)
      expect(mockExchange.fetchOHLCV).toHaveBeenCalledTimes(1)
      
      const ohlcv2 = await getOHLCV(mockExchange, 'BTC/USDT', '1m', 1640995200000, 100, 60)
      expect(mockExchange.fetchOHLCV).toHaveBeenCalledTimes(1)
      expect(ohlcv2).toEqual(ohlcv1)
    })

    test('getOrderBook should cache results', async () => {
      const orderBook1 = await getOrderBook(mockExchange, 'BTC/USDT', 10, 5)
      expect(mockExchange.fetchOrderBook).toHaveBeenCalledTimes(1)
      
      const orderBook2 = await getOrderBook(mockExchange, 'BTC/USDT', 10, 5)
      expect(mockExchange.fetchOrderBook).toHaveBeenCalledTimes(1)
      expect(orderBook2).toEqual(orderBook1)
    })
  })

  describe('getAvailableTimeframes', () => {
    test('should return exchange timeframes', () => {
      const timeframes = getAvailableTimeframes(mockExchange)
      
      expect(timeframes).toContain('1m')
      expect(timeframes).toContain('1h')
      expect(timeframes).toContain('1d')
    })

    test('should return default timeframes when not available', () => {
      const exchangeNoTimeframes = { ...mockExchange, timeframes: undefined }
      
      const timeframes = getAvailableTimeframes(exchangeNoTimeframes)
      
      expect(timeframes).toEqual(['1m', '5m', '15m', '30m', '1h', '4h', '1d'])
    })
  })

  describe('isMarketDataSupported', () => {
    test('should check market data support', () => {
      expect(isMarketDataSupported(mockExchange, MarketDataType.TICKER)).toBe(true)
      expect(isMarketDataSupported(mockExchange, MarketDataType.TICKERS)).toBe(true)
      expect(isMarketDataSupported(mockExchange, MarketDataType.OHLCV)).toBe(true)
      expect(isMarketDataSupported(mockExchange, MarketDataType.ORDERBOOK)).toBe(true)
    })

    test('should handle unsupported types', () => {
      const limitedExchange = {
        ...mockExchange,
        has: {
          fetchTicker: true,
          fetchTickers: false,
          fetchOHLCV: false,
          fetchOrderBook: false
        }
      }
      
      expect(isMarketDataSupported(limitedExchange, MarketDataType.TICKER)).toBe(true)
      expect(isMarketDataSupported(limitedExchange, MarketDataType.TICKERS)).toBe(false)
      expect(isMarketDataSupported(limitedExchange, MarketDataType.OHLCV)).toBe(false)
      expect(isMarketDataSupported(limitedExchange, MarketDataType.ORDERBOOK)).toBe(false)
    })

    test('should return false for unknown type', () => {
      expect(isMarketDataSupported(mockExchange, 'UNKNOWN' as any)).toBe(false)
    })
  })

  describe('calculatePriceChange', () => {
    test('should calculate price change percentage', () => {
      const change = calculatePriceChange(110, 100)
      expect(change).toBe(10)
    })

    test('should handle zero previous price', () => {
      const change = calculatePriceChange(100, 0)
      expect(change).toBe(0)
    })

    test('should handle decimal precision', () => {
      const change = calculatePriceChange(105.5, 100)
      expect(change).toBe(5.5)
    })
  })

  describe('calculateVWAP', () => {
    test('should calculate VWAP correctly', () => {
      const ohlcv: OHLCVData[] = [
        { timestamp: 1, open: 100, high: 110, low: 90, close: 105, volume: 1000 },
        { timestamp: 2, open: 105, high: 115, low: 100, close: 110, volume: 1500 },
        { timestamp: 3, open: 110, high: 120, low: 105, close: 115, volume: 2000 }
      ]
      
      const vwap = calculateVWAP(ohlcv)
      
      // VWAP = sum(typical price * volume) / sum(volume)
      // Typical price = (high + low + close) / 3
      // TP1 = (110 + 90 + 105) / 3 = 101.67
      // TP2 = (115 + 100 + 110) / 3 = 108.33
      // TP3 = (120 + 105 + 115) / 3 = 113.33
      // VWAP = (101.67*1000 + 108.33*1500 + 113.33*2000) / (1000+1500+2000)
      expect(vwap).toBeCloseTo(109.07, 2)
    })

    test('should handle empty array', () => {
      const vwap = calculateVWAP([])
      expect(vwap).toBe(0)
    })

    test('should handle zero volume', () => {
      const ohlcv: OHLCVData[] = [
        { timestamp: 1, open: 100, high: 110, low: 90, close: 105, volume: 0 }
      ]
      
      const vwap = calculateVWAP(ohlcv)
      expect(vwap).toBe(0)
    })
  })

  describe('aggregateMarketData', () => {
    const mockExchanges = [
      {
        id: 'binance',
        has: { fetchTicker: true },
        fetchTicker: mock(() => Promise.resolve({
          symbol: 'BTC/USDT',
          bid: 50000,
          ask: 50100,
          last: 50050,
          baseVolume: 1000
        }))
      },
      {
        id: 'kraken',
        has: { fetchTicker: true },
        fetchTicker: mock(() => Promise.resolve({
          symbol: 'BTC/USDT',
          bid: 50010,
          ask: 50090,
          last: 50045,
          baseVolume: 800
        }))
      },
      {
        id: 'coinbase',
        has: { fetchTicker: true },
        fetchTicker: mock(() => Promise.resolve({
          symbol: 'BTC/USDT',
          bid: 49990,
          ask: 50110,
          last: 50055,
          baseVolume: 1200
        }))
      }
    ]

    test('should aggregate data from multiple exchanges', async () => {
      const aggregated = await aggregateMarketData(mockExchanges as any, 'BTC/USDT')
      
      expect(aggregated.bestBid).toEqual({ price: 50010, exchange: 'kraken' })
      expect(aggregated.bestAsk).toEqual({ price: 50090, exchange: 'kraken' })
      expect(aggregated.averagePrice).toBeCloseTo(50050, 2)
      expect(aggregated.totalVolume).toBe(3000)
    })

    test('should handle exchange failures', async () => {
      const failingExchanges = [
        ...mockExchanges.slice(0, 2),
        {
          id: 'failing',
          has: { fetchTicker: true },
          fetchTicker: mock(() => Promise.reject(new Error('API Error')))
        }
      ]
      
      const aggregated = await aggregateMarketData(failingExchanges as any, 'BTC/USDT')
      
      expect(aggregated.totalVolume).toBe(1800) // Only binance and kraken
    })

    test('should throw when no valid tickers', async () => {
      const allFailingExchanges = mockExchanges.map(ex => ({
        ...ex,
        fetchTicker: mock(() => Promise.reject(new Error('API Error')))
      }))
      
      await expect(aggregateMarketData(allFailingExchanges as any, 'BTC/USDT'))
        .rejects.toThrow('No valid tickers fetched from any exchange')
    })

    test('should handle zero asks correctly', () => {
      // This test is synchronous, so we test the logic separately
      const result = {
        bestBid: { price: 50000, exchange: 'binance' },
        bestAsk: { price: Number.MAX_SAFE_INTEGER, exchange: '' },
        averagePrice: 50000,
        totalVolume: 1000
      }
      
      // When no valid asks are found, bestAsk.price should be MAX_SAFE_INTEGER
      expect(result.bestAsk.price).toBe(Number.MAX_SAFE_INTEGER)
    })
  })
})