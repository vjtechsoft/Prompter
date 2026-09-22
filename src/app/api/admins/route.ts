import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can manage admins' }, { status: 403 });
    }

    const admins = await prisma.user.findMany({
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
        _count: {
          select: {
            prompts: { where: { isDeleted: false } },
            categories: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const adminCount = admins.filter((a) => a.role === 'ADMIN').length;
    const superAdminCount = admins.filter((a) => a.role === 'SUPER_ADMIN').length;

    return NextResponse.json({
      admins,
      meta: {
        totalAdmins: adminCount,
        maxAdmins: 4,
        availableSlots: Math.max(0, 4 - adminCount),
        superAdminCount,
      },
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admin accounts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can create admin accounts' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, avatar, role } = body;

    // Strict rule 1: Cannot create another Super Admin
    if (role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only ONE Super Admin can exist in the system.' },
        { status: 400 }
      );
    }

    // Strict rule 2: Check limit of 4 Admins
    const currentAdminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    if (currentAdminCount >= 4) {
      return NextResponse.json(
        { error: 'Maximum limit of 4 Admins reached. Please delete an existing Admin before creating a new one.' },
        { status: 400 }
      );
    }

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingEmail) {
      return NextResponse.json({ error: 'A user with this email address already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const newAdmin = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'ADMIN',
        avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });

    await logActivity({
      userId: user.id,
      action: 'CREATE_ADMIN',
      entity: 'USER',
      details: `Super Admin created new Admin account: ${newAdmin.email}`,
      req,
    });

    return NextResponse.json({ success: true, admin: newAdmin }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: error.message || 'Failed to create admin' }, { status: 500 });
  }
}
