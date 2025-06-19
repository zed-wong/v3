import { api } from "encore.dev/api";
import ccxt from "ccxt";
import { ExchangeConfig, OrderBook, Order } from "../strategies/types";

export interface SupportedExchangesResponse {
  exchanges: string[];
}

export interface ConfiguredExchangesResponse {
  exchanges: string[];
}

export interface TickerResponse {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
}

export interface BalanceResponse {
  total: Record<string, number>;
  free: Record<string, number>;
  used: Record<string, number>;
}

export interface CancelOrderResponse {
  success: boolean;
}

export interface OrdersResponse {
  orders: Order[];
}

export interface MarketsResponse {
  markets: Record<string, any>;
}

// In-memory storage for exchange configurations (replace with secure storage in production)
let exchangeConfigs: Map<string, ExchangeConfig> = new Map();
let exchangeInstances: Map<string, ccxt.Exchange> = new Map();

// Configure exchange
export const configureExchange = api(
  { method: "POST", path: "/exchanges/configure" },
  async (config: ExchangeConfig): Promise<{ success: boolean; message: string }> => {
    try {
      // Validate exchange is supported
      if (!ccxt.exchanges.includes(config.name)) {
        throw new Error(`Exchange ${config.name} is not supported`);
      }
      
      // Create exchange instance
      const ExchangeClass = ccxt[config.name as keyof typeof ccxt] as any;
      const exchange = new ExchangeClass({
        apiKey: config.apiKey,
        secret: config.secret,
        sandbox: config.sandbox || false,
        rateLimit: config.rateLimit || 1000,
        enableRateLimit: true,
      });
      
      // Test connection
      await exchange.loadMarkets();
      
      // Store configuration and instance
      exchangeConfigs.set(config.name, config);
      exchangeInstances.set(config.name, exchange);
      
      return { success: true, message: `Exchange ${config.name} configured successfully` };
    } catch (error) {
      return { success: false, message: `Failed to configure exchange: ${error}` };
    }
  }
);

// Get supported exchanges
export const getSupportedExchanges = api(
  { method: "GET", path: "/exchanges/supported" },
  async (): Promise<SupportedExchangesResponse> => {
    return { exchanges: ccxt.exchanges };
  }
);

// Get configured exchanges
export const getConfiguredExchanges = api(
  { method: "GET", path: "/exchanges/configured" },
  async (): Promise<ConfiguredExchangesResponse> => {
    return { exchanges: Array.from(exchangeConfigs.keys()) };
  }
);

// Get order book
export const getOrderBook = api(
  { method: "GET", path: "/exchanges/:exchange/orderbook/:symbol" },
  async ({ exchange, symbol }: { exchange: string; symbol: string }): Promise<OrderBook> => {
    const exchangeInstance = exchangeInstances.get(exchange);
    if (!exchangeInstance) {
      throw new Error(`Exchange ${exchange} is not configured`);
    }
    
    try {
      const orderbook = await exchangeInstance.fetchOrderBook(symbol);
      return {
        symbol,
        bids: orderbook.bids.map(([price, amount]: [number, number]) => ({ price, amount })),
        asks: orderbook.asks.map(([price, amount]: [number, number]) => ({ price, amount })),
        timestamp: orderbook.timestamp || Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch order book: ${error}`);
    }
  }
);

// Get ticker
export const getTicker = api(
  { method: "GET", path: "/exchanges/:exchange/ticker/:symbol" },
  async ({ exchange, symbol }: { exchange: string; symbol: string }): Promise<TickerResponse> => {
    const exchangeInstance = exchangeInstances.get(exchange);
    if (!exchangeInstance) {
      throw new Error(`Exchange ${exchange} is not configured`);
    }
    
    try {
      const ticker = await exchangeInstance.fetchTicker(symbol);
      return {
        symbol: ticker.symbol,
        bid: ticker.bid || 0,
        ask: ticker.ask || 0,
        last: ticker.last || 0,
        high: ticker.high || 0,
        low: ticker.low || 0,
        volume: ticker.baseVolume || 0,
        timestamp: ticker.timestamp || Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch ticker: ${error}`);
    }
  }
);

