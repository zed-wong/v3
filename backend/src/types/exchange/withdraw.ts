import type { Transaction } from './transaction'

// Withdrawal command interface
export interface WithdrawalCommand {
  userId: string
  exchangeId: string
  currency: string
  amount: number
  address: string
  tag?: string
  network?: string
}

// Withdrawal result
export interface WithdrawalResult {
  id: string
  txid?: string
  currency: string
  amount: number
  address: string
  tag?: string
  network?: string
  fee?: {
    currency: string
    cost: number
  }
  status: string
}

// Withdrawal transaction interface extending base Transaction
export interface WithdrawalTransaction extends Transaction {
  network?: string
}