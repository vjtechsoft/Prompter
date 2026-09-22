import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appUser = await prisma.appUser.findUnique({
      where: { id: params.id },
    });

    if (!appUser) {
      return NextResponse.json({ error: 'Client app user not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: appUser });
  } catch (error) {
    console.error('Fetch user error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.appUser.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client app user not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, email, avatar, status, isVip } = body;

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (avatar !== undefined) dataToUpdate.avatar = avatar ? avatar.trim() : null;
    if (status !== undefined) dataToUpdate.status = status === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE';
    if (isVip !== undefined) dataToUpdate.isVip = Boolean(isVip);

    if (email !== undefined && email.trim() !== existing.email) {
      const normalizedEmail = email.trim().toLowerCase();
      const duplicate = await prisma.appUser.findUnique({
        where: { email: normalizedEmail },
      });
      if (duplicate && duplicate.id !== existing.id) {
        return NextResponse.json({ error: 'Email already in use by another user' }, { status: 400 });
      }
      dataToUpdate.email = normalizedEmail;
    }

    const updated = await prisma.appUser.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATE_APP_USER',
      entity: 'APP_USER',
      details: `Updated client app user ${updated.name} (${updated.email}). Status: ${updated.status}, VIP: ${updated.isVip}`,
      req,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.appUser.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client app user not found' }, { status: 404 });
    }

    await prisma.appUser.delete({
      where: { id: params.id },
    });

    await logActivity({
      userId: user.id,
      action: 'DELETE_APP_USER',
      entity: 'APP_USER',
      details: `Deleted client app user ${existing.name} (${existing.email})`,
      req,
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
