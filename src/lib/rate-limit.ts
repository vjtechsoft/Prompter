import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding-window store (auto-cleans expired records)
const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((record, key) => {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number; // Duration of window in ms
  max: number;      // Max allowed requests in window
}

export const RATE_LIMIT_PRESETS = {
  auth: { windowMs: 15 * 60 * 1000, max: 10 },      // 10 attempts per 15 minutes (login, password reset)
  upload: { windowMs: 10 * 60 * 1000, max: 30 },    // 30 uploads per 10 minutes
  api: { windowMs: 60 * 1000, max: 120 },           // 120 requests per minute
  publicApi: { windowMs: 60 * 1000, max: 180 },     // 180 requests per minute for public mobile/client feeds
};

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

export function checkRateLimit(
  req: NextRequest,
  prefix: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetTime: number; response?: NextResponse } {
  const ip = getClientIp(req);
  const key = `${prefix}:${ip}`;
  const now = Date.now();

  let record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    rateLimitMap.set(key, record);
    return {
      allowed: true,
      remaining: options.max - 1,
      resetTime: record.resetTime,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, options.max - record.count);

  if (record.count > options.max) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    const response = NextResponse.json(
      {
        error: 'Too many requests. Please slow down and try again later.',
        retryAfter: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(options.max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
        },
      }
    );

    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      response,
    };
  }

  return {
    allowed: true,
    remaining,
    resetTime: record.resetTime,
  };
}
