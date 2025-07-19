# Market Making Bot TODO

## Phase 1: Get Market Data
- [ ] Connect to exchange via ccxt
- [ ] WebSocket price feeds
- [ ] Order book depth

## Phase 2: Place Orders
- [ ] Place limit orders
- [ ] Cancel orders fast
- [ ] Track open orders

## Phase 3: Market Making Logic
- [ ] Calculate bid/ask spread
- [ ] Position sizing
- [ ] Inventory management
- [ ] Auto-rebalancing

## Phase 4: Don't Lose Money
- [ ] Max position limits
- [ ] Stop loss
- [ ] Rate limits
- [ ] Error recovery

## Phase 5: Make It Better
- [ ] Multiple trading pairs
- [ ] Performance metrics
- [ ] Backtesting
- [ ] Strategy optimization

## Backend Infrastructure

### Basic Setup
- [ ] Environment config (.env)
- [x] Event system (emittery)
- [ ] Structured logging
- [x] Standard API response format

### Data & Storage
- [ ] SQLite for trade history
- [ ] Redis for price cache
- [ ] Config persistence

### API Routes
- [ ] Health check endpoint
- [ ] Strategy control (start/stop)
- [ ] Position status
- [ ] P&L reporting
- [ ] Settings management

### Security (Important)
- [ ] API key management
- [ ] Basic auth for admin
- [ ] Request validation
- [ ] Rate limiting

### Monitoring
- [ ] Performance metrics API
- [ ] Trade logs endpoint
- [ ] System alerts
- [ ] Error tracking

### Advanced Features
- [ ] Multi-strategy support
- [ ] Webhook notifications
- [ ] Data export (CSV/JSON)
- [ ] Strategy backtesting API

### Production Ready
- [ ] Process management
- [ ] Graceful shutdown
- [ ] Database migrations
- [ ] API documentation
- [ ] Docker setup
- [ ] Monitoring (Prometheus/Grafana)