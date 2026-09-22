import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, signJwtToken, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { logActivity, logLoginAttempt } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
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

    // Update last login details
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '127.0.0.1',
      },
    });

    // Record logs
    await logLoginAttempt({ userId: user.id, status: 'SUCCESS', req });
    await logActivity({
      userId: user.id,
      action: 'LOGIN',
      entity: 'AUTH',
      details: `User ${user.email} logged in successfully`,
      req,
    });

    // Generate JWT token
    const token = signJwtToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      Boolean(rememberMe)
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    });

    // Set HttpOnly cookie
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
