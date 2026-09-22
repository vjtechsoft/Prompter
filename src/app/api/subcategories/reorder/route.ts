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
    const { items, id, direction, categoryId } = body;

    // Mode A: Direct list of { id, position }
    if (Array.isArray(items) && items.length > 0) {
      const updates = items.map((item, index) =>
        prisma.subcategory.update({
          where: { id: item.id },
          data: { position: item.position !== undefined ? item.position : index + 1 },
        })
      );
      await prisma.$transaction(updates);

      await logActivity({
        userId: user.id,
        action: 'REORDER_SUBCATEGORIES_BULK',
        entity: 'SUBCATEGORY',
        details: `Reordered ${items.length} subcategories`,
        req,
      });

      return NextResponse.json({ success: true, message: 'Subcategories reordered successfully' });
    }

    // Mode B: Move Up or Move Down within category
    if (id && (direction === 'up' || direction === 'down')) {
      const current = await prisma.subcategory.findUnique({ where: { id } });
      if (!current) {
        return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
      }

      const targetCategory = categoryId || current.categoryId;

      const neighbor = await prisma.subcategory.findFirst({
        where: {
          categoryId: targetCategory,
          position: direction === 'up' ? { lt: current.position } : { gt: current.position },
        },
        orderBy: {
          position: direction === 'up' ? 'desc' : 'asc',
        },
      });

      if (neighbor) {
        await prisma.$transaction([
          prisma.subcategory.update({
            where: { id: current.id },
            data: { position: neighbor.position },
          }),
          prisma.subcategory.update({
            where: { id: neighbor.id },
            data: { position: current.position },
          }),
        ]);
      }

      await logActivity({
        userId: user.id,
        action: 'REORDER_SUBCATEGORY',
        entity: 'SUBCATEGORY',
        details: `Reordered subcategory "${current.title}" (${direction})`,
        req,
      });

      return NextResponse.json({ success: true, message: 'Subcategory reordered successfully' });
    }

    return NextResponse.json({ error: 'Invalid reorder parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error reordering subcategories:', error);
    return NextResponse.json({ error: 'Failed to reorder subcategories' }, { status: 500 });
  }
}
