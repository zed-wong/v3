import { cache } from '../cache'
import { Big } from 'big.js'
import type { Exchange, Ticker, OHLCV, OrderBook } from 'ccxt'
import type { TickerData, OHLCVData, OrderBookData } from '../../../types/exchange'
import { ExchangeError, MarketDataType } from '../../../types/exchange'
import { withExchangeErrorHandler, exchangeHas, loadMarkets } from '../base'

// Re-export types for convenience
export type { TickerCommand, OHLCVCommand, OrderBookCommand, TickerData, OHLCVData, OrderBookData } from '../../../types/exchange'

// Fetch ticker for a symbol
export const fetchTicker = withExchangeErrorHandler(
  async (exchange: Exchange, symbol: string): Promise<TickerData> => {
    if (!exchangeHas(exchange, 'fetchTicker')) {
      throw new ExchangeError(
        `Exchange ${exchange.id} does not support fetching tickers`,
        exchange.id
      )
    }
    
    const ticker = await exchange.fetchTicker(symbol)
    return mapTickerToTickerData(ticker, symbol)
  }
)

// Fetch all tickers
export const fetchTickers = withExchangeErrorHandler(
  async (exchange: Exchange, symbols?: string[]): Promise<Record<string, TickerData>> => {
    if (!exchangeHas(exchange, 'fetchTickers')) {
      throw new ExchangeError(
        `Exchange ${exchange.id} does not support fetching multiple tickers`,
        exchange.id
      )
    }
    
    const tickers = await exchange.fetchTickers(symbols)
    const result: Record<string, TickerData> = {}
    
    for (const [symbol, ticker] of Object.entries(tickers)) {
      result[symbol] = mapTickerToTickerData(ticker, symbol)
    }
    
    return result
  }
)

// Fetch OHLCV data
export const fetchOHLCV = withExchangeErrorHandler(
  async (
    exchange: Exchange,
    symbol: string,
    timeframe: string = '1m',
    since?: number,
    limit?: number
  ): Promise<OHLCVData[]> => {
    if (!exchangeHas(exchange, 'fetchOHLCV')) {
      throw new ExchangeError(
        `Exchange ${exchange.id} does not support fetching OHLCV data`,
        exchange.id
      )
    }
    
    // Ensure markets are loaded
    await loadMarkets(exchange)
    
    const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, since, limit)
    return ohlcv.map(mapOHLCVToOHLCVData)
  }
)

// Fetch order book
export const fetchOrderBook = withExchangeErrorHandler(
  async (
    exchange: Exchange,
    symbol: string,
    limit?: number
  ): Promise<OrderBookData> => {
    if (!exchangeHas(exchange, 'fetchOrderBook')) {
      throw new ExchangeError(
        `Exchange ${exchange.id} does not support fetching order books`,
        exchange.id
      )
    }
    
    const orderBook = await exchange.fetchOrderBook(symbol, limit)
    return mapOrderBookToOrderBookData(orderBook, symbol)
  }
)

// Get ticker with caching
export const getTicker = async (
  exchange: Exchange,
  symbol: string,
  cacheTtl = 10 // 10 seconds cache
): Promise<TickerData> => {
  const cacheKey = `ticker-${exchange.id}-${symbol}`
  
  // Try cache first
  const cached = await cache.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }
  
  // Fetch from exchange
  const ticker = await fetchTicker(exchange, symbol)
  
  // Cache the result
  await cache.set(cacheKey, JSON.stringify(ticker), "EX", cacheTtl)
  
  return ticker
}

// Get multiple tickers with caching
export const getTickers = async (
  exchange: Exchange,
  symbols?: string[],
  cacheTtl = 10 // 10 seconds cache
): Promise<Record<string, TickerData>> => {
  const cacheKey = `tickers-${exchange.id}-${symbols?.join(',') || 'all'}`
  
  // Try cache first
  const cached = await cache.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }
  
  // Fetch from exchange
  const tickers = await fetchTickers(exchange, symbols)
  
  // Cache the result
  await cache.set(cacheKey, JSON.stringify(tickers), "EX", cacheTtl)
  
  return tickers
}

// Get OHLCV data with caching
export const getOHLCV = async (
  exchange: Exchange,
  symbol: string,
  timeframe: string = '1m',
  since?: number,
  limit?: number,
  cacheTtl = 60 // 1 minute cache for OHLCV
): Promise<OHLCVData[]> => {
  const cacheKey = `ohlcv-${exchange.id}-${symbol}-${timeframe}-${since || 'latest'}-${limit || 'default'}`
  
  // Try cache first
  const cached = await cache.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }
  
  // Fetch from exchange
  const ohlcv = await fetchOHLCV(exchange, symbol, timeframe, since, limit)
  
  // Cache the result
  await cache.set(cacheKey, JSON.stringify(ohlcv), "EX", cacheTtl)
  
  return ohlcv
}

