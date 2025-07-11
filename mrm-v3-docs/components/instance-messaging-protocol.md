# MRM Instance Messaging Protocol (IMP)

## Overview

The MRM Instance Messaging Protocol enables decentralized instances to report their metrics and status without relying on centralized servers. Instances broadcast signed metrics via Mixin Network transactions, which are then collected and verified by indexers to display on the leaderboard.

## Core Concept

Instances report metrics via Mixin transactions with signed data in the memo field. This approach leverages Mixin's free and fast transactions while ensuring data authenticity through cryptographic signatures.

## 1. Protocol Specification

### Message Format

```typescript
// Each metrics report contains:
interface MetricsReport {
  magic: "MRM1"           // 4 bytes identifier
  timestamp: number       // 4 bytes (unix timestamp)
  instanceId: string      // 16 bytes (unique instance identifier)
  tvl: number            // 4 bytes (Total Value Locked in dollars)
  volume24h: number      // 4 bytes (24-hour volume in dollars)
  signature: Buffer      // 64 bytes (Ed25519 signature for authenticity)
  // Total: ~100 bytes (fits in 200 byte memo limit)
}
```

### Binary Encoding

```typescript
// Encode metrics to binary format for space efficiency
function encodeMetrics(metrics: MetricsReport): Buffer {
  const buffer = Buffer.alloc(100);

  // Magic bytes
  buffer.write('MRM1', 0, 4, 'ascii');

  // Timestamp
  buffer.writeUInt32BE(metrics.timestamp, 4);

  // Instance ID (16 bytes)
  Buffer.from(metrics.instanceId, 'hex').copy(buffer, 8);

  // TVL in dollars (max ~$4.2B with uint32)
  buffer.writeUInt32BE(metrics.tvl, 24);

  // 24h Volume in dollars
  buffer.writeUInt32BE(metrics.volume24h, 28);

  // Signature (64 bytes)
  metrics.signature.copy(buffer, 32);

  return buffer;
}
```

## 2. Instance Setup

### Key Generation

```typescript
// 1. Generate two separate keypairs
const tradingKey = generateKeyPair();  // For fund management
const metricsKey = generateKeyPair();  // For metrics reporting

// 2. Store keys securely
saveToEnv({
  TRADING_PRIVATE_KEY: tradingKey.privateKey,
  METRICS_PRIVATE_KEY: metricsKey.privateKey,
  INSTANCE_ID: generateInstanceId()
});
```

### Registration

```typescript
// Register instance on Solana contract
await contract.registerInstance({
  instanceId: "instance-001",
  metricsPublicKey: metricsKey.publicKey,
  adminAddress: adminWallet.publicKey
});
```

### Metrics Broadcasting

```typescript
// Send metrics every 5 minutes
async function broadcastMetrics() {
  const metrics = {
    magic: 'MRM1',
    timestamp: Math.floor(Date.now() / 1000),
    instanceId: INSTANCE_ID,
    tvl: await calculateTVL(),
    volume24h: await calculate24hVolume()
  };

  // Sign the metrics
  const dataToSign = encodeMetricsForSigning(metrics);
  const signature = ed25519.sign(dataToSign, METRICS_PRIVATE_KEY);

  // Add signature to metrics
  metrics.signature = signature;

  // Send via Mixin transaction
  await mixin.transfer({
    asset_id: 'c94ac88f-4671-3976-b60a-09064f1811e8', // XIN
    amount: '0.00000001',  // Dust amount
    opponent_id: METRICS_COLLECTION_ADDRESS,
    memo: encodeMetrics(metrics).toString('hex'),
    trace_id: uuid.v4()
  });
}

// Run every 5 minutes
setInterval(broadcastMetrics, 5 * 60 * 1000);
```

## 3. Indexer Implementation

### Scanning Strategy

```typescript
class MetricsIndexer {
  private registeredInstances: Map<string, string>; // instanceId -> publicKey

  async initialize() {
    // Load registered instances from Solana
    const instances = await contract.getRegisteredInstances();
    this.registeredInstances = new Map(
      instances.map(i => [i.instanceId, i.metricsPublicKey])
    );
  }

  async scanMetrics() {
    // Get recent transactions
    const transactions = await mixin.getNetworkTransactions({
      asset: 'c94ac88f-4671-3976-b60a-09064f1811e8', // XIN
      limit: 1000,
      order: 'DESC'
    });

    // Filter and verify metrics transactions
    for (const tx of transactions) {
      if (this.isMetricsTransaction(tx)) {
        const metrics = this.decodeAndVerify(tx.memo);
        if (metrics) {
          await this.updateLeaderboard(metrics);
        }
      }
    }
  }

  private isMetricsTransaction(tx: Transaction): boolean {
    return (
      tx.amount === '0.00000001' &&
      tx.memo?.length === 200 && // 100 bytes in hex
      tx.memo.startsWith('4d524d31') // 'MRM1' in hex
    );
  }

  private decodeAndVerify(hexMemo: string): MetricsReport | null {
    const buffer = Buffer.from(hexMemo, 'hex');

    // Decode fields
    const metrics = {
      magic: buffer.toString('ascii', 0, 4),
      timestamp: buffer.readUInt32BE(4),
      instanceId: buffer.toString('hex', 8, 24),
      tvl: buffer.readUInt32BE(24),
      volume24h: buffer.readUInt32BE(28),
      signature: buffer.slice(32, 96)
    };

    // Verify signature
    const publicKey = this.registeredInstances.get(metrics.instanceId);
    if (!publicKey) return null;

    const dataToVerify = buffer.slice(0, 32); // Everything except signature
    const isValid = ed25519.verify(
      metrics.signature,
      dataToVerify,
      Buffer.from(publicKey, 'hex')
    );

    // Check timestamp (prevent replay attacks)
    const now = Math.floor(Date.now() / 1000);
    const age = now - metrics.timestamp;
    if (age > 300 || age < 0) return null; // Must be within 5 minutes

    return isValid ? metrics : null;
  }
}
```

## 4. Security Features

### Signature Verification

- Each metrics report is signed with the instance's private key
- Only instances with registered public keys can submit valid reports
- Signatures prevent tampering and ensure authenticity

### Replay Protection

- Timestamp must be recent (within 5 minutes)
- Indexer tracks processed transactions to prevent duplicates
- Each transaction has unique trace_id

### Registration Control

- Instances must register on Solana contract first
- Registration requires admin approval or stake
- Public keys are immutable once registered

## 5. Implementation Flow

1. **Instance Deployment**
   
   - Generate keypairs (trading + metrics)
   - Register on Solana contract
   - Start metrics broadcasting loop

2. **Metrics Collection**
   
   - Calculate current TVL and volume
   - Create timestamped metrics object
   - Sign with metrics private key
   - Send via Mixin transaction

3. **Indexer Operation**
   
   - Load registered instances from Solana
   - Scan Mixin transactions continuously
   - Verify signatures and timestamps
   - Update leaderboard database
   - Serve data via REST API

## 6. Cost Analysis

- **Per metrics update**: 0.00000001 XIN (~$0.000001)
- **Updates per day**: 288 (every 5 minutes)
- **Monthly cost per instance**: ~$0.00864
- **For 1000 instances**: ~$8.64/month total

## 7. Future Enhancements

- **Compression**: Use bit-packing for even smaller messages
- **Batch Updates**: Multiple instances share one transaction
- **Extended Metrics**: Strategy performance, risk metrics
- **TEE Integration**: Additional signature from secure enclave