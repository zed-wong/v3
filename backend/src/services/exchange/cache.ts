// Simple in-memory cache implementation for exchange data
// In production, this could be replaced with Redis using Bun.redis

interface CacheEntry<T> {
  value: T
  expiry: number
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const expiry = ttlSeconds 
      ? Date.now() + (ttlSeconds * 1000)
      : Number.MAX_SAFE_INTEGER
    
    this.cache.set(key, { value, expiry })
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    if (entry.expiry < Date.now()) {
      this.cache.delete(key)
      return null
    }
    
    return entry.value as T
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  keys(pattern?: string): string[] {
    const keys = Array.from(this.cache.keys())
    
    if (!pattern) {
      return keys
    }
    
    // Simple pattern matching (supports * wildcard)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    return keys.filter(key => regex.test(key))
  }
  
  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry < now) {
        this.cache.delete(key)
      }
    }
  }
}

// Create singleton cache instance
export const cache = new SimpleCache()

// Cache key generators
export const cacheKeys = {
  exchangeDependencies: (exchangeName: string) => 
    `ccxt-${exchangeName}-dependencies`,
  
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

// Cache decorators for functional programming
export const withCache = <T extends any[], R>(
  keyGenerator: (...args: T) => string,
  ttlSeconds?: number
) => {
  return (fn: (...args: T) => Promise<R>) => {
    return async (...args: T): Promise<R> => {
      const key = keyGenerator(...args)
      const cached = cache.get<R>(key)
      
      if (cached !== null) {
        return cached
      }
      
      const result = await fn(...args)
      cache.set(key, result, ttlSeconds)
      return result
    }
  }
}

// Periodic cleanup (run every 5 minutes)
setInterval(() => {
  cache.cleanup()
}, 5 * 60 * 1000)