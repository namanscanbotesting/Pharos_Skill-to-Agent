/**
 * ChainWatch Skill - Block Event Listener
 * Subscribes to Pharos RPC WebSocket and filters wallet events
 */

import { ethers, WebSocketProvider } from 'ethers';
import { 
  Skill, 
  SkillResult, 
  ChainWatchInput, 
  ChainWatchOutput,
  ChainWatchEvent 
} from '../../shared/types.js';

export class ChainWatchSkill implements Skill<ChainWatchInput, ChainWatchOutput> {
  name = 'ChainWatch';
  version = '1.0.0';
  description = 'Real-time blockchain event listener for Pharos network';
  
  private provider: WebSocketProvider | null = null;
  private subscriptions: Map<string, any> = new Map();

  constructor(private rpcUrl: string = 'wss://rpc.pharosnetwork.xyz/ws') {}

  async validate(input: unknown): Promise<boolean> {
    try {
      const wallets = (input as any).wallets;
      if (!Array.isArray(wallets) || wallets.length === 0) return false;
      
      // Validate address format
      for (const wallet of wallets) {
        if (!ethers.isAddress(wallet)) return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  async execute(input: ChainWatchInput): Promise<SkillResult<ChainWatchOutput>> {
    const startTime = Date.now();
    
    try {
      // Initialize provider if not exists
      if (!this.provider) {
        this.provider = new WebSocketProvider(this.rpcUrl);
      }

      const events: ChainWatchEvent[] = [];
      const { wallets, eventTypes, fromBlock = 0 } = input;

      // Fetch recent blocks and filter events
      const currentBlock = await this.provider.getBlockNumber();
      const searchFrom = fromBlock || Math.max(0, currentBlock - 100);

      for (let blockNum = searchFrom; blockNum <= currentBlock; blockNum++) {
        const block = await this.provider.getBlock(blockNum, true);
        if (!block?.transactions) continue;

        for (const txHash of block.transactions) {
          const tx = await this.provider.getTransaction(txHash);
          if (!tx) continue;

          // Check if transaction involves watched wallets
          if (wallets.includes(tx.from.toLowerCase()) || 
              (tx.to && wallets.includes(tx.to.toLowerCase()))) {
            
            const eventType = this.detectEventType(tx, eventTypes);
            if (eventType) {
              events.push({
                eventType,
                wallet: tx.from,
                token: this.extractToken(tx),
                amount: this.extractAmount(tx),
                txHash: tx.hash,
                blockNumber: blockNum,
                timestamp: block.timestamp || Math.floor(Date.now() / 1000),
                data: {
                  value: tx.value.toString(),
                  gasPrice: tx.gasPrice?.toString(),
                },
              });
            }
          }
        }
      }

      return {
        success: true,
        data: { events },
        metadata: {
          executionTimeMs: Date.now() - startTime,
          timestamp: Date.now(),
          skillVersion: this.version,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `ChainWatch failed: ${error.message}`,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          timestamp: Date.now(),
          skillVersion: this.version,
        },
      };
    }
  }

  private detectEventType(tx: ethers.Transaction, allowedTypes: string[]): string | null {
    // Simple detection logic - can be enhanced with ABI decoding
    if (allowedTypes.includes('transfer') && tx.value > 0n) {
      return 'transfer';
    }
    
    // Detect DEX swaps by common router addresses or calldata patterns
    if (allowedTypes.includes('swap') && tx.data && tx.data !== '0x') {
      const swapSignatures = [
        '0x38ed1739', // swapExactTokensForTokens
        '0xfb3bdb41', // swapETHForExactTokens
        '0x791ac947', // swapExactTokensForETH
      ];
      if (swapSignatures.some(sig => tx.data.startsWith(sig))) {
        return 'swap';
      }
    }

    // Detect staking operations
    if (allowedTypes.includes('stake') && tx.data?.startsWith('0xa694fc3a')) {
      return 'stake';
    }

    // Detect approvals
    if (allowedTypes.includes('approval') && tx.data?.startsWith('0x095ea7b3')) {
      return 'approval';
    }

    return null;
  }

  private extractToken(tx: ethers.Transaction): string | undefined {
    // Extract token address from transfer logs or calldata
    // This is simplified - production would decode event logs
    if (tx.to) {
      return tx.to;
    }
    return undefined;
  }

  private extractAmount(tx: ethers.Transaction): string | undefined {
    if (tx.value > 0n) {
      return ethers.formatEther(tx.value);
    }
    return undefined;
  }

  async subscribe(
    wallets: string[], 
    callback: (event: ChainWatchEvent) => void
  ): Promise<void> {
    if (!this.provider) {
      this.provider = new WebSocketProvider(this.rpcUrl);
    }

    for (const wallet of wallets) {
      const filter = { address: wallet };
      const subscription = this.provider.on(filter, (log) => {
        const event: ChainWatchEvent = {
          eventType: 'transfer',
          wallet: wallet,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          timestamp: Math.floor(Date.now() / 1000),
        };
        callback(event);
      });
      
      this.subscriptions.set(wallet, subscription);
    }
  }

  async unsubscribe(wallet: string): Promise<void> {
    const subscription = this.subscriptions.get(wallet);
    if (subscription) {
      await subscription();
      this.subscriptions.delete(wallet);
    }
  }

  async disconnect(): Promise<void> {
    for (const [wallet, subscription] of this.subscriptions) {
      await subscription();
    }
    this.subscriptions.clear();
    
    if (this.provider) {
      await this.provider.destroy();
      this.provider = null;
    }
  }
}

// Export singleton instance for easy import
export const chainWatch = new ChainWatchSkill();
