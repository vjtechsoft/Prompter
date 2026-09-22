import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || 'all';
    const isVip = searchParams.get('isVip') || 'all';
    const sortBy = searchParams.get('sortBy') || 'newest';

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    if (isVip !== 'all') {
      whereClause.isVip = isVip === 'true';
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sortBy === 'lastActive') orderBy = { lastActiveAt: 'desc' };
    else if (sortBy === 'name') orderBy = { name: 'asc' };
    else if (sortBy === 'likes') orderBy = { likesCount: 'desc' };

    const [total, users, totalAll, activeCount, blockedCount, vipCount] = await Promise.all([
      prisma.appUser.count({ where: whereClause }),
      prisma.appUser.findMany({
        where: whereClause,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appUser.count(),
      prisma.appUser.count({ where: { status: 'ACTIVE' } }),
      prisma.appUser.count({ where: { status: 'BLOCKED' } }),
      prisma.appUser.count({ where: { isVip: true } }),
    ]);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        totalUsers: totalAll,
        activeUsers: activeCount,
        blockedUsers: blockedCount,
        vipUsers: vipCount,
      },
    });
  } catch (error) {
    console.error('Fetch app users error:', error);
    return NextResponse.json({ error: 'Failed to fetch client app users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, avatar, isVip, status } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Google email address is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.appUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'A client app user with this email already exists' }, { status: 400 });
    }

    const appUser = await prisma.appUser.create({
      data: {
        name: name?.trim() || 'User',
        email: normalizedEmail,
        avatar: avatar?.trim() || null,
        authProvider: 'GOOGLE',
        status: status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE',
        isVip: Boolean(isVip),
        lastActiveAt: new Date(),
      },
    });

    await logActivity({
      userId: user.id,
      action: 'CREATE_APP_USER',
      entity: 'APP_USER',
      details: `Created client app user ${appUser.name} (${appUser.email})`,
      req,
    });

    return NextResponse.json({ success: true, user: appUser });
  } catch (error) {
    console.error('Create app user error:', error);
    return NextResponse.json({ error: 'Failed to create client app user' }, { status: 500 });
  }
}
