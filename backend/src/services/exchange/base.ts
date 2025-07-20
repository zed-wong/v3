import * as ccxt from 'ccxt'
import type { Exchange } from 'ccxt'
import type { ExchangeConfig } from '../../types/exchange'
import { ExchangeError, ExchangeNotFoundError } from '../../types/exchange'

// Environment configuration
const isSandbox = process.env.EXCHANGE_SANDBOX === 'true'

// Pure function to get exchange class
const getExchangeClass = (exchangeId: string): typeof ccxt.Exchange | null => {
  // Check standard ccxt namespace
  if (exchangeId in ccxt) {
    return (ccxt as any)[exchangeId]
  }
  
  // Check pro namespace
  if ('pro' in ccxt && exchangeId in (ccxt as any).pro) {
    return (ccxt as any).pro[exchangeId]
  }
  
  return null
}

// Pure function to create exchange configuration
const createExchangeOptions = (config: ExchangeConfig): Record<string, any> => ({
  apiKey: config.apiKey,
  secret: config.secret,
  ...(config.password && { password: config.password }),
  ...(config.uid && { uid: config.uid }),
  ...(config.privateKey && { privateKey: config.privateKey }),
  ...(config.walletAddress && { walletAddress: config.walletAddress }),
  ...config.options,
  ...(isSandbox && { sandbox: true })
})

// Factory function to create exchange instance
export const createExchange = async (config: ExchangeConfig): Promise<Exchange> => {
  const ExchangeClass = getExchangeClass(config.exchangeId)
  
  if (!ExchangeClass) {
    throw new ExchangeNotFoundError(config.exchangeId)
  }
  
  try {
    const options = createExchangeOptions(config)
    const exchange = new ExchangeClass(options) as Exchange
    
    // Set sandbox mode if enabled
    if (isSandbox && exchange.urls.test) {
      exchange.setSandboxMode(true)
    }
    
    return exchange
  } catch (error) {
    throw new ExchangeError(
      `Failed to initialize exchange ${config.exchangeId}`,
      config.exchangeId,
      error
    )
  }
}

// Load markets for an exchange (with caching in mind)
export const loadMarkets = async (exchange: Exchange, reload = false): Promise<void> => {
  try {
    await exchange.loadMarkets(reload)
  } catch (error) {
    throw new ExchangeError(
      `Failed to load markets for ${exchange.id}`,
      exchange.id,
      error
    )
  }
}

// Get available symbols for an exchange
export const getSymbols = async (exchange: Exchange): Promise<string[]> => {
  if (!exchange.markets) {
    await loadMarkets(exchange)
  }
  return Object.keys(exchange.markets)
}

// Format price according to exchange precision
export const formatPrice = (
  exchange: Exchange,
  symbol: string,
  price: number
): string => {
  if (!exchange.markets || !exchange.markets[symbol]) {
    throw new ExchangeError(
      `Market ${symbol} not found on ${exchange.id}`,
      exchange.id
    )
  }
  
  return exchange.priceToPrecision(symbol, price)
}

// Format amount according to exchange precision
export const formatAmount = (
  exchange: Exchange,
  symbol: string,
  amount: number
): string => {
  if (!exchange.markets || !exchange.markets[symbol]) {
    throw new ExchangeError(
      `Market ${symbol} not found on ${exchange.id}`,
      exchange.id
    )
  }
  
  return exchange.amountToPrecision(symbol, amount)
}

// Format both price and amount for an order
export const formatOrderValues = (
  exchange: Exchange,
  symbol: string,
  price: number,
  amount: number
): { price: string; amount: string } => ({
  price: formatPrice(exchange, symbol, price),
  amount: formatAmount(exchange, symbol, amount)
})

// Error interpreter function
export const interpretExchangeError = (error: any, exchangeId: string): ExchangeError => {
  if (error instanceof ccxt.NetworkError) {
    return new ExchangeError(
      `Network error on ${exchangeId}: ${error.message}`,
      exchangeId,
      error
    )
  }
  
  if (error instanceof ccxt.ExchangeError) {
    return new ExchangeError(
      `Exchange error on ${exchangeId}: ${error.message}`,
      exchangeId,
      error
    )
  }
  
  if (error instanceof ExchangeError) {
    return error
  }
  
  return new ExchangeError(
    `Unknown error on ${exchangeId}: ${error.message || error}`,
    exchangeId,
    error
  )
}

// Higher-order function for safe exchange operations
export const withExchangeErrorHandler = <T extends any[], R>(
  fn: (exchange: Exchange, ...args: T) => Promise<R>
) => {
  return async (exchange: Exchange, ...args: T): Promise<R> => {
    try {
      return await fn(exchange, ...args)
    } catch (error) {
      throw interpretExchangeError(error, exchange.id)
    }
  }
}

// Utility to check if exchange supports a feature
export const exchangeHas = (exchange: Exchange, feature: string): boolean => {
  return exchange.has[feature] === true
}

// Get exchange capabilities
export const getExchangeCapabilities = (exchange: Exchange): string[] => {
  return Object.entries(exchange.has)
    .filter(([_, supported]) => supported === true)
    .map(([feature]) => feature)
}