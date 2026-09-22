import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [featuredPrompts, featuredCategories, totalPrompts, totalCategories] = await Promise.all([
      prisma.prompt.findMany({
        where: {
          isFeatured: true,
          isDeleted: false,
        },
        include: {
          category: {
            select: { id: true, title: true, slug: true, image: true, status: true },
          },
          subcategory: {
            select: { id: true, title: true, slug: true, image: true, status: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.category.findMany({
        where: {
          isFeatured: true,
        },
        include: {
          subcategories: {
            select: { id: true, title: true, slug: true, status: true },
          },
          _count: {
            select: {
              prompts: {
                where: { isDeleted: false },
              },
              subcategories: true,
            },
          },
        },
        orderBy: { position: 'asc' },
      }),
      prisma.prompt.count({ where: { isDeleted: false, status: true } }),
      prisma.category.count({ where: { status: true } }),
    ]);

    // Format prompt tags
    const formattedPrompts = featuredPrompts.map((p) => {
      let parsedTags: string[] = [];
      try {
        parsedTags = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags;
      } catch {
        parsedTags = [];
      }
      return {
        ...p,
        tags: parsedTags,
      };
    });

    const formattedCategories = featuredCategories.map((c) => ({
      ...c,
      promptCount: c._count.prompts,
      subcategoryCount: c._count.subcategories,
    }));

    const totalLikes = featuredPrompts.reduce((sum, p) => sum + p.likes, 0);
    const totalViews = featuredPrompts.reduce((sum, p) => sum + p.views, 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalFeaturedPrompts: featuredPrompts.length,
        totalFeaturedCategories: featuredCategories.length,
        featuredPromptLikes: totalLikes,
        featuredPromptViews: totalViews,
        totalPromptsCatalog: totalPrompts,
        totalCategoriesCatalog: totalCategories,
      },
      featuredPrompts: formattedPrompts,
      featuredCategories: formattedCategories,
    });
  } catch (error) {
    console.error('Featured GET API error:', error);
    return NextResponse.json({ error: 'Failed to fetch featured content' }, { status: 500 });
  }
}
