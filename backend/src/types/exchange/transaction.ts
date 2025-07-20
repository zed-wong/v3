// Transaction types
export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal'
}

export enum TransactionStatus {
  PENDING = 'pending',
  OK = 'ok',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

export interface Transaction {
  id: string
  txid?: string
  timestamp: number
  datetime: string
  currency: string
  amount: number
  address: string
  tag?: string
  type: TransactionType
  status: TransactionStatus
  fee?: {
    currency: string
    cost: number
  }
}

// Transaction data structure for balance calculations
export interface TransactionData {
  id: string
  timestamp: number
  symbol: string
  amount: string
  type: TransactionType
  status: TransactionStatus
  exchange?: string
}