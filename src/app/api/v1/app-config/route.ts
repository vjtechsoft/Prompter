import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateClientApiKey } from '@/lib/client-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateClientApiKey(req);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const config = await prisma.appSettings.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      return NextResponse.json({
        success: true,
        data: {
          appName: 'Prompter',
          versionName: '1.0.0',
          versionCode: '100',
          maintenanceMode: false,
          appLogo: '/logo.png',
          appIcon: '/icon.png',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        appName: config.appName,
        developerName: config.developerName,
        packageName: config.packageName,
        versionName: config.versionName,
        versionCode: config.versionCode,
        maintenanceMode: config.maintenanceMode,
        appLogo: config.appLogo,
        splashLogo: config.splashLogo,
        appIcon: config.appIcon,
        favicon: config.favicon,
        supportEmail: config.supportEmail,
        website: config.website,
        contactNumber: config.contactNumber,
        copyright: config.copyright,
        defaultLanguage: config.defaultLanguage,
        currency: config.currency,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch app configuration' }, { status: 500 });
  }
}
