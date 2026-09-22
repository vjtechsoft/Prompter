import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculatePopularScore, calculateTrendingScore, slugify } from '@/lib/utils';
import { logActivity } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const prompt = await prisma.prompt.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        subcategory: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    let parsedTags: string[] = [];
    try {
      parsedTags = typeof prompt.tags === 'string' ? JSON.parse(prompt.tags) : prompt.tags;
    } catch (e) {
      parsedTags = [];
    }

    return NextResponse.json({
      prompt: {
        ...prompt,
        tags: parsedTags,
        trendingScore: calculateTrendingScore(prompt.views, prompt.likes, prompt.shares),
        popularScore: calculatePopularScore(prompt.views, prompt.likes, prompt.shares),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve prompt' }, { status: 500 });
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
    const { title, prompt, featuredImage, categoryId, subcategoryId, tags, isPremium, isFeatured, status, likes, views, shares } = body;

    const existing = await prisma.prompt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Check title uniqueness if title changed
    if (title && title.trim() !== existing.title) {
      const duplicateTitle = await prisma.prompt.findFirst({
        where: {
          title: title.trim(),
          NOT: { id },
        },
      });
      if (duplicateTitle) {
        return NextResponse.json({ error: 'A prompt with this title already exists' }, { status: 400 });
      }
    }

    let newSlug = existing.slug;
    if (title && title.trim() !== existing.title) {
      const baseSlug = slugify(title);
      newSlug = baseSlug;
      let counter = 1;
      while (await prisma.prompt.findFirst({ where: { slug: newSlug, NOT: { id } } })) {
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const updated = await prisma.prompt.update({
      where: { id },
      data: {
        title: title ? title.trim() : existing.title,
        slug: newSlug,
        prompt: prompt ? prompt.trim() : existing.prompt,
        featuredImage: featuredImage !== undefined ? featuredImage : existing.featuredImage,
        categoryId: categoryId || existing.categoryId,
        subcategoryId: subcategoryId !== undefined ? (subcategoryId || null) : existing.subcategoryId,
        tags: tags !== undefined ? JSON.stringify(tags) : existing.tags,
        isPremium: isPremium !== undefined ? Boolean(isPremium) : existing.isPremium,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : existing.isFeatured,
        status: status !== undefined ? Boolean(status) : existing.status,
        likes: likes !== undefined ? parseInt(likes) : existing.likes,
        views: views !== undefined ? parseInt(views) : existing.views,
        shares: shares !== undefined ? parseInt(shares) : existing.shares,
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
      action: 'UPDATE_PROMPT',
      entity: 'PROMPT',
      details: `Updated prompt "${updated.title}"`,
      req,
    });

    return NextResponse.json({ success: true, prompt: updated });
  } catch (error: any) {
    console.error('Error updating prompt:', error);
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
  }
}

// DELETE: Soft delete (or permanent if force=true)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    const existing = await prisma.prompt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    if (force) {
      await prisma.prompt.delete({ where: { id } });
      await logActivity({
        userId: user.id,
        action: 'PERMANENT_DELETE_PROMPT',
        entity: 'PROMPT',
        details: `Permanently deleted prompt "${existing.title}"`,
        req,
      });
      return NextResponse.json({ success: true, message: 'Prompt permanently deleted' });
    } else {
      await prisma.prompt.update({
        where: { id },
        data: { isDeleted: true },
      });
      await logActivity({
        userId: user.id,
        action: 'SOFT_DELETE_PROMPT',
        entity: 'PROMPT',
        details: `Moved prompt "${existing.title}" to trash`,
        req,
      });
      return NextResponse.json({ success: true, message: 'Prompt moved to trash' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 });
  }
}

// PATCH: Quick restore or single-field toggle
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { action, value } = body;

    const existing = await prisma.prompt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    let updateData: any = {};
    if (action === 'restore') {
      updateData.isDeleted = false;
    } else if (action === 'toggle_status') {
      updateData.status = typeof value === 'boolean' ? value : !existing.status;
    } else if (action === 'toggle_premium') {
      updateData.isPremium = typeof value === 'boolean' ? value : !existing.isPremium;
    } else {
      return NextResponse.json({ error: 'Invalid patch action' }, { status: 400 });
    }

    const updated = await prisma.prompt.update({
      where: { id },
      data: updateData,
    });

    await logActivity({
      userId: user.id,
      action: `PATCH_${action.toUpperCase()}`,
      entity: 'PROMPT',
      details: `Prompt "${existing.title}" updated (${action})`,
      req,
    });

    return NextResponse.json({ success: true, prompt: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to patch prompt' }, { status: 500 });
  }
}
