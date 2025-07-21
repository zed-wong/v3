import type { Exchange } from 'ccxt'
import { Big } from 'big.js'
import type { WithdrawalCommand, WithdrawalResult, WithdrawalTransaction } from '../../../types/exchange'
import { ExchangeError, TransactionStatus, TransactionType, InsufficientBalanceError } from '../../../types/exchange'
import { withExchangeErrorHandler, exchangeHas } from '../base'
import { validateSufficientBalance } from '../balance/balance'
import { cache } from '../cache'

// Re-export types for convenience
export type { WithdrawalCommand, WithdrawalResult, WithdrawalTransaction } from '../../../types/exchange'

// Create withdrawal request
export const createWithdrawal = withExchangeErrorHandler(
  async (
    exchange: Exchange,
    currency: string,
    amount: number,
    address: string,
    tag?: string,
    params?: any
  ): Promise<WithdrawalResult> => {
    if (!exchangeHas(exchange, 'withdraw')) {
      throw new ExchangeError(
        `Exchange ${exchange.id} does not support withdrawals`,
        exchange.id
      )
    }
    
    // Check balance before withdrawal
    const balance = await exchange.fetchBalance()
    const currencyBalance = balance[currency]
    
    if (currencyBalance) {
      try {
        validateSufficientBalance(currencyBalance, amount, currency)
      } catch (error) {
        throw new InsufficientBalanceError(
          exchange.id,
          currency,
          amount,
          currencyBalance.free ?? 0
        )
      }
    }
    
    // Create withdrawal
    const result = await exchange.withdraw(currency, amount, address, tag, params)
    
    return {
      id: result.id || '',
      txid: result.txid,
      currency,
      amount,
      address,
      tag,
      network: params?.network || result.info?.network,
      fee: result.fee ? {
        currency: result.fee.currency || currency,
        cost: result.fee.cost || 0
      } : undefined,
      status: result.status || 'pending'
    }
  }
)

// Create withdrawal with proper parameters
export const withdraw = async (
  exchange: Exchange,
  command: WithdrawalCommand
): Promise<WithdrawalResult> => {
  const params: any = {}
  
  if (command.network) {
    params.network = command.network
  }
  
  return createWithdrawal(
    exchange,
    command.currency,
    command.amount,
    command.address,
    command.tag,
    params
  )
}

// Fetch withdrawal transactions
export const fetchWithdrawals = withExchangeErrorHandler(
  async (
    exchange: Exchange,
    currency?: string,
    since?: number,
    limit?: number
  ): Promise<WithdrawalTransaction[]> => {
    if (!exchangeHas(exchange, 'fetchWithdrawals')) {
      throw new ExchangeError(
        `Exchange ${exchange.id} does not support fetching withdrawals`,
        exchange.id
      )
    }
    
    const params: any = {}
    if (limit) params.limit = limit
    
    const withdrawals = await exchange.fetchWithdrawals(currency, since, limit, params)
    
    // Map to our withdrawal transaction type
    return withdrawals.map(withdrawal => ({
      id: withdrawal.id || '',
      txid: withdrawal.txid,
      timestamp: withdrawal.timestamp || 0,
      datetime: withdrawal.datetime || new Date(withdrawal.timestamp || 0).toISOString(),
      currency: withdrawal.currency || '',
      amount: withdrawal.amount || 0,
      address: withdrawal.address || '',
      tag: withdrawal.tag,
      type: TransactionType.WITHDRAWAL,
      status: mapWithdrawalStatus(withdrawal.status || 'pending'),
      fee: withdrawal.fee ? {
        currency: withdrawal.fee.currency || '',
        cost: withdrawal.fee.cost || 0
      } : undefined,
      network: withdrawal.info?.network || withdrawal.network
    }))
  }
)

// Map CCXT withdrawal status to our status
const mapWithdrawalStatus = (ccxtStatus: string): TransactionStatus => {
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

// Get withdrawals by user
export const getUserWithdrawals = async (
  exchange: Exchange,
  userId: string,
  currency?: string,
  since?: number
): Promise<WithdrawalTransaction[]> => {
  const cacheKey = `withdrawals-${exchange.id}-${userId}-${currency || 'all'}-${since || 'all'}`
  
  // Try cache first (short TTL for withdrawals)
  const cached = cache.get<WithdrawalTransaction[]>(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch from exchange
  const withdrawals = await fetchWithdrawals(exchange, currency, since)
  
  // Cache for 60 seconds
  cache.set(cacheKey, withdrawals, 60)
  
  return withdrawals
}

// Calculate total withdrawn amount
export const calculateTotalWithdrawn = (
  withdrawals: WithdrawalTransaction[],
  currency?: string
): Record<string, string> => {
  const totals: Record<string, Big> = {}
  
  for (const withdrawal of withdrawals) {
    // Only include successful withdrawals
    if (withdrawal.status !== TransactionStatus.OK) {
      continue
    }
    
    // Filter by currency if specified
    if (currency && withdrawal.currency !== currency) {
      continue
    }
    
    const amount = new Big(withdrawal.amount)
    const feeCost = withdrawal.fee?.cost ? new Big(withdrawal.fee.cost) : new Big(0)
    
    // If fee is in same currency, add it to the total withdrawn
    const totalAmount = withdrawal.fee?.currency === withdrawal.currency
      ? amount.plus(feeCost)
      : amount
    
    const curr = withdrawal.currency
    if (!totals[curr]) {
      totals[curr] = new Big(0)
    }
    
    totals[curr] = totals[curr].plus(totalAmount)
  }
  
  // Convert to string format
  const result: Record<string, string> = {}
  for (const [curr, total] of Object.entries(totals)) {
    result[curr] = total.toString()
  }
  
  return result
}

// Get latest withdrawal timestamp
export const getLatestWithdrawalTimestamp = (
  withdrawals: WithdrawalTransaction[],
  currency?: string
): number | undefined => {
  const filtered = currency
    ? withdrawals.filter(w => w.currency === currency)
    : withdrawals
  
  if (filtered.length === 0) {
    return undefined
  }
  
  return Math.max(...filtered.map(w => w.timestamp))
}

// Get withdrawal fees
export const getWithdrawalFees = withExchangeErrorHandler(
  async (exchange: Exchange): Promise<Record<string, number>> => {
    if (!exchangeHas(exchange, 'fetchCurrencies')) {
      throw new ExchangeError(
        `Exchange ${exchange.id} does not support fetching withdrawal fees`,
        exchange.id
      )
    }
    
    const currencies = await exchange.fetchCurrencies()
    
    // Extract withdrawal fees from currencies info
    const result: Record<string, number> = {}
    
    for (const [currency, info] of Object.entries(currencies)) {
      if (info && typeof info === 'object' && 'fee' in info) {
        result[currency] = (info as any).fee || 0
      }
    }
    
    return result
  }
)

// Validate withdrawal address (basic validation)
export const validateWithdrawalAddress = (
  address: string,
  _currency: string,
  _network?: string
): boolean => {
  // Basic validation
  if (!address || address.length === 0) {
    return false
  }
  
  // Add currency/network specific validations here
  
  return true
}

// Calculate net withdrawal amount (after fees)
export const calculateNetWithdrawalAmount = (
  amount: number,
  fee: number,
  feeCurrency: string,
  withdrawalCurrency: string
): number => {
  const withdrawalAmount = new Big(amount)
  
  // If fee is in same currency, subtract from amount
  if (feeCurrency === withdrawalCurrency) {
    return withdrawalAmount.minus(fee).toNumber()
  }
  
  // Otherwise, full amount is withdrawn (fee paid separately)
  return withdrawalAmount.toNumber()
}