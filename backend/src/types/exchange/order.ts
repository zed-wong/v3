// Order types
export enum OrderType {
  LIMIT = 'limit',
  MARKET = 'market'
}

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell'
}

export enum OrderStatus {
  PENDING = 'pending',
  OPEN = 'open',
  CLOSED = 'closed',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  REJECTED = 'rejected'
}

export interface Order {
  id: string
  clientOrderId?: string
  timestamp: number
  datetime: string
  symbol: string
  type: OrderType
  side: OrderSide
  price?: number
  amount: number
  filled: number
  remaining: number
  status: OrderStatus
  fee?: {
    currency: string
    cost: number
  }
}