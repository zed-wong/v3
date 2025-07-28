// Redis cache implementation for exchange data
import { RedisClient } from "bun"

// Redis connection configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const REDIS_PREFIX = process.env.REDIS_PREFIX || 'exchange:'

// Create singleton cache instance
export const cache = new RedisClient()

// Cache key generators
export const cacheKeys = {
  precision: (exchangeId: string, symbol: string, type: 'price' | 'amount') => 
    `precision-${exchangeId}-${symbol}-${type}`,
  
  markets: (exchangeId: string) => 
    `markets-${exchangeId}`,
  
  balance: (exchangeId: string, userId?: string) => 
    userId ? `balance-${exchangeId}-${userId}` : `balance-${exchangeId}`,
  
  ticker: (exchangeId: string, symbol: string) => 
    `ticker-${exchangeId}-${symbol}`,
  
  orderbook: (exchangeId: string, symbol: string) => 
    `orderbook-${exchangeId}-${symbol}`,
  
  ohlcv: (exchangeId: string, symbol: string, timeframe: string) => 
    `ohlcv-${exchangeId}-${symbol}-${timeframe}`
}