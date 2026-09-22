import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ prompts: [], categories: [], users: [], tags: [] });
    }

    // 1. Match Prompts
    const prompts = await prisma.prompt.findMany({
      where: {
        isDeleted: false,
        OR: [
          { title: { contains: query } },
          { prompt: { contains: query } },
          { tags: { contains: query } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        isPremium: true,
        status: true,
        category: { select: { title: true } },
      },
      take: 6,
    });

    // 2. Match Categories
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { slug: { contains: query } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
        _count: { select: { prompts: true } },
      },
      take: 5,
    });

    // 3. Match Admins (if Super Admin)
    let matchedUsers: any[] = [];
    if (user.role === 'SUPER_ADMIN') {
      matchedUsers = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
        },
        take: 4,
      });
    }

    // 4. Match Client App Users
    const appUsers = await prisma.appUser.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        isVip: true,
        status: true,
      },
      take: 4,
    });

    // 5. Match Subcategories
    const subcategories = await prisma.subcategory.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { slug: { contains: query } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
        category: { select: { id: true, title: true, slug: true } },
        _count: { select: { prompts: true } },
      },
      take: 5,
    });

    return NextResponse.json({
      prompts,
      categories,
      subcategories,
      users: matchedUsers,
      appUsers,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
