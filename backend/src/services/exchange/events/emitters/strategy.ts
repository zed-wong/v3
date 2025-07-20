import type { Order } from '../../../../types/exchange'
import { exchangeEvents } from '../emitter'

// Emit strategy events
export const emitStrategySignal = (strategyId: string, signal: any, exchangeId?: string) => {
  exchangeEvents.emit('strategy:signal', { strategyId, signal, exchangeId })
}

export const emitStrategyExecuted = (strategyId: string, orders: Order[], exchangeId: string) => {
  exchangeEvents.emit('strategy:executed', { strategyId, orders, exchangeId })
}