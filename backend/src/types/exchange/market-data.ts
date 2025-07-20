// Market data types
export enum MarketDataType {
  ORDERBOOK = 'ORDERBOOK',
  OHLCV = 'OHLCV',
  TICKER = 'TICKER',
  TICKERS = 'TICKERS'
}

export interface OHLCVData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TickerData {
  symbol: string
  bid: number
  bidVolume?: number
  ask: number
  askVolume?: number
  last: number
  volume?: number
  timestamp: number
}

export interface OrderBookData {
  symbol: string
  bids: Array<[number, number]>
  asks: Array<[number, number]>
  timestamp: number
}

// Market data command interfaces
export interface TickerCommand {
  exchangeId: string
  symbol: string
}

export interface OHLCVCommand {
  exchangeId: string
  symbol: string
  timeframe: string
  since?: number
  limit?: number
}

export interface OrderBookCommand {
  exchangeId: string
  symbol: string
  limit?: number
}