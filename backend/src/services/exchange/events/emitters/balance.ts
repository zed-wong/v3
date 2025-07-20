import type { Balance } from '../../../../types/exchange'
import { exchangeEvents } from '../emitter'

// Emit balance events
export const emitBalanceUpdated = (
  balances: Record<string, Balance>,
  userId: string,
  exchangeId: string
) => {
  exchangeEvents.emit('balance:updated', { balances, userId, exchangeId })
}

export const emitInsufficientBalance = (
  currency: string,
  required: number,
  available: number,
  userId: string,
  exchangeId: string
) => {
  exchangeEvents.emit('balance:insufficient', {
    currency,
    required,
    available,
    userId,
    exchangeId
  })
}