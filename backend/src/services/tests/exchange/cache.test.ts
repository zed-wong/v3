import { test, expect, describe, beforeAll, afterAll } from "bun:test"
import { cache, cacheKeys } from "../../exchange/cache"

describe("Redis Cache", () => {
  // Test if Redis is available
  let redisAvailable = false
  const testPrefix = "test:exchange:"

  beforeAll(async () => {
    try {
      await cache.ping()
      redisAvailable = true
    } catch (error) {
      console.warn("Redis not available for testing, skipping Redis cache tests")
    }
  })

  afterAll(async () => {
    if (redisAvailable) {
      // Clean up test keys
      const keys = await cache.keys(`${testPrefix}*`)
      if (keys.length > 0) {
        await cache.del(...keys)
      }
    }
  })

  test.skipIf(!redisAvailable)("should set and get string values", async () => {
    const key = `${testPrefix}test-key`
    const value = JSON.stringify({ data: "test-value", number: 42 })

    await cache.set(key, value)
    const retrieved = await cache.get(key)

    expect(JSON.parse(retrieved!)).toEqual(JSON.parse(value))
  })

  test.skipIf(!redisAvailable)("should set values with TTL", async () => {
    const key = `${testPrefix}test-ttl-key`
    const value = JSON.stringify({ data: "expires" })

    await cache.set(key, value, "EX", 1) // 1 second TTL
    
    // Value should exist immediately
    const retrieved = await cache.get(key)
    expect(retrieved).toBe(value)

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100))
    
    const expired = await cache.get(key)
    expect(expired).toBeNull()
  })

  test.skipIf(!redisAvailable)("should delete values", async () => {
    const key = `${testPrefix}test-delete-key`
    const value = JSON.stringify({ data: "to-delete" })

    await cache.set(key, value)
    const result = await cache.del(key)
    
    expect(result).toBe(1)
    
    const retrieved = await cache.get(key)
    expect(retrieved).toBeNull()
  })

  test.skipIf(!redisAvailable)("should list keys with pattern", async () => {
    // Set up test data
    await cache.set(`${testPrefix}markets-binance`, JSON.stringify({ exchange: "binance" }))
    await cache.set(`${testPrefix}markets-kraken`, JSON.stringify({ exchange: "kraken" }))
    await cache.set(`${testPrefix}ticker-binance-BTC/USDT`, JSON.stringify({ price: 50000 }))

    // Test pattern matching
    const marketKeys = await cache.keys(`${testPrefix}markets-*`)
    expect(marketKeys).toContain(`${testPrefix}markets-binance`)
    expect(marketKeys).toContain(`${testPrefix}markets-kraken`)
    expect(marketKeys).not.toContain(`${testPrefix}ticker-binance-BTC/USDT`)
  })

  test.skipIf(!redisAvailable)("should handle complex key operations", async () => {
    const hashKey = `${testPrefix}hash-test`
    
    // Test hash operations
    await cache.hmset(hashKey, ["field1", "value1", "field2", "value2"])
    const values = await cache.hmget(hashKey, ["field1", "field2"])
    expect(values).toEqual(["value1", "value2"])

    // Test increment
    const counterKey = `${testPrefix}counter`
    await cache.set(counterKey, "10")
    const newValue = await cache.incr(counterKey)
    expect(newValue).toBe(11)
  })

  test.skipIf(!redisAvailable)("should check if key exists", async () => {
    const key = `${testPrefix}exists-test`
    
    expect(await cache.exists(key)).toBe(false)
    
    await cache.set(key, "value")
    expect(await cache.exists(key)).toBe(true)
  })

  test("should generate correct cache keys", () => {
    expect(cacheKeys.precision("binance", "BTC/USDT", "price")).toBe("precision-binance-BTC/USDT-price")
    expect(cacheKeys.precision("binance", "BTC/USDT", "amount")).toBe("precision-binance-BTC/USDT-amount")
    expect(cacheKeys.markets("kraken")).toBe("markets-kraken")
    expect(cacheKeys.balance("binance", "user123")).toBe("balance-binance-user123")
    expect(cacheKeys.balance("binance")).toBe("balance-binance")
    expect(cacheKeys.ticker("coinbase", "ETH/USD")).toBe("ticker-coinbase-ETH/USD")
    expect(cacheKeys.orderbook("ftx", "SOL/USDT")).toBe("orderbook-ftx-SOL/USDT")
    expect(cacheKeys.ohlcv("huobi", "DOGE/USDT", "1h")).toBe("ohlcv-huobi-DOGE/USDT-1h")
  })
})