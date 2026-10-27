import prisma from '@/lib/prisma';
import { TrendingConfig, TrendingPeriod, TrendingRankedPrompt } from '@/types';

// In-memory cache for high-throughput responses
interface CacheEntry {
  data: any;
  timestamp: number;
}
const trendingCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds TTL

export const DEFAULT_TRENDING_CONFIG: TrendingConfig = {
  id: 'default',
  weightViews: 1.0,
  weightLikes: 3.0,
  weightCopies: 5.0,
  weightShares: 4.0,
  maxPromptsPerCategory: 10,
  enableToday: true,
  enableWeekly: true,
  enableMonthly: true,
  enableAllTime: true,
  minScoreThreshold: 0.0,
};

/**
 * Invalidate the in-memory trending cache.
 * Call this whenever a prompt action (like, view, share, copy) is recorded
 * or whenever trending settings are modified.
 */
export function invalidateTrendingCache() {
  trendingCache.clear();
}

/**
 * Fetch or initialize the trending settings from the database.
 */
export async function getTrendingConfig(): Promise<TrendingConfig> {
  try {
    const config = await prisma.trendingSetting.findUnique({
      where: { id: 'default' },
    });

    if (config) {
      return {
        id: config.id,
        weightViews: Number(config.weightViews),
        weightLikes: Number(config.weightLikes),
        weightCopies: Number(config.weightCopies),
        weightShares: Number(config.weightShares),
        maxPromptsPerCategory: config.maxPromptsPerCategory,
        enableToday: config.enableToday,
        enableWeekly: config.enableWeekly,
        enableMonthly: config.enableMonthly,
        enableAllTime: config.enableAllTime,
        minScoreThreshold: Number(config.minScoreThreshold),
        updatedAt: config.updatedAt.toISOString(),
      };
    }

    // Upsert default settings
    const created = await prisma.trendingSetting.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        weightViews: DEFAULT_TRENDING_CONFIG.weightViews,
        weightLikes: DEFAULT_TRENDING_CONFIG.weightLikes,
        weightCopies: DEFAULT_TRENDING_CONFIG.weightCopies,
        weightShares: DEFAULT_TRENDING_CONFIG.weightShares,
        maxPromptsPerCategory: DEFAULT_TRENDING_CONFIG.maxPromptsPerCategory,
        enableToday: DEFAULT_TRENDING_CONFIG.enableToday,
        enableWeekly: DEFAULT_TRENDING_CONFIG.enableWeekly,
        enableMonthly: DEFAULT_TRENDING_CONFIG.enableMonthly,
        enableAllTime: DEFAULT_TRENDING_CONFIG.enableAllTime,
        minScoreThreshold: DEFAULT_TRENDING_CONFIG.minScoreThreshold,
      },
    });

    return {
      id: created.id,
      weightViews: Number(created.weightViews),
      weightLikes: Number(created.weightLikes),
      weightCopies: Number(created.weightCopies),
      weightShares: Number(created.weightShares),
      maxPromptsPerCategory: created.maxPromptsPerCategory,
      enableToday: created.enableToday,
      enableWeekly: created.enableWeekly,
      enableMonthly: created.enableMonthly,
      enableAllTime: created.enableAllTime,
      minScoreThreshold: Number(created.minScoreThreshold),
      updatedAt: created.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching trending config, using defaults:', error);
    return DEFAULT_TRENDING_CONFIG;
  }
}

/**
 * Get configured application timezone from AppSettings, defaulting to UTC.
 */
export async function getAppTimezone(): Promise<string> {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: 'default' },
      select: { timezone: true },
    });
    return settings?.timezone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Calculate the exact start timestamps for Today, Weekly, and Monthly
 * based on the configured timezone.
 */
