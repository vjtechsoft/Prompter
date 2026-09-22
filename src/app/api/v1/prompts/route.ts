import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculatePopularScore, calculateTrendingScore, seededHash } from '@/lib/utils';
import { validateClientApiKey } from '@/lib/client-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateClientApiKey(req);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category') || '';
    const subcategory = searchParams.get('subcategory')?.trim() || '';
    const isPremium = searchParams.get('isPremium');
    const isFeatured = searchParams.get('isFeatured') || searchParams.get('featured');
    const sortBy = searchParams.get('sortBy') || 'latest';

    // Public client constraint: Only active, published, and non-deleted prompts
    // whose parent category is ACTIVE, and whose subcategory (if assigned) is also ACTIVE
    const andConditions: any[] = [
      {
        OR: [
          { subcategoryId: null },
          { subcategory: { status: true } },
        ],
      },
    ];

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search } },
          { prompt: { contains: search } },
          { tags: { contains: search } },
        ],
      });
    }

    if (subcategory && subcategory !== 'all') {
      // Allow filtering by subcategory ID or Subcategory Slug (must be active)
      andConditions.push({
        subcategory: {
          status: true,
          OR: [{ id: subcategory }, { slug: subcategory }],
        },
      });
    }

    const where: any = {
      isDeleted: false,
      status: true,
      category: {
        status: true,
        ...(category && category !== 'all' ? { OR: [{ id: category }, { slug: category }] } : {}),
      },
      AND: andConditions,
    };

    if (isPremium === 'true') {
      where.isPremium = true;
    } else if (isPremium === 'false') {
      where.isPremium = false;
    }

    if (isFeatured === 'true') {
      where.isFeatured = true;
    } else if (isFeatured === 'false') {
      where.isFeatured = false;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sortBy === 'views') orderBy = { views: 'desc' };
    else if (sortBy === 'likes') orderBy = { likes: 'desc' };

    // Seed handling for non-repeating random pagination
    const seedParam = searchParams.get('seed');
    const seed = seedParam ? parseInt(seedParam, 10) || 12345 : Math.floor(Math.random() * 900000) + 100000;

    const isCustomScoreSort = sortBy === 'trending' || sortBy === 'popular' || sortBy === 'random';

    let total = 0;
    let prompts: any[] = [];

    if (!isCustomScoreSort) {
      total = await prisma.prompt.count({ where });
      prompts = await prisma.prompt.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          prompt: true,
          featuredImage: true,
          tags: true,
          likes: true,
          views: true,
          shares: true,
          isPremium: true,
          isFeatured: true,
          createdAt: true,
          category: {
            select: { id: true, title: true, slug: true, image: true },
          },
          subcategory: {
            select: { id: true, title: true, slug: true, image: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });
    } else {
      const allMatching = await prisma.prompt.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          prompt: true,
          featuredImage: true,
          tags: true,
          likes: true,
          views: true,
          shares: true,
          isPremium: true,
          isFeatured: true,
          createdAt: true,
          category: {
            select: { id: true, title: true, slug: true, image: true },
          },
          subcategory: {
            select: { id: true, title: true, slug: true, image: true },
          },
        },
      });

      total = allMatching.length;

      const scored = allMatching.map((p) => ({
        ...p,
        trendingScore: calculateTrendingScore(p.views, p.likes, p.shares),
        popularScore: calculatePopularScore(p.views, p.likes, p.shares),
      }));

      if (sortBy === 'trending') {
        scored.sort((a, b) => b.trendingScore - a.trendingScore);
      } else if (sortBy === 'popular') {
        scored.sort((a, b) => b.popularScore - a.popularScore);
      } else if (sortBy === 'random') {
        // Deterministic seeded pseudo-random shuffle: zero duplicates across pages for the same seed
        scored.sort((a, b) => seededHash(a.id, seed) - seededHash(b.id, seed));
      }

      const skip = (page - 1) * limit;
      prompts = scored.slice(skip, skip + limit);
    }

    // Check liked prompts if userId or deviceId provided
    const userId = searchParams.get('userId') || req.headers.get('x-user-id') || req.headers.get('x-client-user-id');
    const deviceId = searchParams.get('deviceId') || req.headers.get('x-device-id') || req.headers.get('x-client-id');
    let likedPromptIds = new Set<string>();

    if (userId || deviceId) {
      const clientIdentifier = userId
        ? `user:${userId.trim().toLowerCase()}`
        : `device:${deviceId?.trim()}`;

      const promptIds = prompts.map((p) => p.id);
      if (promptIds.length > 0) {
        const userLikes = await prisma.promptLike.findMany({
          where: {
            clientIdentifier,
            promptId: { in: promptIds },
          },
          select: { promptId: true },
        });
        likedPromptIds = new Set(userLikes.map((l) => l.promptId));
      }
    }

    const formatted = prompts.map((p) => {
      let parsedTags: string[] = [];
      try {
        parsedTags = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags;
      } catch {
        parsedTags = [];
      }

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        prompt: p.prompt,
        featuredImage: p.featuredImage,
        category: p.category,
        subcategory: p.subcategory || null,
        tags: parsedTags,
        likes: p.likes,
        views: p.views,
        shares: p.shares,
        isPremium: p.isPremium,
        isFeatured: p.isFeatured,
        isLiked: likedPromptIds.has(p.id),
        trendingScore: calculateTrendingScore(p.views, p.likes, p.shares),
        popularScore: calculatePopularScore(p.views, p.likes, p.shares),
        deepLink: `prompter://prompt/${p.slug}`,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
        seed: sortBy === 'random' ? seed : undefined,
      },
    });
  } catch (error) {
    console.error('Client API error (prompts):', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch prompts' }, { status: 500 });
  }
}
