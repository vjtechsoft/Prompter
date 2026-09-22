import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await prisma.appSettings.findUnique({
      where: { id: 'default' },
      select: {
        clientApiKey: true,
        requireApiKey: true,
      },
    });

    return NextResponse.json({
      success: true,
      clientApiKey: config?.clientApiKey || 'prompter_live_sec_7f8a9b1c2d3e4f5a',
      requireApiKey: config?.requireApiKey ?? true,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve API Key settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { requireApiKey, generateNew } = body;

    const updateData: any = {};
    if (typeof requireApiKey === 'boolean') {
      updateData.requireApiKey = requireApiKey;
    }

    if (generateNew) {
      const randomHex = crypto.randomBytes(16).toString('hex');
      updateData.clientApiKey = `prompter_live_sec_${randomHex}`;
    }

    const updated = await prisma.appSettings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        clientApiKey: updateData.clientApiKey || 'prompter_live_sec_7f8a9b1c2d3e4f5a',
        requireApiKey: updateData.requireApiKey ?? true,
      },
      select: {
        clientApiKey: true,
        requireApiKey: true,
      },
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATE_CLIENT_API_KEY_CONFIG',
      entity: 'SETTINGS',
      details: `API key enforced: ${updated.requireApiKey}, Key regenerated: ${Boolean(generateNew)}`,
    });

    return NextResponse.json({
      success: true,
      clientApiKey: updated.clientApiKey,
      requireApiKey: updated.requireApiKey,
      message: generateNew ? 'API Key regenerated successfully' : 'Security settings updated',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update API Key settings' }, { status: 500 });
  }
}