// Get balance
export const getBalance = api(
  { method: "GET", path: "/exchanges/:exchange/balance" },
  async ({ exchange }: { exchange: string }): Promise<BalanceResponse> => {
    const exchangeInstance = exchangeInstances.get(exchange);
    if (!exchangeInstance) {
      throw new Error(`Exchange ${exchange} is not configured`);
    }
    
    try {
      const balance = await exchangeInstance.fetchBalance();
      return {
        total: balance.total || {},
        free: balance.free || {},
        used: balance.used || {},
      };
    } catch (error) {
      throw new Error(`Failed to fetch balance: ${error}`);
    }
  }
);

// Create order
export const createOrder = api(
  { method: "POST", path: "/exchanges/:exchange/orders" },
  async ({ 
    exchange, 
    symbol, 
    type, 
    side, 
    amount, 
    price 
  }: { 
    exchange: string; 
    symbol: string; 
    type: string; 
    side: string; 
    amount: number; 
    price?: number;
  }): Promise<Order> => {
    const exchangeInstance = exchangeInstances.get(exchange);
    if (!exchangeInstance) {
      throw new Error(`Exchange ${exchange} is not configured`);
    }
    
    try {
      const order = await exchangeInstance.createOrder(symbol, type, side, amount, price);
      return {
        id: order.id,
        symbol: order.symbol,
        side: side as 'buy' | 'sell',
        amount: order.amount,
        price: order.price,
        type: type as 'market' | 'limit',
        status: order.status as any,
        timestamp: order.timestamp || Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to create order: ${error}`);
    }
  }
);

// Cancel order
export const cancelOrder = api(
  { method: "DELETE", path: "/exchanges/:exchange/orders/:orderId" },
  async ({ exchange, orderId, symbol }: { exchange: string; orderId: string; symbol: string }): Promise<CancelOrderResponse> => {
    const exchangeInstance = exchangeInstances.get(exchange);
    if (!exchangeInstance) {
      throw new Error(`Exchange ${exchange} is not configured`);
    }
    
    try {
      await exchangeInstance.cancelOrder(orderId, symbol);
      return { success: true };
    } catch (error) {
      console.error(`Failed to cancel order: ${error}`);
      return { success: false };
    }
  }
);

// Get open orders
export const getOpenOrders = api(
  { method: "GET", path: "/exchanges/:exchange/orders/open" },
  async ({ exchange, symbol }: { exchange: string; symbol?: string }): Promise<OrdersResponse> => {
    const exchangeInstance = exchangeInstances.get(exchange);
    if (!exchangeInstance) {
      throw new Error(`Exchange ${exchange} is not configured`);
    }
    
    try {
      const orders = await exchangeInstance.fetchOpenOrders(symbol);
      return {
        orders: orders.map(order => ({
          id: order.id,
          symbol: order.symbol,
          side: order.side as 'buy' | 'sell',
          amount: order.amount,
          price: order.price,
          type: order.type as 'market' | 'limit',
          status: order.status as any,
          timestamp: order.timestamp || Date.now(),
        }))
      };
    } catch (error) {
      throw new Error(`Failed to fetch open orders: ${error}`);
    }
  }
);

// Get markets
export const getMarkets = api(
  { method: "GET", path: "/exchanges/:exchange/markets" },
  async ({ exchange }: { exchange: string }): Promise<MarketsResponse> => {
    const exchangeInstance = exchangeInstances.get(exchange);
    if (!exchangeInstance) {
      throw new Error(`Exchange ${exchange} is not configured`);
    }
    
    try {
      const markets = await exchangeInstance.loadMarkets();
      return { markets };
    } catch (error) {
      throw new Error(`Failed to load markets: ${error}`);
    }
  }
);