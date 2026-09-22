import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculatePopularScore, calculateTrendingScore } from '@/lib/utils';
import { validateClientApiKey } from '@/lib/client-auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await validateClientApiKey(req);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const { id } = params;

    const prompt = await prisma.prompt.findFirst({
      where: {
        isDeleted: false,
        status: true,
        category: {
          status: true,
        },
        AND: [
          {
            OR: [{ id }, { slug: id }],
          },
          {
            OR: [
              { subcategoryId: null },
              { subcategory: { status: true } },
            ],
          },
        ],
      },
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

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt not found or unavailable' }, { status: 404 });
    }

    let parsedTags: string[] = [];
    try {
      parsedTags = typeof prompt.tags === 'string' ? JSON.parse(prompt.tags) : prompt.tags;
    } catch {
      parsedTags = [];
    }

    // Check if current client/user has liked this prompt
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || req.headers.get('x-user-id') || req.headers.get('x-client-user-id');
    const deviceId = searchParams.get('deviceId') || req.headers.get('x-device-id') || req.headers.get('x-client-id');
    let isLiked = false;

    if (userId || deviceId) {
      const clientIdentifier = userId
        ? `user:${userId.trim().toLowerCase()}`
        : `device:${deviceId?.trim()}`;

      const existingLike = await prisma.promptLike.findUnique({
        where: {
          promptId_clientIdentifier: {
            promptId: prompt.id,
            clientIdentifier,
          },
        },
      });
      isLiked = Boolean(existingLike);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...prompt,
        tags: parsedTags,
        isLiked,
        trendingScore: calculateTrendingScore(prompt.views, prompt.likes, prompt.shares),
        popularScore: calculatePopularScore(prompt.views, prompt.likes, prompt.shares),
        deepLink: `prompter://prompt/${prompt.slug}`,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to retrieve prompt' }, { status: 500 });
  }
}
