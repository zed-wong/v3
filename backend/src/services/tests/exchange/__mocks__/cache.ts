// Mock cache for testing
class MockCache {
  private storage = new Map<string, string>()
  
  async get(key: string): Promise<string | null> {
    return this.storage.get(key) || null
  }
  
  async set(key: string, value: string, _mode?: string, _ttl?: number): Promise<"OK"> {
    this.storage.set(key, value)
    return "OK"
  }
  
  async del(...keys: string[]): Promise<number> {
    let count = 0
    for (const key of keys) {
      if (this.storage.delete(key)) count++
    }
    return count
  }
  
  async keys(pattern: string): Promise<string[]> {
    const allKeys = Array.from(this.storage.keys())
    if (pattern === '*') return allKeys
    
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    return allKeys.filter(key => regex.test(key))
  }
  
  async exists(key: string): Promise<boolean> {
    return this.storage.has(key)
  }
  
  async incr(key: string): Promise<number> {
    const val = parseInt(this.storage.get(key) || '0')
    const newVal = val + 1
    this.storage.set(key, newVal.toString())
    return newVal
  }
  
  async hmset(key: string, fieldValues: string[]): Promise<string> {
    const hash: Record<string, string> = {}
    for (let i = 0; i < fieldValues.length; i += 2) {
      hash[fieldValues[i]] = fieldValues[i + 1]
    }
    this.storage.set(key, JSON.stringify(hash))
    return "OK"
  }
  
  async hmget(key: string, fields: string[]): Promise<(string | null)[]> {
    const data = this.storage.get(key)
    if (!data) return fields.map(() => null)
    
    const hash = JSON.parse(data)
    return fields.map(field => hash[field] || null)
  }
  
  async ping(): Promise<"PONG"> {
    return "PONG"
  }
  
  // Add synchronous methods for backward compatibility
  clear(): void {
    this.storage.clear()
  }
  
  // Synchronous get for old tests (returns parsed JSON)
  get<T>(key: string): T | null {
    const value = this.storage.get(key)
    if (!value) return null
    try {
      return JSON.parse(value)
    } catch {
      return value as any
    }
  }
  
  // Synchronous set for old tests (stringifies value)
  set<T>(key: string, value: T, _ttl?: number): void {
    this.storage.set(key, typeof value === 'string' ? value : JSON.stringify(value))
  }
  
  // Synchronous delete for old tests
  delete(key: string): boolean {
    return this.storage.delete(key)
  }
}

export const cache = new MockCache()

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