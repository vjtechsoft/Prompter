import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can view admin details' }, { status: 403 });
    }

    const { id } = params;
    const admin = await prisma.user.findUnique({
      where: { id },
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

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, admin });
  } catch (error) {
    console.error('Error fetching admin:', error);
    return NextResponse.json({ error: 'Failed to fetch admin account' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can update admin accounts' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, email, password, avatar, status, role } = body;

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Protect Super Admin from demotion or tampering if another admin tries
    if (target.role === 'SUPER_ADMIN' && role && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin role cannot be modified' }, { status: 400 });
    }

    // Prevent promoting another user to Super Admin
    if (target.role !== 'SUPER_ADMIN' && role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only ONE Super Admin can exist in the system' }, { status: 400 });
    }

    if (email && email.toLowerCase().trim() !== target.email) {
      const duplicate = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          NOT: { id },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'Email is already in use by another user' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (avatar !== undefined) updateData.avatar = avatar;
    if (status) updateData.status = status;
    if (password && password.trim().length >= 8) {
      updateData.password = await hashPassword(password.trim());
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        status: true,
        updatedAt: true,
      },
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATE_ADMIN',
      entity: 'USER',
      details: `Updated account details for ${updated.email}`,
      req,
    });

    return NextResponse.json({ success: true, admin: updated });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json({ error: 'Failed to update admin account' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can delete admin accounts' }, { status: 403 });
    }

    const { id } = params;
    const target = await prisma.user.findUnique({ where: { id } });

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Strict rule: Cannot delete Super Admin
    if (target.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: The Super Admin account cannot be deleted' },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    await logActivity({
      userId: user.id,
      action: 'DELETE_ADMIN',
      entity: 'USER',
      details: `Deleted Admin account: ${target.email}`,
      req,
    });

    return NextResponse.json({ success: true, message: `Admin ${target.email} deleted successfully` });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json({ error: 'Failed to delete admin account' }, { status: 500 });
  }
}
