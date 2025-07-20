// Balance types
export interface Balance {
  currency: string
  free: number
  used: number
  total: number
}

export interface Balances {
  [currency: string]: Balance
}

// Balance command interface
export interface BalanceCommand {
  userId: string
  exchangeId: string
  currencies?: string[]
}

// Balance result structure
export interface BalanceResult {
  [symbol: string]: {
    deposit: string
    withdrawal: string
    total: string
    exchange: string
  }
}