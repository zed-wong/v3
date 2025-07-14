# MRM V3 Frontend Components List

This document outlines all the frontend components that need to be built for the MRM V3 platform, organized by feature areas.

## 1. User & Wallet Management Components

### 1.1 Wallet Connection
- **WalletConnector** - Multi-wallet connection interface
  - Mixin wallet integration
  - Solana wallet adapters (Phantom, Solflare, etc.)
  - Wallet selection modal
  - Connection status indicator

### 1.2 Address Management
- **AddressDerivation** - Derive addresses from private key
  - Multi-chain address generation
  - Address display with copy functionality
  - QR code generation
  - Export/Import addresses

- **AddressList** - Display all derived addresses
  - Chain logos and names
  - Copy address buttons
  - Balance display per address
  - Address book functionality

### 1.3 Private Key Management
- **PrivateKeyGenerator** - Generate new private keys
  - Mnemonic phrase display
  - Private key reveal/hide toggle
  - Copy to clipboard
  - Download as encrypted file

- **PrivateKeyImporter** - Import existing keys
  - Support for mnemonic phrases
  - Support for raw private keys
  - Validation and error handling
  - Security warnings

## 2. Trading & Market Making Components

### 2.1 Market Making Dashboard
- **MarketMakerDashboard** - Main trading interface
  - Strategy selection
  - Parameter configuration
  - Real-time P&L display
  - Position overview

### 2.2 Strategy Components
- **StrategySelector** - Choose market making strategies
  - Strategy cards with descriptions
  - Risk level indicators
  - Expected returns display
  - Custom strategy upload

- **StrategyConfigurator** - Configure strategy parameters
  - Dynamic form based on strategy
  - Parameter validation
  - Preset configurations
  - Advanced settings toggle

### 2.3 Order Management
- **OrderBook** - Display current orders
  - Buy/Sell orders table
  - Order status indicators
  - Cancel order buttons
  - Order history tab

- **OrderForm** - Place new orders
  - Market/Limit order toggle
  - Price and quantity inputs
  - Fee estimation
  - Slippage settings

### 2.4 Position Tracking
- **PositionTracker** - Monitor open positions
  - Real-time P&L
  - Position size and leverage
  - Risk metrics
  - Close position actions

- **TradeHistory** - Historical trades view
  - Filterable trade list
  - Export functionality
  - Performance analytics
  - Tax report generation

## 3. Arbitrage Components

### 3.1 Arbitrage Dashboard
- **ArbitrageDashboard** - Monitor arbitrage opportunities
  - Cross-exchange price differences
  - Profitability calculator
  - Auto-execution toggle
  - Historical opportunities

### 3.2 Exchange Integration
- **ExchangeConnector** - Connect to exchanges
  - API key management
  - Exchange status indicators
  - Balance synchronization
  - Rate limit monitoring

- **ExchangeBalances** - Display balances across exchanges
  - Unified balance view
  - Transfer between exchanges
  - Deposit/Withdraw actions
  - Balance history charts

## 4. Fund Management Components

### 4.1 Fund Pool Interface
- **FundPoolDashboard** - Main fund management view
  - Total value locked (TVL)
  - APY/Returns display
  - Participant count
  - Performance charts

### 4.2 Deposit/Withdraw
- **DepositForm** - Add funds to pool
  - Token selection
  - Amount input with balance
  - Fee display
  - Transaction confirmation

- **WithdrawForm** - Remove funds from pool
  - Available balance display
  - Withdrawal limits
  - Lock period indicator
  - Emergency withdrawal option

### 4.3 Fund Analytics
- **FundPerformance** - Performance metrics
  - ROI charts
  - Risk metrics
  - Sharpe ratio
  - Drawdown analysis

- **FundAllocation** - Asset allocation view
  - Pie charts
  - Rebalancing suggestions
  - Historical allocations
  - Strategy breakdown

## 5. Lending Components

### 5.1 Lending Dashboard
- **LendingDashboard** - Overview of lending positions
  - Active loans
  - Interest earned
  - Available liquidity
  - Market rates comparison

### 5.2 Lending Actions
- **LendingForm** - Create new loans
  - Asset selection
  - Term selection (fixed/variable)
  - Rate display
  - Risk indicators

- **LoanManager** - Manage existing loans
  - Early repayment options
  - Rollover functionality
  - Interest claim buttons
  - Loan history

## 6. Leaderboard Components

### 6.1 Instance Leaderboard
- **LeaderboardTable** - Ranking of instances
  - Sortable columns (TVL, returns, volume)
  - Instance details expansion
  - Performance badges
  - Follow/Watch functionality

