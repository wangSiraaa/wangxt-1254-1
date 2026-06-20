import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisLockService {
  private readonly LOCK_PREFIX = 'blood:lock:';
  private readonly PREEMPT_PREFIX = 'blood:preempt:';
  private readonly DEFAULT_LOCK_TTL = 30;
  private readonly DEFAULT_PREEMPT_TTL = 1800;

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async acquireLock(key: string, ttl: number = this.DEFAULT_LOCK_TTL): Promise<string> {
    const lockKey = `${this.LOCK_PREFIX}${key}`;
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = await this.redis.set(lockKey, token, 'PX', ttl * 1000, 'NX');
    if (!result) {
      throw new BadRequestException('库存操作冲突，请稍后重试');
    }
    return token;
  }

  async releaseLock(key: string, token: string): Promise<void> {
    const lockKey = `${this.LOCK_PREFIX}${key}`;
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;
    await this.redis.eval(script, 1, lockKey, token);
  }

  async preemptBag(bloodBagId: string, appointmentId: string, ttl: number = this.DEFAULT_PREEMPT_TTL): Promise<boolean> {
    const preemptKey = `${this.PREEMPT_PREFIX}${bloodBagId}`;
    const result = await this.redis.set(preemptKey, appointmentId, 'EX', ttl, 'NX');
    return !!result;
  }

  async releasePreempt(bloodBagId: string): Promise<void> {
    const preemptKey = `${this.PREEMPT_PREFIX}${bloodBagId}`;
    await this.redis.del(preemptKey);
  }

  async getPreemptInfo(bloodBagId: string): Promise<string | null> {
    const preemptKey = `${this.PREEMPT_PREFIX}${bloodBagId}`;
    return await this.redis.get(preemptKey);
  }

  async isBagPreempted(bloodBagId: string): Promise<boolean> {
    const preemptKey = `${this.PREEMPT_PREFIX}${bloodBagId}`;
    const result = await this.redis.exists(preemptKey);
    return result > 0;
  }

  async getExpiringPreempts(seconds: number = 300): Promise<string[]> {
    const preemptKeys = await this.redis.keys(`${this.PREEMPT_PREFIX}*`);
    const expiring: string[] = [];
    for (const key of preemptKeys) {
      const ttl = await this.redis.ttl(key);
      if (ttl > 0 && ttl <= seconds) {
        expiring.push(key.replace(this.PREEMPT_PREFIX, ''));
      }
    }
    return expiring;
  }
}
