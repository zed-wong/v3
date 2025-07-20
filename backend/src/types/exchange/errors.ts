// Exchange error types
export class ExchangeError extends Error {
  constructor(
    message: string,
    public exchangeId: string,
    public originalError?: any
  ) {
    super(message)
    this.name = 'ExchangeError'
  }
}

export class ExchangeNotFoundError extends ExchangeError {
  constructor(exchangeId: string) {
    super(`Exchange ${exchangeId} not found`, exchangeId)
    this.name = 'ExchangeNotFoundError'
  }
}

export class InvalidOrderError extends ExchangeError {
  constructor(message: string, exchangeId: string) {
    super(message, exchangeId)
    this.name = 'InvalidOrderError'
  }
}

export class InsufficientBalanceError extends ExchangeError {
  constructor(exchangeId: string, currency: string, required: number, available: number) {
    super(
      `Insufficient ${currency} balance on ${exchangeId}. Required: ${required}, Available: ${available}`,
      exchangeId
    )
    this.name = 'InsufficientBalanceError'
  }
}