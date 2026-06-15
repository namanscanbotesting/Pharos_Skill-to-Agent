/**
 * SimulationGuard Skill - Transaction Safety Simulator
 * Simulates transactions before execution to prevent losses
 */

import { ethers, JsonRpcProvider } from 'ethers';
import { 
  Skill, 
  SkillResult, 
  SimulationGuardInput, 
  SimulationGuardOutput 
} from '../../shared/types.js';

export class SimulationGuardSkill implements Skill<SimulationGuardInput, SimulationGuardOutput> {
  name = 'SimulationGuard';
  version = '1.0.0';
  description = 'Pre-execution transaction simulator to detect potential failures and losses';

  constructor(private defaultRpcUrl: string = 'https://rpc.pharosnetwork.xyz') {}

  async validate(input: unknown): Promise<boolean> {
    try {
      const tx = (input as any).transaction;
      if (!tx || !tx.to || !tx.data || !tx.from) return false;
      if (!ethers.isAddress(tx.to) || !ethers.isAddress(tx.from)) return false;
      return true;
    } catch {
      return false;
    }
  }

  async execute(input: SimulationGuardInput): Promise<SkillResult<SimulationGuardOutput>> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      const { transaction, rpcUrl = this.defaultRpcUrl, slippageTolerance = 0.5 } = input;
      const provider = new JsonRpcProvider(rpcUrl);

      // 1. Validate transaction basics
      const basicValidation = await this.validateBasic(transaction, provider);
      if (!basicValidation.valid) {
        errors.push(...basicValidation.errors);
      }

      // 2. Estimate gas
      let gasEstimate: number | undefined;
      try {
        const gasLimit = await provider.estimateGas({
          to: transaction.to,
          from: transaction.from,
          data: transaction.data,
          value: transaction.value ? BigInt(transaction.value) : 0n,
        });
        gasEstimate = Number(gasLimit);
      } catch (error: any) {
        errors.push(`Gas estimation failed: ${error.message}`);
      }

      // 3. Simulate transaction using eth_call
      const simulationResult = await this.simulateTransaction(transaction, provider);
      
      // 4. Check for price impact if this is a swap
      let expectedOutput: string | undefined;
      let priceImpact: number | undefined;
      
      if (this.isSwapTransaction(transaction)) {
        const swapAnalysis = await this.analyzeSwapImpact(transaction, provider, slippageTolerance);
        expectedOutput = swapAnalysis.expectedOutput;
        priceImpact = swapAnalysis.priceImpact;
        
        if (priceImpact > slippageTolerance) {
          warnings.push(`High price impact: ${priceImpact.toFixed(2)}% exceeds tolerance ${slippageTolerance}%`);
        }
        
        if (priceImpact > 5) {
          errors.push('Critical price impact (>5%). Transaction not recommended.');
        }
      }

      // 5. Check balance sufficiency
      const balanceCheck = await this.checkBalanceSufficiency(transaction, provider);
      if (!balanceCheck.sufficient) {
        errors.push(`Insufficient balance: ${balanceCheck.message}`);
      }

      // 6. Check contract verification (if applicable)
      const contractCheck = await this.checkContractSafety(transaction.to, provider);
      if (!contractCheck.safe) {
        warnings.push(...contractCheck.warnings);
      }

      const isSafe = errors.length === 0;

