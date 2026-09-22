import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status');
    const isFeatured = searchParams.get('isFeatured');
    const sortBy = searchParams.get('sortBy') || 'position';

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    if (status !== null && status !== undefined && status !== 'all') {
      where.status = status === 'true';
    }

    if (isFeatured !== null && isFeatured !== undefined && isFeatured !== 'all') {
      where.isFeatured = isFeatured === 'true';
    }

    let orderBy: any = { position: 'asc' };
    if (sortBy === 'latest') orderBy = { createdAt: 'desc' };
    else if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sortBy === 'alphabetical') orderBy = { title: 'asc' };

    const categories = await prisma.category.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        subcategories: {
          orderBy: { position: 'asc' },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: {
                prompts: {
                  where: { isDeleted: false },
                },
              },
            },
          },
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
      orderBy,
    });

    // If sorting by prompt count
    if (sortBy === 'prompt_count') {
      categories.sort((a, b) => b._count.prompts - a._count.prompts);
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, image, status, isFeatured } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Category title is required' }, { status: 400 });
    }

    const existing = await prisma.category.findFirst({
      where: { title: title.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'Category with this title already exists' }, { status: 400 });
    }

    let baseSlug = slugify(title);
    let finalSlug = baseSlug;
    let counter = 1;

    while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Auto calculate highest position + 1
    const highestPosCategory = await prisma.category.findFirst({
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const position = (highestPosCategory?.position ?? 0) + 1;

    const category = await prisma.category.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        image: image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        status: status !== undefined ? Boolean(status) : true,
        isFeatured: Boolean(isFeatured),
        position,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { prompts: true },
        },
      },
    });

    await logActivity({
      userId: user.id,
      action: 'CREATE_CATEGORY',
      entity: 'CATEGORY',
      details: `Created category "${category.title}"`,
      req,
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}
