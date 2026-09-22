import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { logActivity } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const subcategory = await prisma.subcategory.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
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
    });

    if (!subcategory) {
      return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
    }

    return NextResponse.json({ subcategory });
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    return NextResponse.json({ error: 'Failed to fetch subcategory' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { title, image, status, position, categoryId } = body;

    const existing = await prisma.subcategory.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
    }

    const targetCategoryId = categoryId || existing.categoryId;

    // If categoryId changed, ensure new parent exists
    if (categoryId && categoryId !== existing.categoryId) {
      const newCat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!newCat) {
        return NextResponse.json({ error: 'Target parent category does not exist' }, { status: 404 });
      }
    }

    // Check duplicate title in target category
    if (title && (title.trim() !== existing.title || targetCategoryId !== existing.categoryId)) {
      const duplicate = await prisma.subcategory.findFirst({
        where: {
          categoryId: targetCategoryId,
          title: title.trim(),
          NOT: { id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `Subcategory "${title.trim()}" already exists in this category` },
          { status: 400 }
        );
      }
    }

    let newSlug = existing.slug;
    if (title && title.trim() !== existing.title) {
      const baseSlug = slugify(title);
      newSlug = baseSlug;
      let counter = 1;
      while (await prisma.subcategory.findFirst({ where: { slug: newSlug, NOT: { id } } })) {
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const updated = await prisma.subcategory.update({
      where: { id },
      data: {
        title: title ? title.trim() : existing.title,
        slug: newSlug,
        image: image !== undefined ? image : existing.image,
        status: status !== undefined ? Boolean(status) : existing.status,
        position: position !== undefined ? parseInt(position, 10) : existing.position,
        categoryId: targetCategoryId,
      },
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
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATE_SUBCATEGORY',
      entity: 'SUBCATEGORY',
      details: `Updated subcategory "${updated.title}"`,
      req,
    });

    return NextResponse.json({ subcategory: updated });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    return NextResponse.json({ error: 'Failed to update subcategory' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const existing = await prisma.subcategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            prompts: {
              where: { isDeleted: false },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
    }

    // Associated prompts will have subcategoryId set to null via onDelete: SetNull in schema
    await prisma.subcategory.delete({
      where: { id },
    });

    await logActivity({
      userId: user.id,
      action: 'DELETE_SUBCATEGORY',
      entity: 'SUBCATEGORY',
      details: `Deleted subcategory "${existing.title}" (${existing._count.prompts} prompts unlinked)`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: 'Subcategory deleted successfully',
      promptsUnlinked: existing._count.prompts,
    });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    return NextResponse.json({ error: 'Failed to delete subcategory' }, { status: 500 });
  }
}
