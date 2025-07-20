import type { Order, OrderType, OrderSide } from './order'

// Trade command interfaces
export interface CreateOrderCommand {
  userId: string
  clientId: string
  exchangeId: string
  symbol: string
  type: OrderType
  side: OrderSide
  amount: number
  price?: number // Required for limit orders
}

export interface CancelOrderCommand {
  userId: string
  exchangeId: string
  orderId: string
  symbol: string
}

// Order result with additional metadata
export interface OrderResult extends Order {
  trades?: Array<{
    id: string
    price: number
    amount: number
    timestamp: number
    fee?: {
      currency: string
      cost: number
    }
  }>
}