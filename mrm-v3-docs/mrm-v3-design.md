# V3-design-doc

## Components

### 1. Node.js backend

Tech stack:
- Fastify (Simple, Lean, Can be deployed anywhere: serverless/docker/server)

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

