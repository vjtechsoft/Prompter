import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const original = await prisma.prompt.findUnique({ where: { id } });

    if (!original) {
      return NextResponse.json({ error: 'Original prompt not found' }, { status: 404 });
    }

    // Generate cloned title and slug
    let baseTitle = `${original.title} (Copy)`;
    let finalTitle = baseTitle;
    let titleCounter = 1;

    while (await prisma.prompt.findFirst({ where: { title: finalTitle } })) {
      finalTitle = `${original.title} (Copy ${titleCounter})`;
      titleCounter++;
    }

    let baseSlug = slugify(finalTitle);
    let finalSlug = baseSlug;
    let slugCounter = 1;

    while (await prisma.prompt.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${slugCounter}`;
      slugCounter++;
    }

    const duplicated = await prisma.prompt.create({
      data: {
        title: finalTitle,
        slug: finalSlug,
        prompt: original.prompt,
        featuredImage: original.featuredImage,
        categoryId: original.categoryId,
        subcategoryId: original.subcategoryId,
        tags: original.tags,
        likes: 0,
        views: 0,
        shares: 0,
        isPremium: original.isPremium,
        status: false, // Default duplicated prompt to draft/inactive
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
      action: 'DUPLICATE_PROMPT',
      entity: 'PROMPT',
      details: `Cloned prompt "${original.title}" as "${duplicated.title}"`,
      req,
    });

    return NextResponse.json({ success: true, prompt: duplicated });
  } catch (error) {
    console.error('Error duplicating prompt:', error);
    return NextResponse.json({ error: 'Failed to duplicate prompt' }, { status: 500 });
  }
}
