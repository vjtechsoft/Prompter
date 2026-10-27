import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getTrendingConfig, invalidateTrendingCache } from '@/lib/trending';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getTrendingConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Fetch trending settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending configuration' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      weightViews,
      weightLikes,
      weightCopies,
      weightShares,
      maxPromptsPerCategory,
      enableToday,
      enableWeekly,
      enableMonthly,
      enableAllTime,
      minScoreThreshold,
    } = body;

    // Validation
    const parsedWeightViews = Math.max(0, parseFloat(weightViews ?? 1.0));
    const parsedWeightLikes = Math.max(0, parseFloat(weightLikes ?? 3.0));
    const parsedWeightCopies = Math.max(0, parseFloat(weightCopies ?? 5.0));
    const parsedWeightShares = Math.max(0, parseFloat(weightShares ?? 4.0));
    const parsedMax = Math.min(100, Math.max(1, parseInt(maxPromptsPerCategory ?? 10, 10)));
    const parsedMinThreshold = Math.max(0, parseFloat(minScoreThreshold ?? 0.0));

    const updated = await prisma.trendingSetting.upsert({
      where: { id: 'default' },
      update: {
        weightViews: parsedWeightViews,
        weightLikes: parsedWeightLikes,
        weightCopies: parsedWeightCopies,
        weightShares: parsedWeightShares,
        maxPromptsPerCategory: parsedMax,
        enableToday: enableToday !== undefined ? Boolean(enableToday) : true,
        enableWeekly: enableWeekly !== undefined ? Boolean(enableWeekly) : true,
        enableMonthly: enableMonthly !== undefined ? Boolean(enableMonthly) : true,
        enableAllTime: enableAllTime !== undefined ? Boolean(enableAllTime) : true,
        minScoreThreshold: parsedMinThreshold,
      },
      create: {
        id: 'default',
        weightViews: parsedWeightViews,
        weightLikes: parsedWeightLikes,
        weightCopies: parsedWeightCopies,
        weightShares: parsedWeightShares,
        maxPromptsPerCategory: parsedMax,
        enableToday: enableToday !== undefined ? Boolean(enableToday) : true,
        enableWeekly: enableWeekly !== undefined ? Boolean(enableWeekly) : true,
        enableMonthly: enableMonthly !== undefined ? Boolean(enableMonthly) : true,
        enableAllTime: enableAllTime !== undefined ? Boolean(enableAllTime) : true,
        minScoreThreshold: parsedMinThreshold,
      },
    });

    // Invalidate cache immediately so new calculations take effect
    invalidateTrendingCache();

    // Log admin activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_TRENDING_SETTINGS',
        entity: 'TrendingSetting',
        details: JSON.stringify({
          weights: {
            views: parsedWeightViews,
            likes: parsedWeightLikes,
            copies: parsedWeightCopies,
            shares: parsedWeightShares,
          },
          maxPrompts: parsedMax,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Trending settings updated successfully',
      config: {
        id: updated.id,
        weightViews: Number(updated.weightViews),
        weightLikes: Number(updated.weightLikes),
        weightCopies: Number(updated.weightCopies),
        weightShares: Number(updated.weightShares),
        maxPromptsPerCategory: updated.maxPromptsPerCategory,
        enableToday: updated.enableToday,
        enableWeekly: updated.enableWeekly,
        enableMonthly: updated.enableMonthly,
        enableAllTime: updated.enableAllTime,
        minScoreThreshold: Number(updated.minScoreThreshold),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Update trending settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update trending settings' },
      { status: 500 }
    );
  }
}
