import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { UserSession } from '@/types';
import prisma from './prisma';

const DEFAULT_FALLBACK_SECRET = 'prompter-ai-admin-auth-secret-key-prod-2026-secure-32chars';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_FALLBACK_SECRET;

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_FALLBACK_SECRET)) {
  console.warn('⚠️ [SECURITY WARNING]: JWT_SECRET is not configured with a dedicated private secret in environment variables.');
}

export const TOKEN_COOKIE_NAME = 'prompt_auth_token';

/**
 * Constant-time string equality check to prevent timing attacks.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Hashes passwords using bcrypt with 12 salt rounds (OWASP recommended work factor).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signJwtToken(payload: { id: string; email: string; role: string }, rememberMe = false): string {
  const expiresIn = rememberMe ? '30d' : '7d';
  return jwt.sign(payload, JWT_SECRET, { expiresIn, algorithm: 'HS256' });
}

export function verifyJwtToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as { id: string; email: string; role: string };
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(req?: NextRequest): Promise<UserSession | null> {
  try {
    let token: string | undefined;

    if (req) {
      // 1. Check HttpOnly Cookie
      token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;

      // 2. Check Authorization Header Bearer token
      if (!token) {
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }
    }

    if (!token) return null;

    const decoded = verifyJwtToken(token);
    if (!decoded || !decoded.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        status: true,
        twoFactorEnabled: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'SUPER_ADMIN' | 'ADMIN',
      avatar: user.avatar,
      status: user.status,
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}
