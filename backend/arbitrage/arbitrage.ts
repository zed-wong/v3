import { api } from "encore.dev/api";
import { exchanges } from "~encore/clients";

export interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  profitPercentage: number;
  volume: number;
  timestamp: Date;
}

export interface ArbitrageConfig {
  symbols: string[];
  exchanges: string[];
  minProfitThreshold: number; // Minimum profit percentage
  maxTradeAmount: number;
}

export interface ArbitrageOpportunityResponse {
  opportunities: ArbitrageOpportunity[];
}

// Find arbitrage opportunities
export const findArbitrageOpportunities = api(
  { method: "POST", path: "/arbitrage/opportunities" },
  async (config: ArbitrageConfig): Promise<ArbitrageOpportunityResponse> => {
    const opportunities: ArbitrageOpportunity[] = [];
    
    for (const symbol of config.symbols) {
      // Get prices from all configured exchanges
      const prices: { exchange: string; bid: number; ask: number }[] = [];
      
      for (const exchange of config.exchanges) {
        try {
          const ticker = await exchanges.getTicker({ exchange, symbol });
          prices.push({
            exchange,
            bid: ticker.bid,
            ask: ticker.ask,
          });
        } catch (error) {
          console.error(`Failed to get ticker for ${symbol} on ${exchange}:`, error);
        }
      }
      
      // Find arbitrage opportunities
      for (let i = 0; i < prices.length; i++) {
        for (let j = 0; j < prices.length; j++) {
          if (i === j) continue;
          
          const buyExchange = prices[i];
          const sellExchange = prices[j];
          
          // Check if we can buy low and sell high
          if (sellExchange.bid > buyExchange.ask) {
            const profit = sellExchange.bid - buyExchange.ask;
            const profitPercentage = (profit / buyExchange.ask) * 100;
            
            if (profitPercentage >= config.minProfitThreshold) {
              opportunities.push({
                id: generateId(),
                symbol,
                buyExchange: buyExchange.exchange,
                sellExchange: sellExchange.exchange,
                buyPrice: buyExchange.ask,
                sellPrice: sellExchange.bid,
                profit,
                profitPercentage,
                volume: Math.min(config.maxTradeAmount, 1000), // Default volume limit
                timestamp: new Date(),
              });
            }
          }
        }
      }
    }
    
    return {
      opportunities: opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage)
    };
  }
);

// Execute arbitrage opportunity
export const executeArbitrage = api(
  { method: "POST", path: "/arbitrage/execute" },
  async ({ opportunityId, amount }: { opportunityId: string; amount: number }): Promise<{ success: boolean; message: string }> => {
    // This is a simplified implementation
    // In production, you would:
    // 1. Verify the opportunity is still valid
    // 2. Check balances on both exchanges
    // 3. Execute buy and sell orders simultaneously
    // 4. Handle partial fills and errors
    
    try {
      // Simulate execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: `Arbitrage executed successfully for ${amount} units`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Arbitrage execution failed: ${error}`,
      };
    }
  }
);

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}