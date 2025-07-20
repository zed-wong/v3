import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test'
import {
  exchangeEvents,
  clearAllListeners,
  // Emitters
  emitOrderCreated,
  emitOrderUpdated,
  emitOrderFailed,
  emitOrderCanceled,
  emitBalanceUpdated,
  emitInsufficientBalance,
  emitDepositReceived,
  emitDepositConfirmed,
  emitDepositFailed,
  emitWithdrawalCreated,
  emitWithdrawalConfirmed,
  emitWithdrawalFailed,
  emitTickerUpdate,
  emitOrderBookUpdate,
  emitExchangeConnected,
  emitExchangeDisconnected,
  emitExchangeError,
  emitStrategySignal,
  emitStrategyExecuted,
  // Listeners
  onOrderEvents,
  onUserBalanceEvents,
  onMarketDataEvents,
  onUserDepositEvents,
  onUserWithdrawalEvents,
  onUserExchangeConnectionEvents,
  onAllExchangeConnectionEvents
} from '../../exchange/events'
import { OrderStatus, OrderType, OrderSide, TransactionStatus } from '../../../types/exchange'
import type { Order, Transaction, Balance } from '../../../types/exchange'

describe('Exchange Events', () => {
  beforeEach(() => {
    clearAllListeners()
  })

  afterEach(() => {
    clearAllListeners()
  })

  const mockOrder: Order = {
    id: 'order123',
    timestamp: Date.now(),
    datetime: new Date().toISOString(),
    symbol: 'BTC/USDT',
    type: OrderType.LIMIT,
    side: OrderSide.BUY,
    price: 50000,
    amount: 0.1,
    filled: 0,
    remaining: 0.1,
    status: OrderStatus.OPEN
  }

  const mockTransaction: Transaction = {
    id: 'tx123',
    txid: 'hash123',
    timestamp: Date.now(),
    datetime: new Date().toISOString(),
    currency: 'BTC',
    amount: 0.5,
    address: 'bc1qtest',
    type: 'deposit' as any,
    status: TransactionStatus.OK
  }

  const mockBalance: Record<string, Balance> = {
    BTC: { currency: 'BTC', free: 1, used: 0, total: 1 },
    USDT: { currency: 'USDT', free: 10000, used: 0, total: 10000 }
  }

  describe('Order Events', () => {
    test('should emit order:created event', async () => {
      const listener = mock()
      exchangeEvents.on('order:created', listener)
      
      emitOrderCreated(mockOrder, 'user123', 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(listener).toHaveBeenCalledWith({
        order: mockOrder,
        userId: 'user123',
        exchangeId: 'binance'
      })
    })

    test('should emit order:updated and order:filled events', async () => {
      const updateListener = mock()
      const filledListener = mock()
      
      exchangeEvents.on('order:updated', updateListener)
      exchangeEvents.on('order:filled', filledListener)
      
      const filledOrder = { 
        ...mockOrder, 
        status: OrderStatus.CLOSED, 
        filled: 0.1, 
        remaining: 0 
      }
      
      emitOrderUpdated(filledOrder, OrderStatus.OPEN, 'user123', 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(updateListener).toHaveBeenCalled()
      expect(filledListener).toHaveBeenCalledWith({
        order: filledOrder,
        userId: 'user123',
        exchangeId: 'binance'
      })
    })

    test('should not emit order:filled for partially filled orders', async () => {
      const filledListener = mock()
      exchangeEvents.on('order:filled', filledListener)
      
      const partialOrder = { 
        ...mockOrder, 
        status: OrderStatus.CLOSED, 
        filled: 0.05, 
        remaining: 0.05 
      }
      
      emitOrderUpdated(partialOrder, OrderStatus.OPEN, 'user123', 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(filledListener).not.toHaveBeenCalled()
    })

    test('should emit order:failed event', async () => {
      const listener = mock()
      exchangeEvents.on('order:failed', listener)
      
      const error = new Error('Insufficient balance')
      emitOrderFailed(mockOrder, error, 'user123', 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(listener).toHaveBeenCalledWith({
        order: mockOrder,
        error,
        userId: 'user123',
        exchangeId: 'binance'
      })
    })

    test('should emit order:canceled event', async () => {
      const listener = mock()
      exchangeEvents.on('order:canceled', listener)
      
      emitOrderCanceled('order123', 'user123', 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(listener).toHaveBeenCalledWith({
        orderId: 'order123',
        userId: 'user123',
        exchangeId: 'binance'
      })
    })
  })

  describe('Balance Events', () => {
    test('should emit balance:updated event', async () => {
      const listener = mock()
      exchangeEvents.on('balance:updated', listener)
      
      emitBalanceUpdated(mockBalance, 'user123', 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(listener).toHaveBeenCalledWith({
        balances: mockBalance,
        userId: 'user123',
        exchangeId: 'binance'
      })
    })

    test('should emit balance:insufficient event', async () => {
      const listener = mock()
      exchangeEvents.on('balance:insufficient', listener)
      
      emitInsufficientBalance('BTC', 2, 1, 'user123', 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(listener).toHaveBeenCalledWith({
        currency: 'BTC',
        required: 2,
        available: 1,
        userId: 'user123',
        exchangeId: 'binance'
      })
    })
  })

  describe('Transaction Events', () => {
    test('should emit deposit events', async () => {
      const receivedListener = mock()
      const confirmedListener = mock()
      const failedListener = mock()
      
      exchangeEvents.on('deposit:received', receivedListener)
      exchangeEvents.on('deposit:confirmed', confirmedListener)
      exchangeEvents.on('deposit:failed', failedListener)
      
      emitDepositReceived(mockTransaction, 'user123', 'binance')
      emitDepositConfirmed(mockTransaction, 'user123', 'binance')
      emitDepositFailed(mockTransaction, new Error('Network error'), 'user123', 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(receivedListener).toHaveBeenCalled()
      expect(confirmedListener).toHaveBeenCalled()
      expect(failedListener).toHaveBeenCalled()
    })

    test('should emit withdrawal events', async () => {
      const createdListener = mock()
      const confirmedListener = mock()
      const failedListener = mock()
      
      exchangeEvents.on('withdrawal:created', createdListener)
      exchangeEvents.on('withdrawal:confirmed', confirmedListener)
      exchangeEvents.on('withdrawal:failed', failedListener)
      
      emitWithdrawalCreated(mockTransaction, 'user123', 'binance')
      emitWithdrawalConfirmed(mockTransaction, 'user123', 'binance')
      emitWithdrawalFailed(mockTransaction, new Error('Invalid address'), 'user123', 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(createdListener).toHaveBeenCalled()
      expect(confirmedListener).toHaveBeenCalled()
      expect(failedListener).toHaveBeenCalled()
    })
  })

  describe('Market Data Events', () => {
    test('should emit ticker:update event', async () => {
      const listener = mock()
      exchangeEvents.on('ticker:update', listener)
      
      const ticker = { bid: 50000, ask: 50100, last: 50050 }
      emitTickerUpdate('BTC/USDT', ticker, 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(listener).toHaveBeenCalledWith({
        symbol: 'BTC/USDT',
        ticker,
        exchangeId: 'binance'
      })
    })

    test('should emit orderbook:update event', async () => {
      const listener = mock()
      exchangeEvents.on('orderbook:update', listener)
      
      const orderbook = { bids: [[50000, 1]], asks: [[50100, 1]] }
      emitOrderBookUpdate('BTC/USDT', orderbook, 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(listener).toHaveBeenCalledWith({
        symbol: 'BTC/USDT',
        orderbook,
        exchangeId: 'binance'
      })
    })
  })

  describe('Connection Events', () => {
    test('should emit connection events', async () => {
      const connectedListener = mock()
      const disconnectedListener = mock()
      const errorListener = mock()
      
      exchangeEvents.on('exchange:connected', connectedListener)
      exchangeEvents.on('exchange:disconnected', disconnectedListener)
      exchangeEvents.on('exchange:error', errorListener)
      
      emitExchangeConnected('user123', 'binance')
      emitExchangeDisconnected('user123', 'binance', 'Network timeout')
      emitExchangeError('user123', 'binance', new Error('API Error'))
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(connectedListener).toHaveBeenCalled()
      expect(disconnectedListener).toHaveBeenCalledWith({
        userId: 'user123',
        exchangeId: 'binance',
        reason: 'Network timeout'
      })
      expect(errorListener).toHaveBeenCalled()
    })
  })

  describe('Strategy Events', () => {
    test('should emit strategy events', async () => {
      const signalListener = mock()
      const executedListener = mock()
      
      exchangeEvents.on('strategy:signal', signalListener)
      exchangeEvents.on('strategy:executed', executedListener)
      
      const signal = { type: 'BUY', symbol: 'BTC/USDT', confidence: 0.8 }
      emitStrategySignal('arbitrage', signal, 'binance')
      emitStrategyExecuted('arbitrage', [mockOrder], 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(signalListener).toHaveBeenCalledWith({
        strategyId: 'arbitrage',
        signal,
        exchangeId: 'binance'
      })
      expect(executedListener).toHaveBeenCalled()
    })
  })

  describe('Event Listeners', () => {
    test('onOrderEvents should listen to all order events', async () => {
      const callback = mock()
      const unsubscribe = onOrderEvents(callback)
      
      emitOrderCreated(mockOrder, 'user123', 'binance')
      emitOrderUpdated(mockOrder, OrderStatus.PENDING, 'user123', 'binance')
      emitOrderFailed(mockOrder, new Error('Test'), 'user123', 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(callback).toHaveBeenCalledTimes(3)
      expect(callback).toHaveBeenCalledWith('order:created', expect.any(Object))
      expect(callback).toHaveBeenCalledWith('order:updated', expect.any(Object))
      expect(callback).toHaveBeenCalledWith('order:failed', expect.any(Object))
      
      unsubscribe()
    })

    test('onUserBalanceEvents should filter by userId', async () => {
      const callback = mock()
      const unsubscribe = onUserBalanceEvents('user123', callback)
      
      emitBalanceUpdated(mockBalance, 'user123', 'binance')
      emitBalanceUpdated(mockBalance, 'user456', 'binance') // Different user
      emitInsufficientBalance('BTC', 2, 1, 'user123', 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(callback).toHaveBeenCalledTimes(2) // Only user123 events
      
      unsubscribe()
    })

    test('onMarketDataEvents should filter by symbols', async () => {
      const callback = mock()
      const unsubscribe = onMarketDataEvents(['BTC/USDT', 'ETH/USDT'], callback)
      
      emitTickerUpdate('BTC/USDT', {}, 'binance')
      emitTickerUpdate('ETH/USDT', {}, 'binance')
      emitTickerUpdate('XRP/USDT', {}, 'binance') // Not in filter
      emitOrderBookUpdate('BTC/USDT', {}, 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(callback).toHaveBeenCalledTimes(3) // Only BTC and ETH events
      
      unsubscribe()
    })

    test('onUserDepositEvents should filter by userId', async () => {
      const callback = mock()
      const unsubscribe = onUserDepositEvents('user123', callback)
      
      emitDepositReceived(mockTransaction, 'user123', 'binance')
      emitDepositReceived(mockTransaction, 'user456', 'binance') // Different user
      emitDepositConfirmed(mockTransaction, 'user123', 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenCalledWith('deposit:received', expect.any(Object))
      expect(callback).toHaveBeenCalledWith('deposit:confirmed', expect.any(Object))
      
      unsubscribe()
    })

    test('onUserWithdrawalEvents should filter by userId', async () => {
      const callback = mock()
      const unsubscribe = onUserWithdrawalEvents('user123', callback)
      
      emitWithdrawalCreated(mockTransaction, 'user123', 'binance')
      emitWithdrawalCreated(mockTransaction, 'user456', 'binance') // Different user
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(callback).toHaveBeenCalledTimes(1)
      
      unsubscribe()
    })

    test('onUserExchangeConnectionEvents should filter by userId', async () => {
      const callback = mock()
      const unsubscribe = onUserExchangeConnectionEvents('user123', callback)
      
      emitExchangeConnected('user123', 'binance')
      emitExchangeConnected('user456', 'binance') // Different user
      emitExchangeError('user123', 'binance', new Error('Test'))
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(callback).toHaveBeenCalledTimes(2)
      
      unsubscribe()
    })

    test('onAllExchangeConnectionEvents should receive all events', async () => {
      const callback = mock()
      const unsubscribe = onAllExchangeConnectionEvents(callback)
      
      emitExchangeConnected('user123', 'binance')
      emitExchangeConnected('user456', 'kraken')
      emitExchangeDisconnected('user789', 'coinbase')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(callback).toHaveBeenCalledTimes(3)
      
      unsubscribe()
    })

    test('unsubscribe should stop receiving events', async () => {
      const callback = mock()
      const unsubscribe = onOrderEvents(callback)
      
      emitOrderCreated(mockOrder, 'user123', 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(callback).toHaveBeenCalledTimes(1)
      
      unsubscribe()
      
      emitOrderCreated(mockOrder, 'user123', 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(callback).toHaveBeenCalledTimes(1) // Still 1, not incremented
    })
  })

  describe('clearAllListeners', () => {
    test('should remove all event listeners', async () => {
      const listener1 = mock()
      const listener2 = mock()
      
      exchangeEvents.on('order:created', listener1)
      exchangeEvents.on('balance:updated', listener2)
      
      clearAllListeners()
      
      emitOrderCreated(mockOrder, 'user123', 'binance')
      emitBalanceUpdated(mockBalance, 'user123', 'binance')
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(listener1).not.toHaveBeenCalled()
      expect(listener2).not.toHaveBeenCalled()
    })
  })
})