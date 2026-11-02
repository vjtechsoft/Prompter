import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import { sendFcmNotification } from '@/lib/fcm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can broadcast notifications' }, { status: 403 });
    }

    const body = await req.json();
    const { title, message, image, deepLink, targetTopic, sendToAll, scheduledAt } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

    // Fetch active notification configuration
    const config = await prisma.notificationSetting.findUnique({
      where: { id: 'default' },
    });

    const effectiveTopic = (targetTopic || config?.fcmTopic || 'all_users').trim().replace(/^\/topics\//, '');

    let fcmResult: {
      success: boolean;
      successCount: number;
      failureCount: number;
      messageId?: string;
      error?: string;
    } = {
      success: true,
      successCount: 0,
      failureCount: 0,
    };

    // If not scheduled and notifications are enabled, dispatch to FCM
    if (!isScheduled) {
      if (config && config.isEnabled) {
        if (config.provider === 'FCM' || config.fcmProjectId || config.fcmServerKey) {
          fcmResult = await sendFcmNotification({
            title: title.trim(),
            message: message.trim(),
            image: image ? image.trim() : null,
            deepLink: deepLink ? deepLink.trim() : null,
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
    }

    const notificationStatus = isScheduled
      ? 'SCHEDULED'
      : fcmResult.success
      ? 'SENT'
      : 'FAILED';

    const notification = await prisma.notification.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        image: image ? image.trim() : null,
        deepLink: deepLink ? deepLink.trim() : null,
        targetTopic: effectiveTopic,
        sendToAll: sendToAll !== undefined ? Boolean(sendToAll) : true,
        scheduledAt: isScheduled ? new Date(scheduledAt) : null,
        sentAt: isScheduled ? null : new Date(),
        status: notificationStatus,
        successCount: fcmResult.successCount,
        failureCount: fcmResult.failureCount,
        errorMessage: fcmResult.error || null,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logActivity({
      userId: user.id,
      action: isScheduled ? 'SCHEDULE_NOTIFICATION' : 'BROADCAST_NOTIFICATION',
      entity: 'NOTIFICATION',
      details: `${isScheduled ? 'Scheduled' : 'Sent'} push notification "${notification.title}" to topic "${effectiveTopic}" (Status: ${notificationStatus})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: isScheduled
        ? 'Notification successfully scheduled'
        : fcmResult.success
        ? `Notification dispatched successfully to topic "${effectiveTopic}" via Firebase Cloud Messaging`
        : `Notification logged in dashboard (FCM dispatch notice: ${fcmResult.error})`,
      notification,
      fcm: fcmResult,
    });
  } catch (error: any) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch notification' },
      { status: 500 }
    );
  }
}
