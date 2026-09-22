import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can access ad settings' }, { status: 403 });
    }

    let ads = await prisma.advertisement.findUnique({
      where: { id: 'default' },
    });

    if (!ads) {
      ads = await prisma.advertisement.create({
        data: { id: 'default' },
      });
    }

    return NextResponse.json({ ads });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ad settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can modify ad settings' }, { status: 403 });
    }

    const body = await req.json();
    const {
      activeProvider,
      interstitialInterval,
      nativeInterval,
      admobAppId,
      admobBannerId,
      admobInterstitialId,
      admobRewardedId,
      admobNativeId,
      admobAppOpenId,
      metaBannerId,
      metaInterstitialId,
      metaRewardedId,
      metaNativeId,
      unityGameId,
      unityBannerPlacement,
      unityInterstitialPlacement,
      unityRewardedPlacement,
    } = body;

    // Strict rule: Only one provider can be active at a time!
    const validProvider = ['ADMOB', 'META', 'UNITY', 'NONE'].includes(activeProvider)
      ? activeProvider
      : 'ADMOB';

    const admobEnabled = validProvider === 'ADMOB';
    const metaEnabled = validProvider === 'META';
    const unityEnabled = validProvider === 'UNITY';

    const parsedInterstitialInterval = Math.max(1, parseInt(String(interstitialInterval ?? 3), 10) || 3);
    const parsedNativeInterval = Math.max(1, parseInt(String(nativeInterval ?? 5), 10) || 5);

    const updated = await prisma.advertisement.upsert({
      where: { id: 'default' },
      update: {
        activeProvider: validProvider,
        interstitialInterval: parsedInterstitialInterval,
        nativeInterval: parsedNativeInterval,
        admobEnabled,
        admobAppId: admobAppId || '',
        admobBannerId: admobBannerId || '',
        admobInterstitialId: admobInterstitialId || '',
        admobRewardedId: admobRewardedId || '',
        admobNativeId: admobNativeId || '',
        admobAppOpenId: admobAppOpenId || '',
        metaEnabled,
        metaBannerId: metaBannerId || '',
        metaInterstitialId: metaInterstitialId || '',
        metaRewardedId: metaRewardedId || '',
        metaNativeId: metaNativeId || '',
        unityEnabled,
        unityGameId: unityGameId || '',
        unityBannerPlacement: unityBannerPlacement || '',
        unityInterstitialPlacement: unityInterstitialPlacement || '',
        unityRewardedPlacement: unityRewardedPlacement || '',
      },
      create: {
        id: 'default',
        activeProvider: validProvider,
        interstitialInterval: parsedInterstitialInterval,
        nativeInterval: parsedNativeInterval,
        admobEnabled,
        metaEnabled,
        unityEnabled,
      },
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATE_AD_SETTINGS',
      entity: 'SETTINGS',
      details: `Updated Ad provider configurations. Active provider: ${validProvider}, Interstitial Interval: ${parsedInterstitialInterval}, Native Interval: ${parsedNativeInterval}`,
      req,
    });

    return NextResponse.json({ success: true, ads: updated });
  } catch (error) {
    console.error('Ad settings update error:', error);
    return NextResponse.json({ error: 'Failed to update ad settings' }, { status: 500 });
  }
}
