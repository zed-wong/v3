import type { Exchange, Ticker, OHLCV, OrderBook } from 'ccxt'
import type { TickerCommand, OHLCVCommand, OrderBookCommand, TickerData, OHLCVData, OrderBookData, MarketDataType } from '../../../types/exchange'
import { ExchangeError } from '../../../types/exchange'
import { withExchangeErrorHandler, exchangeHas, loadMarkets } from '../exchange-base'
import { cache } from '../cache'

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
  const cached = cache.get<TickerData>(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch from exchange
  const ticker = await fetchTicker(exchange, symbol)
  
  // Cache the result
  cache.set(cacheKey, ticker, cacheTtl)
  
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
  const cached = cache.get<Record<string, TickerData>>(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch from exchange
  const tickers = await fetchTickers(exchange, symbols)
  
  // Cache the result
  cache.set(cacheKey, tickers, cacheTtl)
  
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
  const cached = cache.get<OHLCVData[]>(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch from exchange
  const ohlcv = await fetchOHLCV(exchange, symbol, timeframe, since, limit)
  
  // Cache the result
  cache.set(cacheKey, ohlcv, cacheTtl)
  
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
  const cached = cache.get<OrderBookData>(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch from exchange
  const orderBook = await fetchOrderBook(exchange, symbol, limit)
  
  // Cache the result
  cache.set(cacheKey, orderBook, cacheTtl)
  
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
  return ((currentPrice - previousPrice) / previousPrice) * 100
}

// Calculate VWAP (Volume Weighted Average Price)
export const calculateVWAP = (ohlcv: OHLCVData[]): number => {
  if (ohlcv.length === 0) return 0
  
  let totalVolume = 0
  let totalValue = 0
  
  for (const candle of ohlcv) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3
    totalValue += typicalPrice * candle.volume
    totalVolume += candle.volume
  }
  
  return totalVolume > 0 ? totalValue / totalVolume : 0
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
  let totalPrice = 0
  let totalVolume = 0
  
  for (const { exchange, ticker } of validTickers) {
    if (ticker.bid > bestBid.price) {
      bestBid = { price: ticker.bid, exchange }
    }
    if (ticker.ask < bestAsk.price && ticker.ask > 0) {
      bestAsk = { price: ticker.ask, exchange }
    }
    totalPrice += ticker.last
    totalVolume += ticker.volume || 0
  }
  
  return {
    bestBid,
    bestAsk,
    averagePrice: totalPrice / validTickers.length,
    totalVolume
  }
}