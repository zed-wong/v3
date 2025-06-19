# 💡 Strategy Engine + Campaign Architecture Design

## 🧭 Goal
Design a modular, scalable, and trust-minimizable strategy execution system that enables autonomous, verifiable arbitrage and market making logic — capable of global expansion, high resilience, and multi-role orchestration.

---

## 🧱 System Architecture Overview

```
+---------------------+
|   Strategy Engine   |  <-- core state machine + ROI comparator
+---------------------+
         |  
         v
+---------------------+       +------------------+
| Campaign Dispatcher | <---> |  Campaign Oracle  | <-- campaign registry / de-dupe
+---------------------+       +------------------+
         |
         v
+---------------------+
| Execution Layer     | <-- integrates with Market Making + Arbitrage handlers
+---------------------+
         |
         v
+---------------------+
| Recording Oracle    | <-- execution proof + storage trace (S3/chain)
+---------------------+
         |
         v
+---------------------+
| Reputation Oracle   | <-- trust weighting, penalty/fraud filtering
+---------------------+

```

---

## 1. Strategy Engine

### 🔁 States
- `marketMaking`
- `arbitrage`
- `rebalance`
- `idle`

### 🔄 State Switching Conditions
- Define `ROI threshold ratio` (e.g., arbitrage must exceed 150% of MM ROI to trigger switch)
- Enforce cool-down intervals and max switch frequency

### 🔀 Strategy Interface
```ts
interface Strategy {
  id: string
  type: 'marketMaking' | 'arbitrage' | 'rebalance';
  estimatedROI: number;
  canInterruptCurrent: boolean;
  exec(): Promise<ExecutionResult>;
}
```

### ⚖️ ROI Model
- `estimatedROI = (expectedProfit - estimatedCost) / capitalLocked`
- Adjusted with dynamic weights:
  - Market volatility
  - Past execution success rate
  - Capital utilization efficiency

### 🤖 Strategy Competition & Mutex
- Lock per strategy type, only one active at a time
- Queue system for lower-priority strategies
- Abort-and-resume behavior if high ROI arbitrage appears

### 🎛️ Runtime Tuning
- Adjustable thresholds for:
  - ROI advantage
  - Execution reliability
  - Switching debounce timing

---

## 2. Campaign Dispatcher & De-Duplication

### 🧠 Campaign Deduplication Logic
- Compute unique `campaignId = hash(assetPair + priceWindow + route)`
- Use `Campaign Oracle` as global registry:
  - If id exists → skip creation
  - If id absent → publish
- Enforced through shared data layer (e.g., Redis, S3, gossip layer, or simple contract)

### ⚔️ 抢单 vs 分发机制
- **抢单型（抢最快执行者）**：适合短时机会，拼速度；需做冲突控制
- **分发型（指定节点/信誉匹配）**：基于 reputation 或资金接入量
- 可组合策略：抢单先执行、信誉不足时 fallback 给备选节点

---

## 3. Execution Layer

### ⚡ Arbitrage Module
- Handles CEX-CEX, DEX-CEX, cross-chain paths
- Slippage control, fee estimation, fallback route
- Retry on partial execution with gas / retry budget

### 💰 Capital Allocator
- Capital pool slicing (e.g., 70% MM / 20% Arb / 10% idle buffer)
- Rebalancer adjusts allocation based on market score
- Execution is capital-capped per strategy

### 🛡️ Safety Rules
- Cooldown interval after failed run
- Max retries per minute per pair
- Circuit breaker if slippage or PnL deviates beyond bound

---

## 4. Recording Oracle
- Logs strategy traces: timestamp, tx, trade detail, source
- Offloads to IPFS/S3
- Provides signed Merkle root / receipt hash to reputation oracle

---

## 5. Reputation Oracle

### ✅ Scoring Logic
- Metrics: success rate, avg delay, fail ratio, fraud trace
- Adjusts node score over time
- Can influence:
  - Campaign eligibility
  - Yield share
  - Revoke node from participation

### 🚨 Penalty & Arbitration
- Slashed if execution is falsified or harmful
- Arbitration queue for conflict resolution
- Rewards whistleblowing (fraud signals from peer validators)

---

## 6. TEE Trust Integration
- Enforce attestation at runtime
- Verify TDX/SGX report and match quote
- Only verified quote IDs allowed to publish or execute campaign
- Reputation Oracle cross-validates attestation freshness

---

## 7. User Layer Abstraction
- Users only see: `Deposit`, `Withdraw`, `Earn` interfaces
- No need to understand arbitrage or strategy type
- Earnings distributed based on:
  - Capital share
  - Active risk weight (e.g. longer lock-in, higher cut)
- Risk dashboard (API or UI):
  - Current capital allocation
  - Historical volatility
  - SLA metrics and execution stats

---

## 8. Integrity & Abuse Prevention

### 🔐 Campaign Abuse Protection
- Rate-limit campaign creation per strategy ID
- Global registry used as gatekeeper
- Penalty score if task repeated without economic change

### ⚔️ Execution Conflict Guard
- Lock trade pair within block timestamp
- First-success wins: later executions discarded
- Optionally settle in shared pool (if parallelism desired)

### 🧼 Duplicate Execution Filter
- Execution log hashed
- Duplicate tx hash filtered or penalized

### 📡 SLA / Node Health
- Availability ping records
- Avg execution delay / uptime
- Health score reflected in campaign eligibility

---

## 9. Extensibility: Plugins + Ecosystem

- Plugin interface for:
  - Liquidation bot
  - Insurance underwriter
  - MEV sniping
- Chain adapter standardization (EVM, UTXO, Move)
- Campaign Oracle supports multi-chain broadcasting
- Execution layer accepts external bot registration with quote proof

---

## 🌀 Future Work
- Campaign schema formalization
- On-chain attestation and ZK archive proofs
- User dashboard frontend (TVL + risk exposure)
- Multi-party campaign delegation + split execution

