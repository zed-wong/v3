import type { Exchange, Order as CCXTOrder } from 'ccxt'
import { Decimal } from 'decimal.js'
import type { CreateOrderCommand, CancelOrderCommand, OrderResult } from '../../../types/exchange'
import { ExchangeError, InvalidOrderError, InsufficientBalanceError, OrderType, OrderSide, OrderStatus } from '../../../types/exchange'
import { withExchangeErrorHandler, exchangeHas, formatOrderValues } from '../exchange-base'
import { validateSufficientBalance } from '../balance/balance'
import { cache } from '../cache'

// Re-export types for convenience
export type { CreateOrderCommand, CancelOrderCommand, OrderResult } from '../../../types/exchange'

// Create market order
export const createMarketOrder = withExchangeErrorHandler(
  async (
    exchange: Exchange,
    symbol: string,
    side: OrderSide,
    amount: number
  ): Promise<OrderResult> => {
    if (!exchangeHas(exchange, 'createMarketOrder')) {
      throw new ExchangeError(
        `Exchange ${exchange.id} does not support market orders`,
        exchange.id
      )
    }
    
    // Special handling for exchanges that need price for market orders
    let price: number | undefined
    if (['bigone', 'mexc'].includes(exchange.id)) {
      const ticker = await exchange.fetchTicker(symbol)
      price = ticker.last
    }
    
    const order = await exchange.createMarketOrder(symbol, side, amount, price)
    return mapCCXTOrderToOrderResult(order)
  }
)

// Create limit order
export const createLimitOrder = withExchangeErrorHandler(
  async (
    exchange: Exchange,
    symbol: string,
    side: OrderSide,
    amount: number,
    price: number
  ): Promise<OrderResult> => {
    if (!exchangeHas(exchange, 'createLimitOrder')) {
      throw new ExchangeError(
        `Exchange ${exchange.id} does not support limit orders`,
        exchange.id
      )
    }
    
    // Format values according to exchange precision
    const formatted = formatOrderValues(exchange, symbol, price, amount)
    
    const order = await exchange.createLimitOrder(
      symbol,
      side,
      parseFloat(formatted.amount),
      parseFloat(formatted.price)
    )
    
    return mapCCXTOrderToOrderResult(order)
  }
)

// Create order with balance validation
export const createOrder = async (
  exchange: Exchange,
  command: CreateOrderCommand
): Promise<OrderResult> => {
  // Validate order parameters
  validateOrderParameters(command)
  
  // Check balance for buy orders
  if (command.side === OrderSide.BUY) {
    const balance = await exchange.fetchBalance()
    const symbolParts = command.symbol.split('/')
    if (symbolParts.length < 2) {
      throw new InvalidOrderError(`Invalid symbol format: ${command.symbol}`, exchange.id)
    }
    const quoteCurrency = symbolParts[1]
    const quoteBalance = quoteCurrency ? balance[quoteCurrency] : undefined
    
    if (quoteBalance && quoteCurrency) {
      const requiredAmount = command.type === OrderType.LIMIT && command.price
        ? new Decimal(command.amount).times(command.price).toNumber()
        : command.amount // For market orders, this is approximate
      
      try {
        validateSufficientBalance(quoteBalance, requiredAmount, quoteCurrency)
      } catch (error) {
        throw new InsufficientBalanceError(
          exchange.id,
          quoteCurrency,
          requiredAmount,
          quoteBalance.free ?? 0
        )
      }
    }
  }
  
  // Create the order
  if (command.type === OrderType.MARKET) {
    return createMarketOrder(exchange, command.symbol, command.side, command.amount)
  } else {
    if (!command.price) {
      throw new InvalidOrderError('Price is required for limit orders', exchange.id)
    }
    return createLimitOrder(exchange, command.symbol, command.side, command.amount, command.price)
  }
}

// Cancel order
export const cancelOrder = withExchangeErrorHandler(
  async (
    exchange: Exchange,
    orderId: string,
    symbol: string
  ): Promise<boolean> => {
    if (!exchangeHas(exchange, 'cancelOrder')) {
      throw new ExchangeError(
        `Exchange ${exchange.id} does not support order cancellation`,
        exchange.id
      )
    }
    
    await exchange.cancelOrder(orderId, symbol)
    
    // Clear cached orders
    const cacheKey = `orders-${exchange.id}-${symbol}-open`
    cache.delete(cacheKey)
    
    return true
  }
)

// Fetch order by ID
export const fetchOrder = withExchangeErrorHandler(
  async (
    exchange: Exchange,
    orderId: string,
    symbol: string
  ): Promise<OrderResult> => {
    if (!exchangeHas(exchange, 'fetchOrder')) {
      throw new ExchangeError(
        `Exchange ${exchange.id} does not support fetching individual orders`,
        exchange.id
      )
    }
    
    const order = await exchange.fetchOrder(orderId, symbol)
    return mapCCXTOrderToOrderResult(order)
  }
)

// Fetch open orders
export const fetchOpenOrders = withExchangeErrorHandler(
  async (
    exchange: Exchange,
    symbol?: string,
    since?: number,
    limit?: number
  ): Promise<OrderResult[]> => {
    if (!exchangeHas(exchange, 'fetchOpenOrders')) {
      throw new ExchangeError(
        `Exchange ${exchange.id} does not support fetching open orders`,
        exchange.id
      )
    }
    
    const orders = await exchange.fetchOpenOrders(symbol, since, limit)
    return orders.map(mapCCXTOrderToOrderResult)
  }
)

