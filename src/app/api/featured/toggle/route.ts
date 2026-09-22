import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, id, ids, isFeatured } = body;

    if (!type || !['prompt', 'category'].includes(type)) {
      return NextResponse.json({ error: "Invalid type. Must be 'prompt' or 'category'" }, { status: 400 });
    }

    // Support batch operations (ids array)
    if (Array.isArray(ids) && ids.length > 0) {
      const targetState = isFeatured !== undefined ? Boolean(isFeatured) : true;
      let count = 0;

      if (type === 'prompt') {
        const res = await prisma.prompt.updateMany({
          where: { id: { in: ids }, isDeleted: false },
          data: { isFeatured: targetState },
        });
        count = res.count;
      } else {
        const res = await prisma.category.updateMany({
          where: { id: { in: ids } },
          data: { isFeatured: targetState },
        });
        count = res.count;
      }

      await logActivity({
        userId: user.id,
        action: targetState ? 'BATCH_FEATURE' : 'BATCH_UNFEATURE',
        entity: type === 'prompt' ? 'PROMPT' : 'CATEGORY',
        details: `${targetState ? 'Featured' : 'Unfeatured'} ${count} ${type}(s)`,
        req,
      });

      return NextResponse.json({ success: true, count, isFeatured: targetState });
    }

    // Single item toggle
    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    if (type === 'prompt') {
      const prompt = await prisma.prompt.findUnique({
        where: { id },
      });
      if (!prompt || prompt.isDeleted) {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
      }

      const nextState = isFeatured !== undefined ? Boolean(isFeatured) : !prompt.isFeatured;
      const updated = await prisma.prompt.update({
        where: { id },
        data: { isFeatured: nextState },
      });

      await logActivity({
        userId: user.id,
        action: nextState ? 'FEATURE_PROMPT' : 'UNFEATURE_PROMPT',
        entity: 'PROMPT',
        details: `${nextState ? 'Spotlighted prompt' : 'Removed prompt from featured'}: "${prompt.title}"`,
        req,
      });

      return NextResponse.json({ success: true, item: updated, isFeatured: nextState });
    } else {
      const category = await prisma.category.findUnique({
        where: { id },
      });
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }

      const nextState = isFeatured !== undefined ? Boolean(isFeatured) : !category.isFeatured;
      const updated = await prisma.category.update({
        where: { id },
        data: { isFeatured: nextState },
      });

      await logActivity({
        userId: user.id,
        action: nextState ? 'FEATURE_CATEGORY' : 'UNFEATURE_CATEGORY',
        entity: 'CATEGORY',
        details: `${nextState ? 'Spotlighted category' : 'Removed category from featured'}: "${category.title}"`,
        req,
      });

      return NextResponse.json({ success: true, item: updated, isFeatured: nextState });
    }
  } catch (error) {
    console.error('Featured toggle API error:', error);
    return NextResponse.json({ error: 'Failed to update featured status' }, { status: 500 });
  }
}
