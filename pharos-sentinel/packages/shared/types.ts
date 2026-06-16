/**
 * Shared Types and Interfaces for Pharos Sentinel
 * Used across all Skills and the Agent Core
 */

import { z } from 'zod';

// ==================== Base Skill Interface ====================
export interface Skill<TInput, TOutput> {
  name: string;
  version: string;
  description: string;
  execute(input: TInput): Promise<SkillResult<TOutput>>;
  validate(input: unknown): Promise<boolean>;
}

export interface SkillResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTimeMs: number;
    timestamp: number;
    skillVersion: string;
  };
}

// ==================== ChainWatch Types ====================
export const ChainWatchInputSchema = z.object({
  wallets: z.array(z.string()),
  eventTypes: z.array(z.enum(['transfer', 'swap', 'stake', 'approval'])),
  fromBlock: z.number().optional(),
});

export type ChainWatchInput = z.infer<typeof ChainWatchInputSchema>;

export interface ChainWatchEvent {
  eventType: 'transfer' | 'swap' | 'stake' | 'approval';
  wallet: string;
  token?: string;
  amount?: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  data?: Record<string, any>;
}

export const ChainWatchOutputSchema = z.object({
  events: z.array(
    z.object({
      eventType: z.string(),
      wallet: z.string(),
      token: z.string().optional(),
      amount: z.string().optional(),
      txHash: z.string(),
      blockNumber: z.number(),
      timestamp: z.number(),
    })
  ),
});

export type ChainWatchOutput = z.infer<typeof ChainWatchOutputSchema>;

// ==================== RiskScore Types ====================
export interface TokenHolding {
  token: string;
  amount: string;
  price: number;
  valueUsd: number;
}

export const RiskScoreInputSchema = z.object({
  holdings: z.array(
    z.object({
      token: z.string(),
      amount: z.string(),
      price: z.number(),
    })
  ),
  priceHistory: z.array(
    z.object({
      token: z.string(),
      prices: z.array(z.number()),
      timestamps: z.array(z.number()),
    })
  ).optional(),
});

export type RiskScoreInput = z.infer<typeof RiskScoreInputSchema>;

export interface RiskBreakdown {
  volatility: number;
  concentration: number;
  liquidity: number;
}

export const RiskScoreOutputSchema = z.object({
  riskScore: z.number().min(0).max(100),
  level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  breakdown: z.object({
    volatility: z.number(),
    concentration: z.number(),
    liquidity: z.number(),
  }),
  recommendation: z.string(),
});

export type RiskScoreOutput = z.infer<typeof RiskScoreOutputSchema>;

// ==================== SwapExecutor Types ====================
export const SwapExecutorInputSchema = z.object({
  fromToken: z.string(),
  toToken: z.string(),
  amountIn: z.string(),
  slippageBps: z.number().min(0).max(1000),
  walletKey: z.string(),
  rpcUrl: z.string(),
  simulateOnly: z.boolean().optional(),
});

export type SwapExecutorInput = z.infer<typeof SwapExecutorInputSchema>;

export const SwapExecutorOutputSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'failed', 'simulated']),
  txHash: z.string().optional(),
  amountOut: z.string().optional(),
  gasUsed: z.number().optional(),
  revertReason: z.string().optional(),
  simulationResult: z.object({
    success: z.boolean(),
    expectedOutput: z.string(),
    priceImpact: z.number(),
  }).optional(),
});

export type SwapExecutorOutput = z.infer<typeof SwapExecutorOutputSchema>;

// ==================== SocialBroadcast Types ====================
export const SocialBroadcastInputSchema = z.object({
  message: z.string(),
  mentionTokens: z.array(z.string()).optional(),
  attachTxHash: z.string().optional(),
  authorWallet: z.string(),
  signature: z.string(),
});

export type SocialBroadcastInput = z.infer<typeof SocialBroadcastInputSchema>;

export const SocialBroadcastOutputSchema = z.object({
  postId: z.string(),
  url: z.string(),
  timestamp: z.number(),
  status: z.enum(['published', 'failed']),
});

