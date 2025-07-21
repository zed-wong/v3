import type { Exchange, Balances as CCXTBalances, Balance as CCXTBalance } from 'ccxt'
import { Big } from 'big.js'
import type { BalanceCommand, BalanceResult, TransactionData } from '../../../types/exchange'
import { ExchangeError, TransactionStatus, TransactionType } from '../../../types/exchange'
import { withExchangeErrorHandler } from '../base'
import { cache, cacheKeys } from '../cache'

// Re-export types for convenience
export type { BalanceCommand, BalanceResult, TransactionData } from '../../../types/exchange'

// Fetch balance from exchange
export const fetchExchangeBalance = withExchangeErrorHandler(
  async (exchange: Exchange, currencies?: string[]): Promise<CCXTBalances> => {
    const balance = await exchange.fetchBalance()
    
    if (!currencies || currencies.length === 0) {
      return balance
    }
    
    // Filter by requested currencies
    const filtered: CCXTBalances = { info: balance.info }
    for (const currency of currencies) {
      if (balance[currency]) {
        filtered[currency] = balance[currency]
      }
    }
    
    return filtered
  }
)

// Get balance with caching
export const getExchangeBalance = async (
  exchange: Exchange,
  command: BalanceCommand,
  cacheTtl = 60 // 1 minute default
): Promise<CCXTBalances> => {
  const cacheKey = cacheKeys.balance(exchange.id, command.userId)
  
  // Try cache first
  const cached = cache.get<CCXTBalances>(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch from exchange
  const balance = await fetchExchangeBalance(exchange, command.currencies)
  
  // Cache the result
  cache.set(cacheKey, balance, cacheTtl)
  
  return balance
}

// Calculate total balance from transactions (for reconciliation)
export const calculateBalanceFromTransactions = (
  transactions: TransactionData[]
): BalanceResult => {
  const balances: Record<string, { deposit: Big; withdrawal: Big }> = {}
  
  for (const tx of transactions) {
    // Only include successful transactions
    if (tx.status !== 'ok') {
      continue
    }
    
    const symbol = tx.symbol
    if (!balances[symbol]) {
      balances[symbol] = {
        deposit: new Big(0),
        withdrawal: new Big(0)
      }
    }
    
    const amount = new Big(tx.amount)
    
    if (tx.type === TransactionType.DEPOSIT) {
      balances[symbol].deposit = balances[symbol].deposit.plus(amount)
    } else if (tx.type === TransactionType.WITHDRAWAL) {
      balances[symbol].withdrawal = balances[symbol].withdrawal.plus(amount)
    }
  }
  
  // Convert to result format
  const result: BalanceResult = {}
  
  for (const [symbol, balance] of Object.entries(balances)) {
    const total = balance.deposit.minus(balance.withdrawal)
    
    result[symbol] = {
      deposit: balance.deposit.toString(),
      withdrawal: balance.withdrawal.toString(),
      total: total.toString(),
      exchange: transactions[0]?.exchange || 'unknown'
    }
  }
  
  return result
}

// Get incremental transactions since last timestamp
export const getIncrementalTransactions = async (
  fetchFn: (since?: number) => Promise<TransactionData[]>,
  lastTimestamp?: number
): Promise<TransactionData[]> => {
  // If no last timestamp, fetch all
  if (!lastTimestamp) {
    return fetchFn()
  }
  
  // Fetch only new transactions
  return fetchFn(lastTimestamp + 1)
}

// Merge and deduplicate transactions
export const mergeTransactions = (
  existing: TransactionData[],
  newTxs: TransactionData[]
): TransactionData[] => {
  const txMap = new Map<string, TransactionData>()
  
  // Add existing transactions
  for (const tx of existing) {
    txMap.set(tx.id, tx)
  }
  
  // Add new transactions (will overwrite if duplicate)
  for (const tx of newTxs) {
    txMap.set(tx.id, tx)
  }
  
  // Return sorted by timestamp
  return Array.from(txMap.values()).sort((a, b) => a.timestamp - b.timestamp)
}

// Get latest timestamp for a symbol
export const getLatestTimestamp = (
  transactions: TransactionData[],
  symbol?: string
): number | undefined => {
  const filtered = symbol 
    ? transactions.filter(tx => tx.symbol === symbol)
    : transactions
  
  if (filtered.length === 0) {
    return undefined
  }
  
  return Math.max(...filtered.map(tx => tx.timestamp))
}

// Format balance for API response
export const formatBalance = (balance: CCXTBalance): {
  free: string
  used: string
  total: string
} => ({
  free: (balance.free ?? 0).toString(),
  used: (balance.used ?? 0).toString(),
  total: (balance.total ?? 0).toString()
})

// Format all balances for API response
export const formatBalances = (balances: CCXTBalances): Record<string, {
  free: string
  used: string
  total: string
}> => {
  const formatted: Record<string, any> = {}
  
  for (const [currency, balance] of Object.entries(balances)) {
    if (currency === 'info') continue // Skip info property
    if (balance && typeof balance === 'object' && 'total' in balance) {
      const total = balance.total ?? 0
      if (total > 0) { // Only include non-zero balances
        formatted[currency] = formatBalance(balance as CCXTBalance)
      }
    }
  }
  
  return formatted
}

// Validate balance sufficiency
export const validateSufficientBalance = (
  balance: CCXTBalance,
  requiredAmount: number,
  currency: string
): void => {
  const available = balance.free ?? 0
  if (available < requiredAmount) {
    throw new ExchangeError(
      `Insufficient ${currency} balance. Required: ${requiredAmount}, Available: ${available}`,
      'balance_check'
    )
  }
}