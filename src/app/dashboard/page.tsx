'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import {
  Sparkles,
  FolderTree,
  Flame,
  CheckCircle,
  FileEdit,
  Heart,
  Eye,
  Share2,
  Users,
  TrendingUp,
  Crown,
  Activity,
  ArrowUpRight,
  FolderCheck,
  FolderX,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DashboardStats } from '@/types';
import { formatCompactNumber } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

// Custom Tooltip Components for Theme-Aware High-Contrast Visuals
const CustomCategoryTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const count = Number(item.value || 0);
    return (
      <div className="px-3.5 py-2.5 rounded-xl shadow-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.payload?.fill || item.color }}
          />
          <span>{item.name}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-4 text-slate-600 dark:text-slate-300">
          <span>Prompts count:</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{count}</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3.5 py-2 rounded-xl shadow-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
        <p className="font-bold text-slate-900 dark:text-white">{label}</p>
        <p className="mt-1 text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
          <span>Prompts:</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3.5 py-2.5 rounded-xl shadow-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs space-y-1">
        <p className="font-bold text-slate-900 dark:text-white mb-1.5">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatCompactNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Top welcome banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Analytics & Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Real-time insights across prompt repository, audience engagement, and platform growth.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/prompts/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Sparkles className="w-4 h-4" /> New Prompt
            </Link>
          </div>
        </div>

        {/* 12 Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))
          ) : (
            <>
              {/* Card 1: Total Prompts */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Prompts</span>
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.totalPrompts || 0}
                </div>
                <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <ArrowUpRight className="w-3 h-3" /> Active repository
                </div>
              </div>

              {/* Card 2: Total Categories */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Categories</span>
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <FolderTree className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.totalCategories || 0}
                </div>
                <div className="mt-1 text-[11px] text-purple-600 dark:text-purple-400 font-medium">Taxonomy groups</div>
              </div>

              {/* Card 3: Premium Prompts */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Premium Prompts</span>
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <Crown className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.premiumPrompts || 0}
                </div>
                <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">VIP Tier Prompts</div>
              </div>

              {/* Card 4: Published Prompts */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Published Prompts</span>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.publishedPrompts || 0}
                </div>
                <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Publicly visible</div>
              </div>

              {/* Card 5: Draft Prompts */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Draft Prompts</span>
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <FileEdit className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.draftPrompts || 0}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">Unpublished drafts</div>
              </div>

              {/* Card 6: Active Categories */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Categories</span>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <FolderCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.activeCategories || 0}
                </div>
                <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Live on client app</div>
              </div>

              {/* Card 7: Inactive Categories */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Inactive Categories</span>
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <FolderX className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.inactiveCategories || 0}
                </div>
                <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">Disabled</div>
              </div>

              {/* Card 8: Total Likes */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Likes</span>
                  <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
                    <Heart className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCompactNumber(stats?.totalLikes || 0)}
                </div>
                <div className="mt-1 text-[11px] text-pink-600 dark:text-pink-400 font-medium">User appreciations</div>
              </div>

              {/* Card 9: Total Views */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Views</span>
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCompactNumber(stats?.totalViews || 0)}
                </div>
                <div className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">Impressions served</div>
              </div>

              {/* Card 10: Total Shares */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Shares</span>
                  <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                    <Share2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCompactNumber(stats?.totalShares || 0)}
                </div>
                <div className="mt-1 text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">Viral shares</div>
              </div>

              {/* Card 11: Total Admins */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Admin Staff</span>
                  <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.totalAdmins || 0} / 4
                </div>
                <div className="mt-1 text-[11px] text-violet-600 dark:text-violet-400 font-medium">Accounts provisioned</div>
              </div>

              {/* Card 12: Trending Prompts */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Trending Prompts</span>
                  <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.trendingPrompts?.length || 0}
                </div>
                <div className="mt-1 text-[11px] text-orange-600 dark:text-orange-400 font-medium">Viral acceleration</div>
              </div>
            </>
          )}
        </div>

        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Monthly Growth (Bar Chart) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Monthly Prompt Growth</h3>
                <p className="text-xs text-slate-500">Volume of curated prompts published over time</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="h-72">
              {loading ? (
                <Skeleton className="w-full h-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.monthlyPromptGrowth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="prompts" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Category Distribution (Pie / Donut Chart) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Category Distribution</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Prompts grouped by taxonomy</p>
              </div>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <FolderTree className="w-4 h-4" />
              </div>
            </div>
            <div className="h-56 flex-1 relative flex items-center justify-center">
              {loading ? (
                <Skeleton className="w-full h-full rounded-xl" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.categoryDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {(stats?.categoryDistribution || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomCategoryTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Stat in Donut Chart */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
                      {stats?.totalCategories || 0}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                      Categories
                    </span>
                  </div>
                </>
              )}
            </div>
            {/* Legend pills with clear, visible category names and counts */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
              {(stats?.categoryDistribution || []).map((c, i) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="truncate text-slate-800 dark:text-slate-200 font-medium text-[11px]" title={c.name}>
                      {c.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white shrink-0 px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                    {c.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Line Chart: Views vs Likes Analytics */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Engagement Progression</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Weekly comparison between impressions, appreciations, and shares</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="h-72">
            {loading ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.viewsAnalytics || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip content={<CustomLineTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
                    formatter={(value) => <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">{value}</span>}
                  />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} name="Views" />
                  <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3 }} name="Likes" />
                  <Line type="monotone" dataKey="shares" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Shares" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Highlights: Recent Prompts & Trending Prompts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trending Prompts */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Trending Prompts</h3>
              </div>
              <Link href="/prompts?sortBy=trending" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                View All
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats?.trendingPrompts?.map((prompt) => (
                <div key={prompt.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prompt.featuredImage}
                      alt={prompt.title}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {prompt.title}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{prompt.category?.title}</span>
                        <span>•</span>
                        <span>{formatCompactNumber(prompt.views)} views</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className="px-2 py-1 rounded-lg text-xs font-bold bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                      🔥 {prompt.trendingScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Categories */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Popular Categories</h3>
              </div>
              <Link href="/categories" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                Manage
              </Link>
            </div>
            <div className="space-y-4">
              {stats?.popularCategories?.slice(0, 5).map((category) => (
                <div key={category.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-800 dark:text-slate-200">{category.title}</span>
                    <span className="text-slate-500">{category.count} prompts ({category.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, category.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
