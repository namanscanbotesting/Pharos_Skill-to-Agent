# 📋 Task Breakdown: PHAROS SENTINEL

This document divides the project into **independent, parallelizable tasks** suitable for a team of 4-6 developers. Each task is scoped to be completed within the Phase 1 timeline (June 8–15).

---

## 👥 Team Structure & Tracks

| Track | Focus Area | Skills Owned | Recommended Role |
|-------|------------|--------------|------------------|
| **Track A: Infrastructure** | Data Ingestion & State | `ChainWatch`, `MemoryStore` | Backend/Blockchain Dev |
| **Track B: Intelligence** | Logic & AI | `RiskScore`, `ReportWriter` | Data Scientist/ML Eng |
| **Track C: Action** | Transactions & Safety | `SwapExecutor`, `SimulationGuard` | Smart Contract/Security Dev |
| **Track D: Interaction** | Social & Alerts | `SocialBroadcast`, `AlertDispatch` | Full Stack/Integration Dev |
| **Track E: Orchestration** | Agent Core & Demo | Phase 2 Orchestrator, Dashboard | Tech Lead/Frontend Dev |

---

## 🗓 Phase 1 Tasks (Deadline: June 16)

### Track A: Infrastructure

#### Task A1: ChainWatch (Block Event Listener)
- **Goal:** Build a WebSocket listener for Pharos RPC that filters events.
- **Sub-tasks:**
  - [ ] Setup Pharos testnet RPC connection.
  - [ ] Implement WebSocket subscription for `logs` and `transactions`.
  - [ ] Create filter logic for specific wallets and event types (transfer, swap).
  - [ ] Define JSON output schema: `{ event, wallet, token, amount, txHash, timestamp }`.
  - [ ] Write unit tests with mocked block data.
  - [ ] Write integration test against Pharos testnet.
- **Deliverable:** NPM package `@pharos-sentinel/chain-watch` + README.
- **Difficulty:** Medium.

#### Task A2: MemoryStore (Agent State KV)
- **Goal:** Persistent key-value storage for agent state.
- **Sub-tasks:**
  - [ ] Design storage backend (Redis for dev, Pharos on-chain storage for prod).
  - [ ] Implement `get`, `set`, `append` operations.
  - [ ] Add TTL (Time-To-Live) support for temporary data.
  - [ ] Define JSON schema: `{ op, key, value?, ok, lastUpdated }`.
  - [ ] Write tests for concurrency and data integrity.
- **Deliverable:** NPM package `@pharos-sentinel/memory-store` + README.
- **Difficulty:** Low.

---

### Track B: Intelligence

#### Task B1: RiskScore (Portfolio Risk Calculator)
- **Goal:** Calculate a 0-100 risk score based on holdings.
- **Sub-tasks:**
  - [ ] Implement **Volatility Metric**: Standard deviation of asset prices (7-day).
  - [ ] Implement **Concentration Metric**: Herfindahl-Hirschman Index (HHI) for portfolio diversity.
  - [ ] Implement **Liquidity Metric**: Ratio of holding size to daily trading volume.
  - [ ] Combine metrics into weighted score (default: 40% Vol, 40% Conc, 20% Liq).
  - [ ] Generate natural language recommendation (e.g., "Reduce PROS by 20%").
  - [ ] Write tests with historical price data fixtures.
- **Deliverable:** NPM package `@pharos-sentinel/risk-score` + README.
- **Difficulty:** Medium-High (Math heavy).

#### Task B2: ReportWriter (AI Digest Generator)
- **Goal:** Generate human-readable reports from on-chain events using LLM.
- **Sub-tasks:**
  - [ ] Integrate OpenAI API (or local Llama via Ollama).
  - [ ] Design system prompt templates (Conservative, Aggressive, Neutral personas).
  - [ ] Create input formatter: Convert raw events into concise context tokens.
  - [ ] Implement output parser to extract `{ title, summary, highlights, markdown }`.
  - [ ] Add rate limiting and error handling for API calls.
  - [ ] Write tests with mock LLM responses.
- **Deliverable:** NPM package `@pharos-sentinel/report-writer` + README.
- **Difficulty:** Medium.

---

### Track C: Action

#### Task C1: SwapExecutor (On-Chain Transaction)
- **Goal:** Construct, sign, and broadcast DEX swaps on Pharos.
- **Sub-tasks:**
  - [ ] Integrate Pharos DEX Router contract ABI.
  - [ ] Implement transaction builder: `swapExactTokensForTokens`.
  - [ ] Add slippage calculation and deadline logic.
  - [ ] Implement secure key management (env var or local wallet).
  - [ ] Handle gas estimation and dynamic fee adjustment.
  - [ ] Write tests on Pharos testnet (forked mainnet if possible).
- **Deliverable:** NPM package `@pharos-sentinel/swap-executor` + README.
- **Difficulty:** High (Security critical).

