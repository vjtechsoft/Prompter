import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { logActivity } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId')?.trim() || '';
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'position';

    const where: any = {};

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    if (status !== null && status !== undefined && status !== 'all') {
      where.status = status === 'true';
    }

    let orderBy: any = { position: 'asc' };
    if (sortBy === 'latest') orderBy = { createdAt: 'desc' };
    else if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sortBy === 'alphabetical') orderBy = { title: 'asc' };

    const subcategories = await prisma.subcategory.findMany({
      where,
      include: {
        category: {
          select: { id: true, title: true, slug: true },
        },
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
      orderBy,
    });

    if (sortBy === 'prompt_count') {
      subcategories.sort((a, b) => b._count.prompts - a._count.prompts);
    }

    return NextResponse.json({ subcategories });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, categoryId, image, status } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Subcategory title is required' }, { status: 400 });
    }

    if (!categoryId?.trim()) {
      return NextResponse.json({ error: 'Parent category is required' }, { status: 400 });
    }

    // Verify parent category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Selected parent category does not exist' }, { status: 404 });
    }

    // Check duplicate title under the same category
    const existingInCat = await prisma.subcategory.findFirst({
      where: {
        categoryId,
        title: title.trim(),
      },
    });

    if (existingInCat) {
      return NextResponse.json(
        { error: `Subcategory "${title.trim()}" already exists in ${category.title}` },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = slugify(title);
    let finalSlug = baseSlug;
    let counter = 1;

    while (await prisma.subcategory.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Auto-calculate position (highest in this category + 1)
    const highestPos = await prisma.subcategory.findFirst({
      where: { categoryId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const position = (highestPos?.position ?? -1) + 1;

    const newSubcategory = await prisma.subcategory.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        image: image || null,
        status: status !== undefined ? Boolean(status) : true,
        position,
        categoryId,
        createdById: user.id,
      },
      include: {
        category: {
          select: { id: true, title: true, slug: true },
        },
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
      action: 'CREATE_SUBCATEGORY',
      entity: 'SUBCATEGORY',
      details: `Created subcategory "${newSubcategory.title}" in category "${category.title}"`,
      req,
    });

    return NextResponse.json({ subcategory: newSubcategory }, { status: 201 });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    return NextResponse.json({ error: 'Failed to create subcategory' }, { status: 500 });
  }
}
