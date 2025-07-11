# V3-design-doc

## Components

### 1. Node.js backend

Tech stack:

- Fastify (Simple, Lean, Can be deployed anywhere: serverless/docker/server)
- Sqlite (File based, No server needed)

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

Usage:

- Accept funds from Mixin users
- Whitelist (Prevent rug pull)

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

我大概总结一下我们需要解决的问题：

1. 做一个从私钥派生地址，并支持基本操作的SDK，并且在V3里使用这个SDK
2. 分析V2版本已经实现的完整做市，套利，与交易所交互，等各种操作流程，将其结合到V3版本中
3. 实现与Mixin的整合，包括现货交易等，需要设计和实现Mixin与派生地址和交易所之间的资金池功能
4. 实现借贷功能，即用户通过将资产投入我们的程序，程序就可以去选定的交易所放贷，赚取活期或定期收益，扣除成本和利润后回流给用户
5. 结合TDX/SGX 等 TEE 环境，做可信验证 attestation API，让所有人都能知道运行在安全的环境里，Instance 是可信的，实现去信任化部署，任何人都可以运行一个实例
6. 整合HuFi的功能，实现加入campaign等 V2已经实现的功能，可从已有代码复制过来，再加上分配campagin reward功能
7. 一键部署脚本，简化部署流程，扩大可能存在的部署者覆盖面

重点功能：

1. 去中心化做市，能让任何项目方自由的使用产品做市
   
   - 做市引擎，做市策略系统
   - Dashboard，公开参数竞争

2. 安全，一切公开透明可验证
   
   - 链上合约开放数据和状态

3. 去中心化交易，能让任何人自由的交易任何币种
   
   - 内建DEX
   - 使用派生地址，让门槛为零

---

## RoadMap

Update Todos:
  ⎿ ☐ Phase 1: Foundation - Set up Node.js backend with Fastify framework                 
     ☐ Phase 1: Foundation - Create address derivation SDK for multi-chain support ('Drxa' as a sperate sdk published on npm)
     ☐ Phase 1: Foundation - Implement basic exchange connector abstraction layer (I doubt if it is done by drxa sdk)
     ☐ Phase 2: Core Trading - Build market making engine with basic strategies (backend)
     ☐ Phase 2: Core Trading - Implement order management and position tracking (backend)
     ☐ Phase 3: Integration - Complete Mixin wallet and trading integration (backend and contract)
     ☐ Phase 3: Integration - Connect UI to backend APIs and smart contract (UI)
     ☐ Phase 2: Core Trading - Create arbitrage detection and execution system (backend)
     ☐ Phase 3: Integration - Enhance Solana contract with history and termination features (contract)
     ☐ Phase 4: Advanced Features - Implement TEE attestation with SGX/TDX (backend)
     ☐ Phase 5: Production - Create deployment automation and Docker setup (script)
     ☐ Phase 5: Production - Build monitoring and analytics dashboard (UI and backend)
     ☐ Phase 4: Advanced Features - Build lending protocol for exchange yield (backend)
     ☐ Phase 4: Advanced Features - Migrate HuFi campaign features from V2 (backend)
     ☐ Phase 5: Production - Implement built-in DEX functionality (contract)

Questions:

1. How the instance leaderboard is going to work with the backend generally? Is the backend going to send a alive message to a centralized server to summerize? or is the backend is going to do contract call? or the backend is going to store some file in IPFS or Arweave? 

2. Should we build a market making strategies SDK and apply it in the backend? so any instance deployer that wants to create new market making strategies can just open a PR in the SDK and apply them to their instance?
- Implementation Priority Matrix
  
  | Component           | Priority    | Complexity | Dependencies    |
  | ------------------- | ----------- | ---------- | --------------- |
  | Backend Setup       | 🔴 Critical | Medium     | None            |
  | Address SDK         | 🔴 Critical | High       | None            |
  | Exchange Connectors | 🔴 Critical | Medium     | Backend         |
  | Market Making       | 🔴 Critical | High       | SDK, Connectors |
  | Mixin Integration   | 🟡 High     | Medium     | SDK             |
  | TEE Attestation     | 🟢 Medium   | Very High  | Backend         |
  | Lending             | 🔵 Low      | Medium     | Trading Engine  |
  | Built-in DEX        | 🔵 Low      | High       | Smart Contracts |
  
  Quick Start Development Path
1. Week 1: Set up backend boilerplate with Fastify
2. Week 2: Implement basic address SDK with Solana support
3. Week 3: Create first exchange connector (Binance)
4. Week 4: Build simple market making strategy
5. Week 5: Connect UI to show live positions
6. Week 6: Add Mixin wallet integration
7. Week 7: Implement basic TEE attestation
8. Week 8: Deploy MVP to testnet
