import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculatePopularScore, calculateTrendingScore } from '@/lib/utils';
import { validateClientApiKey } from '@/lib/client-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await validateClientApiKey(req);
    if (!auth.valid) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { type, userId, deviceId, toggle } = body;

    if (!type || !['like', 'unlike', 'view', 'share'].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid action type. Must be 'like', 'unlike', 'view', or 'share'." },
        { status: 400 }
      );
    }

    const prompt = await prisma.prompt.findFirst({
      where: {
        isDeleted: false,
        status: true,
        category: {
          status: true,
        },
        AND: [
          {
            OR: [{ id }, { slug: id }],
          },
          {
            OR: [
              { subcategoryId: null },
              { subcategory: { status: true } },
            ],
          },
        ],
      },
      select: {
        id: true,
        slug: true,
        likes: true,
        views: true,
        shares: true,
      },
    });

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt not found' }, { status: 404 });
    }

    // Resolve unique client identifier
    const headerUserId = req.headers.get('x-user-id') || req.headers.get('x-client-user-id');
    const headerDeviceId = req.headers.get('x-device-id') || req.headers.get('x-client-id');
    const effectiveUserId = (userId || headerUserId || '').trim();
    const effectiveDeviceId = (deviceId || headerDeviceId || '').trim();
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    let clientIdentifier: string;
    if (effectiveUserId) {
      clientIdentifier = `user:${effectiveUserId.toLowerCase()}`;
    } else if (effectiveDeviceId) {
      clientIdentifier = `device:${effectiveDeviceId}`;
    } else {
      clientIdentifier = `ip:${clientIp}`;
    }

    // Handle Unique Like & Unlike
    if (type === 'like' || type === 'unlike') {
      const existingLike = await prisma.promptLike.findUnique({
        where: {
          promptId_clientIdentifier: {
            promptId: prompt.id,
            clientIdentifier,
          },
        },
      });

      // 1. UNLIKE action or TOGGLE off
      if (type === 'unlike' || (type === 'like' && toggle === true && existingLike)) {
        if (existingLike) {
          await prisma.promptLike.delete({
            where: { id: existingLike.id },
          });

          // Decrement prompt likes count (min 0)
          const newLikes = Math.max(0, prompt.likes - 1);
          const updated = await prisma.prompt.update({
            where: { id: prompt.id },
            data: { likes: newLikes },
            select: { id: true, slug: true, likes: true, views: true, shares: true },
          });

          // If linked to an AppUser, decrement user's likesCount
          if (effectiveUserId) {
            await prisma.appUser.updateMany({
              where: {
                OR: [{ id: effectiveUserId }, { email: effectiveUserId.toLowerCase() }],
              },
              data: {
                likesCount: { decrement: 1 },
              },
            }).catch(() => {});
          }

          return NextResponse.json({
            success: true,
            action: 'unlike',
            isLiked: false,
            isUnique: true,
            message: 'Prompt unliked successfully',
            data: {
              ...updated,
              isLiked: false,
              trendingScore: calculateTrendingScore(updated.views, updated.likes, updated.shares),
              popularScore: calculatePopularScore(updated.views, updated.likes, updated.shares),
            },
          });
        }

        // Was not liked
        return NextResponse.json({
          success: true,
          action: 'unlike',
          isLiked: false,
          isUnique: false,
          message: 'Prompt was not liked',
          data: {
            ...prompt,
            isLiked: false,
            trendingScore: calculateTrendingScore(prompt.views, prompt.likes, prompt.shares),
            popularScore: calculatePopularScore(prompt.views, prompt.likes, prompt.shares),
          },
        });
      }

      // 2. LIKE action
      if (existingLike) {
        // Already liked by this client/user: DO NOT increment counter again
        return NextResponse.json({
          success: true,
          action: 'like',
          isLiked: true,
          isUnique: false,
          message: 'Prompt is already liked by this user/device',
          data: {
            ...prompt,
            isLiked: true,
            trendingScore: calculateTrendingScore(prompt.views, prompt.likes, prompt.shares),
            popularScore: calculatePopularScore(prompt.views, prompt.likes, prompt.shares),
          },
        });
      }

      // First-time unique like: insert record and increment
      await prisma.promptLike.create({
        data: {
          promptId: prompt.id,
          clientIdentifier,
          userId: effectiveUserId || null,
        },
      });

      const updated = await prisma.prompt.update({
        where: { id: prompt.id },
        data: { likes: { increment: 1 } },
        select: { id: true, slug: true, likes: true, views: true, shares: true },
      });

      // If linked to an AppUser, increment user's likesCount
      if (effectiveUserId) {
        await prisma.appUser.updateMany({
          where: {
            OR: [{ id: effectiveUserId }, { email: effectiveUserId.toLowerCase() }],
          },
          data: {
            likesCount: { increment: 1 },
          },
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        action: 'like',
        isLiked: true,
        isUnique: true,
        message: 'Prompt liked successfully',
        data: {
          ...updated,
          isLiked: true,
          trendingScore: calculateTrendingScore(updated.views, updated.likes, updated.shares),
          popularScore: calculatePopularScore(updated.views, updated.likes, updated.shares),
        },
      });
    }

    // 3. SHARE or VIEW action (simple atomic counter increment)
    const updateData: any = {};
    if (type === 'view') updateData.views = { increment: 1 };
    if (type === 'share') updateData.shares = { increment: 1 };

    const updated = await prisma.prompt.update({
      where: { id: prompt.id },
      data: updateData,
      select: {
        id: true,
        slug: true,
        likes: true,
        views: true,
        shares: true,
      },
    });

    // Check if user has liked this prompt to preserve accurate isLiked state
    const existingLike = await prisma.promptLike.findUnique({
      where: {
        promptId_clientIdentifier: {
          promptId: prompt.id,
          clientIdentifier,
        },
      },
    });

    return NextResponse.json({
      success: true,
      action: type,
      message: `Successfully registered ${type}`,
      data: {
        ...updated,
        isLiked: Boolean(existingLike),
        trendingScore: calculateTrendingScore(updated.views, updated.likes, updated.shares),
        popularScore: calculatePopularScore(updated.views, updated.likes, updated.shares),
      },
    });
  } catch (error) {
    console.error('Record interaction error:', error);
    return NextResponse.json({ success: false, error: 'Failed to record interaction' }, { status: 500 });
  }
}
