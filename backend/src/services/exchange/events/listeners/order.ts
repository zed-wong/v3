import { exchangeEvents } from '../emitter'

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