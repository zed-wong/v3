import { exchangeEvents } from '../emitter'

// Listen to deposit events for a specific user
export const onUserDepositEvents = (
  userId: string,
  callback: (eventName: string, data: any) => void
): (() => void) => {
  const handleDepositEvent = (eventName: string) => (data: any) => {
    if (data.userId === userId) {
      callback(eventName, data)
    }
  }
  
  const unsubscribers = [
    exchangeEvents.on('deposit:received', handleDepositEvent('deposit:received')),
    exchangeEvents.on('deposit:confirmed', handleDepositEvent('deposit:confirmed')),
    exchangeEvents.on('deposit:failed', handleDepositEvent('deposit:failed'))
  ]
  
  return () => {
    unsubscribers.forEach(unsub => unsub())
  }
}

// Listen to withdrawal events for a specific user
export const onUserWithdrawalEvents = (
  userId: string,
  callback: (eventName: string, data: any) => void
): (() => void) => {
  const handleWithdrawalEvent = (eventName: string) => (data: any) => {
    if (data.userId === userId) {
      callback(eventName, data)
    }
  }
  
  const unsubscribers = [
    exchangeEvents.on('withdrawal:created', handleWithdrawalEvent('withdrawal:created')),
    exchangeEvents.on('withdrawal:confirmed', handleWithdrawalEvent('withdrawal:confirmed')),
    exchangeEvents.on('withdrawal:failed', handleWithdrawalEvent('withdrawal:failed'))
  ]
  
  return () => {
    unsubscribers.forEach(unsub => unsub())
  }
}