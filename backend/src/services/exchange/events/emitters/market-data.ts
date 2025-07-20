import { exchangeEvents } from '../emitter'

// Emit market data events
export const emitTickerUpdate = (symbol: string, ticker: any, exchangeId: string) => {
  exchangeEvents.emit('ticker:update', { symbol, ticker, exchangeId })
}

export const emitOrderBookUpdate = (symbol: string, orderbook: any, exchangeId: string) => {
  exchangeEvents.emit('orderbook:update', { symbol, orderbook, exchangeId })
}