### 6.2 Metrics Display
- **MetricsCard** - Individual metric displays
  - Real-time updates
  - Trend indicators
  - Comparison tooltips
  - Historical charts

- **InstanceComparison** - Compare instances
  - Side-by-side metrics
  - Performance charts
  - Strategy comparison
  - Risk analysis

## 7. Instance Deployment Components

### 7.1 Deployment Wizard
- **DeploymentWizard** - Step-by-step deployment
  - Environment selection
  - Configuration forms
  - Cost estimation
  - Deployment progress

### 7.2 Configuration
- **InstanceConfigurator** - Configure instance settings
  - Strategy selection
  - Exchange connections
  - Fund limits
  - Access control

- **NetworkSelector** - Choose deployment network
  - Mainnet/Testnet toggle
  - Chain selection
  - RPC endpoint configuration
  - Gas settings

## 8. Instance Management Components

### 8.1 Management Dashboard
- **InstanceDashboard** - Manage deployed instances
  - Instance health status
  - Resource usage
  - Active strategies
  - Quick actions

### 8.2 Monitoring
- **InstanceMonitor** - Real-time monitoring
  - CPU/Memory usage
  - API call metrics
  - Error logs
  - Alert configuration

- **InstanceLogs** - View instance logs
  - Log filtering
  - Real-time streaming
  - Export functionality
  - Search capabilities

## 9. TEE Attestation Components

### 9.1 Attestation Display
- **AttestationBadge** - Trust indicator
  - Verification status
  - Certificate details
  - Last verification time
  - Provider information

- **AttestationReport** - Detailed attestation view
  - Technical details
  - Verification steps
  - Security guarantees
  - Audit trail

## 10. Campaign/HuFi Components

### 10.1 Campaign Management
- **CampaignList** - Browse active campaigns
  - Reward details
  - Participation requirements
  - Time remaining
  - Join buttons

- **CampaignCreator** - Create new campaigns
  - Reward configuration
  - Eligibility criteria
  - Duration settings
  - Budget allocation

### 10.2 Rewards
- **RewardsDashboard** - Track earned rewards
  - Pending rewards
  - Claim history
  - Estimated earnings
  - Leaderboard position

- **RewardClaim** - Claim rewards interface
  - Available rewards
  - Claim buttons
  - Transaction status
  - Distribution history

## 11. Common/Shared Components

### 11.1 Data Display
- **DataTable** - Reusable table component
  - Sorting
  - Pagination
  - Filtering
  - Export

- **Chart** - Flexible charting component
  - Line/Bar/Pie charts
  - Real-time updates
  - Zoom/Pan
  - Custom tooltips

### 11.2 Forms
- **TokenSelector** - Token selection dropdown
  - Search functionality
  - Balance display
  - Logo display
  - Custom token support

- **AmountInput** - Numeric input with validation
  - Max button
  - USD conversion
  - Decimal handling
  - Balance integration

### 11.3 Notifications
- **NotificationCenter** - System notifications
  - Transaction updates
  - Price alerts
  - System messages
  - Settings management

- **TransactionToast** - Transaction status
  - Pending/Success/Failed states
  - Transaction links
  - Retry functionality
  - Error details

### 11.4 Navigation
- **Sidebar** - Main navigation
  - Collapsible menu
  - Active route highlighting
  - Quick actions
  - User profile

- **Breadcrumbs** - Navigation trail
  - Clickable paths
  - Current location
  - Mobile responsive

## 12. Mobile Components

### 12.1 Mobile-Specific
- **MobileNav** - Bottom navigation
  - Tab bar
  - Active indicators
  - Gesture support

- **MobileDrawer** - Slide-out menus
  - Settings access
  - Quick actions
  - Notifications

## Development Priority

### Phase 1 - Core Components (Critical)
1. Wallet Connection
2. Address Management
3. Fund Deposit/Withdraw
4. Basic Dashboard

### Phase 2 - Trading Features
1. Market Making Dashboard
2. Strategy Components
3. Order Management
4. Exchange Integration

### Phase 3 - Advanced Features
1. Lending Components
2. Arbitrage Dashboard
3. Campaign Management
4. TEE Attestation

### Phase 4 - Analytics & Management
1. Leaderboard
2. Instance Management
3. Performance Analytics
4. Monitoring Tools

## Component Development Guidelines

1. **TypeScript** - All components must be fully typed
2. **Accessibility** - WCAG 2.1 AA compliance
3. **Responsive** - Mobile-first design approach
4. **Testing** - Unit tests for all components
5. **Documentation** - Storybook stories for each component
6. **Performance** - Lazy loading for heavy components
7. **Internationalization** - All text must support i18n