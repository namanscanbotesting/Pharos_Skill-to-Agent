/**
 * ReportWriter Skill - AI-Generated Activity Digest
 * Uses LLM to create human-readable portfolio reports from on-chain events
 */

import OpenAI from 'openai';
import { 
  Skill, 
  SkillResult, 
  ReportWriterInput, 
  ReportWriterOutput 
} from '../../shared/types.js';

export class ReportWriterSkill implements Skill<ReportWriterInput, ReportWriterOutput> {
  name = 'ReportWriter';
  version = '1.0.0';
  description = 'Generates AI-powered portfolio activity reports with customizable personas';

  private openai: OpenAI | null = null;

  constructor(private openaiApiKey?: string) {
    if (openaiApiKey) {
      this.openai = new OpenAI({ apiKey: openaiApiKey });
    }
  }

  async validate(input: unknown): Promise<boolean> {
    try {
      const data = input as any;
      if (!data.events || !Array.isArray(data.events)) return false;
      if (!data.period || !['1h', '24h', '7d', '30d'].includes(data.period)) return false;
      return true;
    } catch {
      return false;
    }
  }

  async execute(input: ReportWriterInput): Promise<SkillResult<ReportWriterOutput>> {
    const startTime = Date.now();
    
    try {
      const { 
        events, 
        period, 
        walletLabel = 'Your Wallet',
        includeRiskAnalysis = true,
        persona = 'neutral'
      } = input;

      // Generate report using LLM or fallback template
      let report: ReportWriterOutput;

      if (this.openai && this.openaiApiKey) {
        report = await this.generateWithLLM(events, period, walletLabel, persona);
      } else {
        report = this.generateTemplateReport(events, period, walletLabel);
      }

      return {
        success: true,
        data: report,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          timestamp: Date.now(),
          skillVersion: this.version,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `ReportWriter failed: ${error.message}`,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          timestamp: Date.now(),
          skillVersion: this.version,
        },
      };
    }
  }

  private async generateWithLLM(
    events: any[],
    period: string,
    walletLabel: string,
    persona: string
  ): Promise<ReportWriterOutput> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    const prompt = this.buildPrompt(events, period, walletLabel, persona);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a financial analyst creating concise, actionable portfolio reports. Format output as JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    const parsed = JSON.parse(content);
    
    return {
      title: parsed.title || `${walletLabel} - ${period} Report`,
      summary: parsed.summary || '',
      highlights: parsed.highlights || [],
      markdownBody: parsed.markdownBody || '',
      riskSummary: parsed.riskSummary,
    };
  }

  private buildPrompt(
    events: any[],
    period: string,
    walletLabel: string,
    persona: string
  ): string {
    const personaInstructions: Record<string, string> = {
      conservative: 'Focus on risk mitigation and capital preservation. Highlight potential dangers.',
      aggressive: 'Emphasize growth opportunities and bold moves. Be optimistic about gains.',
      neutral: 'Provide balanced, factual analysis without emotional bias.',
    };

    return `
Generate a portfolio activity report for ${walletLabel} covering the last ${period}.

Activity Summary:
${JSON.stringify(events, null, 2)}

Persona: ${personaInstructions[persona]}

Return JSON with these fields:
- title: Catchy report title
- summary: 2-3 sentence overview
- highlights: Array of 3-5 key points
- markdownBody: Full report in markdown format
- riskSummary: Object with startRisk, endRisk, change (if applicable)

Keep it concise, actionable, and under 300 words.
    `.trim();
  }

  private generateTemplateReport(
    events: any[],
    period: string,
    walletLabel: string
  ): ReportWriterOutput {
    // Fallback template when LLM is not available
    const eventCount = events.length;
    const swapEvents = events.filter((e: any) => e.eventType === 'swap').length;
    const transferEvents = events.filter((e: any) => e.eventType === 'transfer').length;

    const title = `${walletLabel} - ${period} Activity Report`;
    const summary = `Over the past ${period}, your wallet processed ${eventCount} transactions including ${swapEvents} swaps and ${transferEvents} transfers.`;
    
    const highlights: string[] = [];
    
    if (swapEvents > 0) {
      highlights.push(`Executed ${swapEvents} token swaps`);
    }
    if (transferEvents > 0) {
      highlights.push(`Processed ${transferEvents} transfers`);
    }
    if (eventCount === 0) {
      highlights.push('No on-chain activity detected in this period');
    }
    highlights.push('Portfolio monitoring active');

    const markdownBody = `
# ${title}

## Summary
${summary}

## Activity Highlights
${highlights.map(h => `- ${h}`).join('\n')}

## Details
${events.map((e: any) => `- **${e.eventType}**: ${e.amount || ''} ${e.token || ''} at ${new Date(e.timestamp * 1000).toLocaleString()}`).join('\n') || 'No events recorded'}

---
*Generated by Pharos Sentinel ReportWriter*
    `.trim();

    return {
      title,
      summary,
      highlights,
      markdownBody,
    };
  }
}

// Export singleton instance
export const reportWriter = new ReportWriterSkill();
