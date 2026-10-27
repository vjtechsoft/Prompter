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
  Plus,
  Zap,
  BarChart3,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DashboardStats } from '@/types';
import { formatCompactNumber } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

// Custom Glassmorphic Tooltip Components
const CustomCategoryTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const count = Number(item.value || 0);
    return (
      <div className="px-4 py-3 rounded-2xl shadow-2xl border bg-white/95 dark:bg-[#0c101c]/95 border-slate-200/80 dark:border-white/10 backdrop-blur-xl text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.payload?.fill || item.color }}
          />
          <span>{item.name}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-5 text-slate-600 dark:text-slate-300">
          <span>Prompts count:</span>
          <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{count}</span>
        </div>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-4 py-2.5 rounded-2xl shadow-2xl border bg-white/95 dark:bg-[#0c101c]/95 border-slate-200/80 dark:border-white/10 backdrop-blur-xl text-xs">
        <p className="font-bold text-slate-900 dark:text-white">{label}</p>
        <p className="mt-1.5 text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-glow-indigo shrink-0" />
          <span>New Prompts:</span>
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
      <div className="px-4 py-3 rounded-2xl shadow-2xl border bg-white/95 dark:bg-[#0c101c]/95 border-slate-200/80 dark:border-white/10 backdrop-blur-xl text-xs space-y-1.5 min-w-[160px]">
        <p className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-1.5">
          {label} Engagement
        </p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
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
        {/* Hero Banner with Modern AI Studio Styling */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900/60 border border-indigo-500/20 backdrop-blur-xl shadow-2xl">
          {/* Ambient decorative glow inside hero */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Live Control Center
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Platform Intelligence Overview
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Real-time metrics tracking curated prompt distribution, audience virality, and API throughput across active client apps.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/trending"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold border border-white/15 backdrop-blur-md shadow-sm transition-all"
              >
                <Flame className="w-4 h-4 text-orange-400" /> Trending Engine
              </Link>
              <Link
                href="/prompts/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" /> New Prompt
              </Link>
            </div>
          </div>
        </div>

        {/* 12 Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-3xl" />
            ))
          ) : (
            <>
              {/* Card 1: Total Prompts */}
              <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Prompts</span>
                  <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {stats?.totalPrompts || 0}
                </div>
                <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <ArrowUpRight className="w-3 h-3" /> Active Repository
                </div>
              </div>

              {/* Card 2: Total Categories */}
              <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Categories</span>
                  <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 group-hover:scale-110 transition-transform">
                    <FolderTree className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {stats?.totalCategories || 0}
                </div>
                <div className="mt-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold">Taxonomy Groups</div>
              </div>

              {/* Card 3: Premium Prompts */}
              <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">VIP Prompts</span>
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:scale-110 transition-transform">
                    <Crown className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {stats?.premiumPrompts || 0}
                </div>
                <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">VIP Tier Prompts</div>
              </div>

              {/* Card 4: Published Prompts */}
              <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Published</span>
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {stats?.publishedPrompts || 0}
                </div>
                <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Publicly Visible</div>
              </div>

              {/* Card 5: Draft Prompts */}
              <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Drafts</span>
                  <div className="p-2.5 rounded-2xl bg-slate-500/10 text-slate-500 border border-slate-500/20 group-hover:scale-110 transition-transform">
                    <FileEdit className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {stats?.draftPrompts || 0}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Pending Review</div>
              </div>

              {/* Card 6: Active Categories */}
              <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Categories</span>
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <FolderCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {stats?.activeCategories || 0}
                </div>
                <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Live on Client App</div>
              </div>

              {/* Card 7: Inactive Categories */}
              <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Inactive Categories</span>
                  <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 group-hover:scale-110 transition-transform">
                    <FolderX className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {stats?.inactiveCategories || 0}
                </div>
                <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">Hidden / Archived</div>
              </div>

              {/* Card 8: Total Likes */}
              <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Likes</span>
                  <div className="p-2.5 rounded-2xl bg-pink-500/10 text-pink-500 border border-pink-500/20 group-hover:scale-110 transition-transform">
                    <Heart className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {formatCompactNumber(stats?.totalLikes || 0)}
                </div>
                <div className="mt-1 text-[11px] text-pink-600 dark:text-pink-400 font-semibold">Client App Appreciations</div>
              </div>

              {/* Card 9: Total Views */}
              <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Views</span>
                  <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {formatCompactNumber(stats?.totalViews || 0)}
                </div>
                <div className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Impressions Served</div>
              </div>

              {/* Card 10: Total Shares */}
              <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Shares</span>
                  <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                    <Share2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {formatCompactNumber(stats?.totalShares || 0)}
                </div>
                <div className="mt-1 text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">Viral Outbound Shares</div>
              </div>

              {/* Card 11: Admin Staff */}
              <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Admin Staff</span>
                  <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-500 border border-violet-500/20 group-hover:scale-110 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {stats?.totalAdmins || 0} <span className="text-sm font-semibold text-slate-400">/ 4 max</span>
                </div>
                <div className="mt-1 text-[11px] text-violet-600 dark:text-violet-400 font-semibold">RBAC Provisioned</div>
              </div>

              {/* Card 12: Trending Prompts */}
              <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Trending Prompts</span>
                  <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 group-hover:scale-110 transition-transform">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {stats?.trendingPrompts?.length || 0}
                </div>
                <div className="mt-1 text-[11px] text-orange-600 dark:text-orange-400 font-semibold">Viral Velocity</div>
              </div>
            </>
          )}
        </div>

        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Monthly Growth (Bar Chart) */}
          <div className="lg:col-span-2 p-6 sm:p-7 rounded-3xl glass-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Monthly Prompt Growth
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Volume of AI prompts curated and published over time
                </p>
              </div>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="h-72">
              {loading ? (
                <Skeleton className="w-full h-full rounded-2xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.monthlyPromptGrowth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="prompts" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Category Distribution (Pie / Donut Chart) */}
          <div className="p-6 sm:p-7 rounded-3xl glass-card flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Category Distribution
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Prompts grouped by taxonomy</p>
              </div>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <FolderTree className="w-4 h-4" />
              </div>
            </div>
            <div className="h-56 flex-1 relative flex items-center justify-center">
              {loading ? (
                <Skeleton className="w-full h-full rounded-2xl" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.categoryDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
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
                    <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                      {stats?.totalCategories || 0}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                      Categories
                    </span>
                  </div>
                </>
              )}
            </div>
            {/* Legend pills */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-white/5 mt-2">
              {(stats?.categoryDistribution || []).map((c, i) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 text-xs transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="truncate text-slate-800 dark:text-slate-200 font-semibold text-[11px]" title={c.name}>
                      {c.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white shrink-0 px-1.5 py-0.5 rounded-md bg-white dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/5">
                    {c.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Weekly Engagement Progression */}
        <div className="p-6 sm:p-7 rounded-3xl glass-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Activity className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Engagement Progression
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Comparative metrics across Views, Likes, and Shares throughout the weekly cycle
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-500 dark:text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Views
              </span>
              <span className="flex items-center gap-1.5 text-pink-500 dark:text-pink-400">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Likes
              </span>
              <span className="flex items-center gap-1.5 text-cyan-500 dark:text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Shares
              </span>
            </div>
          </div>
          <div className="h-64">
            {loading ? (
              <Skeleton className="w-full h-full rounded-2xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.viewsAnalytics || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomLineTooltip />} />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="shares" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Highlights: Recent Prompts & Trending Prompts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trending Prompts */}
          <div className="p-6 sm:p-7 rounded-3xl glass-card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Trending Prompts</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Fastest-accelerating community favorites</p>
                </div>
              </div>
              <Link href="/trending" className="text-xs text-indigo-500 hover:text-indigo-400 font-bold hover:underline">
                View All
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {stats?.trendingPrompts?.map((prompt, idx) => (
                <div key={prompt.id} className="py-3.5 flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={prompt.featuredImage}
                        alt={prompt.title}
                        className="w-11 h-11 rounded-2xl object-cover border border-slate-200/80 dark:border-white/10 group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center border border-white/20">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                        {prompt.title}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-indigo-400 font-medium">{prompt.category?.title}</span>
                        <span>•</span>
                        <span>{formatCompactNumber(prompt.views)} views</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-sm">
                      🔥 {prompt.trendingScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Categories */}
          <div className="p-6 sm:p-7 rounded-3xl glass-card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Popular Taxonomies</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Category library proportion</p>
                </div>
              </div>
              <Link href="/categories" className="text-xs text-indigo-500 hover:text-indigo-400 font-bold hover:underline">
                Manage
              </Link>
            </div>
            <div className="space-y-4">
              {stats?.popularCategories?.slice(0, 5).map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{category.title}</span>
                    <span className="text-slate-400">{category.count} prompts ({category.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 shadow-glow-indigo"
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
