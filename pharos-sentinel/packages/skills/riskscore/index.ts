/**
 * RiskScore Skill - Portfolio Risk Calculator
 * Calculates composite risk score using volatility, concentration, and liquidity
 */

import { 
  Skill, 
  SkillResult, 
  RiskScoreInput, 
  RiskScoreOutput,
  TokenHolding,
  RiskBreakdown
} from '../../shared/types.js';

export class RiskScoreSkill implements Skill<RiskScoreInput, RiskScoreOutput> {
  name = 'RiskScore';
  version = '1.0.0';
  description = 'Calculates portfolio risk score (0-100) based on volatility, concentration, and liquidity';

  async validate(input: unknown): Promise<boolean> {
    try {
      const holdings = (input as any).holdings;
      if (!Array.isArray(holdings) || holdings.length === 0) return false;
      
      for (const holding of holdings) {
        if (!holding.token || !holding.amount || typeof holding.price !== 'number') {
          return false;
        }
      }
      
      return true;
    } catch {
      return false;
    }
  }

  async execute(input: RiskScoreInput): Promise<SkillResult<RiskScoreOutput>> {
    const startTime = Date.now();
    
    try {
      const { holdings, priceHistory = [] } = input;

      // Calculate USD values
      const holdingsWithValue: TokenHolding[] = holdings.map(h => ({
        ...h,
        valueUsd: parseFloat(h.amount) * h.price,
      }));

      const totalValue = holdingsWithValue.reduce((sum, h) => sum + h.valueUsd, 0);

      // Calculate risk components
      const volatility = this.calculateVolatility(holdingsWithValue, priceHistory);
      const concentration = this.calculateConcentration(holdingsWithValue, totalValue);
      const liquidity = this.calculateLiquidity(holdingsWithValue);

      // Composite risk score (weighted average)
      const riskScore = Math.min(100, Math.round(
        volatility * 40 + 
        concentration * 35 + 
        liquidity * 25
      ));

      // Determine risk level
      let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      if (riskScore < 30) level = 'LOW';
      else if (riskScore < 60) level = 'MEDIUM';
      else if (riskScore < 80) level = 'HIGH';
      else level = 'CRITICAL';

      // Generate recommendation
      const recommendation = this.generateRecommendation(riskScore, holdingsWithValue, concentration);

      return {
        success: true,
        data: {
          riskScore,
          level,
          breakdown: {
            volatility: Math.round(volatility * 100) / 100,
            concentration: Math.round(concentration * 100) / 100,
            liquidity: Math.round(liquidity * 100) / 100,
          },
          recommendation,
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
        error: `RiskScore calculation failed: ${error.message}`,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          timestamp: Date.now(),
          skillVersion: this.version,
        },
      };
    }
  }

  /**
   * Calculate volatility risk based on price history
   * Higher volatility = higher risk
   */
  private calculateVolatility(
    holdings: TokenHolding[], 
    priceHistory: Array<{ token: string; prices: number[]; timestamps: number[] }>
  ): number {
    if (priceHistory.length === 0) {
      // Default moderate volatility if no history
      return 0.5;
    }

    const volatilities: number[] = [];

    for (const history of priceHistory) {
      if (history.prices.length < 2) continue;

      const prices = history.prices;
      const returns: number[] = [];

      for (let i = 1; i < prices.length; i++) {
        const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
        returns.push(dailyReturn);
      }

      if (returns.length > 0) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);
        
        // Annualize volatility (assuming daily data)
        const annualizedVol = stdDev * Math.sqrt(365);
        volatilities.push(Math.min(1, annualizedVol));
      }
    }

    if (volatilities.length === 0) return 0.5;

    // Weight by portfolio allocation
    const totalVolatility = volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
    return Math.min(1, totalVolatility);
  }

  /**
   * Calculate concentration risk using Herfindahl-Hirschman Index (HHI)
   * Higher concentration = higher risk
   */
  private calculateConcentration(holdings: TokenHolding[], totalValue: number): number {
    if (totalValue === 0 || holdings.length === 0) return 0;

    // Calculate HHI (sum of squared market shares)
    let hhi = 0;
    for (const holding of holdings) {
      const share = holding.valueUsd / totalValue;
      hhi += Math.pow(share, 2);
    }

    // Normalize HHI to 0-1 range (1 = single asset, 0 = perfectly diversified)
    // HHI ranges from 1/n to 1, where n is number of assets
    const minHhi = 1 / holdings.length;
    const normalizedHhi = (hhi - minHhi) / (1 - minHhi);

    return normalizedHhi;
  }

  /**
   * Calculate liquidity risk based on asset types and allocation
   * Assumes major tokens are more liquid
   */
  private calculateLiquidity(holdings: TokenHolding[]): number {
    if (holdings.length === 0) return 0.5;

    // Known liquid tokens (would be configurable in production)
    const liquidTokens = ['PROS', 'ETH', 'USDC', 'USDT', 'DAI', 'WBTC'];
    
    let liquidityScore = 0;
    let totalValue = 0;

    for (const holding of holdings) {
      const isLiquid = liquidTokens.some(
        t => holding.token.toLowerCase().includes(t.toLowerCase())
      );
      
      const weight = isLiquid ? 1.0 : 0.3; // Illiquid assets get higher risk
      liquidityScore += holding.valueUsd * weight;
      totalValue += holding.valueUsd;
    }

    if (totalValue === 0) return 0.5;

    // Return inverse (higher score = lower liquidity = higher risk)
    const avgLiquidity = liquidityScore / totalValue;
    return 1 - avgLiquidity;
  }

  /**
   * Generate actionable recommendation based on risk analysis
   */
  private generateRecommendation(
    riskScore: number, 
    holdings: TokenHolding[],
    concentration: number
  ): string {
    const recommendations: string[] = [];

    if (riskScore >= 80) {
      recommendations.push('CRITICAL: Immediate portfolio rebalancing recommended');
    }

    if (concentration > 0.7) {
      const topHolding = [...holdings].sort((a, b) => b.valueUsd - a.valueUsd)[0];
      if (topHolding) {
        const reducePercent = Math.round((concentration - 0.5) * 100);
        recommendations.push(`Reduce ${topHolding.token} exposure by ${reducePercent}% to diversify`);
      }
    }

    if (riskScore >= 60 && riskScore < 80) {
      recommendations.push('Consider reducing volatile asset exposure');
    }

    if (riskScore < 30) {
      recommendations.push('Portfolio well-diversified. Continue monitoring.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Monitor portfolio regularly. No immediate action required.');
    }

    return recommendations.join('. ');
  }
}

// Export singleton instance
export const riskScore = new RiskScoreSkill();
