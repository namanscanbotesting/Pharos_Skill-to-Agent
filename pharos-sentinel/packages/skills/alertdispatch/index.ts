/**
 * AlertDispatch Skill - Threshold-Based Notifications
 * Evaluates alert rules and sends notifications via Telegram, webhooks, or Discord
 */

import axios from 'axios';
import { 
  Skill, 
  SkillResult, 
  AlertDispatchInput, 
  AlertDispatchOutput,
  AlertRule
} from '../../shared/types.js';

export class AlertDispatchSkill implements Skill<AlertDispatchInput, AlertDispatchOutput> {
  name = 'AlertDispatch';
  version = '1.0.0';
  description = 'Monitors metrics against user-defined rules and triggers notifications';

  constructor(
    private telegramBotToken?: string,
    private defaultWebhookUrl?: string
  ) {}

  async validate(input: unknown): Promise<boolean> {
    try {
      const data = input as any;
      if (!data.rules || !Array.isArray(data.rules) || data.rules.length === 0) return false;
      if (!data.currentData || typeof data.currentData !== 'object') return false;
      
      for (const rule of data.rules) {
        if (!rule.metric || !rule.operator || !rule.value || !rule.channel) return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  async execute(input: AlertDispatchInput): Promise<SkillResult<AlertDispatchOutput>> {
    const startTime = Date.now();
    
    try {
      const { rules, currentData } = input;
      const triggeredAlerts: Array<{
        rule: string;
        sentTo: string[];
        alertId: string;
        timestamp: number;
      }> = [];

      // Evaluate each rule
      for (const rule of rules) {
        const metricValue = currentData[rule.metric];
        
        if (metricValue === undefined) {
          console.warn(`Metric '${rule.metric}' not found in current data`);
          continue;
        }

        const triggered = this.evaluateRule(metricValue, rule);
        
        if (triggered) {
          const alertId = `al_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const sentTo: string[] = [];

          // Send notification based on channel
          try {
            switch (rule.channel) {
              case 'telegram':
                if (rule.telegramChatId && this.telegramBotToken) {
                  await this.sendTelegramAlert(rule, metricValue, rule.telegramChatId);
                  sentTo.push(`telegram:${rule.telegramChatId}`);
                }
                break;
              
              case 'webhook':
                if (rule.webhookUrl) {
                  await this.sendWebhookAlert(rule, metricValue, rule.webhookUrl);
                  sentTo.push(rule.webhookUrl);
                } else if (this.defaultWebhookUrl) {
                  await this.sendWebhookAlert(rule, metricValue, this.defaultWebhookUrl);
                  sentTo.push(this.defaultWebhookUrl);
                }
                break;
              
              case 'discord':
                if (rule.webhookUrl) {
                  await this.sendDiscordAlert(rule, metricValue, rule.webhookUrl);
                  sentTo.push(rule.webhookUrl);
                }
                break;
            }

            triggeredAlerts.push({
              rule: `${rule.metric} ${rule.operator} ${rule.value}`,
              sentTo,
              alertId,
              timestamp: Date.now(),
            });
          } catch (error: any) {
            console.error(`Failed to send alert for rule ${rule.metric}:`, error.message);
          }
        }
      }

      return {
        success: true,
        data: {
          triggered: triggeredAlerts.length > 0,
          alerts: triggeredAlerts,
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
        error: `AlertDispatch failed: ${error.message}`,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          timestamp: Date.now(),
          skillVersion: this.version,
        },
      };
    }
  }

  private evaluateRule(value: number, rule: AlertRule): boolean {
    switch (rule.operator) {
      case '>':
        return value > rule.value;
      case '<':
        return value < rule.value;
      case '>=':
        return value >= rule.value;
      case '<=':
        return value <= rule.value;
      case '==':
        return value === rule.value;
      default:
        return false;
    }
  }

  private async sendTelegramAlert(
    rule: AlertRule,
    value: number,
    chatId: string
  ): Promise<void> {
    if (!this.telegramBotToken) {
      throw new Error('Telegram bot token not configured');
    }

    const message = `
🚨 *Alert Triggered*

*Metric:* ${rule.metric}
*Condition:* ${rule.metric} ${rule.operator} ${rule.value}
*Current Value:* ${value}
*Time:* ${new Date().toISOString()}

This is an automated alert from Pharos Sentinel.
    `.trim();

    await axios.post(
      `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }
    );
  }

  private async sendWebhookAlert(
    rule: AlertRule,
    value: number,
    webhookUrl: string
  ): Promise<void> {
    await axios.post(webhookUrl, {
      alertType: 'threshold_breach',
      metric: rule.metric,
      operator: rule.operator,
      threshold: rule.value,
      currentValue: value,
      timestamp: Date.now(),
      source: 'Pharos Sentinel',
    });
  }

  private async sendDiscordAlert(
    rule: AlertRule,
    value: number,
    webhookUrl: string
  ): Promise<void> {
    await axios.post(webhookUrl, {
      embeds: [
        {
          title: '🚨 Alert Triggered',
          color: 15158332, // Red
          fields: [
            { name: 'Metric', value: rule.metric, inline: true },
            { name: 'Condition', value: `${rule.metric} ${rule.operator} ${rule.value}`, inline: true },
            { name: 'Current Value', value: value.toString(), inline: true },
          ],
          footer: {
            text: 'Pharos Sentinel',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }
}

// Export singleton instance
export const alertDispatch = new AlertDispatchSkill();
