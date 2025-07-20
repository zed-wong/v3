import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { Decimal } from 'decimal.js'
import {
  createMarketOrder,
  createLimitOrder,
  createOrder,
  cancelOrder,
  fetchOrder,
  fetchOpenOrders,
  fetchClosedOrders,
  getOpenOrders,
  cancelAllOrders,
  cancelOldUnfilledOrders
} from '../../exchange/trade/trade'
import { cache } from '../../exchange/cache'
import { 
  ExchangeError, 
  InvalidOrderError, 
  InsufficientBalanceError,
  OrderType,
  OrderSide,
  OrderStatus
} from '../../../types/exchange'
import type { CreateOrderCommand, OrderResult } from '../../../types/exchange'

describe('Trade Service', () => {
  const mockExchange = {
    id: 'binance',
    has: {
      createMarketOrder: true,
      createLimitOrder: true,
      cancelOrder: true,
      fetchOrder: true,
      fetchOpenOrders: true,
      fetchClosedOrders: true
    },
    markets: {
      'BTC/USDT': { precision: { price: 2, amount: 8 } },
      'ETH/USDT': { precision: { price: 2, amount: 8 } }
    },
    fetchTicker: mock(() => Promise.resolve({ last: 50000 })),
    fetchBalance: mock(() => Promise.resolve({
      BTC: { free: 1, used: 0, total: 1 },
      USDT: { free: 100000, used: 0, total: 100000 }
    })),
    createMarketOrder: mock(() => Promise.resolve({
      id: 'order123',
      symbol: 'BTC/USDT',
      type: 'market',
      side: 'buy',
      amount: 0.1,
      filled: 0.1,
      remaining: 0,
      status: 'closed',
      timestamp: Date.now()
    })),
    createLimitOrder: mock(() => Promise.resolve({
      id: 'order456',
      symbol: 'BTC/USDT',
      type: 'limit',
      side: 'sell',
      price: 51000,
      amount: 0.1,
      filled: 0,
      remaining: 0.1,
      status: 'open',
      timestamp: Date.now()
    })),
    cancelOrder: mock(() => Promise.resolve()),
    fetchOrder: mock(() => Promise.resolve({
      id: 'order123',
      symbol: 'BTC/USDT',
      type: 'limit',
      side: 'buy',
      price: 49000,
      amount: 0.1,
      filled: 0.05,
      remaining: 0.05,
      status: 'open',
      timestamp: Date.now()
    })),
    fetchOpenOrders: mock((symbol?: string) => {
      const allOrders = [
        {
          id: 'order1',
          symbol: 'BTC/USDT',
          type: 'limit',
          side: 'buy',
          price: 49000,
          amount: 0.1,
          filled: 0,
          remaining: 0.1,
          status: 'open',
          timestamp: Date.now() - 60000
        },
        {
          id: 'order2',
          symbol: 'ETH/USDT',
          type: 'limit',
          side: 'sell',
          price: 3000,
          amount: 1,
          filled: 0,
          remaining: 1,
          status: 'open',
          timestamp: Date.now() - 10000
        }
      ]
      
      if (symbol) {
        return Promise.resolve(allOrders.filter(order => order.symbol === symbol))
      }
      return Promise.resolve(allOrders)
    }),
    fetchClosedOrders: mock(() => Promise.resolve([
      {
        id: 'order3',
        symbol: 'BTC/USDT',
        type: 'market',
        side: 'buy',
        amount: 0.2,
        filled: 0.2,
        remaining: 0,
        status: 'closed',
        timestamp: Date.now() - 3600000
      }
    ])),
    priceToPrecision: mock((symbol, price) => price.toFixed(2)),
    amountToPrecision: mock((symbol, amount) => amount.toFixed(8))
  } as any
  
  beforeEach(() => {
    cache.clear()
    mockExchange.fetchTicker.mockClear()
    mockExchange.fetchBalance.mockClear()
    mockExchange.createMarketOrder.mockClear()
    mockExchange.createLimitOrder.mockClear()
    mockExchange.cancelOrder.mockClear()
    mockExchange.fetchOrder.mockClear()
    mockExchange.fetchOpenOrders.mockClear()
    mockExchange.fetchClosedOrders.mockClear()
  })

  describe('createMarketOrder', () => {
    test('should create market order', async () => {
      const order = await createMarketOrder(mockExchange, 'BTC/USDT', OrderSide.BUY, 0.1)
      
      expect(mockExchange.createMarketOrder).toHaveBeenCalledWith('BTC/USDT', 'buy', 0.1, undefined)
      expect(order).toMatchObject({
        id: 'order123',
        symbol: 'BTC/USDT',
        type: OrderType.MARKET,
        side: OrderSide.BUY
      })
    })

    test('should fetch price for special exchanges', async () => {
      const specialExchange = { ...mockExchange, id: 'bigone' }
      
      await createMarketOrder(specialExchange, 'BTC/USDT', OrderSide.BUY, 0.1)
      
      expect(mockExchange.fetchTicker).toHaveBeenCalledWith('BTC/USDT')
      expect(mockExchange.createMarketOrder).toHaveBeenCalledWith('BTC/USDT', 'buy', 0.1, 50000)
    })

    test('should handle mexc exchange', async () => {
      const mexcExchange = { ...mockExchange, id: 'mexc' }
      
      await createMarketOrder(mexcExchange, 'BTC/USDT', OrderSide.SELL, 0.1)
      
      expect(mockExchange.fetchTicker).toHaveBeenCalled()
    })

    test('should throw error when not supported', async () => {
      const limitedExchange = {
        id: 'limited',
        has: { createMarketOrder: false }
      } as any
      
      await expect(createMarketOrder(limitedExchange, 'BTC/USDT', OrderSide.BUY, 0.1))
        .rejects.toThrow('Exchange limited does not support market orders')
    })
  })

  describe('createLimitOrder', () => {
    test('should create limit order with formatted values', async () => {
      const order = await createLimitOrder(mockExchange, 'BTC/USDT', OrderSide.SELL, 0.12345678, 51234.5678)
      
      expect(mockExchange.priceToPrecision).toHaveBeenCalledWith('BTC/USDT', 51234.5678)
      expect(mockExchange.amountToPrecision).toHaveBeenCalledWith('BTC/USDT', 0.12345678)
      expect(mockExchange.createLimitOrder).toHaveBeenCalledWith(
        'BTC/USDT',
        'sell',
        0.12345678, // parseFloat of formatted value
        51234.57     // parseFloat of formatted value
      )
      expect(order.type).toBe(OrderType.LIMIT)
    })

    test('should throw error when not supported', async () => {
      const limitedExchange = {
        id: 'limited',
        has: { createLimitOrder: false }
      } as any
      
      await expect(createLimitOrder(limitedExchange, 'BTC/USDT', OrderSide.BUY, 0.1, 50000))
        .rejects.toThrow('Exchange limited does not support limit orders')
    })
  })

  describe('createOrder', () => {
    const baseCommand: CreateOrderCommand = {
      userId: 'user123',
      clientId: 'client123',
      exchangeId: 'binance',
      symbol: 'BTC/USDT',
      type: OrderType.LIMIT,
      side: OrderSide.BUY,
      amount: 0.1,
      price: 49000
    }

    test('should validate and create limit order', async () => {
      const order = await createOrder(mockExchange, baseCommand)
      
      expect(mockExchange.fetchBalance).toHaveBeenCalled()
      expect(order).toBeTruthy()
    })

    test('should validate balance for buy orders', async () => {
      const buyCommand = {
        ...baseCommand,
        amount: 10, // 10 BTC * 49000 = 490000 USDT (more than available)
        price: 49000
      }
      
      await expect(createOrder(mockExchange, buyCommand))
        .rejects.toThrow(InsufficientBalanceError)
    })

    test('should handle market orders', async () => {
      const marketCommand = {
        ...baseCommand,
        type: OrderType.MARKET,
        price: undefined
      }
      
      const order = await createOrder(mockExchange, marketCommand)
      expect(order.type).toBe(OrderType.MARKET)
    })

    test('should validate order parameters', async () => {
      const invalidCommands = [
        { ...baseCommand, symbol: '' },
        { ...baseCommand, amount: 0 },
        { ...baseCommand, amount: -1 },
        { ...baseCommand, type: OrderType.LIMIT, price: undefined },
        { ...baseCommand, type: OrderType.LIMIT, price: 0 },
        { ...baseCommand, type: 'invalid' as any },
        { ...baseCommand, side: 'invalid' as any }
      ]
      
      for (const cmd of invalidCommands) {
        await expect(createOrder(mockExchange, cmd))
          .rejects.toThrow(InvalidOrderError)
      }
    })

    test('should handle invalid symbol format', async () => {
      const invalidSymbolCommand = {
        ...baseCommand,
        symbol: 'BTCUSDT' // Missing /
      }
      
      await expect(createOrder(mockExchange, invalidSymbolCommand))
        .rejects.toThrow('Invalid symbol format')
    })
  })

  describe('cancelOrder', () => {
    test('should cancel order and clear cache', async () => {
      const result = await cancelOrder(mockExchange, 'order123', 'BTC/USDT')
      
      expect(mockExchange.cancelOrder).toHaveBeenCalledWith('order123', 'BTC/USDT')
      expect(result).toBe(true)
    })

    test('should throw error when not supported', async () => {
      const limitedExchange = {
        id: 'limited',
        has: { cancelOrder: false }
      } as any
      
      await expect(cancelOrder(limitedExchange, 'order123', 'BTC/USDT'))
        .rejects.toThrow('Exchange limited does not support order cancellation')
    })
  })

  describe('fetchOrder', () => {
    test('should fetch order by ID', async () => {
      const order = await fetchOrder(mockExchange, 'order123', 'BTC/USDT')
      
      expect(mockExchange.fetchOrder).toHaveBeenCalledWith('order123', 'BTC/USDT')
      expect(order.id).toBe('order123')
    })

    test('should throw error when not supported', async () => {
      const limitedExchange = {
        id: 'limited',
        has: { fetchOrder: false }
      } as any
      
      await expect(fetchOrder(limitedExchange, 'order123', 'BTC/USDT'))
        .rejects.toThrow('Exchange limited does not support fetching individual orders')
    })
  })

  describe('fetchOpenOrders', () => {
    test('should fetch open orders', async () => {
      const orders = await fetchOpenOrders(mockExchange, 'BTC/USDT')
      
      expect(mockExchange.fetchOpenOrders).toHaveBeenCalledWith('BTC/USDT', undefined, undefined)
      expect(orders).toHaveLength(1) // Only order1 is BTC/USDT
      expect(orders[0].id).toBe('order1')
      expect(orders[0].status).toBe(OrderStatus.OPEN)
    })

    test('should fetch with parameters', async () => {
      await fetchOpenOrders(mockExchange, 'BTC/USDT', 1000000, 10)
      
      expect(mockExchange.fetchOpenOrders).toHaveBeenCalledWith('BTC/USDT', 1000000, 10)
    })
  })

  describe('getOpenOrders', () => {
    test('should fetch and cache open orders', async () => {
      const orders = await getOpenOrders(mockExchange, 'BTC/USDT', 5)
      
      expect(mockExchange.fetchOpenOrders).toHaveBeenCalledTimes(1)
      
      // Second call should use cache
      const cachedOrders = await getOpenOrders(mockExchange, 'BTC/USDT', 5)
      expect(mockExchange.fetchOpenOrders).toHaveBeenCalledTimes(1)
      expect(cachedOrders).toEqual(orders)
    })

    test('should use proper cache key', async () => {
      await getOpenOrders(mockExchange, undefined, 5)
      
      const cacheKey = 'orders-binance-all-open'
      expect(cache.get(cacheKey)).toBeTruthy()
    })
  })

  describe('cancelAllOrders', () => {
    test('should cancel all open orders', async () => {
      const count = await cancelAllOrders(mockExchange, 'BTC/USDT')
      
      expect(mockExchange.fetchOpenOrders).toHaveBeenCalledWith('BTC/USDT', undefined, undefined)
      expect(mockExchange.cancelOrder).toHaveBeenCalledTimes(1) // Only order1 is BTC/USDT
      expect(mockExchange.cancelOrder).toHaveBeenCalledWith('order1', 'BTC/USDT')
      expect(count).toBe(1)
    })

    test('should handle cancellation errors', async () => {
      mockExchange.cancelOrder.mockRejectedValueOnce(new Error('Cancel failed'))
      
      const count = await cancelAllOrders(mockExchange)
      
      // Should continue with other orders
      expect(mockExchange.fetchOpenOrders).toHaveBeenCalledWith(undefined, undefined, undefined)
      expect(mockExchange.cancelOrder).toHaveBeenCalledTimes(2) // Tries both orders
      expect(count).toBe(1) // Only one successful (first one failed)
    })
  })

  describe('cancelOldUnfilledOrders', () => {
    test('should cancel orders older than threshold', async () => {
      const count = await cancelOldUnfilledOrders(mockExchange, 30, 'BTC/USDT')
      
      // Only order1 is older than 30 seconds and unfilled
      expect(mockExchange.cancelOrder).toHaveBeenCalledWith('order1', 'BTC/USDT')
      expect(mockExchange.cancelOrder).not.toHaveBeenCalledWith('order2', 'ETH/USDT')
      expect(count).toBe(1)
    })

    test('should not cancel partially filled orders', async () => {
      mockExchange.fetchOpenOrders.mockResolvedValueOnce([
        {
          id: 'order1',
          symbol: 'BTC/USDT',
          filled: 0.05, // Partially filled
          timestamp: Date.now() - 60000
        }
      ])
      
      const count = await cancelOldUnfilledOrders(mockExchange, 30)
      
      expect(mockExchange.cancelOrder).not.toHaveBeenCalled()
      expect(count).toBe(0)
    })
  })

  describe('Order mapping', () => {
    test('should map CCXT order status correctly', async () => {
      const testCases = [
        { ccxtStatus: 'open', expected: OrderStatus.OPEN },
        { ccxtStatus: 'closed', expected: OrderStatus.CLOSED },
        { ccxtStatus: 'canceled', expected: OrderStatus.CANCELED },
        { ccxtStatus: 'cancelled', expected: OrderStatus.CANCELED },
        { ccxtStatus: 'expired', expected: OrderStatus.EXPIRED },
        { ccxtStatus: 'rejected', expected: OrderStatus.REJECTED },
        { ccxtStatus: 'pending', expected: OrderStatus.PENDING },
        { ccxtStatus: undefined, expected: OrderStatus.PENDING }
      ]
      
      for (const { ccxtStatus, expected } of testCases) {
        mockExchange.fetchOrder.mockResolvedValueOnce({
          id: 'test',
          status: ccxtStatus,
          symbol: 'BTC/USDT',
          side: 'buy',
          type: 'limit',
          amount: 0.1,
          filled: 0,
          remaining: 0.1,
          timestamp: Date.now()
        })
        
        const order = await fetchOrder(mockExchange, 'test', 'BTC/USDT')
        expect(order.status).toBe(expected)
      }
    })

    test('should handle order with trades', async () => {
      mockExchange.fetchOrder.mockResolvedValueOnce({
        id: 'order123',
        symbol: 'BTC/USDT',
        type: 'limit',
        side: 'buy',
        price: 50000,
        amount: 0.1,
        filled: 0.1,
        remaining: 0,
        status: 'closed',
        timestamp: Date.now(),
        trades: [
          {
            id: 'trade1',
            price: 49900,
            amount: 0.05,
            timestamp: Date.now() - 1000,
            fee: { currency: 'BTC', cost: 0.00005 }
          },
          {
            id: 'trade2',
            price: 50100,
            amount: 0.05,
            timestamp: Date.now(),
            fee: { currency: 'BTC', cost: 0.00005 }
          }
        ]
      })
      
      const order = await fetchOrder(mockExchange, 'order123', 'BTC/USDT')
      
      expect(order.trades).toHaveLength(2)
      expect(order.trades![0]).toMatchObject({
        id: 'trade1',
        price: 49900,
        amount: 0.05
      })
    })
  })
})