// Get order book with caching
export const getOrderBook = async (
  exchange: Exchange,
  symbol: string,
  limit?: number,
  cacheTtl = 5 // 5 seconds cache for order book
): Promise<OrderBookData> => {
  const cacheKey = `orderbook-${exchange.id}-${symbol}-${limit || 'default'}`
  
  // Try cache first
  const cached = await cache.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }
  
  // Fetch from exchange
  const orderBook = await fetchOrderBook(exchange, symbol, limit)
  
  // Cache the result
  await cache.set(cacheKey, JSON.stringify(orderBook), "EX", cacheTtl)
  
  return orderBook
}

// Get available timeframes for an exchange
export const getAvailableTimeframes = (exchange: Exchange): string[] => {
  return exchange.timeframes ? Object.keys(exchange.timeframes) : ['1m', '5m', '15m', '30m', '1h', '4h', '1d']
}

// Check if a specific market data type is supported
export const isMarketDataSupported = (
  exchange: Exchange,
  dataType: MarketDataType
): boolean => {
  switch (dataType) {
    case MarketDataType.TICKER:
      return exchangeHas(exchange, 'fetchTicker')
    case MarketDataType.TICKERS:
      return exchangeHas(exchange, 'fetchTickers')
    case MarketDataType.OHLCV:
      return exchangeHas(exchange, 'fetchOHLCV')
    case MarketDataType.ORDERBOOK:
      return exchangeHas(exchange, 'fetchOrderBook')
    default:
      return false
  }
}

// Calculate price change percentage
export const calculatePriceChange = (
  currentPrice: number,
  previousPrice: number
): number => {
  if (previousPrice === 0) return 0
  
  const current = new Big(currentPrice)
  const previous = new Big(previousPrice)
  
  return current.minus(previous).div(previous).times(100).toNumber()
}

// Calculate VWAP (Volume Weighted Average Price)
export const calculateVWAP = (ohlcv: OHLCVData[]): number => {
  if (ohlcv.length === 0) return 0
  
  let totalVolume = new Big(0)
  let totalValue = new Big(0)
  
  for (const candle of ohlcv) {
    const high = new Big(candle.high)
    const low = new Big(candle.low)
    const close = new Big(candle.close)
    const volume = new Big(candle.volume)
    
    // Calculate typical price: (High + Low + Close) / 3
    const typicalPrice = high.plus(low).plus(close).div(3)
    
    totalValue = totalValue.plus(typicalPrice.times(volume))
    totalVolume = totalVolume.plus(volume)
  }
  
  return totalVolume.gt(0) ? totalValue.div(totalVolume).toNumber() : 0
}

// Helper: Map CCXT ticker to our TickerData type
const mapTickerToTickerData = (ticker: Ticker, symbol: string): TickerData => ({
  symbol,
  bid: ticker.bid || 0,
  bidVolume: ticker.bidVolume,
  ask: ticker.ask || 0,
  askVolume: ticker.askVolume,
  last: ticker.last || 0,
  volume: ticker.baseVolume,
  timestamp: ticker.timestamp || Date.now()
})

// Helper: Map CCXT OHLCV to our OHLCVData type
const mapOHLCVToOHLCVData = (ohlcv: OHLCV): OHLCVData => ({
  timestamp: ohlcv[0],
  open: ohlcv[1],
  high: ohlcv[2],
  low: ohlcv[3],
  close: ohlcv[4],
  volume: ohlcv[5]
})

// Helper: Map CCXT OrderBook to our OrderBookData type
const mapOrderBookToOrderBookData = (orderBook: OrderBook, symbol: string): OrderBookData => ({
  symbol,
  bids: orderBook.bids,
  asks: orderBook.asks,
  timestamp: orderBook.timestamp || Date.now()
})

// Aggregate market data from multiple exchanges
export const aggregateMarketData = async (
  exchanges: Exchange[],
  symbol: string
): Promise<{
  bestBid: { price: number; exchange: string }
  bestAsk: { price: number; exchange: string }
  averagePrice: number
  totalVolume: number
}> => {
  const tickers = await Promise.all(
    exchanges.map(async (exchange) => {
      try {
        const ticker = await getTicker(exchange, symbol)
        return { exchange: exchange.id, ticker }
      } catch (error) {
        console.error(`Failed to fetch ticker from ${exchange.id}:`, error)
        return null
      }
    })
  )
  
  const validTickers = tickers.filter(t => t !== null) as Array<{ exchange: string; ticker: TickerData }>
  
  if (validTickers.length === 0) {
    throw new Error('No valid tickers fetched from any exchange')
  }
  
  // Find best bid and ask
  let bestBid = { price: 0, exchange: '' }
  let bestAsk = { price: Number.MAX_SAFE_INTEGER, exchange: '' }
  let totalPrice = new Big(0)
  let totalVolume = new Big(0)
  
  for (const { exchange, ticker } of validTickers) {
    if (ticker.bid > bestBid.price) {
      bestBid = { price: ticker.bid, exchange }
    }
    if (ticker.ask < bestAsk.price && ticker.ask > 0) {
      bestAsk = { price: ticker.ask, exchange }
    }
    totalPrice = totalPrice.plus(ticker.last)
    totalVolume = totalVolume.plus(ticker.volume || 0)
  }
  
  return {
    bestBid,
    bestAsk,
    averagePrice: totalPrice.div(validTickers.length).toNumber(),
    totalVolume: totalVolume.toNumber()
  }
}