export function getPeriodDateRanges(timezone: string = 'UTC') {
  const now = new Date();

  try {
    // Format current date in target timezone to get YYYY, MM, DD, and weekday
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const partMap: Record<string, string> = {};
    for (const part of parts) {
      partMap[part.type] = part.value;
    }

    const year = parseInt(partMap.year, 10);
    const month = parseInt(partMap.month, 10); // 1-12
    const day = parseInt(partMap.day, 10);
    const hour = parseInt(partMap.hour, 10);
    const minute = parseInt(partMap.minute, 10);
    const second = parseInt(partMap.second, 10);

    // Calculate how many milliseconds have elapsed since today's 00:00:00 in the target timezone
    const msElapsedToday = (hour * 3600 + minute * 60 + second) * 1000 + now.getMilliseconds();
    const todayStart = new Date(now.getTime() - msElapsedToday);

    // Weekday: Mon=0, Tue=1, ..., Sun=6 (ISO week starting Monday)
    const weekdayStr = partMap.weekday; // 'Mon', 'Tue', etc.
    const dayMap: Record<string, number> = {
      Mon: 0,
      Tue: 1,
      Wed: 2,
      Thu: 3,
      Fri: 4,
      Sat: 5,
      Sun: 6,
    };
    const daysSinceMonday = dayMap[weekdayStr] ?? 0;
    const weeklyStart = new Date(todayStart.getTime() - daysSinceMonday * 86400000);

    // Month start: beginning of 1st day of the current month
    const daysSinceFirstOfMonth = day - 1;
    const monthlyStart = new Date(todayStart.getTime() - daysSinceFirstOfMonth * 86400000);

    return {
      timezone,
      now,
      todayStart,
      weeklyStart,
      monthlyStart,
    };
  } catch (err) {
    console.warn(`Error resolving timezone "${timezone}", falling back to UTC:`, err);
    // Strict UTC fallback
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const dayOfWeek = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1;
    const weeklyStart = new Date(todayStart.getTime() - dayOfWeek * 86400000);
    const monthlyStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

    return {
      timezone: 'UTC',
      now,
      todayStart,
      weeklyStart,
      monthlyStart,
    };
  }
}

/**
 * Calculate trending score using weighted formula.
 */
export function calculateWeightedTrendingScore(
  views: number,
  likes: number,
  copies: number,
  shares: number,
  weights: { weightViews: number; weightLikes: number; weightCopies: number; weightShares: number }
): number {
  const score =
    views * weights.weightViews +
    likes * weights.weightLikes +
    copies * weights.weightCopies +
    shares * weights.weightShares;
  return Math.round(score * 100) / 100;
}

/**
 * Filter condition ensuring deleted, inactive, or unapproved prompts
 * (or prompts under inactive categories/subcategories) are strictly excluded.
 */
export const ELIGIBLE_PROMPT_WHERE = {
  isDeleted: false,
  status: true,
  category: {
    status: true,
  },
  AND: [
    {
      OR: [{ subcategoryId: null }, { subcategory: { status: true } }],
    },
  ],
};

/**
 * Fetch and rank prompts for All-Time category.
 */
async function calculateAllTimeTrending(
  config: TrendingConfig,
  limit: number,
  likedPromptIds: Set<string>
): Promise<TrendingRankedPrompt[]> {
  const prompts = await prisma.prompt.findMany({
    where: ELIGIBLE_PROMPT_WHERE,
    select: {
      id: true,
      title: true,
      slug: true,
      prompt: true,
      featuredImage: true,
      tags: true,
      likes: true,
      views: true,
      shares: true,
      copies: true,
      status: true,
      isDeleted: true,
      createdById: true,
      isPremium: true,
      isFeatured: true,
      createdAt: true,
      updatedAt: true,
      categoryId: true,
      subcategoryId: true,
      category: {
        select: { id: true, title: true, slug: true, image: true },
      },
      subcategory: {
        select: { id: true, title: true, slug: true, image: true },
      },
    },
  });

  const scored = prompts.map((p) => {
    let parsedTags: string[] = [];
    try {
      parsedTags = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags;
    } catch {
      parsedTags = [];
    }

    const score = calculateWeightedTrendingScore(p.views, p.likes, p.copies, p.shares, config);

    return {
      ...p,
      tags: parsedTags,
      score,
      trendingScore: score,
      popularScore: p.likes + p.shares + p.views + p.copies,
      isLiked: likedPromptIds.has(p.id),
      periodActivity: {
        views: p.views,
        likes: p.likes,
        copies: p.copies,
        shares: p.shares,
      },
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  });

  // Filter by minimum threshold and sort descending by score
  const filtered = scored.filter((p) => p.score >= config.minScoreThreshold);

  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.likes !== a.likes) return b.likes - a.likes;
    if (b.views !== a.views) return b.views - a.views;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return filtered.slice(0, limit).map((p, idx) => ({
    ...p,
    rank: idx + 1,
  }));
}

/**
 * Fetch and rank prompts for time-based categories (Today, Weekly, Monthly)
 * using the PromptActivity event table.
 */