#### Task C2: SimulationGuard (Tx Safety Simulator) ⭐ NEW
- **Goal:** Dry-run transactions to prevent losses before execution.
- **Sub-tasks:**
  - [ ] Implement `eth_call` simulation with current state.
  - [ ] Detect revert reasons and parse error strings.
  - [ ] Estimate gas usage and compare against expected range.
  - [ ] Simulate price impact using pre-swap quote vs post-swap state.
  - [ ] Return safety boolean: `{ safe: bool, reason?: string, estimatedGas }`.
  - [ ] Write tests with known bad transactions (reverts, high slippage).
- **Deliverable:** NPM package `@pharos-sentinel/simulation-guard` + README.
- **Difficulty:** High (Security critical).

---

### Track D: Interaction

#### Task D1: SocialBroadcast (Pharos Social Poster)
- **Goal:** Post messages to Pharos on-chain social layer.
- **Sub-tasks:**
  - [ ] Integrate Pharos Social API/Contract.
  - [ ] Implement message formatting (text, tags, tx hash attachments).
  - [ ] Handle character limits and media encoding if applicable.
  - [ ] Return post ID and URL.
  - [ ] Write tests against Pharos social testnet.
- **Deliverable:** NPM package `@pharos-sentinel/social-broadcast` + README.
- **Difficulty:** Medium.

#### Task D2: AlertDispatch (Threshold Notifier)
- **Goal:** Send notifications via Telegram/Discord/Webhook.
- **Sub-tasks:**
  - [ ] Implement rule engine: `{ metric, operator, value, channel }`.
  - [ ] Integrate Telegram Bot API.
  - [ ] Integrate Discord Webhook API.
  - [ ] Add deduplication logic (don't spam same alert).
  - [ ] Write tests with mock webhook servers.
- **Deliverable:** NPM package `@pharos-sentinel/alert-dispatch` + README.
- **Difficulty:** Low-Medium.

---

## 🚀 Phase 2 Tasks (Deadline: July 6)

### Track E: Orchestration & Demo

#### Task E1: Sentinel Orchestrator
- **Goal:** Combine all 8 skills into a running agent loop.
- **Sub-tasks:**
  - [ ] Build event-driven loop (triggered by `ChainWatch`).
  - [ ] Implement decision tree: If Risk > X → Simulate → Execute.
  - [ ] Add configuration file for user preferences (thresholds, wallets).
  - [ ] Integrate `MemoryStore` for state persistence across restarts.
  - [ ] Deploy as Docker container on cloud provider (AWS/GCP/Railway).
- **Deliverable:** Running agent on Pharos testnet.

#### Task E2: Live Dashboard
- **Goal:** React UI showing agent activity in real-time.
- **Sub-tasks:**
  - [ ] Setup Next.js project.
  - [ ] Create components: Risk Gauge, Recent Events Log, Social Feed.
  - [ ] Connect to agent backend via WebSocket/REST.
  - [ ] Add "Manual Trigger" button for demo purposes.
  - [ ] Deploy to Vercel/Netlify.
- **Deliverable:** Public URL for judges to interact with.

#### Task E3: Demo Video & Documentation
- **Goal:** Create compelling submission materials.
- **Sub-tasks:**
  - [ ] Record 3-minute demo video (Risk spike → Auto-swap → Social post).
  - [ ] Write comprehensive README with architecture diagrams.
  - [ ] Create "How to Reuse" guide for each skill.
  - [ ] Submit to DoraHacks (Phase 1) and Agent Arena (Phase 2).

---

## ✅ Definition of Done (Per Skill)
Each Phase 1 skill must have:
1.  **Source Code:** TypeScript, strictly typed.
2.  **Tests:** >90% coverage, including edge cases.
3.  **README:** Installation, Usage Example, Input/Output Schema.
4.  **NPM Package:** Published to npmjs or GitHub Packages.
5.  **DoraHacks Submission:** Separate entry for each skill.

---

## 🆘 Risk Mitigation
| Risk | Impact | Mitigation |
|------|--------|------------|
| Pharos Testnet Instability | High | Build mock RPC server for offline development; fallback to local hardhat node. |
| LLM API Costs/Limits | Medium | Cache responses; use smaller models for testing; implement retry logic. |
| Private Key Security | Critical | Never commit keys; use environment variables; implement "Dry Run Only" mode by default. |
| Timeline Overrun | High | Prioritize Skills #1, #2, #6, #7 (off-chain) first; defer complex on-chain skills if needed. |

---

## 📞 Communication Plan
- **Daily Standup:** 15 mins sync on progress/blockers.
- **GitHub Projects:** Track tasks in Kanban board.
- **Discord Channel:** Dedicated internal channel for rapid Q&A.
- **Code Review:** All PRs require approval from Track Lead before merge.
