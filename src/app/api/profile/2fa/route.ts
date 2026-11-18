import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, comparePassword } from '@/lib/auth';
import { generateTotpSecret, generateTotpUri, verifyTotp, generateBackupCodes } from '@/lib/totp';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET: Check 2FA Status
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true, twoFactorBackupCodes: true },
    });

    return NextResponse.json({
      success: true,
      enabled: Boolean(dbUser?.twoFactorEnabled),
      hasBackupCodes: Boolean(dbUser?.twoFactorBackupCodes),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check 2FA status' }, { status: 500 });
  }
}

// POST: Generate 2FA Setup (Secret & QR URI)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = generateTotpSecret();
    const uri = generateTotpUri(user.email, secret, 'Prompter AI');

    // Temporarily save pending secret
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });

    return NextResponse.json({
      success: true,
      secret,
      uri,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to initiate 2FA setup' }, { status: 500 });
  }
}

// PUT: Verify and Activate 2FA
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorSecret: true },
    });

    if (!dbUser?.twoFactorSecret) {
      return NextResponse.json({ error: '2FA setup was not initiated. Please generate a QR code first.' }, { status: 400 });
    }

    const isValid = verifyTotp(code, dbUser.twoFactorSecret);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code. Please check your authenticator app.' }, { status: 400 });
    }

    // Generate backup recovery codes
    const backupCodes = generateBackupCodes();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      },
    });

    await logActivity({
      userId: user.id,
      action: 'ENABLE_2FA',
      entity: 'AUTH',
      details: 'Two-Factor Authentication enabled',
      req,
    });

    return NextResponse.json({
      success: true,
      message: 'Two-Factor Authentication successfully activated.',
      backupCodes,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to verify and activate 2FA' }, { status: 500 });
  }
}

// DELETE: Disable 2FA (Requires current password confirmation)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Current password is required to disable 2FA' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isMatch = await comparePassword(password, dbUser.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect password. Cannot disable 2FA.' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    await logActivity({
      userId: user.id,
      action: 'DISABLE_2FA',
      entity: 'AUTH',
      details: 'Two-Factor Authentication disabled',
      req,
    });

    return NextResponse.json({
      success: true,
      message: 'Two-Factor Authentication disabled successfully.',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
  }
}
