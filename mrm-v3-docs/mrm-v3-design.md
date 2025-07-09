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
