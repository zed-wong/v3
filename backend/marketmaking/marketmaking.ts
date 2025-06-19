import { api } from "encore.dev/api";
import { MarketMakingStrategy, Order, OrderBook } from "../strategies/types";
import { exchanges } from "~encore/clients";

export interface StopMarketMakingResponse {
  success: boolean;
}

export interface MarketMakingSessionsResponse {
  sessions: MarketMakingSession[];
}

export interface PauseMarketMakingResponse {
  success: boolean;
}

export interface UpdateMarketMakingConfigRequest {
  sessionId: string;
  strategyId?: string;
  exchange?: string;
  symbol?: string;
  baseAmount?: number;
  spread?: number;
  maxOrders?: number;
  priceOffset?: number;
  minProfitThreshold?: number;
}

export interface GetMarketMakingSessionResponse {
  session: MarketMakingSession | null;
}

export interface UpdateMarketMakingConfigResponse {
  session: MarketMakingSession | null;
}

// Market making strategy implementation
export interface MarketMakingConfig {
  strategyId: string;
  exchange: string;
  symbol: string;
  baseAmount: number;
  spread: number;
  maxOrders: number;
  priceOffset: number;
  minProfitThreshold: number;
}

export interface MarketMakingSession {
  id: string;
  config: MarketMakingConfig;
  status: 'active' | 'paused' | 'stopped';
  activeOrders: Order[];
  stats: {
    totalTrades: number;
    totalProfit: number;
    totalVolume: number;
    avgSpread: number;
    uptime: number;
  };
  startTime: Date;
  lastUpdate: Date;
}

// In-memory storage for market making sessions
let sessions: Map<string, MarketMakingSession> = new Map();

// Start market making session
export const startMarketMaking = api(
  { method: "POST", path: "/marketmaking/start" },
  async (config: MarketMakingConfig): Promise<MarketMakingSession> => {
    const session: MarketMakingSession = {
      id: generateId(),
      config,
      status: 'active',
      activeOrders: [],
      stats: {
        totalTrades: 0,
        totalProfit: 0,
        totalVolume: 0,
        avgSpread: 0,
        uptime: 0,
      },
      startTime: new Date(),
      lastUpdate: new Date(),
    };

    sessions.set(session.id, session);
    
    // Start the market making process
    executeMarketMaking(session);
    
    return session;
  }
);

// Stop market making session
export const stopMarketMaking = api(
  { method: "POST", path: "/marketmaking/:sessionId/stop" },
  async ({ sessionId }: { sessionId: string }): Promise<StopMarketMakingResponse> => {
    const session = sessions.get(sessionId);
    if (!session) return false;
    
    session.status = 'stopped';
    
    // Cancel all active orders
    for (const order of session.activeOrders) {
      try {
        await exchanges.cancelOrder({
          exchange: session.config.exchange,
          orderId: order.id,
          symbol: order.symbol,
        });
      } catch (error) {
        console.error(`Failed to cancel order ${order.id}:`, error);
      }
    }
    
    session.activeOrders = [];
    session.lastUpdate = new Date();
    
    return { success: true };
  }
);

// Get market making session
export const getMarketMakingSession = api(
  { method: "GET", path: "/marketmaking/:sessionId" },
  async ({ sessionId }: { sessionId: string }): Promise<GetMarketMakingSessionResponse> => {
    return { session: sessions.get(sessionId) || null };
  }
);

// Get all market making sessions
export const getMarketMakingSessions = api(
  { method: "GET", path: "/marketmaking/sessions" },
  async (): Promise<MarketMakingSessionsResponse> => {
    return { sessions: Array.from(sessions.values()) };
  }
);

// Update market making configuration
export const updateMarketMakingConfig = api(
  { method: "PUT", path: "/marketmaking/:sessionId/config" },
  async (request: UpdateMarketMakingConfigRequest): Promise<UpdateMarketMakingConfigResponse> => {
    const { sessionId, ...updates } = request;
    const session = sessions.get(sessionId);
    if (!session) return { session: null };
    
    session.config = { ...session.config, ...updates };
    session.lastUpdate = new Date();
    
    return { session };
  }
);

// Pause/Resume market making
export const pauseMarketMaking = api(
  { method: "POST", path: "/marketmaking/:sessionId/pause" },
  async ({ sessionId }: { sessionId: string }): Promise<PauseMarketMakingResponse> => {
    const session = sessions.get(sessionId);
    if (!session) return { success: false };
    
    session.status = session.status === 'active' ? 'paused' : 'active';
    session.lastUpdate = new Date();
    
    return { success: true };
  }
);