async function calculateTimeBasedTrending(
  startDate: Date,
  config: TrendingConfig,
  limit: number,
  likedPromptIds: Set<string>
): Promise<TrendingRankedPrompt[]> {
  // Aggregate activities since startDate for eligible prompts
  const activities = await prisma.promptActivity.groupBy({
    by: ['promptId', 'type'],
    where: {
      createdAt: { gte: startDate },
      prompt: ELIGIBLE_PROMPT_WHERE,
    },
    _count: {
      _all: true,
    },
  });

  // Aggregate by promptId
  const activityMap = new Map<string, { views: number; likes: number; copies: number; shares: number }>();
  for (const act of activities) {
    if (!activityMap.has(act.promptId)) {
      activityMap.set(act.promptId, { views: 0, likes: 0, copies: 0, shares: 0 });
    }
    const current = activityMap.get(act.promptId)!;
    const count = act._count._all;

    if (act.type === 'view') current.views += count;
    else if (act.type === 'like') current.likes += count;
    else if (act.type === 'copy') current.copies += count;
    else if (act.type === 'share') current.shares += count;
  }

  // Calculate score for active prompts
  const promptScores: { promptId: string; score: number; activity: { views: number; likes: number; copies: number; shares: number } }[] = [];
  activityMap.forEach((act, promptId) => {
    const score = calculateWeightedTrendingScore(act.views, act.likes, act.copies, act.shares, config);
    if (score >= config.minScoreThreshold) {
      promptScores.push({ promptId, score, activity: act });
    }
  });

  // Sort descending by period score
  promptScores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.activity.likes !== a.activity.likes) return b.activity.likes - a.activity.likes;
    return b.activity.views - a.activity.views;
  });

  const topScored = promptScores.slice(0, limit);
  const promptIds = topScored.map((ps) => ps.promptId);

  if (promptIds.length === 0) {
    return [];
  }

  // Fetch prompt details for the ranked prompt IDs
  const prompts = await prisma.prompt.findMany({
    where: {
      id: { in: promptIds },
      ...ELIGIBLE_PROMPT_WHERE,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      prompt: true,
      featuredImage: true,
      tags: true,
      likes: true,
      views: true,
      shares: true,
      copies: true,
      status: true,
      isDeleted: true,
      createdById: true,
      isPremium: true,
      isFeatured: true,
      createdAt: true,
      updatedAt: true,
      categoryId: true,
      subcategoryId: true,
      category: {
        select: { id: true, title: true, slug: true, image: true },
      },
      subcategory: {
        select: { id: true, title: true, slug: true, image: true },
      },
    },
  });

  const promptMap = new Map(prompts.map((p) => [p.id, p]));

  // Assemble result preserving the sorted ranking order
  const ranked: TrendingRankedPrompt[] = [];
  let rankIndex = 1;

  for (const item of topScored) {
    const p = promptMap.get(item.promptId);
    if (!p) continue;

    let parsedTags: string[] = [];
    try {
      parsedTags = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags;
    } catch {
      parsedTags = [];
    }

    ranked.push({
      ...p,
      tags: parsedTags,
      score: item.score,
      trendingScore: item.score,
      popularScore: p.likes + p.shares + p.views + p.copies,
      rank: rankIndex++,
      isLiked: likedPromptIds.has(p.id),
      periodActivity: item.activity,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    });
  }

  return ranked;
}

/**
 * Main engine function: calculate dynamic trending prompts across all 4 categories.
 */
