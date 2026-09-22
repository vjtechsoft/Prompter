import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const category = await prisma.category.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        subcategories: {
          orderBy: { position: 'asc' },
          include: {
            _count: {
              select: {
                prompts: { where: { isDeleted: false } },
              },
            },
          },
        },
        _count: {
          select: { prompts: true, subcategories: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
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
    const { title, image, status, position, isFeatured } = body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (title && title.trim() !== existing.title) {
      const duplicate = await prisma.category.findFirst({
        where: {
          title: title.trim(),
          NOT: { id },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'Category with this title already exists' }, { status: 400 });
      }
    }

    let newSlug = existing.slug;
    if (title && title.trim() !== existing.title) {
      const baseSlug = slugify(title);
      newSlug = baseSlug;
      let counter = 1;
      while (await prisma.category.findFirst({ where: { slug: newSlug, NOT: { id } } })) {
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        title: title ? title.trim() : existing.title,
        slug: newSlug,
        image: image !== undefined ? image : existing.image,
        status: status !== undefined ? Boolean(status) : existing.status,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : existing.isFeatured,
        position: position !== undefined ? parseInt(position) : existing.position,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        subcategories: {
          orderBy: { position: 'asc' },
          include: {
            _count: {
              select: {
                prompts: { where: { isDeleted: false } },
              },
            },
          },
        },
        _count: {
          select: { prompts: true, subcategories: true },
        },
      },
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATE_CATEGORY',
      entity: 'CATEGORY',
      details: `Updated category "${updated.title}"`,
      req,
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { prompts: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Inform user if category contains active prompts
    if (existing._count.prompts > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category "${existing.title}" because it contains ${existing._count.prompts} prompt(s). Move or delete the prompts first.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    await logActivity({
      userId: user.id,
      action: 'DELETE_CATEGORY',
      entity: 'CATEGORY',
      details: `Deleted category "${existing.title}"`,
      req,
    });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
