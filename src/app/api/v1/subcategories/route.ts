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
    const category = searchParams.get('category')?.trim() || '';
    const search = searchParams.get('search')?.trim() || '';

    const where: any = {
      status: true,
      category: {
        status: true,
      },
    };

    if (category) {
      where.category = {
        status: true,
        OR: [{ id: category }, { slug: category }],
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const subcategories = await prisma.subcategory.findMany({
      where,
      orderBy: [
        { category: { position: 'asc' } },
        { position: 'asc' },
      ],
      include: {
        category: {
          select: { id: true, title: true, slug: true },
        },
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
    });

    const formatted = subcategories.map((sub) => ({
      id: sub.id,
      title: sub.title,
      slug: sub.slug,
      image: sub.image,
      position: sub.position,
      categoryId: sub.categoryId,
      category: sub.category,
      promptCount: sub._count.prompts,
      deepLink: `prompter://category/${sub.category.slug}/sub/${sub.slug}`,
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error('Client API error (subcategories):', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch subcategories' }, { status: 500 });
  }
}
