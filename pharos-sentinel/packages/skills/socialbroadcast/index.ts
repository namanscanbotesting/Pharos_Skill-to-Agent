/**
 * SocialBroadcast Skill - Post to Pharos Social Feed
 * Formats and posts messages to the Pharos on-chain social layer
 */

import { 
  Skill, 
  SkillResult, 
  SocialBroadcastInput, 
  SocialBroadcastOutput 
} from '../../shared/types.js';

export class SocialBroadcastSkill implements Skill<SocialBroadcastInput, SocialBroadcastOutput> {
  name = 'SocialBroadcast';
  version = '1.0.0';
  description = 'Posts formatted messages to Pharos social feed with asset mentions and tx references';

  constructor(private socialApiUrl: string = 'https://social-api.pharosnetwork.xyz') {}

  async validate(input: unknown): Promise<boolean> {
    try {
      const data = input as any;
      if (!data.message || !data.authorWallet || !data.signature) return false;
      if (typeof data.message !== 'string' || data.message.length === 0) return false;
      if (data.message.length > 500) return false; // Character limit
      return true;
    } catch {
      return false;
    }
  }

  async execute(input: SocialBroadcastInput): Promise<SkillResult<SocialBroadcastOutput>> {
    const startTime = Date.now();
    
    try {
      const { message, mentionTokens = [], attachTxHash, authorWallet, signature } = input;

      // Format the post content
      const formattedMessage = this.formatMessage(message, mentionTokens, attachTxHash);

      // In production, this would call the actual Pharos social API
      // For now, we simulate the response
      const postId = `ph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate API call
      const response = await this.mockSocialPost({
        message: formattedMessage,
        author: authorWallet,
        signature,
        metadata: {
          mentionTokens,
          attachTxHash,
        },
      });

      return {
        success: true,
        data: {
          postId: response.postId,
          url: `https://pharos.social/post/${response.postId}`,
          timestamp: Date.now(),
          status: 'published',
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
        error: `SocialBroadcast failed: ${error.message}`,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          timestamp: Date.now(),
          skillVersion: this.version,
        },
      };
    }
  }

  private formatMessage(
    message: string,
    mentionTokens: string[],
    attachTxHash?: string
  ): string {
    let formatted = message;

    // Add token mentions
    if (mentionTokens.length > 0) {
      const tokenTags = mentionTokens.map(t => `$${t}`).join(' ');
      formatted += `\n\n${tokenTags}`;
    }

    // Attach transaction reference
    if (attachTxHash) {
      const shortHash = `${attachTxHash.slice(0, 8)}...${attachTxHash.slice(-6)}`;
      formatted += `\n\n🔗 Tx: ${shortHash}`;
    }

    return formatted;
  }

  private async mockSocialPost(payload: {
    message: string;
    author: string;
    signature: string;
    metadata: any;
  }): Promise<{ postId: string }> {
    // Mock implementation - replace with actual API call
    // Example real implementation:
    /*
    const response = await fetch(`${this.socialApiUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${payload.signature}`,
      },
      body: JSON.stringify({
        content: payload.message,
        author: payload.author,
        metadata: payload.metadata,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Social API error: ${response.statusText}`);
    }
    
    return await response.json();
    */

    console.log('[SocialBroadcast] Mock post:', {
      author: payload.author,
      message: payload.message,
      metadata: payload.metadata,
    });

    return {
      postId: `ph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }
}

// Export singleton instance
export const socialBroadcast = new SocialBroadcastSkill();
