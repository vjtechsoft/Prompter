import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getDynamicTrending, getTrendingConfig, getPeriodDateRanges, getAppTimezone } from '@/lib/trending';
import { TrendingPeriod } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const periodParam = searchParams.get('period')?.toLowerCase();
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const forceRefresh = searchParams.get('refresh') === 'true';

    const validPeriods: TrendingPeriod[] = ['today', 'weekly', 'monthly', 'all_time'];
    const period = validPeriods.includes(periodParam as TrendingPeriod)
      ? (periodParam as TrendingPeriod)
      : undefined;

    // Fetch config and trending prompts
    const config = await getTrendingConfig();
    const trendingData = await getDynamicTrending({
      period,
      limit,
      forceRefresh,
    });

    const timezone = await getAppTimezone();
    const boundaries = getPeriodDateRanges(timezone);

    // Activity metrics summary
    const [todayActivities, weeklyActivities, monthlyActivities, totalActivities] = await Promise.all([
      prisma.promptActivity.count({
        where: { createdAt: { gte: boundaries.todayStart } },
      }),
      prisma.promptActivity.count({
        where: { createdAt: { gte: boundaries.weeklyStart } },
      }),
      prisma.promptActivity.count({
        where: { createdAt: { gte: boundaries.monthlyStart } },
      }),
      prisma.promptActivity.count(),
    ]);

    return NextResponse.json({
      success: true,
      config,
      trending: trendingData,
      activityStats: {
        todayCount: todayActivities,
        weeklyCount: weeklyActivities,
        monthlyCount: monthlyActivities,
        totalCount: totalActivities,
      },
    });
  } catch (error) {
    console.error('Admin trending API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load trending prompts' },
      { status: 500 }
    );
  }
}
