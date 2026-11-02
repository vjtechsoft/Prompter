import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { formatPrivateKey } from '@/lib/fcm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can access notification settings' }, { status: 403 });
    }

    let config = await prisma.notificationSetting.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      config = await prisma.notificationSetting.create({
        data: { id: 'default', provider: 'FCM', fcmTopic: 'all_users' },
      });
    }

    // Fetch broadcast history
    const history = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Device token metrics
    const [totalDevices, androidDevices, iosDevices, otherDevices, totalSent] = await Promise.all([
      prisma.fcmDeviceToken.count({ where: { isActive: true } }),
      prisma.fcmDeviceToken.count({ where: { isActive: true, platform: 'android' } }),
      prisma.fcmDeviceToken.count({ where: { isActive: true, platform: 'ios' } }),
      prisma.fcmDeviceToken.count({ where: { isActive: true, platform: { notIn: ['android', 'ios'] } } }),
      prisma.notification.count({ where: { status: 'SENT' } }),
    ]);

    return NextResponse.json({
      config,
      history,
      metrics: {
        totalDevices,
        androidDevices,
        iosDevices,
        otherDevices,
        totalSent,
      },
    });
  } catch (error) {
    console.error('Fetch notification settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can modify notification settings' }, { status: 403 });
    }

    const body = await req.json();
    let {
      provider = 'FCM',
      fcmProjectId = '',
      fcmClientEmail = '',
      fcmPrivateKey = '',
      fcmServerKey = '',
      fcmTopic = 'all_users',
      oneSignalAppId = '',
      oneSignalRestKey = '',
      isEnabled = false,
      serviceAccountJson,
    } = body;

    // Auto-parse Service Account JSON if provided
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

    // Format & validate RSA Private Key if provided
    if (fcmPrivateKey && typeof fcmPrivateKey === 'string' && fcmPrivateKey.trim()) {
      try {
        fcmPrivateKey = formatPrivateKey(fcmPrivateKey);
      } catch (keyErr: any) {
        return NextResponse.json(
          { error: keyErr.message || 'Invalid Firebase Service Account RSA Private Key' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.notificationSetting.upsert({
      where: { id: 'default' },
      update: {
        provider: provider || 'FCM',
        fcmProjectId: (fcmProjectId || '').trim(),
        fcmClientEmail: (fcmClientEmail || '').trim(),
        fcmPrivateKey: (fcmPrivateKey || '').trim(),
        fcmServerKey: (fcmServerKey || '').trim(),
        fcmTopic: (fcmTopic || 'all_users').trim(),
        oneSignalAppId: (oneSignalAppId || '').trim(),
        oneSignalRestKey: (oneSignalRestKey || '').trim(),
        isEnabled: Boolean(isEnabled),
      },
      create: {
        id: 'default',
        provider: provider || 'FCM',
        fcmProjectId: (fcmProjectId || '').trim(),
        fcmClientEmail: (fcmClientEmail || '').trim(),
        fcmPrivateKey: (fcmPrivateKey || '').trim(),
        fcmServerKey: (fcmServerKey || '').trim(),
        fcmTopic: (fcmTopic || 'all_users').trim(),
        oneSignalAppId: (oneSignalAppId || '').trim(),
        oneSignalRestKey: (oneSignalRestKey || '').trim(),
        isEnabled: Boolean(isEnabled),
      },
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATE_NOTIFICATION_SETTINGS',
      entity: 'SETTINGS',
      details: `Updated ${updated.provider} settings (Enabled: ${updated.isEnabled}, Project: ${updated.fcmProjectId || 'N/A'})`,
      req,
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error('Update notification settings error:', error);
    return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 });
  }
}
