import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, signJwtToken, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { logActivity, logLoginAttempt } from '@/lib/audit';
import { checkRateLimit, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { verifyTotp } from '@/lib/totp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Protection (Brute-Force & Credential Stuffing Prevention)
    const rateCheck = checkRateLimit(req, 'login', RATE_LIMIT_PRESETS.auth);
    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }

    const { email, password, rememberMe, twoFactorCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Constant-time dummy compare if user does not exist to prevent user enumeration via timing
    if (!user) {
      await comparePassword(password, '$2a$12$e80yq5qF0nC.84QvY06Z..0j/1eQ9U7gB6v8D5dK7vM8jY0k1eQ9U');
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account is deactivated. Contact the Super Admin.' }, { status: 403 });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      await logLoginAttempt({ userId: user.id, status: 'FAILED', req });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 2. Multi-Factor Authentication (MFA / 2FA) Enforcement
    if (user.twoFactorEnabled) {
      if (!twoFactorCode || typeof twoFactorCode !== 'string') {
        return NextResponse.json({
          requires2FA: true,
          message: 'Two-Factor Authentication is enabled for this account. Please enter your 6-digit verification code.',
        });
      }

      // Check TOTP code
      const isTotpValid = user.twoFactorSecret ? verifyTotp(twoFactorCode, user.twoFactorSecret) : false;

      // Check single-use backup recovery codes
      let isBackupCodeValid = false;
      let updatedBackupCodes: string[] = [];
      if (!isTotpValid && user.twoFactorBackupCodes) {
        try {
          const codes: string[] = JSON.parse(user.twoFactorBackupCodes);
          const cleanInput = twoFactorCode.trim().toUpperCase();
          const matchIndex = codes.indexOf(cleanInput);
          if (matchIndex !== -1) {
            isBackupCodeValid = true;
            codes.splice(matchIndex, 1); // Consume the backup code
            updatedBackupCodes = codes;
          }
        } catch {
          // Ignore parse errors
        }
      }

      if (!isTotpValid && !isBackupCodeValid) {
        await logLoginAttempt({ userId: user.id, status: 'FAILED', req });
        return NextResponse.json({ error: 'Invalid two-factor authentication code.' }, { status: 401 });
      }

      // If backup code was used, save consumed state
      if (isBackupCodeValid) {
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: JSON.stringify(updatedBackupCodes) },
        });
      }
    }

    // 3. Update Last Login Tracking
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '127.0.0.1',
      },
    });

    // 4. Audit Logging
    await logLoginAttempt({ userId: user.id, status: 'SUCCESS', req });
    await logActivity({
      userId: user.id,
      action: 'LOGIN',
      entity: 'AUTH',
      details: `User ${user.email} authenticated successfully`,
      req,
    });

    // 5. Generate Secure Cryptographic JWT Token
    const token = signJwtToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      Boolean(rememberMe)
    );

    // 6. Return Clean Response (Omitting raw JWT token from body to prevent localStorage theft)
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        twoFactorEnabled: Boolean(user.twoFactorEnabled),
      },
    });

    // 7. Store Auth Token Exclusively in HttpOnly, Secure, SameSite Cookie
    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during login' }, { status: 500 });
  }
}
