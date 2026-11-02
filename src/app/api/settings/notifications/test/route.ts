import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { testFcmConnection } from '@/lib/fcm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can test notifications' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    let {
      fcmProjectId,
      fcmClientEmail,
      fcmPrivateKey,
      fcmServerKey,
      fcmTopic,
      serviceAccountJson,
    } = body;

    // Auto-parse JSON if provided
    if (serviceAccountJson && typeof serviceAccountJson === 'string') {
      try {
        const parsed = JSON.parse(serviceAccountJson.trim());
        if (parsed.project_id) fcmProjectId = parsed.project_id;
        if (parsed.client_email) fcmClientEmail = parsed.client_email;
        if (parsed.private_key) fcmPrivateKey = parsed.private_key;
      } catch (err) {
        return NextResponse.json({ error: 'Invalid Service Account JSON format' }, { status: 400 });
      }
    }

    // If values not passed in body, pull from database
    if (!fcmProjectId || !fcmClientEmail || !fcmPrivateKey) {
      const dbConfig = await prisma.notificationSetting.findUnique({
        where: { id: 'default' },
      });
      if (dbConfig) {
        fcmProjectId = fcmProjectId || dbConfig.fcmProjectId;
        fcmClientEmail = fcmClientEmail || dbConfig.fcmClientEmail;
        fcmPrivateKey = fcmPrivateKey || dbConfig.fcmPrivateKey;
        fcmServerKey = fcmServerKey || dbConfig.fcmServerKey;
        fcmTopic = fcmTopic || dbConfig.fcmTopic;
      }
    }

    const result = await testFcmConnection({
      fcmProjectId: (fcmProjectId || '').trim(),
      fcmClientEmail: (fcmClientEmail || '').trim(),
      fcmPrivateKey: (fcmPrivateKey || '').trim(),
      fcmServerKey: (fcmServerKey || '').trim(),
      fcmTopic: (fcmTopic || 'all_users').trim(),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Test FCM connection error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to test FCM connection' },
      { status: 500 }
    );
  }
}
