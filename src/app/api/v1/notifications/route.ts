import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateClientApiKey } from '@/lib/client-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateClientApiKey(req);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const notifications = await prisma.notification.findMany({
      where: {
        status: 'SENT',
      },
      orderBy: { sentAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        image: true,
        deepLink: true,
        sentAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      meta: {
        count: notifications.length,
      },
    });
  } catch (error) {
    console.error('Client notifications feed error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve notifications' },
      { status: 500 }
    );
  }
}