export type SocialBroadcastOutput = z.infer<typeof SocialBroadcastOutputSchema>;

// ==================== ReportWriter Types ====================
export const ReportWriterInputSchema = z.object({
  events: z.array(z.any()),
  period: z.enum(['1h', '24h', '7d', '30d']),
  walletLabel: z.string().optional(),
  includeRiskAnalysis: z.boolean().optional(),
  persona: z.enum(['conservative', 'aggressive', 'neutral']).optional(),
});

export type ReportWriterInput = z.infer<typeof ReportWriterInputSchema>;

export const ReportWriterOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  highlights: z.array(z.string()),
  markdownBody: z.string(),
  riskSummary: z.object({
    startRisk: z.number(),
    endRisk: z.number(),
    change: z.number(),
  }).optional(),
});

export type ReportWriterOutput = z.infer<typeof ReportWriterOutputSchema>;

// ==================== AlertDispatch Types ====================
export interface AlertRule {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==';
  value: number;
  channel: 'telegram' | 'webhook' | 'discord';
  webhookUrl?: string;
  telegramChatId?: string;
}

export const AlertDispatchInputSchema = z.object({
  rules: z.array(
    z.object({
      metric: z.string(),
      operator: z.enum(['>', '<', '>=', '<=', '==']),
      value: z.number(),
      channel: z.enum(['telegram', 'webhook', 'discord']),
      webhookUrl: z.string().optional(),
      telegramChatId: z.string().optional(),
    })
  ),
  currentData: z.record(z.any()),
});

export type AlertDispatchInput = z.infer<typeof AlertDispatchInputSchema>;

export interface TriggeredAlert {
  rule: string;
  sentTo: string[];
  alertId: string;
  timestamp: number;
}

export const AlertDispatchOutputSchema = z.object({
  triggered: z.boolean(),
  alerts: z.array(
    z.object({
      rule: z.string(),
      sentTo: z.array(z.string()),
      alertId: z.string(),
      timestamp: z.number(),
    })
  ),
});

export type AlertDispatchOutput = z.infer<typeof AlertDispatchOutputSchema>;

// ==================== MemoryStore Types ====================
export const MemoryStoreInputSchema = z.object({
  op: z.enum(['get', 'set', 'delete', 'append']),
  key: z.string(),
  value: z.any().optional(),
});

export type MemoryStoreInput = z.infer<typeof MemoryStoreInputSchema>;

export const MemoryStoreOutputSchema = z.object({
  ok: z.boolean(),
  value: z.any().optional(),
  lastUpdated: z.number().optional(),
  error: z.string().optional(),
});

export type MemoryStoreOutput = z.infer<typeof MemoryStoreOutputSchema>;

// ==================== SimulationGuard Types ====================
export const SimulationGuardInputSchema = z.object({
  transaction: z.object({
    to: z.string(),
    data: z.string(),
    value: z.string().optional(),
    from: z.string(),
  }),
  rpcUrl: z.string(),
  slippageTolerance: z.number().optional(),
});

export type SimulationGuardInput = z.infer<typeof SimulationGuardInputSchema>;

export const SimulationGuardOutputSchema = z.object({
  safe: z.boolean(),
  expectedOutput: z.string().optional(),
  priceImpact: z.number().optional(),
  gasEstimate: z.number().optional(),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
});

export type SimulationGuardOutput = z.infer<typeof SimulationGuardOutputSchema>;

// ==================== Agent Orchestrator Types ====================
export interface AgentConfig {
  watchedWallets: string[];
  riskThreshold: number;
  autoRebalance: boolean;
  socialPostingEnabled: boolean;
  alertChannels: string[];
  rebalancePercentage: number;
}

export interface AgentState {
  isRunning: boolean;
  lastCheckTime: number;
  currentRiskScore: number;
  totalActionsTaken: number;
  lastActionType?: string;
}

export interface AgentDecision {
  action: 'monitor' | 'rebalance' | 'alert' | 'report' | 'social_post';
  reason: string;
  skillsToInvoke: string[];
  parameters: Record<string, any>;
}
