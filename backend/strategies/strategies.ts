import { api } from "encore.dev/api";
import { APIError } from "encore.dev";
import { TradingStrategy, MarketMakingStrategy, StrategyExecution } from "./types";
import { db, prepare } from "../common/db";

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

// Helper function to generate IDs
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Strategy Registration
export const registerStrategy = api(
  { method: "POST", path: "/strategies" },
  async (strategy: CreateTradingStrategyRequest): Promise<TradingStrategy> => {
    const id = generateId();
    const now = new Date().toISOString();
    
    const stmt = prepare(`
      INSERT INTO strategies (id, name, description, type, parameters, status, created_at, updated_at)
      VALUES (?, ?, ?, 'trading', ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      strategy.name,
      strategy.description,
      JSON.stringify(strategy.parameters),
      strategy.isActive ? 'active' : 'inactive',
      now,
      now
    );
    
    const newStrategy: TradingStrategy = {
      id,
      name: strategy.name,
      description: strategy.description,
      parameters: strategy.parameters,
      isActive: strategy.isActive,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
    
    return newStrategy;
  }
);

// Get all strategies
export const getStrategies = api(
  { method: "GET", path: "/strategies" },
  async (): Promise<TradingStrategiesResponse> => {
    const stmt = prepare(`
      SELECT id, name, description, parameters, status, created_at, updated_at
      FROM strategies
      ORDER BY created_at DESC
    `);
    
    const rows = stmt.all();
    
    const strategies: TradingStrategy[] = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      parameters: JSON.parse(row.parameters),
      isActive: row.status === 'active',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
    
    return { strategies };
  }
);

// Get strategy by ID
export const getStrategy = api(
  { method: "GET", path: "/strategies/:id" },
  async ({ id }: { id: string }): Promise<GetStrategyResponse> => {
    const stmt = prepare(`
      SELECT id, name, description, parameters, status, created_at, updated_at
      FROM strategies
      WHERE id = ?
    `);
    
    const row = stmt.get(id) as any;
    
    if (!row) {
      return { strategy: null };
    }
    
    const strategy: TradingStrategy = {
      id: row.id,
      name: row.name,
      description: row.description,
      parameters: JSON.parse(row.parameters),
      isActive: row.status === 'active',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
    
    return { strategy };
  }
);

// Update strategy
export const updateStrategy = api(
  { method: "PUT", path: "/strategies/:id" },
  async (request: UpdateTradingStrategyRequest): Promise<UpdateStrategyResponse> => {
    const { id, ...updates } = request;
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    
    if (updates.name !== undefined) {
      updateFields.push(`name = ?`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      updateFields.push(`description = ?`);
      values.push(updates.description);
    }
    if (updates.parameters !== undefined) {
      updateFields.push(`parameters = ?`);
      values.push(JSON.stringify(updates.parameters));
    }
    if (updates.isActive !== undefined) {
      updateFields.push(`status = ?`);
      values.push(updates.isActive ? 'active' : 'inactive');
    }
    
    if (updateFields.length === 0) {
      return { strategy: null };
    }
    
    updateFields.push(`updated_at = ?`);
    values.push(new Date().toISOString());
    values.push(id);
    
    const updateStmt = prepare(`
      UPDATE strategies 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `);
    
    const result = updateStmt.run(...values);
    
    if (result.changes === 0) {
      return { strategy: null };
    }
    
    // Fetch updated strategy
    const getStmt = prepare(`
      SELECT id, name, description, parameters, status, created_at, updated_at
      FROM strategies
      WHERE id = ?
    `);
    
    const row = getStmt.get(id) as any;
    
    const strategy: TradingStrategy = {
      id: row.id,
      name: row.name,
      description: row.description,
      parameters: JSON.parse(row.parameters),
      isActive: row.status === 'active',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
    
    return { strategy };
  }
);

// Delete strategy
export const deleteStrategy = api(
  { method: "DELETE", path: "/strategies/:id" },
  async ({ id }: { id: string }): Promise<DeleteStrategyResponse> => {
    const stmt = prepare(`DELETE FROM strategies WHERE id = ?`);
    const result = stmt.run(id);
    
    return { success: result.changes > 0 };
  }
);

// Strategy Execution
export const executeStrategy = api(
  { method: "POST", path: "/strategies/:id/execute" },
  async ({ id, exchange, symbol }: { id: string; exchange: string; symbol: string }): Promise<StrategyExecution> => {
    // Check if strategy exists and is active
    const strategyStmt = prepare(`SELECT id, name, status FROM strategies WHERE id = ?`);
    const strategy = strategyStmt.get(id) as any;
    
    if (!strategy) {
      throw APIError.notFound(`Strategy with id ${id} not found`);
    }
    
    if (strategy.status !== 'active') {
      throw APIError.badRequest(`Strategy ${id} is not active`);
    }
    
    const executionId = generateId();
    const startTime = new Date().toISOString();
    
    const insertStmt = prepare(`
      INSERT INTO executions (id, strategy_id, status, started_at, metrics)
      VALUES (?, ?, 'running', ?, ?)
    `);
    
    insertStmt.run(executionId, id, startTime, JSON.stringify({ exchange, symbol }));
    
    const execution: StrategyExecution = {
      id: executionId,
      strategyId: id,
      exchange,
      symbol,
      status: 'running',
      startTime: new Date(startTime),
    };
    
    // Start async execution (this would typically be handled by a queue/worker)
    executeStrategyAsync(execution);
    
    return execution;
  }
);

// Get strategy executions
export const getStrategyExecutions = api(
  { method: "GET", path: "/strategies/:id/executions" },
  async ({ id }: { id: string }): Promise<StrategyExecutionsResponse> => {
    const stmt = prepare(`
      SELECT id, strategy_id, status, started_at, stopped_at, error, metrics
      FROM executions
      WHERE strategy_id = ?
      ORDER BY started_at DESC
    `);
    
    const rows = stmt.all(id);
    
    const executions: StrategyExecution[] = rows.map((row: any) => {
      const metrics = JSON.parse(row.metrics || '{}');
      return {
        id: row.id,
        strategyId: row.strategy_id,
        status: row.status as 'pending' | 'running' | 'completed' | 'failed',
        startTime: new Date(row.started_at),
        endTime: row.stopped_at ? new Date(row.stopped_at) : undefined,
        exchange: metrics.exchange || '',
        symbol: metrics.symbol || '',
        results: metrics.results,
      };
    });
    
    return { executions };
  }
);

// Get execution by ID
export const getExecution = api(
  { method: "GET", path: "/executions/:id" },
  async ({ id }: { id: string }): Promise<GetExecutionResponse> => {
    const stmt = prepare(`
      SELECT id, strategy_id, status, started_at, stopped_at, error, metrics
      FROM executions
      WHERE id = ?
    `);
    
    const row = stmt.get(id) as any;
    
    if (!row) {
      return { execution: null };
    }
    
    const metrics = JSON.parse(row.metrics || '{}');
    const execution: StrategyExecution = {
      id: row.id,
      strategyId: row.strategy_id,
      status: row.status as 'pending' | 'running' | 'completed' | 'failed',
      startTime: new Date(row.started_at),
      endTime: row.stopped_at ? new Date(row.stopped_at) : undefined,
      exchange: metrics.exchange || '',
      symbol: metrics.symbol || '',
      results: metrics.results,
    };
    
    return { execution };
  }
);

// Stop execution
export const stopExecution = api(
  { method: "POST", path: "/executions/:id/stop" },
  async ({ id }: { id: string }): Promise<StopExecutionResponse> => {
    const stmt = prepare(`
      UPDATE executions 
      SET status = 'completed', stopped_at = ?
      WHERE id = ? AND status = 'running'
    `);
    
    const result = stmt.run(new Date().toISOString(), id);
    
    return { success: result.changes > 0 };
  }
);


async function executeStrategyAsync(execution: StrategyExecution): Promise<void> {
  try {
    // Get the strategy details
    const strategyStmt = prepare(`
      SELECT id, name, parameters FROM strategies WHERE id = ?
    `);
    const strategy = strategyStmt.get(execution.strategyId) as any;
    
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    
    // Execute the strategy logic based on type
    // This is where we would integrate with CCXT and implement actual trading logic
    // For now, simulate execution
    await simulateExecution(execution, strategy);
    
    const endTime = new Date().toISOString();
    const results = {
      totalTrades: Math.floor(Math.random() * 10) + 1,
      profit: (Math.random() - 0.5) * 1000,
      volume: Math.random() * 10000,
    };
    
    // Get current metrics and update with results
    const getMetricsStmt = prepare(`SELECT metrics FROM executions WHERE id = ?`);
    const currentRow = getMetricsStmt.get(execution.id) as any;
    const currentMetrics = JSON.parse(currentRow.metrics || '{}');
    currentMetrics.results = results;
    
    const updateStmt = prepare(`
      UPDATE executions 
      SET status = 'completed', 
          stopped_at = ?,
          metrics = ?
      WHERE id = ?
    `);
    
    updateStmt.run(endTime, JSON.stringify(currentMetrics), execution.id);
  } catch (error) {
    const errorStmt = prepare(`
      UPDATE executions 
      SET status = 'failed', 
          stopped_at = ?,
          error = ?
      WHERE id = ?
    `);
    
    errorStmt.run(new Date().toISOString(), String(error), execution.id);
    console.error(`Strategy execution failed: ${error}`);
  }
}

async function simulateExecution(execution: StrategyExecution, strategy: any): Promise<void> {
  // Simulate some async work
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log(`Executed strategy ${strategy.name} on ${execution.exchange} for ${execution.symbol}`);
}