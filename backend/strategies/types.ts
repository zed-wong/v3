export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketMakingStrategy extends TradingStrategy {
  spread: number;
  orderSize: number;
  maxOrders: number;
  priceOffset: number;
}

export interface StrategyExecution {
  id: string;
  strategyId: string;
  exchange: string;
  symbol: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  results?: {
    totalTrades: number;
    profit: number;
    volume: number;
  };
}

export interface ExchangeConfig {
  name: string;
  apiKey: string;
  secret: string;
  sandbox?: boolean;
  rateLimit?: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  type: 'market' | 'limit';
  status: 'open' | 'closed' | 'canceled' | 'rejected';
  timestamp: number;
}