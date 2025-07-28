// Mock cache for testing
class MockCache {
  private cache: Map<string, string> = new Map()
  
  async get(key: string): Promise<string | null> {
    return this.cache.get(key) || null
  }
  
  async set(key: string, value: string, _mode?: string, _ttl?: number): Promise<"OK"> {
    this.cache.set(key, value)
    return "OK"
  }
  
  async del(...keys: string[]): Promise<number> {
    let deleted = 0
    for (const key of keys) {
      if (this.cache.delete(key)) {
        deleted++
      }
    }
    return deleted
  }
  
  async keys(pattern: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys())
    if (pattern === '*') {
      return allKeys
    }
    
    // Simple pattern matching
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    return allKeys.filter(key => regex.test(key))
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  // For backward compatibility with old tests
  delete(key: string): boolean {
    return this.cache.delete(key)
  }
}

export const mockCache = new MockCache()

// Mock cache keys
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