      return {
        success: true,
        data: {
          safe: isSafe,
          expectedOutput,
          priceImpact,
          gasEstimate,
          warnings,
          errors,
        },
        metadata: {
          executionTimeMs: Date.now() - startTime,
          timestamp: Date.now(),
          skillVersion: this.version,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `SimulationGuard failed: ${error.message}`,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          timestamp: Date.now(),
          skillVersion: this.version,
        },
      };
    }
  }

  private async validateBasic(
    tx: { to: string; from: string; data?: string; value?: string },
    provider: JsonRpcProvider
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check if recipient is a contract (for function calls)
    if (tx.data && tx.data !== '0x') {
      const code = await provider.getCode(tx.to);
      if (code === '0x') {
        errors.push('Target address is not a contract but calldata provided');
      }
    }

    // Check for zero address
    if (tx.to === ethers.ZeroAddress) {
      errors.push('Cannot send to zero address');
    }

    return { valid: errors.length === 0, errors };
  }

  private async simulateTransaction(
    tx: { to: string; from: string; data?: string; value?: string },
    provider: JsonRpcProvider
  ): Promise<{ success: boolean; revertReason?: string }> {
    try {
      await provider.call({
        to: tx.to,
        from: tx.from,
        data: tx.data,
        value: tx.value ? BigInt(tx.value) : undefined,
      });
      return { success: true };
    } catch (error: any) {
      let revertReason = error.message;
      
      // Try to decode revert reason
      if (error.info?.error?.data) {
        const data = error.info.error.data;
        if (typeof data === 'string' && data.startsWith('0x08c379a0')) {
          // Error(string)
          try {
            const decoded = ethers.decodeBytes32String('0x' + data.slice(10));
            revertReason = `Reverted: ${decoded}`;
          } catch {
            // Ignore decoding errors
          }
        }
      }
      
      return { success: false, revertReason };
    }
  }

  private isSwapTransaction(tx: { data?: string }): boolean {
    if (!tx.data) return false;
    
    const swapSignatures = [
      '0x38ed1739', // swapExactTokensForTokens
      '0xfb3bdb41', // swapETHForExactTokens
      '0x791ac947', // swapExactTokensForETH
      '0x18cbafe5', // swapExactTokensForETHSupportingFeeOnTransferTokens
      '0x8803dbee', // swapTokensForExactTokens
    ];
    
    return swapSignatures.some(sig => tx.data!.startsWith(sig));
  }

  private async analyzeSwapImpact(
    tx: { to: string; data: string; value?: string },
    provider: JsonRpcProvider,
    slippageTolerance: number
  ): Promise<{ expectedOutput: string; priceImpact: number }> {
    // This is a simplified analysis
    // In production, would integrate with DEX SDK or simulate against pool state
    
    try {
      // Decode swap parameters (simplified for demo)
      const functionSelector = tx.data.slice(0, 10);
      
      // Mock price impact calculation
      // Real implementation would query liquidity pools
      const mockPriceImpact = Math.random() * 3; // 0-3% for demo
      
      // Mock expected output
      const value = tx.value ? ethers.formatEther(tx.value) : '1';
      const expectedOutput = (parseFloat(value) * (1 - mockPriceImpact / 100)).toFixed(6);
      
      return {
        expectedOutput,
        priceImpact: mockPriceImpact,
      };
    } catch {
      return {
        expectedOutput: '0',
        priceImpact: 0,
      };
    }
  }

  private async checkBalanceSufficiency(
    tx: { from: string; value?: string },
    provider: JsonRpcProvider
  ): Promise<{ sufficient: boolean; message: string }> {
    try {
      const balance = await provider.getBalance(tx.from);
      const requiredValue = tx.value ? BigInt(tx.value) : 0n;
      
      // Also estimate gas cost
      const gasPrice = await provider.getFeeData();
      const estimatedGas = 21000n; // Base transfer
      const gasCost = gasPrice.gasPrice || gasPrice.maxFeePerGas || 0n;
      const totalRequired = requiredValue + (estimatedGas * gasCost);
      
      if (balance < totalRequired) {
        return {
          sufficient: false,
          message: `Balance ${ethers.formatEther(balance)} ETH < Required ${ethers.formatEther(totalRequired)} ETH`,
        };
      }
      
      return { sufficient: true, message: 'Balance sufficient' };
    } catch (error: any) {
      return {
        sufficient: false,
        message: `Balance check failed: ${error.message}`,
      };
    }
  }

  private async checkContractSafety(
    address: string,
    provider: JsonRpcProvider
  ): Promise<{ safe: boolean; warnings: string[] }> {
    const warnings: string[] = [];
    
    try {
      const code = await provider.getCode(address);
      
      if (code === '0x') {
        return { safe: false, warnings: ['Address is not a contract'] };
      }
      
      // Check if contract was recently deployed (< 24 hours)
      // This would require block timestamp analysis in production
      
      // Check for common security patterns
      // (In production, would integrate with security scanners)
      
      return { safe: true, warnings };
    } catch {
      return { safe: true, warnings: ['Could not verify contract'] };
    }
  }
}

// Export singleton instance
export const simulationGuard = new SimulationGuardSkill();