// Core market making logic
async function executeMarketMaking(session: MarketMakingSession): Promise<void> {
  while (session.status === 'active') {
    try {
      await marketMakingCycle(session);
      
      // Wait before next cycle (prevent rate limiting)
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Market making error for session ${session.id}:`, error);
      
      // Pause session on critical errors
      if (isCriticalError(error)) {
        session.status = 'paused';
      }
      
      // Wait longer on errors
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

async function marketMakingCycle(session: MarketMakingSession): Promise<void> {
  const { config } = session;
  
  // Get current market data
  const orderBook = await exchanges.getOrderBook({
    exchange: config.exchange,
    symbol: config.symbol,
  });
  
  const ticker = await exchanges.getTicker({
    exchange: config.exchange,
    symbol: config.symbol,
  });
  
  // Calculate optimal bid/ask prices
  const { bidPrice, askPrice } = calculateOptimalPrices(orderBook, ticker, config);
  
  // Manage existing orders
  await manageExistingOrders(session, orderBook);
  
  // Place new orders if needed
  await placeNewOrders(session, bidPrice, askPrice);
  
  // Update session stats
  updateSessionStats(session);
  
  session.lastUpdate = new Date();
}

function calculateOptimalPrices(orderBook: OrderBook, ticker: any, config: MarketMakingConfig): { bidPrice: number; askPrice: number } {
  const midPrice = (orderBook.bids[0].price + orderBook.asks[0].price) / 2;
  const spreadSize = config.spread / 100; // Convert percentage to decimal
  
  let bidPrice = midPrice * (1 - spreadSize / 2);
  let askPrice = midPrice * (1 + spreadSize / 2);
  
  // Apply price offset if configured
  if (config.priceOffset !== 0) {
    const offset = config.priceOffset / 100;
    bidPrice *= (1 + offset);
    askPrice *= (1 + offset);
  }
  
  return { bidPrice, askPrice };
}

async function manageExistingOrders(session: MarketMakingSession, orderBook: OrderBook): Promise<void> {
  const { config } = session;
  
  // Check if existing orders need to be canceled/updated
  const ordersToCancel = [];
  
  for (const order of session.activeOrders) {
    const shouldCancel = shouldCancelOrder(order, orderBook, config);
    if (shouldCancel) {
      ordersToCancel.push(order);
    }
  }
  
  // Cancel outdated orders
  for (const order of ordersToCancel) {
    try {
      await exchanges.cancelOrder({
        exchange: config.exchange,
        orderId: order.id,
        symbol: order.symbol,
      });
      
      // Remove from active orders
      session.activeOrders = session.activeOrders.filter(o => o.id !== order.id);
    } catch (error) {
      console.error(`Failed to cancel order ${order.id}:`, error);
    }
  }
}

async function placeNewOrders(session: MarketMakingSession, bidPrice: number, askPrice: number): Promise<void> {
  const { config } = session;
  
  // Count current orders by side
  const buyOrders = session.activeOrders.filter(o => o.side === 'buy').length;
  const sellOrders = session.activeOrders.filter(o => o.side === 'sell').length;
  
  const maxOrdersPerSide = Math.floor(config.maxOrders / 2);
  
  // Place buy orders if needed
  if (buyOrders < maxOrdersPerSide) {
    try {
      const buyOrder = await exchanges.createOrder({
        exchange: config.exchange,
        symbol: config.symbol,
        type: 'limit',
        side: 'buy',
        amount: config.baseAmount,
        price: bidPrice,
      });
      
      session.activeOrders.push(buyOrder);
    } catch (error) {
      console.error('Failed to place buy order:', error);
    }
  }
  
  // Place sell orders if needed
  if (sellOrders < maxOrdersPerSide) {
    try {
      const sellOrder = await exchanges.createOrder({
        exchange: config.exchange,
        symbol: config.symbol,
        type: 'limit',
        side: 'sell',
        amount: config.baseAmount,
        price: askPrice,
      });
      
      session.activeOrders.push(sellOrder);
    } catch (error) {
      console.error('Failed to place sell order:', error);
    }
  }
}

function shouldCancelOrder(order: Order, orderBook: OrderBook, config: MarketMakingConfig): boolean {
  const midPrice = (orderBook.bids[0].price + orderBook.asks[0].price) / 2;
  const priceDeviation = Math.abs(order.price - midPrice) / midPrice;
  
  // Cancel if price has moved too far from current market
  const maxDeviation = config.spread / 100 * 2; // 2x the spread
  
  return priceDeviation > maxDeviation;
}

function updateSessionStats(session: MarketMakingSession): void {
  const now = new Date();
  const uptimeMs = now.getTime() - session.startTime.getTime();
  session.stats.uptime = Math.floor(uptimeMs / 1000); // Convert to seconds
  
  // Calculate average spread from active orders
  if (session.activeOrders.length >= 2) {
    const buyOrders = session.activeOrders.filter(o => o.side === 'buy');
    const sellOrders = session.activeOrders.filter(o => o.side === 'sell');
    
    if (buyOrders.length > 0 && sellOrders.length > 0) {
      const highestBid = Math.max(...buyOrders.map(o => o.price));
      const lowestAsk = Math.min(...sellOrders.map(o => o.price));
      const spread = (lowestAsk - highestBid) / ((lowestAsk + highestBid) / 2);
      session.stats.avgSpread = spread * 100; // Convert to percentage
    }
  }
}

function isCriticalError(error: any): boolean {
  // Define critical errors that should pause market making
  const criticalErrors = [
    'insufficient_balance',
    'market_closed',
    'symbol_not_found',
    'exchange_maintenance',
  ];
  
  return criticalErrors.some(criticalError => 
    error.message?.toLowerCase().includes(criticalError)
  );
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}