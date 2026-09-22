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

    const { ids, action, value } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No prompt IDs provided' }, { status: 400 });
    }

    if (action === 'delete') {
      await prisma.prompt.updateMany({
        where: { id: { in: ids } },
        data: { isDeleted: true },
      });
      await logActivity({
        userId: user.id,
        action: 'BULK_SOFT_DELETE',
        entity: 'PROMPT',
        details: `Moved ${ids.length} prompts to trash`,
        req,
      });
      return NextResponse.json({ success: true, message: `${ids.length} prompts moved to trash` });
    } else if (action === 'force_delete') {
      await prisma.prompt.deleteMany({
        where: { id: { in: ids } },
      });
      await logActivity({
        userId: user.id,
        action: 'BULK_FORCE_DELETE',
        entity: 'PROMPT',
        details: `Permanently deleted ${ids.length} prompts`,
        req,
      });
      return NextResponse.json({ success: true, message: `${ids.length} prompts permanently deleted` });
    } else if (action === 'restore') {
      await prisma.prompt.updateMany({
        where: { id: { in: ids } },
        data: { isDeleted: false },
      });
      await logActivity({
        userId: user.id,
        action: 'BULK_RESTORE',
        entity: 'PROMPT',
        details: `Restored ${ids.length} prompts from trash`,
        req,
      });
      return NextResponse.json({ success: true, message: `${ids.length} prompts restored` });
    } else if (action === 'status') {
      const newStatus = Boolean(value);
      await prisma.prompt.updateMany({
        where: { id: { in: ids } },
        data: { status: newStatus },
      });
      await logActivity({
        userId: user.id,
        action: 'BULK_UPDATE_STATUS',
        entity: 'PROMPT',
        details: `Updated status to ${newStatus ? 'Active' : 'Inactive'} for ${ids.length} prompts`,
        req,
      });
      return NextResponse.json({
        success: true,
        message: `Updated status for ${ids.length} prompts`,
      });
    } else if (action === 'premium') {
      const isPremium = Boolean(value);
      await prisma.prompt.updateMany({
        where: { id: { in: ids } },
        data: { isPremium },
      });
      await logActivity({
        userId: user.id,
        action: 'BULK_UPDATE_PREMIUM',
        entity: 'PROMPT',
        details: `Updated premium to ${isPremium ? 'Premium' : 'Free'} for ${ids.length} prompts`,
        req,
      });
      return NextResponse.json({
        success: true,
        message: `Updated premium status for ${ids.length} prompts`,
      });
    }

    return NextResponse.json({ error: 'Invalid bulk action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk prompt action error:', error);
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 });
  }
}
