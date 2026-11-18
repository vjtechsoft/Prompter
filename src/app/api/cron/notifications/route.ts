import { NextRequest, NextResponse } from 'next/server';
import { processScheduledNotifications } from '@/lib/notification-scheduler';
import { getCurrentUser, timingSafeEqualStr } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization') || '';
    const providedBearer = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

    let isAuthorized = false;

    // 1. Authorize via CRON_SECRET if configured (constant-time check)
    if (cronSecret && providedBearer && timingSafeEqualStr(providedBearer, cronSecret)) {
      isAuthorized = true;
    }

    // 2. Fallback: Authorize via active Admin user session
    if (!isAuthorized) {
      const user = await getCurrentUser(req);
      if (user && user.role === 'SUPER_ADMIN') {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid CRON_SECRET or Super Admin session required' },
        { status: 401 }
      );
    }

    const summary = await processScheduledNotifications();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (error: any) {
    console.error('Cron scheduled notifications error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process scheduled notifications' },
      { status: 500 }
    );
  }
}
