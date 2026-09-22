import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateClientApiKey } from '@/lib/client-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateClientApiKey(req);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const urls = await prisma.appUrls.findUnique({
      where: { id: 'default' },
    });

    if (!urls) {
      return NextResponse.json({
        success: true,
        data: {
          privacyPolicy: 'https://prompter.io/privacy',
          termsOfService: 'https://prompter.io/terms',
          refundPolicy: 'https://prompter.io/refund',
          dataDeletionPolicy: 'https://prompter.io/data-deletion',
          contactUs: 'https://prompter.io/contact',
          website: 'https://prompter.io',
          playStore: '',
          socialLinks: {
            twitter: '',
            facebook: '',
            instagram: '',
            youtube: '',
            telegram: '',
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        privacyPolicy: urls.privacyPolicy,
        termsOfService: urls.termsOfService,
        refundPolicy: urls.refundPolicy,
        dataDeletionPolicy: urls.dataDeletionPolicy,
        contactUs: urls.contactUs,
        aboutUs: urls.aboutUs,
        website: urls.website,
        playStore: urls.playStore,
        socialLinks: {
          twitter: urls.twitter,
          facebook: urls.facebook,
          instagram: urls.instagram,
          youtube: urls.youtube,
          telegram: urls.telegram,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch URLs' }, { status: 500 });
  }
}
