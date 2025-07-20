import Emittery from 'emittery'
import type { Order, Transaction, Balance } from '../../types/exchange'
import { OrderStatus } from '../../types/exchange'

// Define event types
export interface ExchangeEvents {
  // Order events
  'order:created': { order: Order; userId: string; exchangeId: string }
  'order:updated': { order: Order; previousStatus: OrderStatus; userId: string; exchangeId: string }
  'order:filled': { order: Order; userId: string; exchangeId: string }
  'order:canceled': { orderId: string; userId: string; exchangeId: string }
  'order:failed': { order: Order; error: Error; userId: string; exchangeId: string }
  
  // Trade events
  'trade:executed': { order: Order; trades: any[]; userId: string; exchangeId: string }
  
  // Balance events
  'balance:updated': { balances: Record<string, Balance>; userId: string; exchangeId: string }
  'balance:insufficient': { currency: string; required: number; available: number; userId: string; exchangeId: string }
  
  // Deposit events
  'deposit:received': { deposit: Transaction; userId: string; exchangeId: string }
  'deposit:confirmed': { deposit: Transaction; userId: string; exchangeId: string }
  'deposit:failed': { deposit: Transaction; error: Error; userId: string; exchangeId: string }
  
  // Withdrawal events
  'withdrawal:created': { withdrawal: Transaction; userId: string; exchangeId: string }
  'withdrawal:confirmed': { withdrawal: Transaction; userId: string; exchangeId: string }
  'withdrawal:failed': { withdrawal: Transaction; error: Error; userId: string; exchangeId: string }
  
  // Market data events
  'ticker:update': { symbol: string; ticker: any; exchangeId: string }
  'orderbook:update': { symbol: string; orderbook: any; exchangeId: string }
  
  // Exchange connection events
  'exchange:connected': { userId: string; exchangeId: string }
  'exchange:disconnected': { userId: string; exchangeId: string; reason?: string }
  'exchange:error': { userId: string; exchangeId: string; error: Error }
  
  // Strategy events
  'strategy:signal': { strategyId: string; signal: any; exchangeId?: string }
  'strategy:executed': { strategyId: string; orders: Order[]; exchangeId: string }
}

// Create typed event emitter
export const exchangeEvents = new Emittery<ExchangeEvents>()

// Helper functions for common event patterns

// Emit order lifecycle events
export const emitOrderCreated = (order: Order, userId: string, exchangeId: string) => {
  exchangeEvents.emit('order:created', { order, userId, exchangeId })
}

export const emitOrderUpdated = (
  order: Order,
  previousStatus: OrderStatus,
  userId: string,
  exchangeId: string
) => {
  exchangeEvents.emit('order:updated', { order, previousStatus, userId, exchangeId })
  
  // Emit specific events based on status
  if (order.status === OrderStatus.CLOSED && order.filled === order.amount) {
    exchangeEvents.emit('order:filled', { order, userId, exchangeId })
  }
}

export const emitOrderFailed = (order: Order, error: Error, userId: string, exchangeId: string) => {
  exchangeEvents.emit('order:failed', { order, error, userId, exchangeId })
}

// Emit balance events
export const emitBalanceUpdated = (
  balances: Record<string, Balance>,
  userId: string,
  exchangeId: string
) => {
  exchangeEvents.emit('balance:updated', { balances, userId, exchangeId })
}

export const emitInsufficientBalance = (
  currency: string,
  required: number,
  available: number,
  userId: string,
  exchangeId: string
) => {
  exchangeEvents.emit('balance:insufficient', {
    currency,
    required,
    available,
    userId,
    exchangeId
  })
}

// Emit deposit events
export const emitDepositReceived = (deposit: Transaction, userId: string, exchangeId: string) => {
  exchangeEvents.emit('deposit:received', { deposit, userId, exchangeId })
}

export const emitDepositConfirmed = (deposit: Transaction, userId: string, exchangeId: string) => {
  exchangeEvents.emit('deposit:confirmed', { deposit, userId, exchangeId })
}

// Emit withdrawal events
export const emitWithdrawalCreated = (withdrawal: Transaction, userId: string, exchangeId: string) => {
  exchangeEvents.emit('withdrawal:created', { withdrawal, userId, exchangeId })
}

export const emitWithdrawalConfirmed = (
  withdrawal: Transaction,
  userId: string,
  exchangeId: string
) => {
  exchangeEvents.emit('withdrawal:confirmed', { withdrawal, userId, exchangeId })
}

// Emit market data events
export const emitTickerUpdate = (symbol: string, ticker: any, exchangeId: string) => {
  exchangeEvents.emit('ticker:update', { symbol, ticker, exchangeId })
}

export const emitOrderBookUpdate = (symbol: string, orderbook: any, exchangeId: string) => {
  exchangeEvents.emit('orderbook:update', { symbol, orderbook, exchangeId })
}

// Emit exchange connection events
export const emitExchangeConnected = (userId: string, exchangeId: string) => {
  exchangeEvents.emit('exchange:connected', { userId, exchangeId })
}

export const emitExchangeDisconnected = (userId: string, exchangeId: string, reason?: string) => {
  exchangeEvents.emit('exchange:disconnected', { userId, exchangeId, reason })
}

export const emitExchangeError = (userId: string, exchangeId: string, error: Error) => {
  exchangeEvents.emit('exchange:error', { userId, exchangeId, error })
}

// Event listener helpers

// Listen to all order events
export const onOrderEvents = (
  callback: (eventName: string, data: any) => void
): (() => void) => {
  const unsubscribers = [
    exchangeEvents.on('order:created', (data) => callback('order:created', data)),
    exchangeEvents.on('order:updated', (data) => callback('order:updated', data)),
    exchangeEvents.on('order:filled', (data) => callback('order:filled', data)),
    exchangeEvents.on('order:canceled', (data) => callback('order:canceled', data)),
    exchangeEvents.on('order:failed', (data) => callback('order:failed', data))
  ]
  
  return () => {
    unsubscribers.forEach(unsub => unsub())
  }
}

// Listen to balance events for a specific user
export const onUserBalanceEvents = (
  userId: string,
  callback: (eventName: string, data: any) => void
): (() => void) => {
  const handleBalanceUpdate = (data: any) => {
    if (data.userId === userId) {
      callback('balance:updated', data)
    }
  }
  
  const handleInsufficientBalance = (data: any) => {
    if (data.userId === userId) {
      callback('balance:insufficient', data)
    }
  }
  
  const unsubscribers = [
    exchangeEvents.on('balance:updated', handleBalanceUpdate),
    exchangeEvents.on('balance:insufficient', handleInsufficientBalance)
  ]
  
  return () => {
    unsubscribers.forEach(unsub => unsub())
  }
}

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

// Clear all listeners (useful for testing)
export const clearAllListeners = () => {
  exchangeEvents.clearListeners()
}