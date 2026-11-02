import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: 'default' },
    });

    const packageName = settings?.packageName || 'com.prompter.studio';

    const assetLinks = [
      {
        relation: [
          'delegate_permission/common.handle_all_urls',
          'delegate_permission/common.get_login_creds',
        ],
        target: {
          namespace: 'android_app',
          package_name: packageName,
          sha256_cert_fingerprints: [
            // Standard placeholder fingerprint; admins can configure or override as needed
            '14:6D:E9:01:C3:59:7E:6E:FD:08:42:08:26:A1:0C:55:04:3F:8A:2F:E9:90:3A:D5:75:A0:01:8C:FE:E2:5F:B6',
          ],
        },
      },
    ];

    return NextResponse.json(assetLinks, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
