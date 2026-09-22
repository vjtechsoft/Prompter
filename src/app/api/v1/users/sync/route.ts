import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateClientApiKey } from '@/lib/client-auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await validateClientApiKey(req);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const body = await req.json();
    const { email, name, avatar, appVersion } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Google email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user is currently blocked
    const existing = await prisma.appUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing && existing.status === 'BLOCKED') {
      return NextResponse.json(
        { success: false, error: 'This user account has been suspended by administration.' },
        { status: 403 }
      );
    }

    const user = await prisma.appUser.upsert({
      where: { email: normalizedEmail },
      update: {
        name: name?.trim() || existing?.name || 'User',
        avatar: avatar ? avatar.trim() : existing?.avatar || null,
        appVersion: appVersion ? appVersion.trim() : existing?.appVersion || null,
        lastActiveAt: new Date(),
      },
      create: {
        email: normalizedEmail,
        name: name?.trim() || 'User',
        avatar: avatar ? avatar.trim() : null,
        authProvider: 'GOOGLE',
        status: 'ACTIVE',
        appVersion: appVersion ? appVersion.trim() : null,
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        authProvider: user.authProvider,
        status: user.status,
        isVip: user.isVip,
        likesCount: user.likesCount,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Client user sync error:', error);
    return NextResponse.json({ success: false, error: 'Failed to synchronize user' }, { status: 500 });
  }
}
