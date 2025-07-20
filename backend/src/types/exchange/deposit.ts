import type { Transaction } from './transaction'

// Deposit command interface
export interface DepositCommand {
  userId: string
  exchangeId: string
  currency: string
  network?: string
}

// Deposit address result
export interface DepositAddress {
  currency: string
  address: string
  tag?: string
  network?: string
}

// Deposit transaction interface extending base Transaction
export interface DepositTransaction extends Transaction {
  network?: string
}