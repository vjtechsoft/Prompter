import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculatePopularScore, calculateTrendingScore, seededHash, slugify } from '@/lib/utils';
import { logActivity } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category') || '';
    const subcategory = searchParams.get('subcategory') || searchParams.get('subcategoryId') || '';
    const isPremium = searchParams.get('isPremium');
    const isFeatured = searchParams.get('isFeatured');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const createdById = searchParams.get('createdById');
    const sortBy = searchParams.get('sortBy') || 'latest';
    const isDeletedParam = searchParams.get('isDeleted') === 'true';

    const where: any = {
      isDeleted: isDeletedParam,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { prompt: { contains: search } },
        { tags: { contains: search } },
        { createdBy: { name: { contains: search } } },
      ];
    }

    if (category && category !== 'all') {
      where.categoryId = category;
    }

    if (subcategory && subcategory !== 'all') {
      where.subcategoryId = subcategory;
    }

    if (isPremium !== null && isPremium !== undefined && isPremium !== 'all') {
      where.isPremium = isPremium === 'true';
    }

    if (isFeatured !== null && isFeatured !== undefined && isFeatured !== 'all') {
      where.isFeatured = isFeatured === 'true';
    }

    if (status !== null && status !== undefined && status !== 'all') {
      where.status = status === 'true';
    }

    if (createdById && createdById !== 'all') {
      where.createdById = createdById;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Determine ordering
    let orderBy: any = { createdAt: 'desc' };

    if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sortBy === 'most_viewed') {
      orderBy = { views: 'desc' };
    } else if (sortBy === 'most_liked') {
      orderBy = { likes: 'desc' };
    } else if (sortBy === 'most_shared') {
      orderBy = { shares: 'desc' };
    } else if (sortBy === 'a-z') {
      orderBy = { title: 'asc' };
    } else if (sortBy === 'z-a') {
      orderBy = { title: 'desc' };
    }

    // Seed handling for repeatable random sorting without data repetition across pagination
    const seedParam = searchParams.get('seed');
    const seed = seedParam ? parseInt(seedParam, 10) || 12345 : Math.floor(Math.random() * 900000) + 100000;

    // Custom sorting: trending, popular, or deterministic seeded random
    const isCustomScoreSort = sortBy === 'trending' || sortBy === 'popular' || sortBy === 'random';

    let total = 0;
    let prompts: any[] = [];

    if (!isCustomScoreSort) {
      total = await prisma.prompt.count({ where });
      prompts = await prisma.prompt.findMany({
        where,
        include: {
          category: {
            select: { id: true, title: true, slug: true },
          },
          subcategory: {
            select: { id: true, title: true, slug: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      });
    } else {
      // Fetch matching records and sort by score or seeded hash
      const allMatching = await prisma.prompt.findMany({
        where,
        include: {
          category: {
            select: { id: true, title: true, slug: true },
          },
          subcategory: {
            select: { id: true, title: true, slug: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
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
        scored.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
      } else if (sortBy === 'popular') {
        scored.sort((a, b) => (b.popularScore || 0) - (a.popularScore || 0));
      } else if (sortBy === 'random') {
        // Deterministic pseudo-random shuffle using seed: items are reliably placed with zero pagination repetition
        scored.sort((a, b) => seededHash(a.id, seed) - seededHash(b.id, seed));
      }

      const skip = (page - 1) * limit;
      prompts = scored.slice(skip, skip + limit);
    }

    const formattedPrompts = prompts.map((p) => {
      let parsedTags: string[] = [];
      try {
        parsedTags = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags;
      } catch (e) {
        parsedTags = p.tags ? p.tags.split(',').map((t: string) => t.trim()) : [];
      }

      return {
        ...p,
        tags: parsedTags,
        trendingScore: calculateTrendingScore(p.views, p.likes, p.shares),
        popularScore: calculatePopularScore(p.views, p.likes, p.shares),
      };
    });

    return NextResponse.json({
      prompts: formattedPrompts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        seed: sortBy === 'random' ? seed : undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, prompt, featuredImage, categoryId, subcategoryId, tags, isPremium, isFeatured, status } = body;

    if (!title?.trim() || !prompt?.trim() || !categoryId) {
      return NextResponse.json(
        { error: 'Title, prompt content, and category are required' },
        { status: 400 }
      );
    }

    // Check unique title
    const existingTitle = await prisma.prompt.findFirst({
      where: { title: title.trim() },
    });

    if (existingTitle) {
      return NextResponse.json({ error: 'A prompt with this title already exists' }, { status: 400 });
    }

    // Generate slug and ensure uniqueness
    let baseSlug = slugify(title);
    let finalSlug = baseSlug;
    let counter = 1;

    while (await prisma.prompt.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify([]);

    const newPrompt = await prisma.prompt.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        prompt: prompt.trim(),
        featuredImage: featuredImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        categoryId,
        subcategoryId: subcategoryId || null,
        tags: tagsJson,
        isPremium: Boolean(isPremium),
        isFeatured: Boolean(isFeatured),
        status: status !== undefined ? Boolean(status) : true,
        createdById: user.id,
      },
      include: {
        category: true,
        subcategory: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logActivity({
      userId: user.id,
      action: 'CREATE_PROMPT',
      entity: 'PROMPT',
      details: `Created prompt "${newPrompt.title}"`,
      req,
    });

    return NextResponse.json({ success: true, prompt: newPrompt }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating prompt:', error);
    return NextResponse.json({ error: error.message || 'Failed to create prompt' }, { status: 500 });
  }
}