// Fetch closed orders
export const fetchClosedOrders = withExchangeErrorHandler(
  async (
    exchange: Exchange,
    symbol?: string,
    since?: number,
    limit?: number
  ): Promise<OrderResult[]> => {
    if (!exchangeHas(exchange, 'fetchClosedOrders')) {
      throw new ExchangeError(
        `Exchange ${exchange.id} does not support fetching closed orders`,
        exchange.id
      )
    }
    
    const orders = await exchange.fetchClosedOrders(symbol, since, limit)
    return orders.map(mapCCXTOrderToOrderResult)
  }
)

// Get open orders with caching
export const getOpenOrders = async (
  exchange: Exchange,
  symbol?: string,
  cacheTtl = 5 // 5 seconds cache for open orders
): Promise<OrderResult[]> => {
  const cacheKey = `orders-${exchange.id}-${symbol || 'all'}-open`
  
  // Try cache first
  const cached = cache.get<OrderResult[]>(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch from exchange
  const orders = await fetchOpenOrders(exchange, symbol)
  
  // Cache the result
  cache.set(cacheKey, orders, cacheTtl)
  
  return orders
}

// Cancel all open orders for a symbol
export const cancelAllOrders = async (
  exchange: Exchange,
  symbol?: string
): Promise<number> => {
  const openOrders = await fetchOpenOrders(exchange, symbol)
  
  let canceledCount = 0
  const cancelPromises = openOrders.map(async (order) => {
    try {
      await cancelOrder(exchange, order.id, order.symbol)
      canceledCount++
    } catch (error) {
      console.error(`Failed to cancel order ${order.id}:`, error)
    }
  })
  
  await Promise.all(cancelPromises)
  
  return canceledCount
}

// Cancel old unfilled orders (older than specified seconds)
export const cancelOldUnfilledOrders = async (
  exchange: Exchange,
  ageSeconds = 30,
  symbol?: string
): Promise<number> => {
  const openOrders = await fetchOpenOrders(exchange, symbol)
  const cutoffTime = Date.now() - (ageSeconds * 1000)
  
  const oldOrders = openOrders.filter(order => 
    order.timestamp < cutoffTime && order.filled === 0
  )
  
  let canceledCount = 0
  const cancelPromises = oldOrders.map(async (order) => {
    try {
      await cancelOrder(exchange, order.id, order.symbol)
      canceledCount++
    } catch (error) {
      console.error(`Failed to cancel old order ${order.id}:`, error)
    }
  })
  
  await Promise.all(cancelPromises)
  
  return canceledCount
}

// Helper: Map CCXT order to our OrderResult type
const mapCCXTOrderToOrderResult = (order: CCXTOrder): OrderResult => {
  const status = mapOrderStatus(order.status)
  
  return {
    id: order.id,
    clientOrderId: order.clientOrderId,
    timestamp: order.timestamp || 0,
    datetime: order.datetime || new Date(order.timestamp || 0).toISOString(),
    symbol: order.symbol || '',
    type: (order.type as OrderType) || OrderType.LIMIT,
    side: (order.side as OrderSide) || OrderSide.BUY,
    price: order.price,
    amount: order.amount || 0,
    filled: order.filled || 0,
    remaining: order.remaining || 0,
    status,
    fee: order.fee ? {
      currency: order.fee.currency || '',
      cost: order.fee.cost || 0
    } : undefined,
    trades: order.trades?.map(trade => ({
      id: trade.id || '',
      price: trade.price || 0,
      amount: trade.amount || 0,
      timestamp: trade.timestamp || 0,
      fee: trade.fee ? {
        currency: trade.fee.currency || '',
        cost: trade.fee.cost || 0
      } : undefined
    }))
  }
}

// Helper: Map CCXT order status to our OrderStatus
const mapOrderStatus = (ccxtStatus?: string): OrderStatus => {
  if (!ccxtStatus) return OrderStatus.PENDING
  
  switch (ccxtStatus.toLowerCase()) {
    case 'open':
      return OrderStatus.OPEN
    case 'closed':
      return OrderStatus.CLOSED
    case 'canceled':
    case 'cancelled':
      return OrderStatus.CANCELED
    case 'expired':
      return OrderStatus.EXPIRED
    case 'rejected':
      return OrderStatus.REJECTED
    case 'pending':
    default:
      return OrderStatus.PENDING
  }
}

// Helper: Validate order parameters
const validateOrderParameters = (command: CreateOrderCommand): void => {
  if (!command.symbol) {
    throw new InvalidOrderError('Symbol is required', command.exchangeId)
  }
  
  if (command.amount <= 0) {
    throw new InvalidOrderError('Amount must be greater than 0', command.exchangeId)
  }
  
  if (command.type === OrderType.LIMIT && (!command.price || command.price <= 0)) {
    throw new InvalidOrderError('Price must be greater than 0 for limit orders', command.exchangeId)
  }
  
  if (!Object.values(OrderType).includes(command.type)) {
    throw new InvalidOrderError(`Invalid order type: ${command.type}`, command.exchangeId)
  }
  
  if (!Object.values(OrderSide).includes(command.side)) {
    throw new InvalidOrderError(`Invalid order side: ${command.side}`, command.exchangeId)
  }
}