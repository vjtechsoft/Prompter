'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Copy,
  Check,
  Edit2,
  Trash2,
  CopyCheck,
  Eye,
  Crown,
  Star,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RotateCcw,
  Layers,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { PromptItem, CategoryItem } from '@/types';
import { formatCompactNumber } from '@/lib/utils';
import * as XLSX from 'xlsx';

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [selectedPremium, setSelectedPremium] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [randomSeed, setRandomSeed] = useState<number>(() => Math.floor(Math.random() * 900000) + 100000);
  const [viewTrash, setViewTrash] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Preview modal
  const [previewPrompt, setPreviewPrompt] = useState<PromptItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  // Fetch categories for filter dropdown
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.categories) setCategories(data.categories);
      } catch (e) {
        console.error('Failed to load categories', e);
      }
    }
    loadCategories();
  }, []);

  const activeFilterCat = categories.find((c) => c.id === selectedCategory);
  const filterSubcategories = activeFilterCat?.subcategories || [];

  // Fetch prompts
  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        category: selectedCategory,
        ...(selectedSubcategory !== 'all' ? { subcategory: selectedSubcategory } : {}),
        isPremium: selectedPremium,
        status: selectedStatus,
        sortBy,
        isDeleted: viewTrash ? 'true' : 'false',
        ...(sortBy === 'random' ? { seed: randomSeed.toString() } : {}),
      });

      const res = await fetch(`/api/prompts?${params.toString()}`);
      const data = await res.json();
      if (data.prompts) {
        setPrompts(data.prompts);
        setTotal(data.pagination.total);
      }
    } catch (e) {
      error('Failed to load prompts');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedCategory, selectedSubcategory, selectedPremium, selectedStatus, sortBy, randomSeed, viewTrash, error]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  // Handle single status switch
  const handleToggleStatus = async (prompt: PromptItem) => {
    try {
      const res = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_status' }),
      });
      if (!res.ok) throw new Error();
      success(`Updated status for "${prompt.title}"`);
      loadPrompts();
    } catch {
      error('Failed to update status');
    }
  };

  // Handle single premium switch
  const handleTogglePremium = async (prompt: PromptItem) => {
    try {
      const res = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_premium' }),
      });
      if (!res.ok) throw new Error();
      success(`Updated premium flag for "${prompt.title}"`);
      loadPrompts();
    } catch {
      error('Failed to update premium flag');
    }
  };

  // Duplicate prompt
  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/prompts/${id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      success(`Prompt duplicated as "${data.prompt.title}"`);
      loadPrompts();
    } catch {
      error('Failed to duplicate prompt');
    }
  };

  // Delete / Trash
  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const url = viewTrash ? `/api/prompts/${deleteId}?force=true` : `/api/prompts/${deleteId}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      success(viewTrash ? 'Prompt permanently deleted' : 'Prompt moved to trash');
      setDeleteId(null);
      loadPrompts();
    } catch {
      error('Failed to delete prompt');
    } finally {
      setIsDeleting(false);
    }
  };

  // Restore from trash
  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/prompts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      if (!res.ok) throw new Error();
      success('Prompt restored successfully');
      loadPrompts();
    } catch {
      error('Failed to restore prompt');
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: string, value?: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/prompts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action, value }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      success(data.message);
      setSelectedIds([]);
      loadPrompts();
    } catch {
      error('Failed to perform bulk action');
    }
  };

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === prompts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(prompts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Copy prompt text to clipboard
  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    success('Prompt copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csvRows = [
      ['ID', 'Title', 'Category', 'Premium', 'Status', 'Likes', 'Views', 'Shares', 'Created At'],
      ...prompts.map((p) => [
        p.id,
        `"${p.title.replace(/"/g, '""')}"`,
        p.category?.title || 'None',
        p.isPremium ? 'YES' : 'NO',
        p.status ? 'ACTIVE' : 'INACTIVE',
        p.likes,
        p.views,
        p.shares,
        new Date(p.createdAt).toLocaleDateString(),
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `prompts_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Exported prompts to CSV');
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = prompts.map((p) => ({
      Title: p.title,
      Category: p.category?.title || 'None',
      PromptContent: p.prompt,
      Premium: p.isPremium ? 'Yes' : 'No',
      Status: p.status ? 'Active' : 'Draft',
      Likes: p.likes,
      Views: p.views,
      Shares: p.shares,
      TrendingScore: p.trendingScore || 0,
      PopularScore: p.popularScore || 0,
      CreatedAt: new Date(p.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Prompts');
    XLSX.writeFile(workbook, `prompts_report_${Date.now()}.xlsx`);
    success('Exported prompts to Excel (.xlsx)');
  };

  // Print Sheet
  const handlePrint = () => {
    window.print();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-indigo-600" />
              Prompt Repository
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage, categorize, preview, and analyze AI prompt templates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setViewTrash(!viewTrash);
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                viewTrash
                  ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              {viewTrash ? 'Exit Trash' : 'Trash'}
            </button>

            {/* Export options */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
              title="Export to CSV"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" /> CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
              title="Export to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Excel
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
              title="Print Table"
            >
              <Printer className="w-3.5 h-3.5 text-purple-500" /> Print
            </button>

            <Link
              href="/prompts/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Prompt
            </Link>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search title, category, tags..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory('all');
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            {/* Subcategory Filter (displayed if category has subcategories) */}
            {selectedCategory !== 'all' && filterSubcategories.length > 0 && (
              <select
                value={selectedSubcategory}
                onChange={(e) => {
                  setSelectedSubcategory(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-teal-800 dark:text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="all">All Subcategories</option>
                {filterSubcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            )}

            {/* Premium Filter */}
            <select
              value={selectedPremium}
              onChange={(e) => {
                setSelectedPremium(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Tier: All</option>
              <option value="true">Premium (VIP)</option>
              <option value="false">Free</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Status: All</option>
              <option value="true">Active (Published)</option>
              <option value="false">Inactive (Draft)</option>
            </select>
          </div>

          {/* Second toolbar row: Sorting & Limit & Bulk Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  const val = e.target.value;
                  setSortBy(val);
                  if (val === 'random') {
                    setRandomSeed(Math.floor(Math.random() * 900000) + 100000);
                  }
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="random">🎲 Random (Shuffle)</option>
                <option value="trending">🔥 Trending (Formula)</option>
                <option value="popular">⭐ Popular (Total Engagement)</option>
                <option value="most_viewed">Most Viewed</option>
                <option value="most_liked">Most Liked</option>
                <option value="most_shared">Most Shared</option>
                <option value="a-z">Title (A-Z)</option>
                <option value="z-a">Title (Z-A)</option>
              </select>

              {sortBy === 'random' && (
                <button
                  type="button"
                  onClick={() => {
                    setRandomSeed(Math.floor(Math.random() * 900000) + 100000);
                    setPage(1);
                  }}
                  title="Reshuffle random order (generates new seed)"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold transition-colors shadow-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reshuffle</span>
                </button>
              )}
            </div>

            {/* Bulk Action Controls */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 animate-in fade-in">
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  {selectedIds.length} selected:
                </span>

                {viewTrash ? (
                  <>
                    <button
                      onClick={() => handleBulkAction('restore')}
                      className="px-2 py-1 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleBulkAction('force_delete')}
                      className="px-2 py-1 text-xs font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-500"
                    >
                      Perm Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleBulkAction('status', true)}
                      className="px-2 py-1 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleBulkAction('status', false)}
                      className="px-2 py-1 text-xs font-medium rounded-lg bg-slate-600 text-white hover:bg-slate-500"
                    >
                      Draft
                    </button>
                    <button
                      onClick={() => handleBulkAction('premium', true)}
                      className="px-2 py-1 text-xs font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-500"
                    >
                      Set VIP
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="px-2 py-1 text-xs font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-500"
                    >
                      Trash
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Rows Per Page */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Rows:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={prompts.length > 0 && selectedIds.length === prompts.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="py-4 px-3 w-16">Image</th>
                  <th className="py-4 px-3 min-w-[200px]">Title & Tags</th>
                  <th className="py-4 px-3">Category</th>
                  <th className="py-4 px-3 text-center">Premium</th>
                  <th className="py-4 px-3 text-center">Status</th>
                  <th className="py-4 px-3 text-center">Engagement</th>
                  <th className="py-4 px-3">Author</th>
                  <th className="py-4 px-3">Date</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={10} className="p-4">
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </td>
                    </tr>
                  ))
                ) : prompts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      No prompts found. Try changing your filters or add a new prompt!
                    </td>
                  </tr>
                ) : (
                  prompts.map((prompt) => (
                    <tr
                      key={prompt.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(prompt.id)}
                          onChange={() => toggleSelectOne(prompt.id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Thumbnail */}
                      <td className="py-3 px-3">
                        <img
                          src={prompt.featuredImage}
                          alt={prompt.title}
                          className="w-12 h-12 rounded-xl object-cover shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                      </td>

                      {/* Title & Tags */}
                      <td className="py-3 px-3">
                        <div
                          className="font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1 text-sm flex items-center gap-1.5"
                          onClick={() => setPreviewPrompt(prompt)}
                          title="Click to preview"
                        >
                          {prompt.isFeatured && (
                            <span title="Featured Prompt" className="inline-flex items-center">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                            </span>
                          )}
                          <span className="truncate">{prompt.title}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prompt.tags?.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400"
                            >
                              #{tag}
                            </span>
                          ))}
                          {prompt.tags?.length > 3 && (
                            <span className="text-[10px] text-slate-400">
                              +{prompt.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category & Subcategory */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {prompt.category?.title || 'Uncategorized'}
                          </span>
                          {prompt.subcategory && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/70">
                              <span className="text-teal-400 dark:text-teal-500 font-bold">↳</span>
                              {prompt.subcategory.title}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Premium Switch */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleTogglePremium(prompt)}
                          title={prompt.isPremium ? 'Make Free' : 'Make Premium'}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-transform hover:scale-105 ${
                            prompt.isPremium
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <Crown className="w-3 h-3" />
                          {prompt.isPremium ? 'VIP' : 'FREE'}
                        </button>
                      </td>

                      {/* Status Switch */}
                      <td className="py-3 px-3 text-center">
                        <Switch
                          size="sm"
                          checked={prompt.status}
                          onChange={() => handleToggleStatus(prompt)}
                        />
                      </td>

                      {/* Engagement */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500">
                          <span title="Views">👁 {formatCompactNumber(prompt.views)}</span>
                          <span title="Likes">❤️ {formatCompactNumber(prompt.likes)}</span>
                          <span title="Shares">🔗 {formatCompactNumber(prompt.shares)}</span>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-3 px-3">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {prompt.createdBy?.name || 'Admin'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(prompt.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {viewTrash ? (
                            <>
                              <button
                                onClick={() => handleRestore(prompt.id)}
                                title="Restore Prompt"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteId(prompt.id)}
                                title="Permanently Delete"
                                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setPreviewPrompt(prompt)}
                                title="Quick Preview"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicate(prompt.id)}
                                title="Duplicate Prompt"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <CopyCheck className="w-4 h-4" />
                              </button>
                              <Link
                                href={`/prompts/${prompt.id}/edit`}
                                title="Edit Prompt"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => setDeleteId(prompt.id)}
                                title="Move to Trash"
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 gap-3">
            <div>
              Showing {prompts.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
              {Math.min(page * limit, total)} of {total} results
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-300">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Prompt Preview Modal */}
        <Modal
          isOpen={!!previewPrompt}
          onClose={() => setPreviewPrompt(null)}
          title={previewPrompt?.title || 'Prompt Preview'}
          description={`Category: ${previewPrompt?.category?.title || 'General'}${previewPrompt?.subcategory ? ` > ${previewPrompt.subcategory.title}` : ''}`}
          maxWidth="2xl"
        >
          {previewPrompt && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden aspect-video max-h-56 bg-slate-950">
                <img
                  src={previewPrompt.featuredImage}
                  alt={previewPrompt.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {previewPrompt.isPremium && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-black flex items-center gap-1 shadow-lg">
                      <Crown className="w-3.5 h-3.5" /> VIP Exclusive
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                      previewPrompt.status ? 'bg-emerald-600' : 'bg-slate-600'
                    }`}
                  >
                    {previewPrompt.status ? 'Active' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Views:</span>{' '}
                  <strong className="text-slate-900 dark:text-white">{previewPrompt.views}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Likes:</span>{' '}
                  <strong className="text-slate-900 dark:text-white">{previewPrompt.likes}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Shares:</span>{' '}
                  <strong className="text-slate-900 dark:text-white">{previewPrompt.shares}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Trending Score:</span>{' '}
                  <strong className="text-orange-500">{previewPrompt.trendingScore}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Characters:</span>{' '}
                  <strong className="text-indigo-500">{previewPrompt.prompt.length}</strong>
                </div>
              </div>

              {/* Prompt Text / Code Area with Copy Button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Prompt Template
                  </span>
                  <button
                    onClick={() => handleCopyPrompt(previewPrompt.prompt)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Prompt'}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto select-all">
                  {previewPrompt.prompt}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          title={viewTrash ? 'Permanently Delete Prompt?' : 'Move Prompt to Trash?'}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>
                {viewTrash
                  ? 'This will irrevocably wipe this prompt record from the database. This action cannot be undone.'
                  : 'This will move the prompt to the trash repository where it can be restored later.'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-md shadow-rose-600/20"
              >
                {isDeleting ? 'Deleting...' : viewTrash ? 'Permanently Delete' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
