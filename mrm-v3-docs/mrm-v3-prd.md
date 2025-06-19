
```mermaid
graph TD
  subgraph 用户
    U1[用户 Mixin 钱包]
    U2[用户链上钱包<br/>(ETH, TRX, SOL...)]
  end

  subgraph 系统入口
    M1[Mixin Bot 钱包]
    A1[派生链地址池<br/>(ETH, TRX, SOL...) ]
  end

  subgraph 核心逻辑
    C1[入金监听器]
    C2[资金路由与聚合器]
    C3[自动转移引擎<br/>（转账至 CEX）]
    C4[做市策略执行器]
    C5[用户赎回 & 出金模块]
  end

  subgraph CEX 端
    X1[Binance 钱包]
    X2[OKX 钱包]
  end

  %% 入金路径
  U1 --> M1
  U2 --> A1

  M1 --> C1
  A1 --> C1

  C1 --> C2
  C2 --> C3
  C3 --> X1
  C3 --> X2

  X1 --> C4
  X2 --> C4

  C4 --> C5
  C5 --> M1
  C5 --> A1
```