import { NextRequest, NextResponse } from 'next/server';
import { validateClientApiKey } from '@/lib/client-auth';
import { getDynamicTrending } from '@/lib/trending';
import { TrendingPeriod } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateClientApiKey(req);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const periodParam = searchParams.get('period')?.toLowerCase();
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Optional user identification for isLiked state
    const userId =
      searchParams.get('userId') ||
      req.headers.get('x-user-id') ||
      req.headers.get('x-client-user-id');
    const deviceId =
      searchParams.get('deviceId') ||
      req.headers.get('x-device-id') ||
      req.headers.get('x-client-id');

    const validPeriods: TrendingPeriod[] = ['today', 'weekly', 'monthly', 'all_time'];
    const period = validPeriods.includes(periodParam as TrendingPeriod)
      ? (periodParam as TrendingPeriod)
      : undefined;

    const result = await getDynamicTrending({
      period,
      limit,
      userId,
      deviceId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Client trending API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve trending prompts' },
      { status: 500 }
    );
  }
}
