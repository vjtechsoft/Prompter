import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        status: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            prompts: { where: { isDeleted: false } },
            categories: true,
          },
        },
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, avatar } = body;

    if (email && email.toLowerCase().trim() !== user.email) {
      const duplicate = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          NOT: { id: user.id },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'Email is already taken by another account' }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name ? name.trim() : undefined,
        email: email ? email.toLowerCase().trim() : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        status: true,
      },
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATE_PROFILE',
      entity: 'USER',
      details: 'Updated profile information',
      req,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// DELETE own profile (Admins can delete self; Super Admin cannot be deleted!)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Super Admin profile cannot be deleted. You must transfer system ownership first.' },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id: user.id } });

    const response = NextResponse.json({ success: true, message: 'Account deleted successfully' });
    response.cookies.delete(TOKEN_COOKIE_NAME);
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
