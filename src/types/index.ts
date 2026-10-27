export type Role = 'SUPER_ADMIN' | 'ADMIN';

export type UserSession = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  status: string;
};

export type SubcategoryItem = {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  status: boolean;
  position: number;
  categoryId: string;
  category?: {
    id: string;
    title: string;
    slug: string;
  };
  createdById: string;
  createdBy?: {
    name: string;
    email: string;
  };
  _count?: {
    prompts: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type CategoryItem = {
  id: string;
  title: string;
  slug: string;
  image: string;
  status: boolean;
  isFeatured: boolean;
  position: number;
  createdById: string;
  createdBy?: {
    name: string;
    email: string;
  };
  subcategories?: SubcategoryItem[];
  _count?: {
    prompts: number;
    subcategories?: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type PromptItem = {
  id: string;
  title: string;
  slug: string;
  prompt: string;
  featuredImage: string;
  categoryId: string;
  category?: {
    id: string;
    title: string;
    slug: string;
  };
  subcategoryId?: string | null;
  subcategory?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  tags: string[]; // parsed from JSON string
  likes: number;
  views: number;
  shares: number;
  copies: number;
  isPremium: boolean;
  isFeatured: boolean;
  status: boolean;
  isDeleted: boolean;
  createdById: string;
  createdBy?: {
    name: string;
    email: string;
  };
  trendingScore?: number;
  popularScore?: number;
  score?: number;
  rank?: number;
  periodActivity?: {
    views: number;
    likes: number;
    copies: number;
    shares: number;
  };
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FeaturedStats = {
  totalFeaturedPrompts: number;
  totalFeaturedCategories: number;
  featuredPromptLikes: number;
  featuredPromptViews: number;
  totalPromptsCatalog?: number;
  totalCategoriesCatalog?: number;
};

export type AppUserItem = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  authProvider: string;
  status: 'ACTIVE' | 'BLOCKED';
  isVip: boolean;
  appVersion: string | null;
  likesCount: number;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
};

export type AppUserStats = {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  vipUsers: number;
};

export type AdSettings = {
  id: string;
  activeProvider: 'ADMOB' | 'META' | 'UNITY' | 'NONE';
  interstitialInterval: number;
  nativeInterval: number;
  admobEnabled: boolean;
  admobAppId: string;
  admobBannerId: string;
  admobInterstitialId: string;
  admobRewardedId: string;
  admobNativeId: string;
  admobAppOpenId: string;
  metaEnabled: boolean;
  metaBannerId: string;
  metaInterstitialId: string;
  metaRewardedId: string;
  metaNativeId: string;
  unityEnabled: boolean;
  unityGameId: string;
  unityBannerPlacement: string;
  unityInterstitialPlacement: string;
  unityRewardedPlacement: string;
};

export type NotificationConfig = {
  id: string;
  oneSignalAppId: string;
  oneSignalRestKey: string;
  isEnabled: boolean;
};

export type AppGeneralSettings = {
  id: string;
  appName: string;
  developerName: string;
  packageName: string;
  versionName: string;
  versionCode: string;
  supportEmail: string;
  website: string;
  contactNumber: string;
  copyright: string;
  defaultLanguage: string;
  theme: string;
  timezone: string;
  currency: string;
  maintenanceMode: boolean;
  appLogo: string;
  splashLogo: string;
  appIcon: string;
  favicon: string;
};

export type AppUrlsConfig = {
  id: string;
  privacyPolicy: string;
  termsOfService: string;
  refundPolicy: string;
  dataDeletionPolicy: string;
  contactUs: string;
  aboutUs: string;
  website: string;
  playStore: string;
  facebook: string;
  instagram: string;
  youtube: string;
  twitter: string;
  telegram: string;
};

export type DashboardStats = {
  totalPrompts: number;
  totalCategories: number;
  premiumPrompts: number;
  publishedPrompts: number;
  draftPrompts: number;
  activeCategories: number;
  inactiveCategories: number;
  totalLikes: number;
  totalViews: number;
  totalShares: number;
  totalCopies?: number;
  totalAdmins: number;
  recentPrompts: PromptItem[];
  recentCategories: CategoryItem[];
  popularCategories: { id: string; title: string; slug: string; image: string; count: number; percentage: number }[];
  trendingPrompts: PromptItem[];
  monthlyPromptGrowth: { month: string; prompts: number }[];
  categoryDistribution: { name: string; value: number }[];
  viewsAnalytics: { date: string; views: number; likes: number; shares: number }[];
};

export type TrendingPeriod = 'today' | 'weekly' | 'monthly' | 'all_time';

export type TrendingConfig = {
  id: string;
  weightViews: number;
  weightLikes: number;
  weightCopies: number;
  weightShares: number;
  maxPromptsPerCategory: number;
  enableToday: boolean;
  enableWeekly: boolean;
  enableMonthly: boolean;
  enableAllTime: boolean;
  minScoreThreshold: number;
  updatedAt?: string;
};

export type TrendingRankedPrompt = PromptItem & {
  rank: number;
  score: number;
  periodActivity?: {
    views: number;
    likes: number;
    copies: number;
    shares: number;
  };
};

export type TrendingCategoryData = {
  category: TrendingPeriod;
  title: string;
  description: string;
  periodRange?: { start: string; end: string };
  totalCount: number;
  prompts: TrendingRankedPrompt[];
};

export type TrendingApiResponse = {
  success: boolean;
  data: {
    today: TrendingRankedPrompt[];
    weekly: TrendingRankedPrompt[];
    monthly: TrendingRankedPrompt[];
    all_time: TrendingRankedPrompt[];
  };
  meta: {
    timezone: string;
    weights: { views: number; likes: number; copies: number; shares: number };
    limits: { today: number; weekly: number; monthly: number; all_time: number };
    generatedAt: string;
  };
};

