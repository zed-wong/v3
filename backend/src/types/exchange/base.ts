import type { Exchange } from 'ccxt'

// Core exchange configuration types
export interface ExchangeConfig {
  exchangeId: string
  apiKey: string
  secret: string
  password?: string
  uid?: string
  privateKey?: string
  walletAddress?: string
  options?: Record<string, any>
}

export interface ExchangeInstance {
  id: string
  exchange: Exchange
  config: ExchangeConfig
}

// Function types for functional programming style
export type ExchangeFactory = (config: ExchangeConfig) => Promise<Exchange>
export type ExchangeMethod<T, R> = (exchange: Exchange, params: T) => Promise<R>
export type ExchangeMapper<T, R> = (data: T) => R
export type ExchangeValidator<T> = (data: T) => boolean | string