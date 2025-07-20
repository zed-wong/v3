import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { cache, cacheKeys, withCache } from '../../exchange/cache'

describe('Exchange Cache', () => {
  beforeEach(() => {
    cache.clear()
  })

  afterEach(() => {
    cache.clear()
  })

  describe('SimpleCache', () => {
    test('should set and get values', () => {
      cache.set('test-key', 'test-value')
      expect(cache.get('test-key')).toBe('test-value')
    })

    test('should return null for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeNull()
    })

    test('should handle TTL expiry', async () => {
      cache.set('expiring-key', 'value', 0.1) // 0.1 second TTL
      expect(cache.get('expiring-key')).toBe('value')
      
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(cache.get('expiring-key')).toBeNull()
    })

    test('should delete keys', () => {
      cache.set('delete-me', 'value')
      expect(cache.get('delete-me')).toBe('value')
      
      const deleted = cache.delete('delete-me')
      expect(deleted).toBe(true)
      expect(cache.get('delete-me')).toBeNull()
    })

    test('should clear all keys', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      
      cache.clear()
      
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBeNull()
      expect(cache.get('key3')).toBeNull()
    })

    test('should list keys without pattern', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('different', 'value3')
      
      const keys = cache.keys()
      expect(keys).toHaveLength(3)
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).toContain('different')
    })

    test('should list keys with pattern', () => {
      cache.set('test-key1', 'value1')
      cache.set('test-key2', 'value2')
      cache.set('other-key', 'value3')
      
      const keys = cache.keys('test-*')
      expect(keys).toHaveLength(2)
      expect(keys).toContain('test-key1')
      expect(keys).toContain('test-key2')
    })

    test('should cleanup expired entries', async () => {
      cache.set('expired', 'value', 0.1)
      cache.set('not-expired', 'value', 10)
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      cache.cleanup()
      
      expect(cache.get('expired')).toBeNull()
      expect(cache.get('not-expired')).toBe('value')
    })

    test('should handle complex data types', () => {
      const complexData = {
        name: 'test',
        values: [1, 2, 3],
        nested: { key: 'value' }
      }
      
      cache.set('complex', complexData)
      expect(cache.get('complex')).toEqual(complexData)
    })
  })

  describe('cacheKeys', () => {
    test('should generate exchange dependencies key', () => {
      expect(cacheKeys.exchangeDependencies('binance'))
        .toBe('ccxt-binance-dependencies')
    })

    test('should generate precision key', () => {
      expect(cacheKeys.precision('binance', 'BTC/USDT', 'price'))
        .toBe('precision-binance-BTC/USDT-price')
    })

    test('should generate markets key', () => {
      expect(cacheKeys.markets('binance'))
        .toBe('markets-binance')
    })

    test('should generate balance key with userId', () => {
      expect(cacheKeys.balance('binance', 'user123'))
        .toBe('balance-binance-user123')
    })

    test('should generate balance key without userId', () => {
      expect(cacheKeys.balance('binance'))
        .toBe('balance-binance')
    })

    test('should generate ticker key', () => {
      expect(cacheKeys.ticker('binance', 'BTC/USDT'))
        .toBe('ticker-binance-BTC/USDT')
    })

    test('should generate orderbook key', () => {
      expect(cacheKeys.orderbook('binance', 'BTC/USDT'))
        .toBe('orderbook-binance-BTC/USDT')
    })

    test('should generate ohlcv key', () => {
      expect(cacheKeys.ohlcv('binance', 'BTC/USDT', '1h'))
        .toBe('ohlcv-binance-BTC/USDT-1h')
    })
  })

  describe('withCache decorator', () => {
    test('should cache function results', async () => {
      let callCount = 0
      const expensiveFunction = async (value: string) => {
        callCount++
        return `result-${value}`
      }
      
      const cachedFunction = withCache(
        (value: string) => `cache-key-${value}`,
        60
      )(expensiveFunction)
      
      // First call - should execute function
      const result1 = await cachedFunction('test')
      expect(result1).toBe('result-test')
      expect(callCount).toBe(1)
      
      // Second call - should return cached value
      const result2 = await cachedFunction('test')
      expect(result2).toBe('result-test')
      expect(callCount).toBe(1) // Function not called again
      
      // Different argument - should execute function
      const result3 = await cachedFunction('other')
      expect(result3).toBe('result-other')
      expect(callCount).toBe(2)
    })

    test('should respect TTL in cache decorator', async () => {
      let callCount = 0
      const timedFunction = async (value: string) => {
        callCount++
        return `result-${value}-${callCount}`
      }
      
      const cachedFunction = withCache(
        (value: string) => `ttl-key-${value}`,
        0.1 // 0.1 second TTL
      )(timedFunction)
      
      const result1 = await cachedFunction('test')
      expect(result1).toBe('result-test-1')
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const result2 = await cachedFunction('test')
      expect(result2).toBe('result-test-2')
      expect(callCount).toBe(2)
    })

    test('should handle errors in cached function', async () => {
      const errorFunction = async () => {
        throw new Error('Test error')
      }
      
      const cachedFunction = withCache(
        () => 'error-key',
        60
      )(errorFunction)
      
      await expect(cachedFunction()).rejects.toThrow('Test error')
      
      // Error should not be cached
      await expect(cachedFunction()).rejects.toThrow('Test error')
    })
  })
})