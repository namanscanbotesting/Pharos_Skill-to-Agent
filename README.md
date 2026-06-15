# 🛡️ PHAROS SENTINEL
### Autonomous On-Chain Intelligence & Risk Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Pharos Hackathon](https://img.shields.io/badge/Hackathon-Skill--to--Agent-blue)](https://dorahacks.io/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()

**PHAROS SENTINEL** is a modular AI agent ecosystem for the Pharos network that autonomously monitors wallets, calculates portfolio risk, executes protective swaps, and broadcasts activity to the social layer. Built as a collection of **8 reusable Skills**, it demonstrates the full power of Pharos: **Payments + Social + Agents**.

---

## 🏆 Why PHAROS SENTINEL?

| Feature | Benefit |
|---------|---------|
| **Autonomous Protection** | 24/7 portfolio monitoring with instant risk mitigation |
| **Composable Skills** | 8 independent modules reusable by any Pharos developer |
| **Safety First** | Built-in transaction simulation prevents costly mistakes |
| **Social Integration** | Auto-posts trading activity to Pharos social feed |
| **AI-Powered Insights** | LLM-generated reports explain complex on-chain actions |

---

## 📦 Phase 1: The 8 Skills

Each skill is a standalone NPM package with full documentation and tests.

### 🔹 Core Skills

| Skill | Description | Input | Output |
|-------|-------------|-------|--------|
| **ChainWatch** | Real-time block event listener | Wallet addresses, event types | Structured event data |
| **RiskScore** | Portfolio risk calculator (0-100) | Token holdings, price history | Risk score + recommendations |
| **SwapExecutor** | Secure DEX transaction builder | Token pair, amount, slippage | Transaction hash |
| **SimulationGuard** ⭐ | Pre-execution safety simulator | Transaction data | Safe/Unsafe verdict |
| **SocialBroadcast** | Pharos social layer poster | Message, tags, tx hash | Post ID + URL |
| **ReportWriter** | AI-generated activity digest | Event history, period | Markdown report |
| **AlertDispatch** | Multi-channel notifier | Rules, current metrics | Alert confirmations |
| **MemoryStore** | Persistent agent state KV | Key, value, operation | Stored data |

---

## 🚀 Quick Start

### Install Individual Skills

```bash
npm install @pharos-sentinel/chain-watch
npm install @pharos-sentinel/risk-score
npm install @pharos-sentinel/swap-executor
npm install @pharos-sentinel/simulation-guard
npm install @pharos-sentinel/social-broadcast
npm install @pharos-sentinel/report-writer
npm install @pharos-sentinel/alert-dispatch
npm install @pharos-sentinel/memory-store
```

### Example: Calculate Portfolio Risk

```typescript
import { RiskScore } from '@pharos-sentinel/risk-score';

const holdings = [
  { token: 'PROS', amount: 1000, price: 2.5 },
  { token: 'ETH', amount: 0.5, price: 3000 }
];

const result = await RiskScore.calculate({ holdings, priceHistory: [...] });
console.log(`Risk Score: ${result.score}/100 - ${result.level}`);
// Output: Risk Score: 72/100 - HIGH
// Recommendation: Reduce PROS exposure by 20%
```

### Example: Safe Swap Execution

