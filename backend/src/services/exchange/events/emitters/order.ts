import type { Order } from '../../../../types/exchange'
import { OrderStatus } from '../../../../types/exchange'
import { exchangeEvents } from '../emitter'

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

export const emitOrderCanceled = (orderId: string, userId: string, exchangeId: string) => {
  exchangeEvents.emit('order:canceled', { orderId, userId, exchangeId })
}