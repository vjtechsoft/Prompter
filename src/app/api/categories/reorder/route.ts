import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { items, id, direction } = body;

    // Mode A: Direct list of { id, position }
    if (Array.isArray(items) && items.length > 0) {
      const updates = items.map((item, index) =>
        prisma.category.update({
          where: { id: item.id },
          data: { position: item.position !== undefined ? item.position : index + 1 },
        })
      );
      await prisma.$transaction(updates);

      await logActivity({
        userId: user.id,
        action: 'REORDER_CATEGORIES_BULK',
        entity: 'CATEGORY',
        details: `Reordered ${items.length} categories`,
        req,
      });

      return NextResponse.json({ success: true, message: 'Categories reordered successfully' });
    }

    // Mode B: Move Up or Move Down
    if (id && (direction === 'up' || direction === 'down')) {
      const current = await prisma.category.findUnique({ where: { id } });
      if (!current) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }

      const neighbor = await prisma.category.findFirst({
        where: {
          position: direction === 'up' ? { lt: current.position } : { gt: current.position },
        },
        orderBy: {
          position: direction === 'up' ? 'desc' : 'asc',
        },
      });

      if (!neighbor) {
        // Already at top or bottom
        return NextResponse.json({ success: true, message: 'Already at position edge' });
      }

      // Swap positions
      const originalCurrentPos = current.position;
      const neighborPos = neighbor.position;

      await prisma.$transaction([
        prisma.category.update({
          where: { id: current.id },
          data: { position: neighborPos },
        }),
        prisma.category.update({
          where: { id: neighbor.id },
          data: { position: originalCurrentPos },
        }),
      ]);

      await logActivity({
        userId: user.id,
        action: 'REORDER_CATEGORY_SWAP',
        entity: 'CATEGORY',
        details: `Swapped category "${current.title}" with "${neighbor.title}"`,
        req,
      });

      return NextResponse.json({ success: true, message: 'Position updated successfully' });
    }

    return NextResponse.json({ error: 'Invalid reorder parameters' }, { status: 400 });
  } catch (error) {
    console.error('Reorder error:', error);
    return NextResponse.json({ error: 'Failed to reorder categories' }, { status: 500 });
  }
}
