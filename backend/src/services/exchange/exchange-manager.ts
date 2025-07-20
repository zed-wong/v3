import type { Exchange } from 'ccxt'
import type { ExchangeConfig, ExchangeInstance, ExchangeRegistry, ExchangeSelectionStrategy } from '../../types/exchange'
import { ExchangeError, ExchangeNotFoundError } from '../../types/exchange'
import { createExchange, loadMarkets } from './exchange-base'
import { cache } from './cache'

// Re-export types for convenience
export type { ExchangeRegistry, ExchangeSelectionStrategy } from '../../types/exchange'

// In-memory storage for exchange instances (in production, use database)
const exchangeInstances = new Map<string, ExchangeInstance>()
const exchangeRegistries = new Map<string, ExchangeRegistry[]>()

// Generate unique key for exchange instance
const getExchangeKey = (userId: string, exchangeId: string, label?: string): string => {
  return `${userId}-${exchangeId}${label ? `-${label}` : ''}`
}

// Register exchange for a user
export const registerExchange = async (
  userId: string,
  config: ExchangeConfig,
  label?: string
): Promise<ExchangeRegistry> => {
  const registry: ExchangeRegistry = {
    userId,
    exchangeId: config.exchangeId,
    label,
    config: {
      exchangeId: config.exchangeId,
      apiKey: maskApiKey(config.apiKey),
      secret: maskSecret(config.secret),
      ...(config.password && { password: '***' }),
      ...(config.uid && { uid: config.uid }),
      ...(config.privateKey && { privateKey: '***' }),
      ...(config.walletAddress && { walletAddress: config.walletAddress }),
      options: config.options
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  // Store registry (in production, save to database)
  const userRegistries = exchangeRegistries.get(userId) || []
  userRegistries.push(registry)
  exchangeRegistries.set(userId, userRegistries)
  
  // Create and cache exchange instance
  const key = getExchangeKey(userId, config.exchangeId, label)
  const exchange = await createExchange(config)
  await loadMarkets(exchange)
  
  exchangeInstances.set(key, {
    id: key,
    exchange,
    config
  })
  
  return registry
}

// Get exchange instance for a user
export const getExchange = async (
  userId: string,
  exchangeId: string,
  label?: string
): Promise<Exchange> => {
  const key = getExchangeKey(userId, exchangeId, label)
  
  // Check cache first
  const instance = exchangeInstances.get(key)
  if (instance) {
    return instance.exchange
  }
  
  // Check if exchange is registered
  const userRegistries = exchangeRegistries.get(userId) || []
  const registry = userRegistries.find(r => 
    r.exchangeId === exchangeId && r.label === label && r.isActive
  )
  
  if (!registry) {
    throw new ExchangeNotFoundError(exchangeId)
  }
  
  // In production, retrieve full config from secure storage
  throw new ExchangeError(
    `Exchange ${exchangeId} not loaded. Please reload the exchange.`,
    exchangeId
  )
}

// Get all registered exchanges for a user
export const getUserExchanges = (userId: string): ExchangeRegistry[] => {
  return exchangeRegistries.get(userId) || []
}

// Get all active exchange instances for a user
export const getActiveExchanges = async (userId: string): Promise<Exchange[]> => {
  const userRegistries = getUserExchanges(userId).filter(r => r.isActive)
  const exchanges: Exchange[] = []
  
  for (const registry of userRegistries) {
    try {
      const exchange = await getExchange(userId, registry.exchangeId, registry.label)
      exchanges.push(exchange)
    } catch (error) {
      console.error(`Failed to get exchange ${registry.exchangeId}:`, error)
    }
  }
  
  return exchanges
}

// Update exchange configuration
export const updateExchange = async (
  userId: string,
  exchangeId: string,
  config: Partial<ExchangeConfig>,
  label?: string
): Promise<ExchangeRegistry> => {
  const userRegistries = exchangeRegistries.get(userId) || []
  const registryIndex = userRegistries.findIndex(r => 
    r.exchangeId === exchangeId && r.label === label
  )
  
  if (registryIndex === -1) {
    throw new ExchangeNotFoundError(exchangeId)
  }
  
  // Update registry
  const registry = userRegistries[registryIndex]
  registry.config = {
    ...registry.config,
    ...config,
    apiKey: config.apiKey ? maskApiKey(config.apiKey) : registry.config.apiKey,
    secret: config.secret ? maskSecret(config.secret) : registry.config.secret
  }
  registry.updatedAt = new Date()
  
  // Remove old instance
  const key = getExchangeKey(userId, exchangeId, label)
  exchangeInstances.delete(key)
  
  // Clear related caches
  clearExchangeCaches(exchangeId, userId)
  
  return registry
}

// Deactivate exchange for a user
export const deactivateExchange = (
  userId: string,
  exchangeId: string,
  label?: string
): boolean => {
  const userRegistries = exchangeRegistries.get(userId) || []
  const registry = userRegistries.find(r => 
    r.exchangeId === exchangeId && r.label === label
  )
  
  if (!registry) {
    return false
  }
  
  registry.isActive = false
  registry.updatedAt = new Date()
  
  // Remove instance
  const key = getExchangeKey(userId, exchangeId, label)
  exchangeInstances.delete(key)
  
  // Clear related caches
  clearExchangeCaches(exchangeId, userId)
  
  return true
}

// Clear all exchange-related caches
const clearExchangeCaches = (exchangeId: string, userId?: string): void => {
  const patterns = [
    `ccxt-${exchangeId}-*`,
    `markets-${exchangeId}`,
    `balance-${exchangeId}*`,
    `ticker-${exchangeId}-*`,
    `orderbook-${exchangeId}-*`,
    `ohlcv-${exchangeId}-*`,
    `orders-${exchangeId}-*`,
    `deposits-${exchangeId}-*`,
    `withdrawals-${exchangeId}-*`
  ]
  
  if (userId) {
    patterns.push(
      `balance-${exchangeId}-${userId}`,
      `deposits-${exchangeId}-${userId}-*`,
      `withdrawals-${exchangeId}-${userId}-*`
    )
  }
  
  for (const pattern of patterns) {
    const keys = cache.keys(pattern)
    keys.forEach(key => cache.delete(key))
  }
}


// Select exchange with best price for buying
export const selectBestBuyExchange: ExchangeSelectionStrategy = (exchanges) => {
  // Implementation would compare ask prices across exchanges
  // For now, return first available
  return exchanges.length > 0 ? exchanges[0] : null
}

// Select exchange with best price for selling
export const selectBestSellExchange: ExchangeSelectionStrategy = (exchanges) => {
  // Implementation would compare bid prices across exchanges
  // For now, return first available
  return exchanges.length > 0 ? exchanges[0] : null
}

// Select exchange with highest liquidity
export const selectHighestLiquidityExchange: ExchangeSelectionStrategy = (exchanges) => {
  // Implementation would compare order book depth
  // For now, return first available
  return exchanges.length > 0 ? exchanges[0] : null
}

// Select exchange randomly (for load balancing)
export const selectRandomExchange: ExchangeSelectionStrategy = (exchanges) => {
  if (exchanges.length === 0) return null
  const index = Math.floor(Math.random() * exchanges.length)
  return exchanges[index]
}

// Helper functions
const maskApiKey = (apiKey: string): string => {
  if (apiKey.length <= 8) return '***'
  return apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4)
}

const maskSecret = (secret: string): string => {
  return '***'
}

// Get supported exchanges list
export const getSupportedExchanges = async (): Promise<string[]> => {
  // In production, this would fetch from a curated list
  // For now, return common exchanges
  return [
    'binance',
    'bitfinex',
    'bitget',
    'bitmex',
    'bitstamp',
    'bybit',
    'coinbase',
    'gateio',
    'huobi',
    'kraken',
    'kucoin',
    'mexc',
    'okx',
    'poloniex'
  ]
}

// Validate exchange credentials
export const validateExchangeCredentials = async (
  config: ExchangeConfig
): Promise<boolean> => {
  try {
    const exchange = await createExchange(config)
    
    // Try to fetch balance as a test
    if (exchange.has.fetchBalance) {
      await exchange.fetchBalance()
    }
    
    return true
  } catch (error) {
    console.error('Exchange credential validation failed:', error)
    return false
  }
}