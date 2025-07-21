import type { Exchange } from 'ccxt'
import { Big } from 'big.js'
import type { DepositCommand, DepositAddress, DepositTransaction } from '../../../types/exchange'
import { ExchangeError, TransactionStatus, TransactionType } from '../../../types/exchange'
import { withExchangeErrorHandler, exchangeHas } from '../base'
import { cache } from '../cache'

// Re-export types for convenience
export type { DepositCommand, DepositAddress, DepositTransaction } from '../../../types/exchange'

// Create or fetch deposit address
export const getDepositAddress = withExchangeErrorHandler(
  async (exchange: Exchange, currency: string, network?: string): Promise<DepositAddress> => {
    // Check if exchange supports fetching deposit addresses
    if (exchangeHas(exchange, 'fetchDepositAddress')) {
      try {
        const params = network ? { network } : {}
        const result = await exchange.fetchDepositAddress(currency, params)
        
        return {
          currency,
          address: result.address,
          tag: result.tag,
          network: result.network || network
        }
      } catch (error) {
        // Fall through to create if fetch fails
        console.warn(`Failed to fetch deposit address for ${currency}, attempting to create:`, error)
      }
    }
    
    // Create new deposit address if fetch not supported or failed
    if (exchangeHas(exchange, 'createDepositAddress')) {
      const params = network ? { network } : {}
      const result = await exchange.createDepositAddress(currency, params)
      
      return {
        currency,
        address: result.address,
        tag: result.tag,
        network: result.network || network
      }
    }
    
    throw new ExchangeError(
      `Exchange ${exchange.id} does not support deposit address operations`,
      exchange.id
    )
  }
)

// Get deposit address with caching
export const getCachedDepositAddress = async (
  exchange: Exchange,
  command: DepositCommand,
  cacheTtl = 3600 // 1 hour default
): Promise<DepositAddress> => {
  const cacheKey = `deposit-address-${exchange.id}-${command.userId}-${command.currency}-${command.network || 'default'}`
  
  // Try cache first
  const cached = cache.get<DepositAddress>(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch from exchange
  const address = await getDepositAddress(exchange, command.currency, command.network)
  
  // Cache the result
  cache.set(cacheKey, address, cacheTtl)
  
  return address
}

// Fetch deposit transactions
export const fetchDeposits = withExchangeErrorHandler(
  async (
    exchange: Exchange,
    currency?: string,
    since?: number,
    limit?: number
  ): Promise<DepositTransaction[]> => {
    if (!exchangeHas(exchange, 'fetchDeposits')) {
      throw new ExchangeError(
        `Exchange ${exchange.id} does not support fetching deposits`,
        exchange.id
      )
    }
    
    const params: any = {}
    if (limit) params.limit = limit
    
    const deposits = await exchange.fetchDeposits(currency, since, limit, params)
    
    // Map to our deposit transaction type
    return deposits.map(deposit => ({
      id: deposit.id || '',
      txid: deposit.txid,
      timestamp: deposit.timestamp || 0,
      datetime: deposit.datetime || new Date(deposit.timestamp || 0).toISOString(),
      currency: deposit.currency || '',
      amount: deposit.amount || 0,
      address: deposit.address || '',
      tag: deposit.tag,
      type: TransactionType.DEPOSIT,
      status: mapDepositStatus(deposit.status || 'pending'),
      fee: deposit.fee ? {
        currency: deposit.fee.currency || '',
        cost: deposit.fee.cost || 0
      } : undefined,
      network: deposit.info?.network || deposit.network
    }))
  }
)

// Map CCXT deposit status to our status
const mapDepositStatus = (ccxtStatus: string): TransactionStatus => {
  switch (ccxtStatus) {
    case 'pending':
      return TransactionStatus.PENDING
    case 'ok':
    case 'completed':
    case 'success':
      return TransactionStatus.OK
    case 'failed':
    case 'rejected':
      return TransactionStatus.FAILED
    case 'canceled':
    case 'cancelled':
      return TransactionStatus.CANCELED
    default:
      return TransactionStatus.PENDING
  }
}

// Get deposits by user and symbol
export const getUserDeposits = async (
  exchange: Exchange,
  userId: string,
  currency?: string,
  since?: number
): Promise<DepositTransaction[]> => {
  const cacheKey = `deposits-${exchange.id}-${userId}-${currency || 'all'}-${since || 'all'}`
  
  // Try cache first (short TTL for deposits)
  const cached = cache.get<DepositTransaction[]>(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch from exchange
  const deposits = await fetchDeposits(exchange, currency, since)
  
  // Cache for 60 seconds
  cache.set(cacheKey, deposits, 60)
  
  return deposits
}

// Calculate total deposited amount
export const calculateTotalDeposited = (
  deposits: DepositTransaction[],
  currency?: string
): Record<string, string> => {
  const totals: Record<string, Big> = {}
  
  for (const deposit of deposits) {
    // Only include successful deposits
    if (deposit.status !== TransactionStatus.OK) {
      continue
    }
    
    // Filter by currency if specified
    if (currency && deposit.currency !== currency) {
      continue
    }
    
    const amount = new Big(deposit.amount)
    
    if (!totals[deposit.currency]) {
      totals[deposit.currency] = new Big(0)
    }
    
    const curr = deposit.currency
    totals[curr] = totals[curr].plus(amount)
  }
  
  // Convert to string format
  const result: Record<string, string> = {}
  for (const [curr, total] of Object.entries(totals)) {
    result[curr] = total.toString()
  }
  
  return result
}

// Get latest deposit timestamp
export const getLatestDepositTimestamp = (
  deposits: DepositTransaction[],
  currency?: string
): number | undefined => {
  const filtered = currency
    ? deposits.filter(d => d.currency === currency)
    : deposits
  
  if (filtered.length === 0) {
    return undefined
  }
  
  return filtered.reduce((max, d) => Math.max(max, d.timestamp), 0)
}

// Validate deposit address format (basic validation)
export const validateDepositAddress = (
  address: string,
  _currency: string,
  _network?: string
): boolean => {
  // Basic validation - can be extended based on currency/network
  if (!address || address.length === 0) {
    return false
  }
  
  // Add currency/network specific validations here
  // For example:
  // - BTC address format validation
  // - ETH address checksum validation
  // - etc.
  
  return true
}