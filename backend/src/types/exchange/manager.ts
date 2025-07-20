import type { Exchange } from 'ccxt'
import type { ExchangeConfig } from './base'

// Exchange registry interface
export interface ExchangeRegistry {
  userId: string
  exchangeId: string
  label?: string
  config: Partial<ExchangeConfig>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Exchange selection strategies
export type ExchangeSelectionStrategy = (exchanges: Exchange[]) => Exchange | null