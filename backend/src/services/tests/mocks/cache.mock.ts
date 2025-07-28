// Mock Redis cache for testing
import { mock } from 'bun:test'

// Create a mock cache instance
export const createMockCache = () => {
  const storage = new Map<string, string>()
  
  return {
    // Async Redis-compatible methods
    async get(key: string): Promise<string | null> {
      return storage.get(key) || null
    },
    
    async set(key: string, value: string, mode?: "EX" | "PX" | "EXAT" | "PXAT" | "NX" | "XX" | "KEEPTTL" | "GET", ttl?: number): Promise<"OK"> {
      storage.set(key, value)
      return "OK"
    },
    
    async del(...keys: string[]): Promise<number> {
      let count = 0
      for (const key of keys) {
        if (storage.delete(key)) count++
      }
      return count
    },
    
    async keys(pattern: string): Promise<string[]> {
      const allKeys = Array.from(storage.keys())
      if (pattern === '*') return allKeys
      
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
      return allKeys.filter(key => regex.test(key))
    },
    
    async exists(key: string): Promise<boolean> {
      return storage.has(key)
    },
    
    async incr(key: string): Promise<number> {
      const val = parseInt(storage.get(key) || '0')
      const newVal = val + 1
      storage.set(key, newVal.toString())
      return newVal
    },
    
    async hmset(key: string, fieldValues: string[]): Promise<string> {
      const hash: Record<string, string> = {}
      for (let i = 0; i < fieldValues.length; i += 2) {
        hash[fieldValues[i]] = fieldValues[i + 1]
      }
      storage.set(key, JSON.stringify(hash))
      return "OK"
    },
    
    async hmget(key: string, fields: string[]): Promise<(string | null)[]> {
      const data = storage.get(key)
      if (!data) return fields.map(() => null)
      
      const hash = JSON.parse(data)
      return fields.map(field => hash[field] || null)
    },
    
    async ping(): Promise<"PONG"> {
      return "PONG"
    },
    
    // Test helper methods
    clear(): void {
      storage.clear()
    },
    
    size(): number {
      return storage.size
    }
  }
}

// Create cache keys helper
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

// Mock the cache module
export const mockCacheModule = () => {
  const mockCache = createMockCache()
  
  mock.module('../../exchange/cache', () => ({
    cache: mockCache,
    cacheKeys
  }))
  
  return mockCache
}