import { exchangeEvents } from '../emitter'

// Listen to market data events for specific symbols
export const onMarketDataEvents = (
  symbols: string[],
  callback: (eventName: string, data: any) => void
): (() => void) => {
  const symbolSet = new Set(symbols)
  
  const handleTickerUpdate = (data: any) => {
    if (symbolSet.has(data.symbol)) {
      callback('ticker:update', data)
    }
  }
  
  const handleOrderBookUpdate = (data: any) => {
    if (symbolSet.has(data.symbol)) {
      callback('orderbook:update', data)
    }
  }
  
  const unsubscribers = [
    exchangeEvents.on('ticker:update', handleTickerUpdate),
    exchangeEvents.on('orderbook:update', handleOrderBookUpdate)
  ]
  
  return () => {
    unsubscribers.forEach(unsub => unsub())
  }
}