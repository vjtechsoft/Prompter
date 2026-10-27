import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDynamicTrending, invalidateTrendingCache } from '@/lib/trending';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Clear the cache
    invalidateTrendingCache();

    // Recalculate fresh rankings
    const freshData = await getDynamicTrending({ forceRefresh: true });

    return NextResponse.json({
      success: true,
      message: 'Trending cache recalculated and refreshed successfully',
      data: freshData,
    });
  } catch (error) {
    console.error('Refresh trending cache error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh trending cache' },
      { status: 500 }
    );
  }
}
