# V3-design-doc

## Components

### 1. Node.js backend

Tech stack:

- Fastify (Simple, Lean, Can be deployed anywhere: serverless/docker/server)
- Prisma ORM & Sqlite (File based, No server needed)

Usage: 

- Startegy execution
- Funds allocation
- Address management
- TEE attesation
- Network detection

Details:

- [ ] Startegies: Market making, arbitrage strategies SDK
- [ ] Funds: Access control, whitelist
- [ ] Address management: SDK, private key management
- [ ] TEE attesation: Endpoints, Attestation report
- [ ] Network detection: Register or send ping to central server/dashboard
- [ ] Lending: Lend to exchanges

---

### 2. Solana Rust smart contract

Tech stack:

- Anchor

Components:
1. MVM Funds allocator
2. Registry contract

Usage:

- Accept funds from Mixin users
- Whitelist (Prevent rug pull)
- Register all the instance on first boot, so leaderboard get to trace them

Details:

- [ ] Deposit fund
- [ ] Withdraw fund
- [ ] Record fund history
- [ ] Admin management
- [ ] Termination (Incident Response)

---

### 3. UI

Tech stack:

- Svelte 5
- Shadcn svelte

Usage:

- UI (create, deposit, withdraw, remove)
- Leaderboard UI (compare instances by metrics)
- Instance deployer (easy setup after deployment)

Details:

- [ ] User related UI
- [ ] Trading, Market making
- [ ] Leaderboard UI
- [ ] Deployer Setup UI
- [ ] Deployer management UI

---

## RoadMap

### Development Phases

#### Phase 1: Foundation ⚡ **Current Phase**
  ☐ Set up Node.js backend with Fastify framework
  ☐ Create address derivation SDK ('Drxa' SDK) for multi-chain support
  ☐ Implement basic exchange connector abstraction layer
  ☐ Set up database schema with SQLite
  ☐ Create basic API endpoints for instance management

#### Phase 2: Core Trading Engine
  ☐ Build market making engine with basic strategies
  ☐ Implement order management and position tracking
  ☐ Create arbitrage detection and execution system
  ☐ Add risk management and position limits
  ☐ Implement strategy backtesting framework

#### Phase 3: Integration & Connectivity
  ☐ Complete Mixin wallet and trading integration
  ☐ Connect UI to backend APIs and smart contracts
  ☐ Enhance Solana contracts with history tracking
  ☐ Implement Instance Messaging Protocol (IMP)
  ☐ Add exchange connectors (Binance, OKX, Bybit)

#### Phase 4: Advanced Features
  ☐ Implement TEE attestation with SGX/TDX/AMD SEV
  ☐ Build lending protocol for exchange yield
  ☐ Migrate HuFi campaign features
  ☐ Add advanced trading strategies
  ☐ Implement cross-exchange arbitrage

#### Phase 5: Production & Scaling
  ☐ Create deployment automation and Docker setup
  ☐ Build monitoring and analytics dashboard
  ☐ Implement built-in DEX functionality
  ☐ Add performance optimization and caching
  ☐ Create comprehensive documentation

### Component Priority Matrix

| Component           | Priority    | Complexity | Status      | Dependencies    |
| ------------------- | ----------- | ---------- | ----------- | --------------- |
| Backend Setup       | 🔴 Critical | Medium     | In Progress | None            |
| Address SDK (Drxa)  | 🔴 Critical | High       | In Progress | None            |
| Exchange Connectors | 🔴 Critical | Medium     | Not Started | Backend         |
| Market Making Engine| 🔴 Critical | High       | Not Started | SDK, Connectors |
| Smart Contracts     | 🔴 Critical | Medium     | In Progress | None            |
| UI/UX               | 🟡 High     | Medium     | In Progress | Backend APIs    |
| Mixin Integration   | 🟡 High     | Medium     | Not Started | SDK             |
| IMP Protocol        | 🟢 Medium   | Medium     | Not Started | Backend         |
| TEE Attestation     | 🟢 Medium   | High       | Not Started | Backend         |
| Lending Features    | 🔵 Low      | Medium     | Not Started | Trading Engine  |
| Built-in DEX        | 🔵 Low      | High       | Not Started | Smart Contracts |

### MVP Development list

**Foundation**
- ✅ Set up project structure
- ☐ Implement Fastify backend framework
- ☐ Create SQLite database schema
- ☐ Begin Drxa SDK development

**Core Infrastructure**
- ☐ Complete address derivation SDK
- ☐ Implement first exchange connector (Binance)
- ☐ Create basic API endpoints
- ☐ Connect UI to backend

**Trading Engine**
- ☐ Build market making strategy engine
- ☐ Implement order management system
- ☐ Add position tracking and reporting
- ☐ Create live dashboard views

**Integration & Testing**
- ☐ Complete Mixin wallet integration
- ☐ Implement basic TEE attestation
- ☐ Deploy to Solana testnet
- ☐ Conduct integration testing

---

## Design notes
### Rug pull
About making it impossible for rug pull:

Design the incentive system to make it more profitable to contribute to the system than attacking it.

- Limit the amount of money of each instance, add reputation system, allow the capacity grow
- Make it more costly to rug, use staking as one way of the protection
- Monitor as much as possible, make it transparent to the public, so people get to know when rug happens. 
- Add alert and slash system.