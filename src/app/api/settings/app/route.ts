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

    let settings = await prisma.appSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: { id: 'default' },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch app settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can modify app settings' }, { status: 403 });
    }

    const body = await req.json();
    const {
      appName,
      developerName,
      packageName,
      versionName,
      versionCode,
      supportEmail,
      website,
      contactNumber,
      copyright,
      defaultLanguage,
      theme,
      timezone,
      currency,
      maintenanceMode,
      appLogo,
      splashLogo,
      appIcon,
      favicon,
    } = body;

    const updated = await prisma.appSettings.upsert({
      where: { id: 'default' },
      update: {
        appName: appName || 'Prompter Admin',
        developerName: developerName || 'Prompter Devs',
        packageName: packageName || 'com.prompter.admin',
        versionName: versionName || '1.0.0',
        versionCode: versionCode || '100',
        supportEmail: supportEmail || 'support@prompter.io',
        website: website || 'https://prompter.io',
        contactNumber: contactNumber || '',
        copyright: copyright || '© 2026 Prompter. All rights reserved.',
        defaultLanguage: defaultLanguage || 'en',
        theme: theme || 'system',
        timezone: timezone || 'UTC',
        currency: currency || 'USD ($)',
        maintenanceMode: Boolean(maintenanceMode),
        appLogo: appLogo || '/logo.png',
        splashLogo: splashLogo || '/logo.png',
        appIcon: appIcon || '/icon.png',
        favicon: favicon || '/favicon.ico',
      },
      create: {
        id: 'default',
        appName: appName || 'Prompter Admin',
        developerName: developerName || 'Prompter Devs',
        packageName: packageName || 'com.prompter.admin',
        versionName: versionName || '1.0.0',
        versionCode: versionCode || '100',
        supportEmail: supportEmail || 'support@prompter.io',
        website: website || 'https://prompter.io',
        contactNumber: contactNumber || '',
        copyright: copyright || '© 2026 Prompter. All rights reserved.',
        defaultLanguage: defaultLanguage || 'en',
        theme: theme || 'system',
        timezone: timezone || 'UTC',
        currency: currency || 'USD ($)',
        maintenanceMode: Boolean(maintenanceMode),
        appLogo: '/logo.png',
        splashLogo: '/logo.png',
        appIcon: '/icon.png',
        favicon: '/favicon.ico',
      },
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATE_APP_SETTINGS',
      entity: 'SETTINGS',
      details: `Updated Application Configuration (${updated.appName} v${updated.versionName})`,
      req,
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('App settings error:', error);
    return NextResponse.json({ error: 'Failed to update app settings' }, { status: 500 });
  }
}
