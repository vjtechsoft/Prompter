import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { logActivity } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // For security, return generic message so attackers cannot enumerate emails
      return NextResponse.json({
        success: true,
        message: 'If the email exists in our system, a password reset link has been dispatched.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour validity

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    await logActivity({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entity: 'AUTH',
      details: `Password reset requested for ${user.email}`,
      req,
    });

    // In a production email service, you'd send an email with the link:
    // /reset-password?token=${resetToken}
    return NextResponse.json({
      success: true,
      message: 'Password reset instructions have been generated.',
      // We also include the token in dev mode for ease of use/testing
      devToken: resetToken,
      resetUrl: `/reset-password?token=${resetToken}`,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
