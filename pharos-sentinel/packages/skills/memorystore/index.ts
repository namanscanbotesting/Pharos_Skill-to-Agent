/**
 * MemoryStore Skill - Agent State & Context Persistence
 * Reads/writes persistent agent memory to storage layer
 */

import { 
  Skill, 
  SkillResult, 
  MemoryStoreInput, 
  MemoryStoreOutput 
} from '../../shared/types.js';

// In-memory store for demo (replace with Redis/DB in production)
const memoryStore: Map<string, { value: any; lastUpdated: number }> = new Map();

export class MemoryStoreSkill implements Skill<MemoryStoreInput, MemoryStoreOutput> {
  name = 'MemoryStore';
  version = '1.0.0';
  description = 'Persistent key-value storage for agent state and decision history';

  constructor(private storageBackend: 'memory' | 'redis' | 'chain' = 'memory') {}

  async validate(input: unknown): Promise<boolean> {
    try {
      const data = input as any;
      if (!data.op || !['get', 'set', 'delete', 'append'].includes(data.op)) return false;
      if (!data.key || typeof data.key !== 'string') return false;
      if (data.op === 'set' && data.value === undefined) return false;
      return true;
    } catch {
      return false;
    }
  }

  async execute(input: MemoryStoreInput): Promise<SkillResult<MemoryStoreOutput>> {
    const startTime = Date.now();
    
    try {
      const { op, key, value } = input;
      let result: MemoryStoreOutput;

      switch (op) {
        case 'get':
          result = await this.get(key);
          break;
        
        case 'set':
          result = await this.set(key, value!);
          break;
        
        case 'delete':
          result = await this.delete(key);
          break;
        
        case 'append':
          result = await this.append(key, value);
          break;
        
        default:
          throw new Error(`Unknown operation: ${op}`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          timestamp: Date.now(),
          skillVersion: this.version,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `MemoryStore failed: ${error.message}`,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          timestamp: Date.now(),
          skillVersion: this.version,
        },
      };
    }
  }

  private async get(key: string): Promise<MemoryStoreOutput> {
    const item = memoryStore.get(key);
    
    if (!item) {
      return {
        ok: false,
        error: 'Key not found',
      };
    }

    return {
      ok: true,
      value: item.value,
      lastUpdated: item.lastUpdated,
    };
  }

  private async set(key: string, value: any): Promise<MemoryStoreOutput> {
    memoryStore.set(key, {
      value,
      lastUpdated: Date.now(),
    });

    return {
      ok: true,
      value,
      lastUpdated: Date.now(),
    };
  }

  private async delete(key: string): Promise<MemoryStoreOutput> {
    const deleted = memoryStore.delete(key);

    return {
      ok: deleted,
      error: deleted ? undefined : 'Key not found',
    };
  }

  private async append(key: string, value: any): Promise<MemoryStoreOutput> {
    const existing = memoryStore.get(key);
    
    if (!existing) {
      // Create new array with value
      memoryStore.set(key, {
        value: [value],
        lastUpdated: Date.now(),
      });
      
      return {
        ok: true,
        value: [value],
        lastUpdated: Date.now(),
      };
    }

    // Append to existing array
    if (!Array.isArray(existing.value)) {
      return {
        ok: false,
        error: 'Existing value is not an array',
      };
    }

    existing.value.push(value);
    existing.lastUpdated = Date.now();
    memoryStore.set(key, existing);

    return {
      ok: true,
      value: existing.value,
      lastUpdated: existing.lastUpdated,
    };
  }

  // Helper methods for common agent patterns
  
  async saveDecision(decisionId: string, decision: any): Promise<void> {
    const key = `agent:decisions:${decisionId}`;
    await this.set(key, decision);
    
    // Also append to decision history
    await this.append('agent:decisionHistory', {
      id: decisionId,
      timestamp: Date.now(),
      ...decision,
    });
  }

  async getDecisionHistory(limit: number = 10): Promise<any[]> {
    const result = await this.get('agent:decisionHistory');
    if (!result.ok || !result.value) return [];
    
    return result.value.slice(-limit);
  }

  async saveAgentState(state: any): Promise<void> {
    await this.set('agent:state', state);
  }

  async getAgentState(): Promise<any> {
    const result = await this.get('agent:state');
    return result.ok ? result.value : null;
  }

  async clearAll(): Promise<void> {
    memoryStore.clear();
  }
}

// Export singleton instance
export const memoryStore = new MemoryStoreSkill();