export async function getDynamicTrending(options?: {
  period?: TrendingPeriod;
  limit?: number;
  userId?: string | null;
  deviceId?: string | null;
  forceRefresh?: boolean;
}) {
  const { period, limit: overrideLimit, userId, deviceId, forceRefresh = false } = options || {};

  const config = await getTrendingConfig();
  const timezone = await getAppTimezone();
  const boundaries = getPeriodDateRanges(timezone);

  // Generate cache key
  const cacheKey = `trending:${period || 'all'}:${overrideLimit || 'def'}:${userId || 'anon'}:${deviceId || 'anon'}`;
  const now = Date.now();

  if (!forceRefresh) {
    const cached = trendingCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // Resolve liked prompt IDs for personalized isLiked flag
  const likedPromptIds = new Set<string>();
  if (userId || deviceId) {
    const clientIdentifiers: string[] = [];
    if (userId) clientIdentifiers.push(`user:${userId.toLowerCase()}`);
    if (deviceId) clientIdentifiers.push(`device:${deviceId}`);

    if (clientIdentifiers.length > 0) {
      const likes = await prisma.promptLike.findMany({
        where: {
          clientIdentifier: { in: clientIdentifiers },
        },
        select: { promptId: true },
      });
      likes.forEach((l) => likedPromptIds.add(l.promptId));
    }
  }

  const effectiveLimit = Math.max(1, Math.min(100, overrideLimit || config.maxPromptsPerCategory));

  // If specific period is requested, calculate only that period
  if (period) {
    let prompts: TrendingRankedPrompt[] = [];
    let isEnabled = true;

    if (period === 'today') {
      isEnabled = config.enableToday;
      if (isEnabled) {
        prompts = await calculateTimeBasedTrending(boundaries.todayStart, config, effectiveLimit, likedPromptIds);
      }
    } else if (period === 'weekly') {
      isEnabled = config.enableWeekly;
      if (isEnabled) {
        prompts = await calculateTimeBasedTrending(boundaries.weeklyStart, config, effectiveLimit, likedPromptIds);
      }
    } else if (period === 'monthly') {
      isEnabled = config.enableMonthly;
      if (isEnabled) {
        prompts = await calculateTimeBasedTrending(boundaries.monthlyStart, config, effectiveLimit, likedPromptIds);
      }
    } else if (period === 'all_time') {
      isEnabled = config.enableAllTime;
      if (isEnabled) {
        prompts = await calculateAllTimeTrending(config, effectiveLimit, likedPromptIds);
      }
    }

    const result = {
      success: true,
      category: period,
      isEnabled,
      prompts,
      meta: {
        timezone,
        periodRange:
          period === 'today'
            ? { start: boundaries.todayStart.toISOString(), end: boundaries.now.toISOString() }
            : period === 'weekly'
            ? { start: boundaries.weeklyStart.toISOString(), end: boundaries.now.toISOString() }
            : period === 'monthly'
            ? { start: boundaries.monthlyStart.toISOString(), end: boundaries.now.toISOString() }
            : undefined,
        weights: {
          views: config.weightViews,
          likes: config.weightLikes,
          copies: config.weightCopies,
          shares: config.weightShares,
        },
        limit: effectiveLimit,
        generatedAt: new Date().toISOString(),
      },
    };

    trendingCache.set(cacheKey, { data: result, timestamp: now });
    return result;
  }

  // Calculate all 4 categories concurrently
  const [todayPrompts, weeklyPrompts, monthlyPrompts, allTimePrompts] = await Promise.all([
    config.enableToday
      ? calculateTimeBasedTrending(boundaries.todayStart, config, effectiveLimit, likedPromptIds)
      : Promise.resolve([]),
    config.enableWeekly
      ? calculateTimeBasedTrending(boundaries.weeklyStart, config, effectiveLimit, likedPromptIds)
      : Promise.resolve([]),
    config.enableMonthly
      ? calculateTimeBasedTrending(boundaries.monthlyStart, config, effectiveLimit, likedPromptIds)
      : Promise.resolve([]),
    config.enableAllTime
      ? calculateAllTimeTrending(config, effectiveLimit, likedPromptIds)
      : Promise.resolve([]),
  ]);

  const result = {
    success: true,
    data: {
      today: todayPrompts,
      weekly: weeklyPrompts,
      monthly: monthlyPrompts,
      all_time: allTimePrompts,
    },
    meta: {
      timezone,
      weights: {
        views: config.weightViews,
        likes: config.weightLikes,
        copies: config.weightCopies,
        shares: config.weightShares,
      },
      limits: {
        today: effectiveLimit,
        weekly: effectiveLimit,
        monthly: effectiveLimit,
        all_time: effectiveLimit,
      },
      sectionsEnabled: {
        today: config.enableToday,
        weekly: config.enableWeekly,
        monthly: config.enableMonthly,
        all_time: config.enableAllTime,
      },
      periodRanges: {
        today: { start: boundaries.todayStart.toISOString(), end: boundaries.now.toISOString() },
        weekly: { start: boundaries.weeklyStart.toISOString(), end: boundaries.now.toISOString() },
        monthly: { start: boundaries.monthlyStart.toISOString(), end: boundaries.now.toISOString() },
      },
      generatedAt: new Date().toISOString(),
    },
  };

  trendingCache.set(cacheKey, { data: result, timestamp: now });
  return result;
}
