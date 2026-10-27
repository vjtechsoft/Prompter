'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/admin-layout';
import {
  Flame,
  Calendar,
  CalendarRange,
  Trophy,
  Sliders,
  RefreshCw,
  Search,
  Eye,
  Edit2,
  Copy,
  Check,
  Crown,
  Heart,
  Share2,
  Sparkles,
  Zap,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Save,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  TrendingConfig,
  TrendingPeriod,
  TrendingRankedPrompt,
} from '@/types';
import { formatCompactNumber } from '@/lib/utils';

export default function TrendingPage() {
  const [activeTab, setActiveTab] = useState<TrendingPeriod | 'settings'>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Trending data
  const [todayPrompts, setTodayPrompts] = useState<TrendingRankedPrompt[]>([]);
  const [weeklyPrompts, setWeeklyPrompts] = useState<TrendingRankedPrompt[]>([]);
  const [monthlyPrompts, setMonthlyPrompts] = useState<TrendingRankedPrompt[]>([]);
  const [allTimePrompts, setAllTimePrompts] = useState<TrendingRankedPrompt[]>([]);

  // Config & Activity stats
  const [config, setConfig] = useState<TrendingConfig>({
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
  });

  const [formConfig, setFormConfig] = useState<TrendingConfig>(config);
  const [metaInfo, setMetaInfo] = useState<{
    timezone: string;
    generatedAt: string;
    periodRanges?: Record<string, { start: string; end: string }>;
  }>({
    timezone: 'UTC',
    generatedAt: '',
  });

  const [activityStats, setActivityStats] = useState({
    todayCount: 0,
    weeklyCount: 0,
    monthlyCount: 0,
    totalCount: 0,
  });

  // Search filter inside lists
  const [searchQuery, setSearchQuery] = useState('');

  // Prompt preview modal
  const [previewPrompt, setPreviewPrompt] = useState<TrendingRankedPrompt | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const { success, error } = useToast();

  const loadTrendingData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const url = isRefresh ? '/api/trending?refresh=true' : '/api/trending';
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch trending data');
      }

      if (data.config) {
        setConfig(data.config);
        setFormConfig(data.config);
      }

      if (data.activityStats) {
        setActivityStats(data.activityStats);
      }

      if (data.trending?.data) {
        setTodayPrompts(data.trending.data.today || []);
        setWeeklyPrompts(data.trending.data.weekly || []);
        setMonthlyPrompts(data.trending.data.monthly || []);
        setAllTimePrompts(data.trending.data.all_time || []);
      }

      if (data.trending?.meta) {
        setMetaInfo({
          timezone: data.trending.meta.timezone || 'UTC',
          generatedAt: data.trending.meta.generatedAt || '',
          periodRanges: data.trending.meta.periodRanges,
        });
      }

      if (isRefresh) {
        success('Trending rankings refreshed successfully!');
      }
    } catch (err: any) {
      error(err.message || 'Error loading trending prompts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [error, success]);

  useEffect(() => {
    loadTrendingData();
  }, [loadTrendingData]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);

    try {
      const res = await fetch('/api/trending/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formConfig),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setConfig(data.config);
      setFormConfig(data.config);
      success('Trending algorithm settings updated and cache recalculated!');
      // Reload trending rankings with new settings
      loadTrendingData(true);
    } catch (err: any) {
      error(err.message || 'Error saving settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    success('Prompt copied to clipboard!');
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  // Get active list based on selected tab
  const getActivePrompts = () => {
    switch (activeTab) {
      case 'today':
        return todayPrompts;
      case 'weekly':
        return weeklyPrompts;
      case 'monthly':
        return monthlyPrompts;
      case 'all_time':
        return allTimePrompts;
      default:
        return [];
    }
  };

  const activePrompts = getActivePrompts();
  const filteredPrompts = activePrompts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Tab definitions
  const tabs = [
    {
      id: 'today' as const,
      label: 'Today Trending',
      icon: Flame,
      count: todayPrompts.length,
      badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
      activeGradient: 'from-orange-500 to-amber-500',
      enabled: config.enableToday,
    },
    {
      id: 'weekly' as const,
      label: 'Weekly Trending',
      icon: Calendar,
      count: weeklyPrompts.length,
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      activeGradient: 'from-indigo-600 to-purple-600',
      enabled: config.enableWeekly,
    },
    {
      id: 'monthly' as const,
      label: 'Monthly Trending',
      icon: CalendarRange,
      count: monthlyPrompts.length,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      activeGradient: 'from-emerald-600 to-teal-600',
      enabled: config.enableMonthly,
    },
    {
      id: 'all_time' as const,
      label: 'All-Time Trending',
      icon: Trophy,
      count: allTimePrompts.length,
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      activeGradient: 'from-amber-500 to-yellow-600',
      enabled: config.enableAllTime,
    },
    {
      id: 'settings' as const,
      label: 'Algorithm & Weights',
      icon: Sliders,
      count: null,
      badgeColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      activeGradient: 'from-slate-700 to-slate-900',
      enabled: true,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-sm">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  Dynamic Trending Prompts
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                    Live Engine
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Four independent time-period rankings calculated dynamically by weighted engagement velocity.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadTrendingData(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all disabled:opacity-50"
              title="Force Recalculate & Invalidate Cache"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
              <span>{refreshing ? 'Recalculating...' : 'Refresh Rankings'}</span>
            </button>

            <Link
              href="/client-apis"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 transition-colors"
            >
              <span>Client API Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Category Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Today Trending */}
          <div
            onClick={() => setActiveTab('today')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer glass-card glass-card-hover ${
              activeTab === 'today'
                ? 'bg-gradient-to-br from-orange-500/15 via-amber-500/5 to-transparent border-orange-500/40 ring-1 ring-orange-500/30 shadow-glow-amber/20'
                : 'border-slate-200/80 dark:border-white/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                  <Flame className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Today</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 font-mono">
                {activityStats.todayCount} events
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {todayPrompts.length > 0 ? `#1: ${todayPrompts[0].score}` : '0'}
              </div>
              <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">
                {todayPrompts.length} ranked
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {todayPrompts.length > 0 ? todayPrompts[0].title : 'Awaiting today activity'}
            </p>
          </div>

          {/* Card 2: Weekly Trending */}
          <div
            onClick={() => setActiveTab('weekly')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer glass-card glass-card-hover ${
              activeTab === 'weekly'
                ? 'bg-gradient-to-br from-indigo-500/15 via-purple-500/5 to-transparent border-indigo-500/40 ring-1 ring-indigo-500/30 shadow-glow-indigo/20'
                : 'border-slate-200/80 dark:border-white/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  <Calendar className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">This Week</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 font-mono">
                {activityStats.weeklyCount} events
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {weeklyPrompts.length > 0 ? `#1: ${weeklyPrompts[0].score}` : '0'}
              </div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                {weeklyPrompts.length} ranked
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {weeklyPrompts.length > 0 ? weeklyPrompts[0].title : 'Awaiting weekly activity'}
            </p>
          </div>

          {/* Card 3: Monthly Trending */}
          <div
            onClick={() => setActiveTab('monthly')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer glass-card glass-card-hover ${
              activeTab === 'monthly'
                ? 'bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-transparent border-emerald-500/40 ring-1 ring-emerald-500/30 shadow-sm'
                : 'border-slate-200/80 dark:border-white/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CalendarRange className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">This Month</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 font-mono">
                {activityStats.monthlyCount} events
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {monthlyPrompts.length > 0 ? `#1: ${monthlyPrompts[0].score}` : '0'}
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                {monthlyPrompts.length} ranked
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {monthlyPrompts.length > 0 ? monthlyPrompts[0].title : 'Awaiting monthly activity'}
            </p>
          </div>

          {/* Card 4: All-Time Trending */}
          <div
            onClick={() => setActiveTab('all_time')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer glass-card glass-card-hover ${
              activeTab === 'all_time'
                ? 'bg-gradient-to-br from-amber-500/15 via-yellow-500/5 to-transparent border-amber-500/40 ring-1 ring-amber-500/30 shadow-glow-amber/20'
                : 'border-slate-200/80 dark:border-white/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Trophy className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">All-Time</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 font-mono">
                Lifetime Metrics
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {allTimePrompts.length > 0 ? `#1: ${allTimePrompts[0].score}` : '0'}
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                {allTimePrompts.length} ranked
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {allTimePrompts.length > 0 ? allTimePrompts[0].title : 'No prompts cataloged'}
            </p>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400 dark:text-orange-600' : ''}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-900'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {!tab.enabled && tab.id !== 'settings' && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    Disabled
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* SECTION: RANKINGS TAB (Today, Weekly, Monthly, All-Time) */}
        {activeTab !== 'settings' && (
          <div className="space-y-4">
            {/* Filter toolbar & metadata banner */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter trending prompts by title, category, or tag..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Timezone: {metaInfo.timezone}</span>
                </div>
                <span>•</span>
                <div className="hidden sm:inline-flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Formula: (V×{config.weightViews}) + (L×{config.weightLikes}) + (C×{config.weightCopies}) + (S×{config.weightShares})
                  </span>
                </div>
              </div>
            </div>

            {/* Prompts Ranking Table */}
            <div className="rounded-3xl glass-card overflow-hidden">
              {loading ? (
                <div className="p-8 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="w-24 h-8 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : filteredPrompts.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="inline-flex p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <Flame className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No Trending Prompts in this Period
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {searchQuery
                      ? 'No prompts matched your search query. Try clearing the search filter.'
                      : activeTab === 'all_time'
                      ? 'No active published prompts found. Publish some prompts to view rankings.'
                      : `No user activity (views, likes, copies, shares) has been recorded yet for ${activeTab}. Activity recorded via client apps or APIs will appear here in real time.`}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 w-16 text-center">Rank</th>
                        <th className="py-3 px-4">Prompt Title & Taxonomy</th>
                        <th className="py-3 px-4 text-center">Trending Score</th>
                        <th className="py-3 px-4 text-center">
                          {activeTab === 'all_time' ? 'Lifetime Activity' : 'Period Activity'}
                        </th>
                        <th className="py-3 px-4 text-center">Total Stats</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {filteredPrompts.map((prompt) => {
                        const rank = prompt.rank;
                        const isTop1 = rank === 1;
                        const isTop2 = rank === 2;
                        const isTop3 = rank === 3;

                        return (
                          <tr
                            key={prompt.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                          >
                            {/* Rank Column */}
                            <td className="py-3.5 px-4 text-center">
                              {isTop1 ? (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 font-extrabold text-sm border border-amber-500/30 shadow-sm">
                                  🥇 1
                                </span>
                              ) : isTop2 ? (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300/30 text-slate-600 dark:text-slate-300 font-extrabold text-sm border border-slate-400/30">
                                  🥈 2
                                </span>
                              ) : isTop3 ? (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-700/20 text-orange-700 dark:text-orange-400 font-extrabold text-sm border border-orange-700/30">
                                  🥉 3
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs font-mono">
                                  #{rank}
                                </span>
                              )}
                            </td>

                            {/* Prompt Info */}
                            <td className="py-3.5 px-4 min-w-[260px]">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                  <img
                                    src={prompt.featuredImage || '/logo.png'}
                                    alt={prompt.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                      {prompt.title}
                                    </h4>
                                    {prompt.isPremium && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        <Crown className="w-2.5 h-2.5" /> VIP
                                      </span>
                                    )}
                                    {prompt.isFeatured && (
                                      <span className="text-amber-400 font-bold text-xs" title="Featured Prompt">
                                        ★
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                      {prompt.category?.title || 'Uncategorized'}
                                    </span>
                                    {prompt.subcategory && (
                                      <>
                                        <span>↳</span>
                                        <span className="text-slate-400">
                                          {prompt.subcategory.title}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Trending Score Column */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-extrabold text-sm border border-orange-200 dark:border-orange-800/80 shadow-sm">
                                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                                  {prompt.score}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                  Trending Pts
                                </span>
                              </div>
                            </td>

                            {/* Period Activity Column */}
                            <td className="py-3.5 px-4 text-center">
                              {prompt.periodActivity ? (
                                <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 font-mono text-[11px]">
                                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400" title="Period Views">
                                    <Eye className="w-3 h-3 text-blue-500" />
                                    {prompt.periodActivity.views}
                                  </span>
                                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400" title="Period Likes">
                                    <Heart className="w-3 h-3 text-rose-500" />
                                    {prompt.periodActivity.likes}
                                  </span>
                                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400" title="Period Copies">
                                    <Copy className="w-3 h-3 text-emerald-500" />
                                    {prompt.periodActivity.copies}
                                  </span>
                                  <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400" title="Period Shares">
                                    <Share2 className="w-3 h-3 text-purple-500" />
                                    {prompt.periodActivity.shares}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            {/* Total Lifetime Counters */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
                                <span title="Lifetime Views">
                                  👁️ {formatCompactNumber(prompt.views)}
                                </span>
                                <span title="Lifetime Likes">
                                  ❤️ {formatCompactNumber(prompt.likes)}
                                </span>
                                <span title="Lifetime Copies">
                                  📋 {formatCompactNumber(prompt.copies || 0)}
                                </span>
                                <span title="Lifetime Shares">
                                  🔗 {formatCompactNumber(prompt.shares)}
                                </span>
                              </div>
                            </td>

                            {/* Actions Column */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewPrompt(prompt)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Quick Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyPrompt(prompt.prompt, prompt.id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Copy Prompt Content"
                                >
                                  {copiedPromptId === prompt.id ? (
                                    <Check className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                                <Link
                                  href={`/prompts/${prompt.id}/edit`}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                                  title="Edit Prompt"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION: CONFIGURATION & WEIGHTS TAB */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1 & 2: Weights & Parameters */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-orange-500" />
                        Trending Score Weights Formula
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Define the multiplier impact of each user action when ranking prompts.
                      </p>
                    </div>
                    <div className="px-3 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 text-xs font-mono font-bold">
                      Trending Score = (V×{formConfig.weightViews}) + (L×{formConfig.weightLikes}) + (C×{formConfig.weightCopies}) + (S×{formConfig.weightShares})
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Weight Views */}
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                      <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-blue-500" /> Views Weight (W_v)
                        </span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">
                          {formConfig.weightViews}x
                        </span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        value={formConfig.weightViews}
                        onChange={(e) =>
                          setFormConfig({ ...formConfig, weightViews: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-400">Baseline passive impression weight</p>
                    </div>

                    {/* Weight Likes */}
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                      <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-rose-500" /> Likes Weight (W_l)
                        </span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">
                          {formConfig.weightLikes}x
                        </span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        value={formConfig.weightLikes}
                        onChange={(e) =>
                          setFormConfig({ ...formConfig, weightLikes: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-400">High-intent unique user appreciation</p>
                    </div>

                    {/* Weight Copies */}
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                      <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Copy className="w-3.5 h-3.5 text-emerald-500" /> Copies / Uses Weight (W_c)
                        </span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">
                          {formConfig.weightCopies}x
                        </span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        value={formConfig.weightCopies}
                        onChange={(e) =>
                          setFormConfig({ ...formConfig, weightCopies: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-400">Direct utility value indicator</p>
                    </div>

                    {/* Weight Shares */}
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                      <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Share2 className="w-3.5 h-3.5 text-purple-500" /> Shares Weight (W_s)
                        </span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">
                          {formConfig.weightShares}x
                        </span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        value={formConfig.weightShares}
                        onChange={(e) =>
                          setFormConfig({ ...formConfig, weightShares: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-400">Organic viral distribution multiplier</p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Capacity & Minimum Thresholds */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Limits & Thresholds
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Max Prompts per Category (Default Limit)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formConfig.maxPromptsPerCategory}
                        onChange={(e) =>
                          setFormConfig({
                            ...formConfig,
                            maxPromptsPerCategory: parseInt(e.target.value, 10) || 10,
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                      />
                      <p className="text-[11px] text-slate-400">
                        Default count of trending prompts returned to client applications per category.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Minimum Trending Score Threshold
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formConfig.minScoreThreshold}
                        onChange={(e) =>
                          setFormConfig({
                            ...formConfig,
                            minScoreThreshold: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                      />
                      <p className="text-[11px] text-slate-400">
                        Prompts below this score are excluded from trending leaderboards (default 0).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Section Toggles & Actions */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Category Toggles
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enable or disable specific trending sections across the client app and APIs.
                  </p>

                  <div className="space-y-3 pt-2">
                    {/* Today Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">Today Trending</div>
                          <div className="text-[10px] text-slate-400">Current calendar day</div>
                        </div>
                      </div>
                      <Switch
                        checked={formConfig.enableToday}
                        onChange={(checked) => setFormConfig({ ...formConfig, enableToday: checked })}
                      />
                    </div>

                    {/* Weekly Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">Weekly Trending</div>
                          <div className="text-[10px] text-slate-400">Current calendar week</div>
                        </div>
                      </div>
                      <Switch
                        checked={formConfig.enableWeekly}
                        onChange={(checked) => setFormConfig({ ...formConfig, enableWeekly: checked })}
                      />
                    </div>

                    {/* Monthly Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <CalendarRange className="w-4 h-4 text-emerald-500" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">Monthly Trending</div>
                          <div className="text-[10px] text-slate-400">Current calendar month</div>
                        </div>
                      </div>
                      <Switch
                        checked={formConfig.enableMonthly}
                        onChange={(checked) => setFormConfig({ ...formConfig, enableMonthly: checked })}
                      />
                    </div>

                    {/* All-Time Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">All-Time Trending</div>
                          <div className="text-[10px] text-slate-400">Overall historical popularity</div>
                        </div>
                      </div>
                      <Switch
                        checked={formConfig.enableAllTime}
                        onChange={(checked) => setFormConfig({ ...formConfig, enableAllTime: checked })}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/30 transition-all disabled:opacity-50"
                    >
                      {savingSettings ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving Configuration...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Save & Apply Algorithm
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormConfig(config)}
                      className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                      Reset Unsaved Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Prompt Preview Modal */}
        {previewPrompt && (
          <Modal
            isOpen={Boolean(previewPrompt)}
            onClose={() => setPreviewPrompt(null)}
            title="Prompt Details & Engagement Preview"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 border">
                  <img
                    src={previewPrompt.featuredImage || '/logo.png'}
                    alt={previewPrompt.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {previewPrompt.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-xs font-bold">
                      Trending Score: {previewPrompt.score}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Rank #{previewPrompt.rank}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Prompt Body</span>
                  <button
                    type="button"
                    onClick={() => handleCopyPrompt(previewPrompt.prompt, previewPrompt.id)}
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {previewPrompt.prompt}
                </p>
              </div>

              {previewPrompt.periodActivity && (
                <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs font-mono">
                  <div>
                    <div className="text-slate-400 text-[10px]">Views</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {previewPrompt.periodActivity.views}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Likes</div>
                    <div className="font-bold text-rose-500 mt-0.5">
                      {previewPrompt.periodActivity.likes}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Copies</div>
                    <div className="font-bold text-emerald-500 mt-0.5">
                      {previewPrompt.periodActivity.copies}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Shares</div>
                    <div className="font-bold text-purple-500 mt-0.5">
                      {previewPrompt.periodActivity.shares}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Link
                  href={`/prompts/${previewPrompt.id}/edit`}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity"
                >
                  Edit Prompt
                </Link>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AdminLayout>
  );
}
