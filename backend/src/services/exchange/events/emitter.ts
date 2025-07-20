import Emittery from 'emittery'
import type { ExchangeEvents } from './types'

// Create typed event emitter
export const exchangeEvents = new Emittery<ExchangeEvents>()

// Clear all listeners (useful for testing)
export const clearAllListeners = () => {
  exchangeEvents.clearListeners()
}