import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { sendFcmNotification } from '@/lib/fcm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can send notifications' }, { status: 403 });
    }

    const { id } = params;
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.status === 'SENT') {
      return NextResponse.json({ error: 'This notification has already been sent' }, { status: 400 });
    }

    // Fetch active notification configuration
    const config = await prisma.notificationSetting.findUnique({
      where: { id: 'default' },
    });

    const effectiveTopic = (notification.targetTopic || config?.fcmTopic || 'all_users')
      .trim()
      .replace(/^\/topics\//, '');

    let fcmResult: {
      success: boolean;
      successCount: number;
      failureCount: number;
      error?: string;
    } = {
      success: false,
      successCount: 0,
      failureCount: 1,
      error: 'Push notifications are not enabled in settings',
    };

    if (config && config.isEnabled) {
      if (config.provider === 'FCM' || config.fcmProjectId || config.fcmServerKey) {
        fcmResult = await sendFcmNotification({
          title: notification.title.trim(),
          message: notification.message.trim(),
          image: notification.image ? notification.image.trim() : null,
          deepLink: notification.deepLink ? notification.deepLink.trim() : null,
          topic: effectiveTopic,
          config: {
            fcmProjectId: config.fcmProjectId,
            fcmClientEmail: config.fcmClientEmail,
            fcmPrivateKey: config.fcmPrivateKey,
            fcmServerKey: config.fcmServerKey,
            fcmTopic: effectiveTopic,
          },
        });
      }
    }

    const nextStatus = fcmResult.success ? 'SENT' : 'FAILED';

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        status: nextStatus,
        sentAt: new Date(),
        successCount: fcmResult.successCount,
        failureCount: fcmResult.failureCount,
        errorMessage: fcmResult.error || null,
      },
    });

    await logActivity({
      userId: user.id,
      action: 'DISPATCH_SCHEDULED_NOW',
      entity: 'NOTIFICATION',
      details: `Immediately dispatched scheduled notification "${notification.title}" to topic "${effectiveTopic}" (Status: ${nextStatus})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: fcmResult.success
        ? `Notification "${notification.title}" sent immediately to topic "${effectiveTopic}"`
        : `Notification logged in dashboard (FCM dispatch notice: ${fcmResult.error})`,
      notification: updated,
    });
  } catch (error: any) {
    console.error('Send scheduled now error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch notification now' },
      { status: 500 }
    );
  }
}