```typescript
import { SwapExecutor } from '@pharos-sentinel/swap-executor';
import { SimulationGuard } from '@pharos-sentinel/simulation-guard';

const txData = {
  fromToken: 'PROS',
  toToken: 'USDC',
  amountIn: 500,
  slippageBps: 50,
  walletKey: process.env.PRIVATE_KEY
};

// ALWAYS simulate before executing
const simulation = await SimulationGuard.verify(txData);
if (simulation.safe) {
  const result = await SwapExecutor.execute(txData);
  console.log(`Swap confirmed: ${result.txHash}`);
} else {
  console.error(`Transaction blocked: ${simulation.reason}`);
}
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PHAROS SENTINEL AGENT                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Chain    │───▶│ Risk     │───▶│ Decision │              │
│  │ Watch    │    │ Score    │    │ Engine   │              │
│  └──────────┘    └──────────┘    └────┬─────┘              │
│                                       │                     │
│              ┌────────────────────────┼─────────────────┐  │
│              ▼                        ▼                 ▼  │
│       ┌─────────────┐         ┌─────────────┐   ┌──────────┐│
│       │ Simulation  │         │ Swap        │   │ Social   ││
│       │ Guard       │────────▶│ Executor    │   │ Broadcast││
│       └─────────────┘         └─────────────┘   └──────────┘│
│              │                        │                 │   │
│              ▼                        ▼                 ▼   │
│       ┌─────────────┐         ┌─────────────┐   ┌──────────┐│
│       │ Memory      │         │ Alert       │   │ Report   ││
│       │ Store       │         │ Dispatch    │   │ Writer   ││
│       └─────────────┘         └─────────────┘   └──────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Use Cases

### For DeFi Users
- **Auto-Rebalancing:** Automatically reduce exposure when risk thresholds are breached
- **Real-Time Alerts:** Get notified via Telegram/Discord when portfolio health declines
- **Social Sharing:** Share successful trades and strategies with the community

### For Developers
- **Reusable Components:** Drop any skill into your own Pharos agent
- **Type-Safe APIs:** Full TypeScript support with documented schemas
- **Test Coverage:** Each skill includes comprehensive unit and integration tests

### For the Pharos Ecosystem
- **Demonstrates Capabilities:** Showcases payments, social, and agents in one project
- **Drives Adoption:** Lowers barrier to entry for new agent builders
- **Security Best Practices:** Sets standard for safe autonomous transactions

---

## 📅 Hackathon Timeline

| Phase | Dates | Deliverables |
|-------|-------|--------------|
| **Phase 1: Skills** | June 8-16 | 8 independent skill modules submitted to DoraHacks |
| **Phase 2: Agent** | June 23-July 6 | Fully autonomous Sentinel Agent + Live Dashboard |
| **Judging** | July 6-24 | Demo video, documentation, live testnet deployment |

---

## 🧪 Testing

Run all tests:

```bash
npm run test
```

Run tests for specific skill:

```bash
npm run test --workspace=@pharos-sentinel/risk-score
```

Integration tests require Pharos testnet RPC:

```bash
export PHAROS_RPC_URL=https://testnet.pharos.network
npm run test:integration
```

---

## 📚 Documentation

- **[Architecture Details](./ARCHITECTURE.md)** - High-level design and data flow
- **[Task Breakdown](./TASKS.md)** - Development tasks and team structure
- **[Skill API Reference](./docs/api-reference.md)** - Complete API documentation
- **[Deployment Guide](./docs/deployment.md)** - How to deploy your own Sentinel

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Tracks
Looking to contribute? Join one of our tracks:
- **Infrastructure:** ChainWatch, MemoryStore
- **Intelligence:** RiskScore, ReportWriter  
- **Action:** SwapExecutor, SimulationGuard
- **Interaction:** SocialBroadcast, AlertDispatch

---

## 🏆 Team

Built by [Your Team Name] for the **Pharos Skill-to-Agent Dual Cascade Hackathon**.

- 👨‍💻 [Team Member 1] - Infrastructure Lead
- 👨‍💻 [Team Member 2] - Intelligence Lead
- 👨‍💻 [Team Member 3] - Action & Security Lead
- 👨‍💻 [Team Member 4] - Interaction Lead

---

## 📞 Contact

- **Telegram:** [Join Developer Group](https://t.me/+U27f5oGnJNlkZTI0)
- **Discord:** [Pharos Community](https://discord.com/invite/pharos)
- **Documentation:** [Pharos Docs](https://docs.pharosnetwork.xyz/)
- **Twitter:** [@Pharos_Network](https://x.com/Pharos_Network)

---

## ⚠️ Disclaimer

This software is for educational purposes and hackathon submission only. 
**DO NOT use in production with real funds without thorough security audit.**
Autonomous trading agents carry significant risk of financial loss.

---

## 📄 License

MIT © 2024 PHAROS SENTINEL Team

---

<div align="center">

**Built with ❤️ for the Pharos Ecosystem**

[Hackathon Submission](https://dorahacks.io/hackathon/pharos) | [Live Demo](#) | [Video Demo](#)

</div>
