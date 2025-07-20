import { exchangeEvents } from '../emitter'

// Listen to exchange connection events for a specific user
export const onUserExchangeConnectionEvents = (
  userId: string,
  callback: (eventName: string, data: any) => void
): (() => void) => {
  const handleConnectionEvent = (eventName: string) => (data: any) => {
    if (data.userId === userId) {
      callback(eventName, data)
    }
  }
  
  const unsubscribers = [
    exchangeEvents.on('exchange:connected', handleConnectionEvent('exchange:connected')),
    exchangeEvents.on('exchange:disconnected', handleConnectionEvent('exchange:disconnected')),
    exchangeEvents.on('exchange:error', handleConnectionEvent('exchange:error'))
  ]
  
  return () => {
    unsubscribers.forEach(unsub => unsub())
  }
}

// Listen to all exchange connection events
export const onAllExchangeConnectionEvents = (
  callback: (eventName: string, data: any) => void
): (() => void) => {
  const unsubscribers = [
    exchangeEvents.on('exchange:connected', (data) => callback('exchange:connected', data)),
    exchangeEvents.on('exchange:disconnected', (data) => callback('exchange:disconnected', data)),
    exchangeEvents.on('exchange:error', (data) => callback('exchange:error', data))
  ]
  
  return () => {
    unsubscribers.forEach(unsub => unsub())
  }
}