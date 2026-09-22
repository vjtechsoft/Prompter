import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No user IDs provided' }, { status: 400 });
    }

    let affectedCount = 0;

    switch (action) {
      case 'ACTIVATE': {
        const res = await prisma.appUser.updateMany({
          where: { id: { in: ids } },
          data: { status: 'ACTIVE' },
        });
        affectedCount = res.count;
        break;
      }
      case 'BLOCK': {
        const res = await prisma.appUser.updateMany({
          where: { id: { in: ids } },
          data: { status: 'BLOCKED' },
        });
        affectedCount = res.count;
        break;
      }
      case 'VIP_ENABLE': {
        const res = await prisma.appUser.updateMany({
          where: { id: { in: ids } },
          data: { isVip: true },
        });
        affectedCount = res.count;
        break;
      }
      case 'VIP_DISABLE': {
        const res = await prisma.appUser.updateMany({
          where: { id: { in: ids } },
          data: { isVip: false },
        });
        affectedCount = res.count;
        break;
      }
      case 'DELETE': {
        const res = await prisma.appUser.deleteMany({
          where: { id: { in: ids } },
        });
        affectedCount = res.count;
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid bulk action' }, { status: 400 });
    }

    await logActivity({
      userId: user.id,
      action: `BULK_${action}_APP_USERS`,
      entity: 'APP_USER',
      details: `Performed bulk ${action} on ${affectedCount} client app user(s)`,
      req,
    });

    return NextResponse.json({ success: true, count: affectedCount });
  } catch (error) {
    console.error('Bulk user operation error:', error);
    return NextResponse.json({ error: 'Failed to perform bulk operation' }, { status: 500 });
  }
}
