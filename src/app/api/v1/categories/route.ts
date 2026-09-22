import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateClientApiKey } from '@/lib/client-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateClientApiKey(req);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isFeatured = searchParams.get('isFeatured') || searchParams.get('featured');

    const where: any = {
      status: true,
    };

    if (isFeatured === 'true') {
      where.isFeatured = true;
    } else if (isFeatured === 'false') {
      where.isFeatured = false;
    }

    // Only return active categories for the client app
    const categories = await prisma.category.findMany({
      where,
      orderBy: {
        position: 'asc',
      },
      include: {
        subcategories: {
          where: { status: true },
          orderBy: { position: 'asc' },
          include: {
            _count: {
              select: {
                prompts: {
                  where: {
                    isDeleted: false,
                    status: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            prompts: {
              where: {
                isDeleted: false,
                status: true,
                OR: [
                  { subcategoryId: null },
                  { subcategory: { status: true } },
                ],
              },
            },
          },
        },
      },
    });

    const formatted = categories.map((cat) => ({
      id: cat.id,
      title: cat.title,
      slug: cat.slug,
      image: cat.image,
      position: cat.position,
      isFeatured: cat.isFeatured,
      promptCount: cat._count.prompts,
      subcategories: cat.subcategories.map((sub) => ({
        id: sub.id,
        title: sub.title,
        slug: sub.slug,
        image: sub.image,
        position: sub.position,
        promptCount: sub._count.prompts,
        deepLink: `prompter://category/${cat.slug}/sub/${sub.slug}`,
      })),
      deepLink: `prompter://category/${cat.slug}`,
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
  }
}
