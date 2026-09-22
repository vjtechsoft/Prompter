import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateClientApiKey } from '@/lib/client-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await validateClientApiKey(req);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const ads = await prisma.advertisement.findUnique({
      where: { id: 'default' },
    });

    if (!ads) {
      return NextResponse.json({
        success: true,
        data: {
          activeProvider: 'NONE',
          adsEnabled: false,
          interstitialInterval: 3,
          nativeInterval: 5,
          provider: null,
        },
      });
    }

    const isAdMob = ads.activeProvider === 'ADMOB' && ads.admobEnabled;
    const isMeta = ads.activeProvider === 'META' && ads.metaEnabled;
    const isUnity = ads.activeProvider === 'UNITY' && ads.unityEnabled;

    return NextResponse.json({
      success: true,
      data: {
        activeProvider: ads.activeProvider,
        adsEnabled: isAdMob || isMeta || isUnity,
        interstitialInterval: ads.interstitialInterval ?? 3,
        nativeInterval: ads.nativeInterval ?? 5,
        provider: isAdMob
          ? {
              providerName: 'Google AdMob',
              appId: ads.admobAppId,
              bannerUnitId: ads.admobBannerId,
              interstitialUnitId: ads.admobInterstitialId,
              rewardedUnitId: ads.admobRewardedId,
              nativeUnitId: ads.admobNativeId,
              appOpenUnitId: ads.admobAppOpenId,
            }
          : isMeta
          ? {
              providerName: 'Meta Audience Network',
              bannerUnitId: ads.metaBannerId,
              interstitialUnitId: ads.metaInterstitialId,
              rewardedUnitId: ads.metaRewardedId,
              nativeUnitId: ads.metaNativeId,
            }
          : isUnity
          ? {
              providerName: 'Unity Ads',
              gameId: ads.unityGameId,
              bannerPlacementId: ads.unityBannerPlacement,
              interstitialPlacementId: ads.unityInterstitialPlacement,
              rewardedPlacementId: ads.unityRewardedPlacement,
            }
          : null,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch ad configuration' }, { status: 500 });
  }
}
