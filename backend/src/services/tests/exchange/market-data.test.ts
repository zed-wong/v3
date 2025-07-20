import { describe, test, expect, beforeEach, mock } from 'bun:test'
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
import { cache } from '../../exchange/cache'
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
    markets: {
      'BTC/USDT': {},
      'ETH/USDT': {}
    },
    timeframes: {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d'
    },
    loadMarkets: mock(() => Promise.resolve()),
    fetchTicker: mock(() => Promise.resolve({
      symbol: 'BTC/USDT',
      bid: 49900,
      bidVolume: 2.5,
      ask: 50100,
      askVolume: 1.8,
      last: 50000,
      baseVolume: 1234.5,
      timestamp: Date.now()
    })),
    fetchTickers: mock(() => Promise.resolve({
      'BTC/USDT': {
        symbol: 'BTC/USDT',
        bid: 49900,
        ask: 50100,
        last: 50000,
        baseVolume: 1234.5,
        timestamp: Date.now()
      },
      'ETH/USDT': {
        symbol: 'ETH/USDT',
        bid: 2990,
        ask: 3010,
        last: 3000,
        baseVolume: 5678.9,
        timestamp: Date.now()
      }
    })),
    fetchOHLCV: mock(() => Promise.resolve([
      [1640995200000, 48000, 49000, 47500, 48500, 100],
      [1640995260000, 48500, 49500, 48000, 49000, 150],
      [1640995320000, 49000, 50000, 48500, 49500, 200]
    ])),
    fetchOrderBook: mock(() => Promise.resolve({
      symbol: 'BTC/USDT',
      bids: [[49900, 1.5], [49800, 2.0], [49700, 3.0]],
      asks: [[50100, 1.2], [50200, 2.5], [50300, 3.8]],
      timestamp: Date.now()
    }))
  } as any

  beforeEach(() => {
    cache.clear()
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
        bid: 49900,
        ask: 50100,
        last: 50000
      })
    })

    test('should map ticker data correctly', async () => {
      const ticker = await fetchTicker(mockExchange, 'BTC/USDT')
      
      expect(ticker.bidVolume).toBe(2.5)
      expect(ticker.askVolume).toBe(1.8)
      expect(ticker.volume).toBe(1234.5)
      expect(ticker.timestamp).toBeTruthy()
    })

    test('should throw error when not supported', async () => {
      const limitedExchange = {
        id: 'limited',
        has: { fetchTicker: false }
      } as any
      
      await expect(fetchTicker(limitedExchange, 'BTC/USDT'))
        .rejects.toThrow('Exchange limited does not support fetching tickers')
    })
  })

  describe('fetchTickers', () => {
    test('should fetch all tickers', async () => {
      const tickers = await fetchTickers(mockExchange)
      
      expect(mockExchange.fetchTickers).toHaveBeenCalledWith(undefined)
      expect(Object.keys(tickers)).toHaveLength(2)
      expect(tickers['BTC/USDT']).toBeTruthy()
      expect(tickers['ETH/USDT']).toBeTruthy()
    })

    test('should fetch specific tickers', async () => {
      await fetchTickers(mockExchange, ['BTC/USDT'])
      
      expect(mockExchange.fetchTickers).toHaveBeenCalledWith(['BTC/USDT'])
    })

    test('should handle missing data', async () => {
      mockExchange.fetchTickers.mockResolvedValueOnce({
        'BTC/USDT': {
          symbol: 'BTC/USDT',
          last: 50000
          // Missing bid, ask, etc.
        }
      })
      
      const tickers = await fetchTickers(mockExchange)
      expect(tickers['BTC/USDT'].bid).toBe(0)
      expect(tickers['BTC/USDT'].ask).toBe(0)
    })
  })

  describe('fetchOHLCV', () => {
    test('should fetch OHLCV data', async () => {
      const ohlcv = await fetchOHLCV(mockExchange, 'BTC/USDT', '1h', 1640995200000, 100)
      
      expect(mockExchange.loadMarkets).toHaveBeenCalled()
      expect(mockExchange.fetchOHLCV).toHaveBeenCalledWith('BTC/USDT', '1h', 1640995200000, 100)
      expect(ohlcv).toHaveLength(3)
      expect(ohlcv[0]).toMatchObject({
        timestamp: 1640995200000,
        open: 48000,
        high: 49000,
        low: 47500,
        close: 48500,
        volume: 100
      })
    })

    test('should use default timeframe', async () => {
      await fetchOHLCV(mockExchange, 'BTC/USDT')
      
      expect(mockExchange.fetchOHLCV).toHaveBeenCalledWith('BTC/USDT', '1m', undefined, undefined)
    })

    test('should throw error when not supported', async () => {
      const limitedExchange = {
        id: 'limited',
        has: { fetchOHLCV: false }
      } as any
      
      await expect(fetchOHLCV(limitedExchange, 'BTC/USDT'))
        .rejects.toThrow('Exchange limited does not support fetching OHLCV data')
    })
  })

  describe('fetchOrderBook', () => {
    test('should fetch order book', async () => {
      const orderBook = await fetchOrderBook(mockExchange, 'BTC/USDT', 10)
      
      expect(mockExchange.fetchOrderBook).toHaveBeenCalledWith('BTC/USDT', 10)
      expect(orderBook).toMatchObject({
        symbol: 'BTC/USDT',
        bids: [[49900, 1.5], [49800, 2.0], [49700, 3.0]],
        asks: [[50100, 1.2], [50200, 2.5], [50300, 3.8]]
      })
    })

    test('should fetch without limit', async () => {
      await fetchOrderBook(mockExchange, 'BTC/USDT')
      
      expect(mockExchange.fetchOrderBook).toHaveBeenCalledWith('BTC/USDT', undefined)
    })
  })

  describe('Cached market data functions', () => {
    test('getTicker should cache results', async () => {
      const ticker = await getTicker(mockExchange, 'BTC/USDT', 10)
      
      expect(mockExchange.fetchTicker).toHaveBeenCalledTimes(1)
      
      // Second call should use cache
      const cachedTicker = await getTicker(mockExchange, 'BTC/USDT', 10)
      expect(mockExchange.fetchTicker).toHaveBeenCalledTimes(1)
      expect(cachedTicker).toEqual(ticker)
    })

    test('getTickers should cache results', async () => {
      const tickers = await getTickers(mockExchange, ['BTC/USDT'], 10)
      
      expect(mockExchange.fetchTickers).toHaveBeenCalledTimes(1)
      
      const cachedTickers = await getTickers(mockExchange, ['BTC/USDT'], 10)
      expect(mockExchange.fetchTickers).toHaveBeenCalledTimes(1)
      expect(cachedTickers).toEqual(tickers)
    })

    test('getOHLCV should cache with proper key', async () => {
      await getOHLCV(mockExchange, 'BTC/USDT', '1h', 1640995200000, 100, 60)
      
      const cacheKey = 'ohlcv-binance-BTC/USDT-1h-1640995200000-100'
      expect(cache.get(cacheKey)).toBeTruthy()
    })

    test('getOrderBook should cache results', async () => {
      const orderBook = await getOrderBook(mockExchange, 'BTC/USDT', 10, 5)
      
      expect(mockExchange.fetchOrderBook).toHaveBeenCalledTimes(1)
      
      const cachedOrderBook = await getOrderBook(mockExchange, 'BTC/USDT', 10, 5)
      expect(mockExchange.fetchOrderBook).toHaveBeenCalledTimes(1)
      expect(cachedOrderBook).toEqual(orderBook)
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
        has: {
          fetchTicker: false,
          fetchTickers: false,
          fetchOHLCV: false,
          fetchOrderBook: false
        }
      } as any
      
      expect(isMarketDataSupported(limitedExchange, MarketDataType.TICKER)).toBe(false)
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
      expect(calculatePriceChange(110, 100)).toBe(10)
      expect(calculatePriceChange(90, 100)).toBe(-10)
      expect(calculatePriceChange(100, 100)).toBe(0)
    })

    test('should handle zero previous price', () => {
      expect(calculatePriceChange(100, 0)).toBe(0)
    })

    test('should handle decimal precision', () => {
      const change = calculatePriceChange(105.5, 100)
      expect(change).toBeCloseTo(5.5, 2)
    })
  })

  describe('calculateVWAP', () => {
    test('should calculate VWAP correctly', () => {
      const ohlcv: OHLCVData[] = [
        { timestamp: 1, open: 100, high: 110, low: 90, close: 105, volume: 1000 },
        { timestamp: 2, open: 105, high: 115, low: 95, close: 110, volume: 1500 },
        { timestamp: 3, open: 110, high: 120, low: 100, close: 115, volume: 2000 }
      ]
      
      // VWAP = Sum(Typical Price * Volume) / Sum(Volume)
      // Typical Price = (High + Low + Close) / 3
      // TP1 = (110 + 90 + 105) / 3 = 101.67
      // TP2 = (115 + 95 + 110) / 3 = 106.67
      // TP3 = (120 + 100 + 115) / 3 = 111.67
      // VWAP = (101.67*1000 + 106.67*1500 + 111.67*2000) / (1000+1500+2000)
      // VWAP = 485000 / 4500 = 107.78
      
      const vwap = calculateVWAP(ohlcv)
      expect(vwap).toBeCloseTo(107.78, 2)
    })

    test('should handle empty array', () => {
      expect(calculateVWAP([])).toBe(0)
    })

    test('should handle zero volume', () => {
      const ohlcv: OHLCVData[] = [
        { timestamp: 1, open: 100, high: 110, low: 90, close: 105, volume: 0 }
      ]
      
      expect(calculateVWAP(ohlcv)).toBe(0)
    })
  })

  describe('aggregateMarketData', () => {
    const mockExchanges = [
      {
        id: 'binance',
        has: { fetchTicker: true },
        fetchTicker: mock(() => Promise.resolve({
          symbol: 'BTC/USDT',
          bid: 49900,
          ask: 50100,
          last: 50000,
          baseVolume: 1000
        }))
      },
      {
        id: 'kraken',
        has: { fetchTicker: true },
        fetchTicker: mock(() => Promise.resolve({
          symbol: 'BTC/USDT',
          bid: 49950,
          ask: 50050,
          last: 50025,
          baseVolume: 500
        }))
      },
      {
        id: 'coinbase',
        has: { fetchTicker: true },
        fetchTicker: mock(() => Promise.resolve({
          symbol: 'BTC/USDT',
          bid: 49925,
          ask: 50075,
          last: 50010,
          baseVolume: 750
        }))
      }
    ] as any[]

    test('should aggregate data from multiple exchanges', async () => {
      const aggregated = await aggregateMarketData(mockExchanges, 'BTC/USDT')
      
      expect(aggregated.bestBid).toEqual({ price: 49950, exchange: 'kraken' })
      expect(aggregated.bestAsk).toEqual({ price: 50050, exchange: 'kraken' })
      expect(aggregated.averagePrice).toBeCloseTo(50011.67, 2)
      expect(aggregated.totalVolume).toBe(2250)
    })

    test('should handle exchange failures', async () => {
      const failingExchanges = [
        ...mockExchanges.slice(0, 2),
        {
          id: 'failing',
          has: { fetchTicker: true },
          fetchTicker: mock(() => Promise.reject(new Error('API Error')))
        }
      ] as any[]
      
      const aggregated = await aggregateMarketData(failingExchanges, 'BTC/USDT')
      
      // Should still work with available exchanges
      expect(aggregated.bestBid.price).toBe(49950)
      expect(aggregated.totalVolume).toBe(1500) // Only binance and kraken
    })

    test('should throw when no valid tickers', async () => {
      const allFailingExchanges = mockExchanges.map(ex => ({
        ...ex,
        fetchTicker: mock(() => Promise.reject(new Error('API Error')))
      }))
      
      await expect(aggregateMarketData(allFailingExchanges, 'BTC/USDT'))
        .rejects.toThrow('No valid tickers fetched from any exchange')
    })

    test('should handle zero asks correctly', async () => {
      const exchangeWithZeroAsk = [{
        id: 'test',
        has: { fetchTicker: true },
        fetchTicker: mock(() => Promise.resolve({
          symbol: 'BTC/USDT',
          bid: 50000,
          ask: 0, // Zero ask
          last: 50000,
          baseVolume: 100
        }))
      }] as any[]
      
      const aggregated = await aggregateMarketData(exchangeWithZeroAsk, 'BTC/USDT')
      
      expect(aggregated.bestAsk.price).toBe(Number.MAX_SAFE_INTEGER)
    })
  })
})