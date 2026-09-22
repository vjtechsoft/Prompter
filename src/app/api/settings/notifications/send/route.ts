import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

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
    const { title, message, image, deepLink, sendToAll, scheduledAt } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

    const notification = await prisma.notification.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        image: image || null,
        deepLink: deepLink || null,
        sendToAll: sendToAll !== undefined ? Boolean(sendToAll) : true,
        scheduledAt: isScheduled ? new Date(scheduledAt) : null,
        sentAt: isScheduled ? null : new Date(),
        status: isScheduled ? 'SCHEDULED' : 'SENT',
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
      details: `${isScheduled ? 'Scheduled' : 'Sent'} push notification "${notification.title}"`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: isScheduled ? 'Notification successfully scheduled' : 'Notification dispatched to all users',
      notification,
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json({ error: 'Failed to dispatch notification' }, { status: 500 });
  }
}
