import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let urls = await prisma.appUrls.findUnique({
      where: { id: 'default' },
    });

    if (!urls) {
      urls = await prisma.appUrls.create({
        data: { id: 'default' },
      });
    }

    return NextResponse.json({ urls });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch URL settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can modify app URLs' }, { status: 403 });
    }

    const body = await req.json();
    const {
      privacyPolicy,
      termsOfService,
      refundPolicy,
      dataDeletionPolicy,
      contactUs,
      aboutUs,
      website,
      playStore,
      facebook,
      instagram,
      youtube,
      twitter,
      telegram,
    } = body;

    const updated = await prisma.appUrls.upsert({
      where: { id: 'default' },
      update: {
        privacyPolicy: privacyPolicy || '',
        termsOfService: termsOfService || '',
        refundPolicy: refundPolicy || '',
        dataDeletionPolicy: dataDeletionPolicy || '',
        contactUs: contactUs || '',
        aboutUs: aboutUs || '',
        website: website || '',
        playStore: playStore || '',
        facebook: facebook || '',
        instagram: instagram || '',
        youtube: youtube || '',
        twitter: twitter || '',
        telegram: telegram || '',
      },
      create: {
        id: 'default',
        privacyPolicy: privacyPolicy || '',
        termsOfService: termsOfService || '',
        refundPolicy: refundPolicy || '',
        dataDeletionPolicy: dataDeletionPolicy || '',
        contactUs: contactUs || '',
        aboutUs: aboutUs || '',
        website: website || '',
        playStore: playStore || '',
        facebook: facebook || '',
        instagram: instagram || '',
        youtube: youtube || '',
        twitter: twitter || '',
        telegram: telegram || '',
      },
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATE_APP_URLS',
      entity: 'SETTINGS',
      details: 'Updated Application legal policies and social media URLs',
      req,
    });

    return NextResponse.json({ success: true, urls: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update URL settings' }, { status: 500 });
  }
}
