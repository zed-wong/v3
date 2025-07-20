import type { Transaction } from '../../../../types/exchange'
import { exchangeEvents } from '../emitter'

// Emit deposit events
export const emitDepositReceived = (deposit: Transaction, userId: string, exchangeId: string) => {
  exchangeEvents.emit('deposit:received', { deposit, userId, exchangeId })
}

export const emitDepositConfirmed = (deposit: Transaction, userId: string, exchangeId: string) => {
  exchangeEvents.emit('deposit:confirmed', { deposit, userId, exchangeId })
}

export const emitDepositFailed = (deposit: Transaction, error: Error, userId: string, exchangeId: string) => {
  exchangeEvents.emit('deposit:failed', { deposit, error, userId, exchangeId })
}

// Emit withdrawal events
export const emitWithdrawalCreated = (withdrawal: Transaction, userId: string, exchangeId: string) => {
  exchangeEvents.emit('withdrawal:created', { withdrawal, userId, exchangeId })
}

export const emitWithdrawalConfirmed = (
  withdrawal: Transaction,
  userId: string,
  exchangeId: string
) => {
  exchangeEvents.emit('withdrawal:confirmed', { withdrawal, userId, exchangeId })
}

export const emitWithdrawalFailed = (withdrawal: Transaction, error: Error, userId: string, exchangeId: string) => {
  exchangeEvents.emit('withdrawal:failed', { withdrawal, error, userId, exchangeId })
}