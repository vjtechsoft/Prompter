import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

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
        data: { id: 'default' },
      });
    }

    const history = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ config, history });
  } catch (error) {
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
    const { oneSignalAppId, oneSignalRestKey, isEnabled } = body;

    const updated = await prisma.notificationSetting.upsert({
      where: { id: 'default' },
      update: {
        oneSignalAppId: oneSignalAppId || '',
        oneSignalRestKey: oneSignalRestKey || '',
        isEnabled: Boolean(isEnabled),
      },
      create: {
        id: 'default',
        oneSignalAppId: oneSignalAppId || '',
        oneSignalRestKey: oneSignalRestKey || '',
        isEnabled: Boolean(isEnabled),
      },
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATE_NOTIFICATION_SETTINGS',
      entity: 'SETTINGS',
      details: `Updated OneSignal settings (Enabled: ${updated.isEnabled})`,
      req,
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 });
  }
}
