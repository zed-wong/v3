import { api } from "encore.dev/api";
import { TradingStrategy, MarketMakingStrategy, StrategyExecution } from "./types";

export interface CreateTradingStrategyRequest {
  name: string;
  description: string;
  parameters: Record<string, any>;
  isActive: boolean;
}

export interface UpdateTradingStrategyRequest {
  id: string;
  name?: string;
  description?: string;
  parameters?: Record<string, any>;
  isActive?: boolean;
}

export interface TradingStrategiesResponse {
  strategies: TradingStrategy[];
}

export interface DeleteStrategyResponse {
  success: boolean;
}

export interface StrategyExecutionsResponse {
  executions: StrategyExecution[];
}

export interface StopExecutionResponse {
  success: boolean;
}

export interface GetStrategyResponse {
  strategy: TradingStrategy | null;
}

export interface UpdateStrategyResponse {
  strategy: TradingStrategy | null;
}

export interface GetExecutionResponse {
  execution: StrategyExecution | null;
}

// In-memory storage for strategies (replace with database in production)
let strategies: TradingStrategy[] = [];
let executions: StrategyExecution[] = [];

// Strategy Registration
export const registerStrategy = api(
  { method: "POST", path: "/strategies" },
  async (strategy: CreateTradingStrategyRequest): Promise<TradingStrategy> => {
    const newStrategy: TradingStrategy = {
      ...strategy,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    strategies.push(newStrategy);
    return newStrategy;
  }
);

// Get all strategies
export const getStrategies = api(
  { method: "GET", path: "/strategies" },
  async (): Promise<TradingStrategiesResponse> => {
    return { strategies };
  }
);

// Get strategy by ID
export const getStrategy = api(
  { method: "GET", path: "/strategies/:id" },
  async ({ id }: { id: string }): Promise<GetStrategyResponse> => {
    return { strategy: strategies.find(s => s.id === id) || null };
  }
);

// Update strategy
export const updateStrategy = api(
  { method: "PUT", path: "/strategies/:id" },
  async (request: UpdateTradingStrategyRequest): Promise<UpdateStrategyResponse> => {
    const { id, ...updates } = request;
    const strategyIndex = strategies.findIndex(s => s.id === id);
    if (strategyIndex === -1) return { strategy: null };
    
    strategies[strategyIndex] = {
      ...strategies[strategyIndex],
      ...updates,
      updatedAt: new Date(),
    };
    
    return { strategy: strategies[strategyIndex] };
  }
);

// Delete strategy
export const deleteStrategy = api(
  { method: "DELETE", path: "/strategies/:id" },
  async ({ id }: { id: string }): Promise<DeleteStrategyResponse> => {
    const initialLength = strategies.length;
    strategies = strategies.filter(s => s.id !== id);
    return { success: strategies.length < initialLength };
  }
);

// Strategy Execution
export const executeStrategy = api(
  { method: "POST", path: "/strategies/:id/execute" },
  async ({ id, exchange, symbol }: { id: string; exchange: string; symbol: string }): Promise<StrategyExecution> => {
    const strategy = strategies.find(s => s.id === id);
    if (!strategy) {
      throw new Error(`Strategy with id ${id} not found`);
    }
    
    if (!strategy.isActive) {
      throw new Error(`Strategy ${id} is not active`);
    }
    
    const execution: StrategyExecution = {
      id: generateId(),
      strategyId: id,
      exchange,
      symbol,
      status: 'pending',
      startTime: new Date(),
    };
    
    executions.push(execution);
    
    // Start async execution (this would typically be handled by a queue/worker)
    executeStrategyAsync(execution);
    
    return execution;
  }
);

// Get strategy executions
export const getStrategyExecutions = api(
  { method: "GET", path: "/strategies/:id/executions" },
  async ({ id }: { id: string }): Promise<StrategyExecutionsResponse> => {
    return { executions: executions.filter(e => e.strategyId === id) };
  }
);

// Get execution by ID
export const getExecution = api(
  { method: "GET", path: "/executions/:id" },
  async ({ id }: { id: string }): Promise<GetExecutionResponse> => {
    return { execution: executions.find(e => e.id === id) || null };
  }
);

// Stop execution
export const stopExecution = api(
  { method: "POST", path: "/executions/:id/stop" },
  async ({ id }: { id: string }): Promise<StopExecutionResponse> => {
    const execution = executions.find(e => e.id === id);
    if (!execution || execution.status !== 'running') {
      return { success: false };
    }
    
    execution.status = 'completed';
    execution.endTime = new Date();
    return { success: true };
  }
);

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

async function executeStrategyAsync(execution: StrategyExecution): Promise<void> {
  try {
    // Update status to running
    execution.status = 'running';
    
    // Get the strategy
    const strategy = strategies.find(s => s.id === execution.strategyId);
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    
    // Execute the strategy logic based on type
    // This is where we would integrate with CCXT and implement actual trading logic
    // For now, simulate execution
    await simulateExecution(execution, strategy);
    
    execution.status = 'completed';
    execution.endTime = new Date();
    execution.results = {
      totalTrades: Math.floor(Math.random() * 10) + 1,
      profit: (Math.random() - 0.5) * 1000,
      volume: Math.random() * 10000,
    };
  } catch (error) {
    execution.status = 'failed';
    execution.endTime = new Date();
    console.error(`Strategy execution failed: ${error}`);
  }
}

async function simulateExecution(execution: StrategyExecution, strategy: TradingStrategy): Promise<void> {
  // Simulate some async work
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log(`Executed strategy ${strategy.name} on ${execution.exchange} for ${execution.symbol}`);
}