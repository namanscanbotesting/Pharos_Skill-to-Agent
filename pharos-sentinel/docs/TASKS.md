# Pharos Sentinel - Task Breakdown & Implementation Plan

## Overview

This document provides a detailed task breakdown for implementing Pharos Sentinel across both hackathon phases. Tasks are organized by team tracks with clear dependencies, timelines, and deliverables.

---

## Team Structure & Tracks

```
┌─────────────────────────────────────────────────────────────┐
│                    PROJECT LEAD                             │
│  - Overall architecture oversight                           │
│  - Cross-track coordination                                 │
│  - Demo video production                                    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  TRACK A      │   │  TRACK B      │   │  TRACK C      │
│Infrastructure │   │  Intelligence │   │    Action     │
│               │   │               │   │               │
│• ChainWatch   │   │• RiskScore    │   │• SwapExecutor │
│• MemoryStore  │   │• ReportWriter │   │• SimulationG. │
└───────────────┘   └───────────────┘   └───────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │  TRACK D      │
                    │  Interaction  │
                    │               │
                    │• SocialBroad. │
                    │• AlertDispatch│
                    └───────────────┘
```

---

## Phase 1 Timeline (June 8-16)

### Week 1: Foundation (June 8-12)

#### Track A: Infrastructure

**Task A1.1: Project Setup** ⬜
- [ ] Initialize monorepo structure
- [ ] Configure TypeScript (tsconfig.json)
- [ ] Set up path aliases (@skills/*, @agent/*, @shared/*)
- [ ] Install dependencies (ethers, zod, axios, openai)
- [ ] Create base Skill interface in shared/types.ts
- [ ] Set up build pipeline (npm run build)
- **Estimated**: 4 hours
- **Dependencies**: None
- **Deliverable**: Working project structure with type checking

**Task A1.2: ChainWatch Core** ⬜
- [ ] Implement WebSocket provider connection
- [ ] Build block scanner logic
- [ ] Create event type detection (transfer, swap, stake, approval)
- [ ] Implement event filtering by wallet address
- [ ] Add input validation with Zod schema
- [ ] Write unit tests for event detection
- **Estimated**: 8 hours
- **Dependencies**: A1.1
- **Deliverable**: Functional ChainWatch skill

**Task A1.3: MemoryStore Implementation** ⬜
- [ ] Create in-memory storage backend
- [ ] Implement CRUD operations (get/set/delete/append)
- [ ] Add timestamp tracking
- [ ] Build helper methods (saveDecision, getAgentState)
- [ ] Write unit tests for all operations
- **Estimated**: 6 hours
- **Dependencies**: A1.1
- **Deliverable**: Functional MemoryStore skill

---

#### Track B: Intelligence

**Task B1.1: RiskScore Algorithm** ⬜
- [ ] Implement volatility calculation (standard deviation)
- [ ] Build concentration calculator (Herfindahl-Hirschman Index)
- [ ] Create liquidity scoring system
- [ ] Design weighted aggregation (40/35/25)
- [ ] Implement risk level classification (LOW/MEDIUM/HIGH/CRITICAL)
- [ ] Build recommendation generator
- **Estimated**: 10 hours
- **Dependencies**: A1.1 (for types)
- **Deliverable**: Functional RiskScore skill with accurate calculations

**Task B1.2: ReportWriter Template Engine** ⬜
- [ ] Create fallback template system (no LLM)
- [ ] Design markdown output format
- [ ] Implement event summarization logic
- [ ] Build highlights extraction
- [ ] Add persona-based language variations
- **Estimated**: 6 hours
- **Dependencies**: A1.1
- **Deliverable**: Working template-based report generator

**Task B1.3: ReportWriter LLM Integration** ⬜
- [ ] Integrate OpenAI API client
- [ ] Design prompt templates for each persona
- [ ] Implement JSON response parsing
- [ ] Add error handling for API failures
- [ ] Create fallback to templates on API error
- **Estimated**: 6 hours
- **Dependencies**: B1.2
- **Deliverable**: AI-powered report generation with fallback

---

#### Track C: Action

**Task C1.1: SimulationGuard Safety Pipeline** ⬜
- [ ] Implement basic transaction validation
- [ ] Build gas estimation logic
- [ ] Create eth_call simulation wrapper
- [ ] Design price impact analyzer (mock for demo)
- [ ] Implement balance sufficiency check
- [ ] Add contract verification (getCode)
- [ ] Aggregate safety signals into single decision
- **Estimated**: 12 hours
- **Dependencies**: A1.1
- **Priority**: CRITICAL - blocks autonomous features
- **Deliverable**: Comprehensive transaction safety checker

**Task C1.2: SwapExecutor Core** ⬜
- [ ] Integrate ERC20 ABI for token interactions
- [ ] Implement DEX router interface
- [ ] Build allowance checking logic
- [ ] Create approval transaction flow
- [ ] Implement swap transaction building
- [ ] Add slippage calculation
- [ ] Handle transaction confirmation
- **Estimated**: 10 hours
- **Dependencies**: C1.1 (for safety checks)
- **Deliverable**: End-to-end swap execution with safety

---

#### Track D: Interaction

**Task D1.1: AlertDispatch Rule Engine** ⬜
- [ ] Implement rule parser (metric, operator, value, channel)
- [ ] Build comparison engine (>, <, >=, <=, ==)
- [ ] Create rule evaluation loop
- [ ] Add support for multiple simultaneous rules
- **Estimated**: 6 hours
- **Dependencies**: A1.1
- **Deliverable**: Functional rule evaluation system

**Task D1.2: AlertDispatch Channel Integrations** ⬜
- [ ] Implement Telegram bot API integration
- [ ] Build Discord webhook formatter
- [ ] Create generic webhook POST handler
- [ ] Add message formatting per channel
- [ ] Implement retry logic for failed sends
- **Estimated**: 8 hours
- **Dependencies**: D1.1
- **Deliverable**: Multi-channel notification system

**Task D1.3: SocialBroadcast Implementation** ⬜
- [ ] Design message formatter (token mentions, tx refs)
- [ ] Implement signature validation stub
- [ ] Build Pharos Social API client
- [ ] Create post URL generator
- [ ] Add character limit enforcement
- **Estimated**: 6 hours
- **Dependencies**: A1.1
- **Deliverable**: Working social feed poster

---

### Week 2: Polish & Submission (June 13-16)

#### All Tracks

**Task P1: Individual Skill Testing** ⬜
- [ ] Write comprehensive unit tests for each skill
- [ ] Create integration test scenarios
- [ ] Test edge cases and error conditions
- [ ] Document expected inputs/outputs
- **Estimated**: 16 hours (distributed)
- **Dependencies**: All skill implementations
- **Deliverable**: Test suite with >80% coverage

**Task P2: Documentation** ⬜
- [ ] Write README for each skill package
- [ ] Document input/output schemas
- [ ] Create usage examples
- [ ] Record demo GIFs for each skill
- **Estimated**: 12 hours (distributed)
- **Dependencies**: P1
- **Deliverable**: Complete documentation for all 8 skills

**Task P3: DoraHacks Submissions** ⬜
- [ ] Prepare 8 separate submission entries
- [ ] Write compelling descriptions for each skill
- [ ] Upload demo videos
- [ ] Submit before June 16 deadline
- **Estimated**: 8 hours
- **Dependencies**: P2
- **Deliverable**: All 8 skills submitted to DoraHacks

---

## Phase 2 Timeline (June 23 - July 6)

### Week 3: Agent Core Development (June 23-29)

#### Track A+B+C+D: Collaborative

**Task A2.1: Agent Orchestrator** ⬜
- [ ] Design decision matrix (risk → action mapping)
- [ ] Implement monitoring loop with configurable interval
- [ ] Build state management (start/stop/status)
- [ ] Create agent configuration system
- [ ] Integrate all 8 skills into orchestrator
- **Estimated**: 16 hours
- **Dependencies**: All Phase 1 skills complete
- **Deliverable**: Working agent orchestration layer

**Task A2.2: Decision Engine** ⬜
- [ ] Implement risk-based decision logic
- [ ] Create action executor switch (rebalance/alert/report)
- [ ] Build skill invocation coordinator
- [ ] Add decision logging to MemoryStore
- **Estimated**: 10 hours
- **Dependencies**: A2.1
- **Deliverable**: Intelligent decision-making system

**Task A2.3: Auto-Rebalancing Flow** ⬜
- [ ] Design rebalancing strategy (% to rebalance)
- [ ] Integrate SimulationGuard before execution
- [ ] Build conditional swap execution
- [ ] Add social broadcast on successful rebalance
- [ ] Implement abort-on-unsafe logic
- **Estimated**: 12 hours
- **Dependencies**: A2.2, C1.1, C1.2
- **Deliverable**: Safe autonomous rebalancing

**Task A2.4: Alert & Report Automation** ⬜
- [ ] Configure threshold-based alert triggers
- [ ] Automate periodic report generation
- [ ] Add conditional social posting
- [ ] Implement multi-alert deduplication
- **Estimated**: 8 hours
- **Dependencies**: A2.2, D1.2, B1.3
- **Deliverable**: Automated notification system

---

### Week 4: Demo & Final Submission (June 30 - July 6)

**Task F1: Live Demo Dashboard** ⬜
- [ ] Build simple web UI (React or vanilla JS)
- [ ] Display real-time risk score
- [ ] Show recent agent decisions
- [ ] Visualize portfolio composition
- [ ] Add manual trigger buttons for demo
- **Estimated**: 16 hours
- **Dependencies**: A2.1 complete
- **Deliverable**: Interactive demo dashboard

**Task F2: Demo Video Production** ⬜
- [ ] Write demo script showing full flow
- [ ] Record screen capture of agent running
- [ ] Demonstrate risk spike → auto-rebalance flow
- [ ] Show social posts being generated
- [ ] Edit video with narration (3-5 minutes)
- **Estimated**: 12 hours
- **Dependencies**: F1, A2.3
- **Deliverable**: Professional demo video

**Task F3: Integration Testing** ⬜
- [ ] Test complete agent loop end-to-end
- [ ] Verify all skill integrations work together
- [ ] Test error recovery scenarios
- [ ] Run 24-hour stability test
- **Estimated**: 12 hours
- **Dependencies**: All agent features complete
- **Deliverable**: Stable, tested agent

**Task F4: Final Submission** ⬜
- [ ] Prepare DoraHacks Phase 2 entry
- [ ] Write comprehensive project description
- [ ] Link to all Phase 1 submissions
- [ ] Include demo video and dashboard link
- [ ] Submit before July 6 deadline
- **Estimated**: 8 hours
- **Dependencies**: F1, F2, F3
- **Deliverable**: Complete Phase 2 submission

---

## Critical Path Analysis

```
Phase 1 Critical Path:
A1.1 → C1.1 (SimulationGuard) → C1.2 (SwapExecutor) → P1 → P3
         ↓
       B1.1 (RiskScore) ────────┘

Phase 2 Critical Path:
All Phase 1 → A2.1 (Orchestrator) → A2.3 (Auto-Rebalance) → F2 (Demo Video) → F4
```

**Bottleneck**: SimulationGuard (C1.1) - must be completed early as it blocks safe autonomous execution

---

## Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Pharos RPC instability | Medium | High | Implement retry logic, cache results |
| OpenAI API rate limits | Low | Medium | Use template fallback, batch requests |
| Smart contract integration issues | Medium | High | Extensive testing on testnet first |
| Time constraints | High | High | Prioritize core skills, cut nice-to-haves |

### Mitigation Strategies

1. **Daily Standups**: 15-min sync to identify blockers early
2. **Feature Freeze**: June 14 for Phase 1, July 4 for Phase 2
3. **Mock Services**: Have working mocks if real APIs fail
4. **Parallel Development**: Tracks work independently where possible

---

## Definition of Done (DoD)

### For Each Skill (Phase 1)

- [ ] Implements base Skill<TInput, TOutput> interface
- [ ] Has Zod schemas for input validation
- [ ] Returns properly typed SkillResult<T>
- [ ] Includes comprehensive unit tests (>80% coverage)
- [ ] Has README with usage examples
- [ ] Exported singleton instance available
- [ ] Successfully builds without TypeScript errors

### For Agent (Phase 2)

- [ ] All 8 skills integrated and functional
- [ ] Monitoring loop runs stably for 24+ hours
- [ ] Decision logic correctly responds to risk changes
- [ ] Auto-rebalancing includes safety checks
- [ ] State persists across restarts
- [ ] Demo dashboard shows live data
- [ ] Demo video demonstrates full flow

---

## Testing Strategy

### Unit Tests (Jest)

```typescript
// Example: RiskScore test
describe('RiskScoreSkill', () => {
  it('should calculate LOW risk for diversified portfolio', async () => {
    const result = await riskScore.execute({
      holdings: [
        { token: 'PROS', amount: '100', price: 1 },
        { token: 'ETH', amount: '1', price: 100 },
        { token: 'USDC', amount: '100', price: 1 },
      ],
    });
    
    expect(result.success).toBe(true);
    expect(result.data?.riskScore).toBeLessThan(30);
    expect(result.data?.level).toBe('LOW');
  });
});
```

### Integration Tests

```typescript
// Example: Full agent loop test
describe('PharosSentinelAgent', () => {
  it('should detect high risk and trigger alert', async () => {
    const agent = new PharosSentinelAgent({
      watchedWallets: [TEST_WALLET],
      riskThreshold: 50, // Lower for testing
      autoRebalance: false,
    });
    
    await agent.start(1000); // Check every second
    await sleep(5000);
    await agent.stop();
    
    const history = await memoryStore.getDecisionHistory();
    expect(history.some(d => d.action === 'alert')).toBe(true);
  });
});
```

---

## Success Metrics

### Phase 1 (Skills)

- ✅ 8 skills submitted to DoraHacks
- ✅ Each skill has < 100ms execution time
- ✅ >80% test coverage
- ✅ Zero TypeScript errors
- ✅ Comprehensive documentation

### Phase 2 (Agent)

- ✅ Agent runs autonomously for 24+ hours
- ✅ Correctly identifies risk threshold breaches
- ✅ Successfully simulates before executing transactions
- ✅ Posts to social feed on significant events
- ✅ Demo video clearly shows value proposition
- ✅ Top 10 finish in Agent Arena

---

## Resource Requirements

### Development Environment

- Node.js 18+ installed
- Code editor (VS Code recommended)
- Git for version control
- Access to Pharos testnet RPC
- OpenAI API key (optional but recommended)
- Telegram bot token (for alert testing)

### Infrastructure

- GitHub repository for code hosting
- Vercel/Netlify for demo dashboard hosting
- YouTube/unlisted video for demo
- DoraHacks accounts for submissions

---

## Communication Plan

### Daily Sync (15 min)

**Time**: 10:00 AM UTC
**Attendees**: All track leads
**Agenda**:
1. What did you complete yesterday?
2. What will you work on today?
3. Any blockers?

### Weekly Review (1 hour)

**Day**: Every Sunday
**Agenda**:
1. Review week's progress against plan
2. Adjust next week's priorities
3. Demo completed features

### Tools

- **Code**: GitHub
- **Chat**: Telegram/Discord
- **Docs**: This repository
- **Tasks**: GitHub Projects or Notion

---

## Appendix: Skill Dependency Matrix

```
                    ChainWatch  RiskScore  SimGuard  SwapExec  Social  Report  Alert  Memory
ChainWatch          -           -          ✓         -         -       ✓       -      ✓
RiskScore           -           -          -         -         -       ✓       ✓      ✓
SimulationGuard     ✓           -          -         ✓         -       -       -      -
SwapExecutor        -           -          ✓         -         ✓       -       -      ✓
SocialBroadcast     -           -          -         ✓         -       ✓       ✓      ✓
ReportWriter        ✓           ✓          -         -         -       -       -      ✓
AlertDispatch       -           ✓          -         -         -       -       -      ✓
MemoryStore         -           -          -         -         -       -       -      -

✓ = Depends on this skill
```

---

*Last Updated: June 2024*
*Version: 1.0*
*Owner: Pharos Sentinel Team Lead*
