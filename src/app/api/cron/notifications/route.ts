import { NextRequest, NextResponse } from 'next/server';
import { processScheduledNotifications } from '@/lib/notification-scheduler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // If CRON_SECRET is configured in environment, verify authorization
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
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
