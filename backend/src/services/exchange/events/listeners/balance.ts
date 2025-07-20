import { exchangeEvents } from '../emitter'

// Listen to balance events for a specific user
export const onUserBalanceEvents = (
  userId: string,
  callback: (eventName: string, data: any) => void
): (() => void) => {
  const handleBalanceUpdate = (data: any) => {
    if (data.userId === userId) {
      callback('balance:updated', data)
    }
  }
  
  const handleInsufficientBalance = (data: any) => {
    if (data.userId === userId) {
      callback('balance:insufficient', data)
    }
  }
  
  const unsubscribers = [
    exchangeEvents.on('balance:updated', handleBalanceUpdate),
    exchangeEvents.on('balance:insufficient', handleInsufficientBalance)
  ]
  
  return () => {
    unsubscribers.forEach(unsub => unsub())
  }
}