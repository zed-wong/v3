import type { Order, Transaction, Balance } from '../../../types/exchange'
import type { OrderStatus } from '../../../types/exchange'

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