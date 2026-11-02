import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can delete notifications' }, { status: 403 });
    }

    const { id } = params;
    const existing = await prisma.notification.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    await prisma.notification.delete({
      where: { id },
    });

    await logActivity({
      userId: user.id,
      action: 'DELETE_NOTIFICATION',
      entity: 'NOTIFICATION',
      details: `Deleted notification "${existing.title}"`,
      req,
    });

    return NextResponse.json({ success: true, message: 'Notification removed' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
