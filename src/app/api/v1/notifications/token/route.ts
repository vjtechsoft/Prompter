import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateClientApiKey } from '@/lib/client-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await validateClientApiKey(req);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { token, deviceId, userId, platform = 'android', appVersion } = body;

    if (!token || typeof token !== 'string' || !token.trim()) {
      return NextResponse.json(
        { success: false, error: 'FCM device token is required' },
        { status: 400 }
      );
    }

    const trimmedToken = token.trim();
    const effectiveDeviceId = (deviceId || req.headers.get('x-device-id') || '').trim();
    const effectiveUserId = (userId || req.headers.get('x-user-id') || '').trim();
    const effectivePlatform = (platform || 'android').toLowerCase().trim();

    // Upsert device token
    const record = await prisma.fcmDeviceToken.upsert({
      where: { token: trimmedToken },
      update: {
        deviceId: effectiveDeviceId || undefined,
        userId: effectiveUserId || undefined,
        platform: effectivePlatform,
        appVersion: appVersion ? String(appVersion) : undefined,
        isActive: true,
        lastSeenAt: new Date(),
      },
      create: {
        token: trimmedToken,
        deviceId: effectiveDeviceId || null,
        userId: effectiveUserId || null,
        platform: effectivePlatform,
        appVersion: appVersion ? String(appVersion) : null,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'FCM device token registered successfully',
      data: {
        id: record.id,
        platform: record.platform,
        isActive: record.isActive,
        registeredAt: record.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Register FCM token error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register device token' },
      { status: 500 }
    );
  }
}
