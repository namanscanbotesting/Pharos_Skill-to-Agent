/**
 * Pharos Sentinel - Agent Core Orchestrator
 * Combines all Phase 1 Skills into an autonomous agent loop
 */

import { chainWatch, ChainWatchSkill } from '../skills/chainwatch/index.js';
import { riskScore, RiskScoreSkill } from '../skills/riskscore/index.js';
import { simulationGuard, SimulationGuardSkill } from '../skills/simulationguard/index.js';
import { swapExecutor, SwapExecutorSkill } from '../skills/swapexecutor/index.js';
import { socialBroadcast, SocialBroadcastSkill } from '../skills/socialbroadcast/index.js';
import { reportWriter, ReportWriterSkill } from '../skills/reportwriter/index.js';
import { alertDispatch, AlertDispatchSkill } from '../skills/alertdispatch/index.js';
import { memoryStore, MemoryStoreSkill } from '../skills/memorystore/index.js';

import {
  AgentConfig,
  AgentState,
  AgentDecision,
  ChainWatchEvent,
  RiskScoreOutput,
} from '../shared/types.js';

export class PharosSentinelAgent {
  private config: AgentConfig;
  private state: AgentState;
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  // Skills
  private chainWatch: ChainWatchSkill;
  private riskScore: RiskScoreSkill;
  private simulationGuard: SimulationGuardSkill;
  private swapExecutor: SwapExecutorSkill;
  private socialBroadcast: SocialBroadcastSkill;
  private reportWriter: ReportWriterSkill;
  private alertDispatch: AlertDispatchSkill;
  private memoryStore: MemoryStoreSkill;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      watchedWallets: config.watchedWallets || [],
      riskThreshold: config.riskThreshold || 70,
      autoRebalance: config.autoRebalance ?? true,
      socialPostingEnabled: config.socialPostingEnabled ?? true,
      alertChannels: config.alertChannels || ['telegram'],
      rebalancePercentage: config.rebalancePercentage || 20,
    };

    this.state = {
      isRunning: false,
      lastCheckTime: 0,
      currentRiskScore: 0,
      totalActionsTaken: 0,
    };

    // Initialize skills with configuration
    this.chainWatch = new ChainWatchSkill();
    this.riskScore = new RiskScoreSkill();
    this.simulationGuard = new SimulationGuardSkill();
    this.swapExecutor = new SwapExecutorSkill();
    this.socialBroadcast = new SocialBroadcastSkill();
    this.reportWriter = new ReportWriterSkill(process.env.OPENAI_API_KEY);
    this.alertDispatch = new AlertDispatchSkill(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.DEFAULT_WEBHOOK_URL
    );
    this.memoryStore = new MemoryStoreSkill();
  }

  /**
   * Start the autonomous agent loop
   */
  async start(checkIntervalMs: number = 60000): Promise<void> {
    if (this.isRunning) {
      console.warn('Agent is already running');
      return;
    }

    console.log('[PharosSentinel] Starting agent...');
    this.isRunning = true;
    this.state.isRunning = true;

    // Load previous state if exists
    await this.loadState();

    // Start monitoring loop
    this.checkInterval = setInterval(() => {
      this.monitoringLoop().catch(console.error);
    }, checkIntervalMs);

    // Run first iteration immediately
    await this.monitoringLoop();

    console.log('[PharosSentinel] Agent started successfully');
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('[PharosSentinel] Stopping agent...');
    this.isRunning = false;
    this.state.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Save final state
    await this.saveState();
    console.log('[PharosSentinel] Agent stopped');
  }

  /**
   * Main monitoring loop - called at regular intervals
   */
  private async monitoringLoop(): Promise<void> {
    const now = Date.now();
    this.state.lastCheckTime = now;

    try {
      console.log('[PharosSentinel] Running monitoring cycle...');

      // Step 1: Get latest chain events
      const chainEvents = await this.getChainEvents();
      
      // Step 2: Calculate current portfolio risk
      const riskResult = await this.calculateRisk();
      
      if (!riskResult.success || !riskResult.data) {
        console.error('[PharosSentinel] Risk calculation failed');
        return;
      }

      this.state.currentRiskScore = riskResult.data.riskScore;
      console.log(`[PharosSentinel] Current risk score: ${riskResult.data.riskScore} (${riskResult.data.level})`);

      // Step 3: Make decision based on risk
      const decision = this.makeDecision(riskResult.data, chainEvents);

      // Step 4: Execute decision
      await this.executeDecision(decision, riskResult.data);

      // Step 5: Save state
      await this.saveState();

    } catch (error: any) {
      console.error('[PharosSentinel] Monitoring loop error:', error.message);
    }
  }

  /**
   * Fetch recent chain events for watched wallets
   */
  private async getChainEvents(): Promise<ChainWatchEvent[]> {
    if (this.config.watchedWallets.length === 0) {
      return [];
    }

    const result = await this.chainWatch.execute({
      wallets: this.config.watchedWallets,
      eventTypes: ['transfer', 'swap', 'stake'],
      fromBlock: 0, // Would track last checked block in production
    });

    return result.success && result.data ? result.data.events : [];
  }

  /**
   * Calculate portfolio risk score
   * In production, would fetch real holdings from chain
   */
  private async calculateRisk(): Promise<any> {
    // Mock portfolio data - replace with actual chain queries
    const mockHoldings = [
      { token: 'PROS', amount: '1000', price: 0.5 },
      { token: 'ETH', amount: '0.5', price: 3000 },
      { token: 'USDC', amount: '500', price: 1 },
    ];

    return await this.riskScore.execute({
      holdings: mockHoldings,
      priceHistory: [], // Would fetch from price oracle
    });
  }

  /**
   * Make autonomous decision based on risk analysis
   */
  private makeDecision(riskData: RiskScoreOutput, events: ChainWatchEvent[]): AgentDecision {
    const { riskScore, level } = riskData;

    // Critical risk - immediate rebalancing
    if (riskScore >= 80 && this.config.autoRebalance) {
      return {
        action: 'rebalance',
        reason: `Critical risk level (${level}): ${riskData.recommendation}`,
        skillsToInvoke: ['simulationGuard', 'swapExecutor', 'socialBroadcast'],
        parameters: {
          urgency: 'high',
          rebalancePercent: this.config.rebalancePercentage * 1.5,
        },
      };
    }

    // High risk - alert and consider rebalancing
    if (riskScore >= this.config.riskThreshold) {
      return {
        action: 'alert',
        reason: `High risk detected: ${riskData.recommendation}`,
        skillsToInvoke: ['alertDispatch', 'reportWriter'],
        parameters: {
          urgency: 'medium',
          includeReport: true,
        },
      };
    }

    // Regular monitoring - generate periodic report
    if (events.length > 0 || Math.random() < 0.1) {
      return {
        action: 'report',
        reason: 'Regular activity report',
        skillsToInvoke: ['reportWriter', 'socialBroadcast'],
        parameters: {
          period: '24h',
          includeEvents: events.length > 0,
        },
      };
    }

    // No action needed
    return {
      action: 'monitor',
      reason: 'No significant changes detected',
      skillsToInvoke: [],
      parameters: {},
    };
  }

  /**
   * Execute the decided action using appropriate skills
   */
  private async executeDecision(decision: AgentDecision, riskData: RiskScoreOutput): Promise<void> {
    console.log(`[PharosSentinel] Executing decision: ${decision.action}`);
    console.log(`[PharosSentinel] Reason: ${decision.reason}`);

    this.state.totalActionsTaken++;
    this.state.lastActionType = decision.action;

    switch (decision.action) {
      case 'rebalance':
        await this.executeRebalance(decision.parameters);
        break;

      case 'alert':
        await this.executeAlert(decision.parameters, riskData);
        break;

      case 'report':
        await this.executeReport(decision.parameters);
        break;

      case 'social_post':
        await this.executeSocialPost(decision.parameters);
        break;

      case 'monitor':
        console.log('[PharosSentinel] Continuing monitoring...');
        break;
    }

    // Save decision to memory
    await this.memoryStore.saveDecision(`decision_${Date.now()}`, {
      action: decision.action,
      reason: decision.reason,
      timestamp: Date.now(),
      riskScore: riskData.riskScore,
    });
  }

  /**
   * Execute portfolio rebalancing with safety checks
   */
  private async executeRebalance(params: any): Promise<void> {
    console.log('[PharosSentinel] Initiating rebalancing...');

    // Mock rebalancing transaction
    const mockTx = {
      to: '0xRouterAddress',
      data: '0x38ed1739...', // swap function signature
      from: this.config.watchedWallets[0] || '0xUser',
      value: '0',
    };

    // Step 1: Simulate transaction with SafetyGuard
    const simResult = await this.simulationGuard.execute({
      transaction: mockTx,
      rpcUrl: 'https://rpc.pharosnetwork.xyz',
      slippageTolerance: 0.5,
    });

    if (!simResult.success || !simResult.data?.safe) {
      console.error('[PharosSentinel] Rebalancing aborted - simulation failed');
      console.error('Errors:', simResult.error || simResult.data?.errors);
      return;
    }

    console.log('[PharosSentinel] Simulation passed, executing swap...');

    // Step 2: Execute swap (would need real wallet key in production)
    // const swapResult = await this.swapExecutor.execute({...});

    // Step 3: Post to social feed
    if (this.config.socialPostingEnabled) {
      await this.executeSocialPost({
        message: `🔄 Auto-rebalanced portfolio to reduce risk. ${simResult.data.priceImpact}% price impact.`,
        mentionTokens: ['PROS'],
      });
    }
  }

  /**
   * Send alerts based on risk threshold breach
   */
  private async executeAlert(params: any, riskData: RiskScoreOutput): Promise<void> {
    console.log('[PharosSentinel] Sending alerts...');

    const rules = [
      {
        metric: 'riskScore',
        operator: '>' as const,
        value: this.config.riskThreshold,
        channel: 'telegram' as const,
        telegramChatId: process.env.TELEGRAM_CHAT_ID,
      },
    ];

    await this.alertDispatch.execute({
      rules,
      currentData: {
        riskScore: riskData.riskScore,
        level: riskData.level,
      },
    });

    // Generate detailed report if requested
    if (params.includeReport) {
      await this.executeReport({ period: '24h' });
    }
  }

  /**
   * Generate and optionally post activity report
   */
  private async executeReport(params: any): Promise<void> {
    console.log('[PharosSentinel] Generating report...');

    const events = await this.getChainEvents();

    const reportResult = await this.reportWriter.execute({
      events,
      period: params.period || '24h',
      walletLabel: 'Pharos Sentinel Wallet',
      persona: 'neutral',
    });

    if (reportResult.success && reportResult.data) {
      console.log('[PharosSentinel] Report generated:', reportResult.data.title);
      console.log(reportResult.data.summary);

      // Post to social if enabled
      if (this.config.socialPostingEnabled && params.postToSocial) {
        await this.executeSocialPost({
          message: `📊 ${reportResult.data.summary}`,
        });
      }
    }
  }

  /**
   * Post message to Pharos social feed
   */
  private async executeSocialPost(params: {
    message: string;
    mentionTokens?: string[];
    attachTxHash?: string;
  }): Promise<void> {
    console.log('[PharosSentinel] Posting to social...');

    // In production, would need proper signature
    await this.socialBroadcast.execute({
      message: params.message,
      mentionTokens: params.mentionTokens || [],
      attachTxHash: params.attachTxHash,
      authorWallet: this.config.watchedWallets[0] || '',
      signature: 'mock_signature',
    });
  }

  /**
   * Persist agent state to memory store
   */
  private async saveState(): Promise<void> {
    await this.memoryStore.saveAgentState({
      ...this.state,
      config: this.config,
      lastUpdated: Date.now(),
    });
  }

  /**
   * Load previously saved state
   */
  private async loadState(): Promise<void> {
    const savedState = await this.memoryStore.getAgentState();
    if (savedState) {
      console.log('[PharosSentinel] Restored previous state');
      this.state = { ...this.state, ...savedState };
    }
  }

  /**
   * Get current agent status
   */
  getStatus(): { state: AgentState; config: AgentConfig } {
    return {
      state: this.state,
      config: this.config,
    };
  }
}

// Export singleton instance
export const sentinelAgent = new PharosSentinelAgent();
