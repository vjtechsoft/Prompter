import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { processScheduledNotifications } from '@/lib/notification-scheduler';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can dispatch scheduled notifications' }, { status: 403 });
    }

    const summary = await processScheduledNotifications();

    if (summary.processed > 0) {
      await logActivity({
        userId: user.id,
        action: 'PROCESS_SCHEDULED_NOTIFICATIONS',
        entity: 'NOTIFICATION',
        details: `Processed ${summary.processed} scheduled notification(s): ${summary.successful} sent, ${summary.failed} failed`,
        req,
      });
    }

    return NextResponse.json({
      success: true,
      message: summary.processed > 0
        ? `Successfully processed ${summary.processed} scheduled notification(s) (${summary.successful} sent, ${summary.failed} failed)`
        : 'No pending scheduled notifications due for delivery right now',
      summary,
    });
  } catch (error: any) {
    console.error('Process scheduled notifications error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process scheduled notifications' },
      { status: 500 }
    );
  }
}
