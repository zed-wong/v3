import { exchangeEvents } from '../emitter'

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