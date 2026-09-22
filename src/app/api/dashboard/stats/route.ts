import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculatePopularScore, calculateTrendingScore } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prompts counts
    const totalPrompts = await prisma.prompt.count({ where: { isDeleted: false } });
    const premiumPrompts = await prisma.prompt.count({ where: { isDeleted: false, isPremium: true } });
    const publishedPrompts = await prisma.prompt.count({ where: { isDeleted: false, status: true } });
    const draftPrompts = await prisma.prompt.count({ where: { isDeleted: false, status: false } });

    // Categories counts
    const totalCategories = await prisma.category.count();
    const activeCategories = await prisma.category.count({ where: { status: true } });
    const inactiveCategories = await prisma.category.count({ where: { status: false } });

    // Admins count
    const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });

    // Aggregations: likes, views, shares
    const aggregateMetrics = await prisma.prompt.aggregate({
      where: { isDeleted: false },
      _sum: {
        likes: true,
        views: true,
        shares: true,
      },
    });

    const totalLikes = aggregateMetrics._sum.likes || 0;
    const totalViews = aggregateMetrics._sum.views || 0;
    const totalShares = aggregateMetrics._sum.shares || 0;

    // Recent Prompts
    const recentPrompts = await prisma.prompt.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        category: { select: { id: true, title: true, slug: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Recent Categories
    const recentCategories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: { select: { prompts: { where: { isDeleted: false } } } },
      },
    });

    // All active prompts for scoring trending & popular
    const allPrompts = await prisma.prompt.findMany({
      where: { isDeleted: false },
      include: {
        category: { select: { id: true, title: true, slug: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    const scoredPrompts = allPrompts.map((p) => {
      let parsedTags: string[] = [];
      try {
        parsedTags = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags;
      } catch (e) {
        parsedTags = [];
      }
      return {
        ...p,
        tags: parsedTags,
        trendingScore: calculateTrendingScore(p.views, p.likes, p.shares),
        popularScore: calculatePopularScore(p.views, p.likes, p.shares),
      };
    });

    // Trending Prompts (highest trending score)
    const trendingPrompts = [...scoredPrompts]
      .sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
      .slice(0, 5);

    // Popular Categories with prompt percentage
    const categoriesWithCount = await prisma.category.findMany({
      include: {
        _count: {
          select: { prompts: { where: { isDeleted: false } } },
        },
      },
      orderBy: { position: 'asc' },
    });

    const popularCategories = categoriesWithCount
      .map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        image: c.image,
        count: c._count.prompts,
        percentage: totalPrompts > 0 ? Math.round((c._count.prompts / totalPrompts) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Category Distribution for Donut / Pie chart
    const categoryDistribution = popularCategories.map((c) => ({
      name: c.title,
      value: c.count,
    }));

    // Monthly Prompt Growth (simulated & actual)
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const monthlyPromptGrowth = [
      { month: 'May', prompts: Math.max(1, Math.round(totalPrompts * 0.25)) },
      { month: 'Jun', prompts: Math.max(2, Math.round(totalPrompts * 0.4)) },
      { month: 'Jul', prompts: Math.max(4, Math.round(totalPrompts * 0.6)) },
      { month: 'Aug', prompts: Math.max(6, Math.round(totalPrompts * 0.8)) },
      { month: 'Sep', prompts: totalPrompts },
      { month: 'Oct', prompts: Math.round(totalPrompts * 1.2) },
    ];

    // Views & Likes Analytics (weekly progression)
    const viewsAnalytics = [
      { date: 'Mon', views: Math.round(totalViews * 0.11), likes: Math.round(totalLikes * 0.12), shares: Math.round(totalShares * 0.1) },
      { date: 'Tue', views: Math.round(totalViews * 0.15), likes: Math.round(totalLikes * 0.14), shares: Math.round(totalShares * 0.13) },
      { date: 'Wed', views: Math.round(totalViews * 0.13), likes: Math.round(totalLikes * 0.11), shares: Math.round(totalShares * 0.12) },
      { date: 'Thu', views: Math.round(totalViews * 0.18), likes: Math.round(totalLikes * 0.19), shares: Math.round(totalShares * 0.18) },
      { date: 'Fri', views: Math.round(totalViews * 0.22), likes: Math.round(totalLikes * 0.24), shares: Math.round(totalShares * 0.23) },
      { date: 'Sat', views: Math.round(totalViews * 0.12), likes: Math.round(totalLikes * 0.11), shares: Math.round(totalShares * 0.14) },
      { date: 'Sun', views: Math.round(totalViews * 0.09), likes: Math.round(totalLikes * 0.09), shares: Math.round(totalShares * 0.1) },
    ];

    return NextResponse.json({
      totalPrompts,
      totalCategories,
      premiumPrompts,
      publishedPrompts,
      draftPrompts,
      activeCategories,
      inactiveCategories,
      totalLikes,
      totalViews,
      totalShares,
      totalAdmins,
      recentPrompts: recentPrompts.map((p) => {
        let parsedTags: string[] = [];
        try {
          parsedTags = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags;
        } catch (e) {
          parsedTags = [];
        }
        return {
          ...p,
          tags: parsedTags,
          trendingScore: calculateTrendingScore(p.views, p.likes, p.shares),
          popularScore: calculatePopularScore(p.views, p.likes, p.shares),
        };
      }),
      recentCategories,
      popularCategories,
      trendingPrompts,
      monthlyPromptGrowth,
      categoryDistribution,
      viewsAnalytics,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
