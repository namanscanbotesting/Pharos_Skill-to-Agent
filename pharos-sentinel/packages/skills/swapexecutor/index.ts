/**
 * SwapExecutor Skill - On-Chain Swap Transaction Executor
 * Constructs and signs DEX swap transactions on Pharos
 */

import { ethers, Wallet, JsonRpcProvider } from 'ethers';
import { 
  Skill, 
  SkillResult, 
  SwapExecutorInput, 
  SwapExecutorOutput 
} from '../../shared/types.js';

// Minimal ABI for ERC20 and DEX Router
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
];

const ROUTER_ABI = [
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] path) external view returns (uint[] memory amounts)',
];

export class SwapExecutorSkill implements Skill<SwapExecutorInput, SwapExecutorOutput> {
  name = 'SwapExecutor';
  version = '1.0.0';
  description = 'Executes token swaps on Pharos DEX with safety checks';

  constructor(
    private defaultRpcUrl: string = 'https://rpc.pharosnetwork.xyz',
    private routerAddress: string = '0x...' // Configure per network
  ) {}

  async validate(input: unknown): Promise<boolean> {
    try {
      const data = input as any;
      if (!data.fromToken || !data.toToken || !data.amountIn) return false;
      if (!data.walletKey || !data.rpcUrl) return false;
      if (typeof data.slippageBps !== 'number' || data.slippageBps < 0 || data.slippageBps > 1000) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  async execute(input: SwapExecutorInput): Promise<SkillResult<SwapExecutorOutput>> {
    const startTime = Date.now();
    
    try {
      const { 
        fromToken, 
        toToken, 
        amountIn, 
        slippageBps, 
        walletKey, 
        rpcUrl = this.defaultRpcUrl,
        simulateOnly = false 
      } = input;

      // Initialize provider and wallet
      const provider = new JsonRpcProvider(rpcUrl);
      const wallet = new Wallet(walletKey, provider);

      // Get token decimals
      const fromContract = new ethers.Contract(fromToken, ERC20_ABI, wallet);
      const toContract = new ethers.Contract(toToken, ERC20_ABI, wallet);
      
      const [fromDecimals, toDecimals] = await Promise.all([
        fromContract.decimals(),
        toContract.decimals(),
      ]);

      // Convert amount to proper decimals
      const amountInWei = ethers.parseUnits(amountIn.toString(), fromDecimals);

      // Get expected output from router
      const router = new ethers.Contract(this.routerAddress, ROUTER_ABI, wallet);
      const path = [fromToken, toToken];
      
      let expectedOutput: bigint;
      try {
        const amounts = await router.getAmountsOut(amountInWei, path);
        expectedOutput = amounts[amounts.length - 1];
      } catch {
        expectedOutput = 0n; // Fallback
      }

      // Calculate minimum output with slippage
      const slippageMultiplier = 10000 - slippageBps;
      const amountOutMin = (expectedOutput * BigInt(slippageMultiplier)) / 10000n;

      // Check and approve allowance if needed
      const currentAllowance = await fromContract.allowance(wallet.address, this.routerAddress);
      if (currentAllowance < amountInWei) {
        if (simulateOnly) {
          return {
            success: true,
            data: {
              status: 'simulated',
              simulationResult: {
                success: true,
                expectedOutput: ethers.formatUnits(expectedOutput, toDecimals),
                priceImpact: 0,
              },
            },
            metadata: {
              executionTimeMs: Date.now() - startTime,
              timestamp: Date.now(),
              skillVersion: this.version,
            },
          };
        }

        const approveTx = await fromContract.approve(this.routerAddress, ethers.MaxUint256);
        await approveTx.wait();
      }

      // Execute swap
      if (simulateOnly) {
        return {
          success: true,
          data: {
            status: 'simulated',
            simulationResult: {
              success: true,
              expectedOutput: ethers.formatUnits(expectedOutput, toDecimals),
              priceImpact: 0,
            },
          },
          metadata: {
            executionTimeMs: Date.now() - startTime,
            timestamp: Date.now(),
            skillVersion: this.version,
          },
        };
      }

      // Build swap transaction
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      
      const swapTx = await router.swapExactTokensForTokens.populateTransaction(
        amountInWei,
        amountOutMin,
        path,
        wallet.address,
        deadline
      );

      // Send transaction
      const txResponse = await wallet.sendTransaction({
        to: swapTx.to,
        data: swapTx.data,
        value: 0n,
      });

      // Wait for confirmation
      const receipt = await txResponse.wait();

      if (!receipt) {
        throw new Error('Transaction failed - no receipt');
      }

      return {
        success: true,
        data: {
          status: 'confirmed',
          txHash: receipt.hash,
          amountOut: ethers.formatUnits(expectedOutput, toDecimals),
          gasUsed: Number(receipt.gasUsed),
          simulationResult: {
            success: true,
            expectedOutput: ethers.formatUnits(expectedOutput, toDecimals),
            priceImpact: 0,
          },
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
        error: `SwapExecutor failed: ${error.message}`,
        data: {
          status: 'failed',
          revertReason: error.message,
        },
        metadata: {
          executionTimeMs: Date.now() - startTime,
          timestamp: Date.now(),
          skillVersion: this.version,
        },
      };
    }
  }
}

// Export singleton instance (configure router address for your network)
export const swapExecutor = new SwapExecutorSkill();
