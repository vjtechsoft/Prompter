'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/admin-layout';
import {
  Star,
  Sparkles,
  Layers,
  Search,
  Plus,
  Trash2,
  Eye,
  Edit2,
  Copy,
  Check,
  Crown,
  Heart,
  TrendingUp,
  Loader2,
  FolderTree,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { PromptItem, CategoryItem, FeaturedStats } from '@/types';
import { formatCompactNumber } from '@/lib/utils';

export default function FeaturedPage() {
  const [activeTab, setActiveTab] = useState<'prompts' | 'categories'>('prompts');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FeaturedStats>({
    totalFeaturedPrompts: 0,
    totalFeaturedCategories: 0,
    featuredPromptLikes: 0,
    featuredPromptViews: 0,
    totalPromptsCatalog: 0,
    totalCategoriesCatalog: 0,
  });

  const [featuredPrompts, setFeaturedPrompts] = useState<PromptItem[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<CategoryItem[]>([]);

  // Search filter inside featured lists
  const [promptSearch, setPromptSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  // Bulk selection inside featured lists
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Prompt Preview Modal
  const [previewPrompt, setPreviewPrompt] = useState<PromptItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Add Featured Prompts Modal
  const [isAddPromptModalOpen, setIsAddPromptModalOpen] = useState(false);
  const [availablePrompts, setAvailablePrompts] = useState<PromptItem[]>([]);
  const [loadingAvailablePrompts, setLoadingAvailablePrompts] = useState(false);
  const [addPromptSearch, setAddPromptSearch] = useState('');
  const [selectedToAddPromptIds, setSelectedToAddPromptIds] = useState<string[]>([]);
  const [isSubmittingPrompts, setIsSubmittingPrompts] = useState(false);

  // Add Featured Categories Modal
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);
  const [loadingAvailableCategories, setLoadingAvailableCategories] = useState(false);
  const [addCategorySearch, setAddCategorySearch] = useState('');
  const [selectedToAddCategoryIds, setSelectedToAddCategoryIds] = useState<string[]>([]);
  const [isSubmittingCategories, setIsSubmittingCategories] = useState(false);

  const { success, error } = useToast();

  // Load Featured Data
  const loadFeaturedData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/featured');
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setFeaturedPrompts(data.featuredPrompts || []);
        setFeaturedCategories(data.featuredCategories || []);
      } else {
        throw new Error(data.error || 'Failed to load featured items');
      }
    } catch (err: any) {
      error(err.message || 'Error loading featured data');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadFeaturedData();
  }, [loadFeaturedData]);

  // Toggle Feature Function
  const handleToggle = async (type: 'prompt' | 'category', ids: string[], isFeatured: boolean) => {
    try {
      const res = await fetch('/api/featured/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ids, isFeatured }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update featured status');

      success(
        isFeatured
          ? `Added ${ids.length} item${ids.length === 1 ? '' : 's'} to featured`
          : `Removed ${ids.length} item${ids.length === 1 ? '' : 's'} from featured`
      );

      if (type === 'prompt') {
        setSelectedPromptIds((prev) => prev.filter((id) => !ids.includes(id)));
      } else {
        setSelectedCategoryIds((prev) => prev.filter((id) => !ids.includes(id)));
      }

      await loadFeaturedData();
    } catch (err: any) {
      error(err.message || 'Action failed');
    }
  };

  // Open Add Prompts Modal
  const openAddPromptModal = async () => {
    setIsAddPromptModalOpen(true);
    setSelectedToAddPromptIds([]);
    setAddPromptSearch('');
    fetchAvailablePrompts('');
  };

  const fetchAvailablePrompts = async (searchQuery: string) => {
    setLoadingAvailablePrompts(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        search: searchQuery,
        isDeleted: 'false',
      });
      const res = await fetch(`/api/prompts?${params.toString()}`);
      const data = await res.json();
      if (data.prompts) {
        // Filter out prompts that are already featured
        setAvailablePrompts(data.prompts.filter((p: PromptItem) => !p.isFeatured));
      }
    } catch {
      error('Failed to load available prompts');
    } finally {
      setLoadingAvailablePrompts(false);
    }
  };

  // Open Add Categories Modal
  const openAddCategoryModal = async () => {
    setIsAddCategoryModalOpen(true);
    setSelectedToAddCategoryIds([]);
    setAddCategorySearch('');
    fetchAvailableCategories('');
  };

  const fetchAvailableCategories = async (searchQuery: string) => {
    setLoadingAvailableCategories(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
      });
      const res = await fetch(`/api/categories?${params.toString()}`);
      const data = await res.json();
      if (data.categories) {
        setAvailableCategories(data.categories.filter((c: CategoryItem) => !c.isFeatured));
      }
    } catch {
      error('Failed to load available categories');
    } finally {
      setLoadingAvailableCategories(false);
    }
  };

  // Submit Add Prompts
  const handleAddPromptsSubmit = async () => {
    if (selectedToAddPromptIds.length === 0) return;
    setIsSubmittingPrompts(true);
    try {
      await handleToggle('prompt', selectedToAddPromptIds, true);
      setIsAddPromptModalOpen(false);
    } finally {
      setIsSubmittingPrompts(false);
    }
  };

  // Submit Add Categories
  const handleAddCategoriesSubmit = async () => {
    if (selectedToAddCategoryIds.length === 0) return;
    setIsSubmittingCategories(true);
    try {
      await handleToggle('category', selectedToAddCategoryIds, true);
      setIsAddCategoryModalOpen(false);
    } finally {
      setIsSubmittingCategories(false);
    }
  };

  // Filtered lists for view
  const filteredPrompts = featuredPrompts.filter(
    (p) =>
      p.title.toLowerCase().includes(promptSearch.toLowerCase()) ||
      p.category?.title?.toLowerCase().includes(promptSearch.toLowerCase()) ||
      p.subcategory?.title?.toLowerCase().includes(promptSearch.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(promptSearch.toLowerCase()))
  );

  const filteredCategories = featuredCategories.filter(
    (c) =>
      c.title.toLowerCase().includes(categorySearch.toLowerCase()) ||
      c.slug.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-500 shadow-xs">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Featured Content
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Curate standout prompts and categories highlighted across client applications and APIs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'prompts' ? (
              <button
                onClick={openAddPromptModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Featured Prompts
              </button>
            ) : (
              <button
                onClick={openAddCategoryModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Featured Categories
              </button>
            )}
          </div>
        </div>

        {/* Analytics KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Featured Prompts</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {loading ? <Skeleton className="h-8 w-16" /> : stats.totalFeaturedPrompts}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                out of {stats.totalPromptsCatalog || 0} total prompts
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-500">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Featured Categories</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {loading ? <Skeleton className="h-8 w-16" /> : stats.totalFeaturedCategories}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                out of {stats.totalCategoriesCatalog || 0} total categories
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Featured Total Likes</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {loading ? <Skeleton className="h-8 w-16" /> : formatCompactNumber(stats.featuredPromptLikes || 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">community applause</p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500">
              <Heart className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Featured Total Views</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {loading ? <Skeleton className="h-8 w-16" /> : formatCompactNumber(stats.featuredPromptViews || 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">client impressions</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'prompts'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Featured Prompts</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {featuredPrompts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'categories'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Featured Categories</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {featuredCategories.length}
            </span>
          </button>
        </div>

        {/* PROMPTS TAB */}
        {activeTab === 'prompts' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search featured prompts or tags..."
                  value={promptSearch}
                  onChange={(e) => setPromptSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedPromptIds.length > 0 && (
                  <button
                    onClick={() => handleToggle('prompt', selectedPromptIds, false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove ({selectedPromptIds.length}) from Featured</span>
                  </button>
                )}
              </div>
            </div>

            {/* Prompts Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="p-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredPrompts.length > 0 &&
                            selectedPromptIds.length === filteredPrompts.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPromptIds(filteredPrompts.map((p) => p.id));
                            } else {
                              setSelectedPromptIds([]);
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                      </th>
                      <th className="py-3 px-3 w-16">Image</th>
                      <th className="py-3 px-3">Prompt Title</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3 text-center">Engagement</th>
                      <th className="py-3 px-3 text-center">Access</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={8} className="p-4">
                            <Skeleton className="h-10 w-full" />
                          </td>
                        </tr>
                      ))
                    ) : filteredPrompts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Star className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                          <p className="font-medium text-slate-600 dark:text-slate-400">
                            {promptSearch ? 'No matching featured prompts found.' : 'No featured prompts yet.'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Click &quot;Add Featured Prompts&quot; to highlight high-quality prompts.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredPrompts.map((prompt) => (
                        <tr
                          key={prompt.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedPromptIds.includes(prompt.id)}
                              onChange={() => {
                                setSelectedPromptIds((prev) =>
                                  prev.includes(prompt.id)
                                    ? prev.filter((id) => id !== prompt.id)
                                    : [...prev, prompt.id]
                                );
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <img
                              src={prompt.featuredImage}
                              alt={prompt.title}
                              className="w-12 h-12 rounded-xl object-cover shadow-xs ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <div
                              onClick={() => setPreviewPrompt(prompt)}
                              className="font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 line-clamp-1 text-sm flex items-center gap-1.5"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
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
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {prompt.category?.title || 'Uncategorized'}
                              </span>
                              {prompt.subcategory && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                                  <Layers className="w-2.5 h-2.5" />
                                  {prompt.subcategory.title}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              <span title="Likes">❤️ {formatCompactNumber(prompt.likes)}</span>
                              <span title="Views">👁️ {formatCompactNumber(prompt.views)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {prompt.isPremium ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                                <Crown className="w-3 h-3" /> VIP
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Free</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                prompt.status
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                              }`}
                            >
                              {prompt.status ? 'Active' : 'Draft'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleToggle('prompt', [prompt.id], false)}
                                title="Remove from Featured"
                                className="p-1.5 text-amber-500 hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              >
                                <Star className="w-4 h-4 fill-amber-400" />
                              </button>
                              <button
                                onClick={() => setPreviewPrompt(prompt)}
                                title="Preview Prompt"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <Link
                                href={`/prompts/${prompt.id}/edit`}
                                title="Edit Prompt"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search featured categories or slug..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedCategoryIds.length > 0 && (
                  <button
                    onClick={() => handleToggle('category', selectedCategoryIds, false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove ({selectedCategoryIds.length}) from Featured</span>
                  </button>
                )}
              </div>
            </div>

            {/* Categories Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="p-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredCategories.length > 0 &&
                            selectedCategoryIds.length === filteredCategories.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategoryIds(filteredCategories.map((c) => c.id));
                            } else {
                              setSelectedCategoryIds([]);
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                      </th>
                      <th className="py-3 px-3 w-16">Image</th>
                      <th className="py-3 px-3">Category Title</th>
                      <th className="py-3 px-3 text-center">Subcategories</th>
                      <th className="py-3 px-3 text-center">Prompts</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={7} className="p-4">
                            <Skeleton className="h-10 w-full" />
                          </td>
                        </tr>
                      ))
                    ) : filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Star className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                          <p className="font-medium text-slate-600 dark:text-slate-400">
                            {categorySearch
                              ? 'No matching featured categories found.'
                              : 'No featured categories yet.'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Click &quot;Add Featured Categories&quot; to pin categories to the featured section.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((cat) => (
                        <tr
                          key={cat.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedCategoryIds.includes(cat.id)}
                              onChange={() => {
                                setSelectedCategoryIds((prev) =>
                                  prev.includes(cat.id)
                                    ? prev.filter((id) => id !== cat.id)
                                    : [...prev, cat.id]
                                );
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <img
                              src={cat.image}
                              alt={cat.title}
                              className="w-12 h-12 rounded-xl object-cover shadow-xs ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white text-sm">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                              <span>{cat.title}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              /category/{cat.slug}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                              <Layers className="w-3.5 h-3.5" />
                              <span>{cat.subcategories?.length || 0}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {cat._count?.prompts || 0} prompts
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cat.status
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                              }`}
                            >
                              {cat.status ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleToggle('category', [cat.id], false)}
                                title="Remove from Featured"
                                className="p-1.5 text-amber-500 hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              >
                                <Star className="w-4 h-4 fill-amber-400" />
                              </button>
                              <Link
                                href="/categories"
                                title="Manage in Categories"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Add Featured Prompts */}
        <Modal
          isOpen={isAddPromptModalOpen}
          onClose={() => setIsAddPromptModalOpen(false)}
          title="Add Prompts to Featured"
          description="Select published or draft prompts to promote to the Featured section."
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search prompt title or keywords..."
                  value={addPromptSearch}
                  onChange={(e) => {
                    setAddPromptSearch(e.target.value);
                    fetchAvailablePrompts(e.target.value);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {loadingAvailablePrompts ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500 mb-2" />
                  Loading available prompts...
                </div>
              ) : availablePrompts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No available prompts to feature. All matching prompts may already be featured.
                </div>
              ) : (
                availablePrompts.map((prompt) => (
                  <label
                    key={prompt.id}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedToAddPromptIds.includes(prompt.id)}
                      onChange={() => {
                        setSelectedToAddPromptIds((prev) =>
                          prev.includes(prompt.id)
                            ? prev.filter((id) => id !== prompt.id)
                            : [...prev, prompt.id]
                        );
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <img
                      src={prompt.featuredImage}
                      alt={prompt.title}
                      className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {prompt.title}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{prompt.category?.title || 'Uncategorized'}</span>
                        {prompt.isPremium && (
                          <span className="text-amber-500 font-bold flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" /> VIP
                          </span>
                        )}
                        <span>• ❤️ {prompt.likes}</span>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                {selectedToAddPromptIds.length} prompt{selectedToAddPromptIds.length === 1 ? '' : 's'} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPromptModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedToAddPromptIds.length === 0 || isSubmittingPrompts}
                  onClick={handleAddPromptsSubmit}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingPrompts && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Add to Featured ({selectedToAddPromptIds.length})
                </button>
              </div>
            </div>
          </div>
        </Modal>

        {/* MODAL: Add Featured Categories */}
        <Modal
          isOpen={isAddCategoryModalOpen}
          onClose={() => setIsAddCategoryModalOpen(false)}
          title="Add Categories to Featured"
          description="Select categories to highlight in the Featured section."
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search category title..."
                value={addCategorySearch}
                onChange={(e) => {
                  setAddCategorySearch(e.target.value);
                  fetchAvailableCategories(e.target.value);
                }}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {loadingAvailableCategories ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-500 mb-2" />
                  Loading available categories...
                </div>
              ) : availableCategories.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No available categories to feature.
                </div>
              ) : (
                availableCategories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedToAddCategoryIds.includes(cat.id)}
                      onChange={() => {
                        setSelectedToAddCategoryIds((prev) =>
                          prev.includes(cat.id)
                            ? prev.filter((id) => id !== cat.id)
                            : [...prev, cat.id]
                        );
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {cat.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        /category/{cat.slug} • {cat._count?.prompts || 0} prompts
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                {selectedToAddCategoryIds.length} categor{selectedToAddCategoryIds.length === 1 ? 'y' : 'ies'} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedToAddCategoryIds.length === 0 || isSubmittingCategories}
                  onClick={handleAddCategoriesSubmit}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingCategories && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Add to Featured ({selectedToAddCategoryIds.length})
                </button>
              </div>
            </div>
          </div>
        </Modal>

        {/* MODAL: Preview Prompt */}
        <Modal
          isOpen={!!previewPrompt}
          onClose={() => setPreviewPrompt(null)}
          title={previewPrompt?.title || 'Prompt Preview'}
          description="Featured prompt detail view."
          maxWidth="2xl"
        >
          {previewPrompt && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-800">
                <img
                  src={previewPrompt.featuredImage}
                  alt={previewPrompt.title}
                  className="w-full h-full object-cover"
                />
                {previewPrompt.isPremium && (
                  <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                    <Crown className="w-3.5 h-3.5" /> VIP Only
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Prompt Text
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(previewPrompt.prompt);
                      setCopied(true);
                      success('Copied prompt to clipboard');
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Prompt'}
                  </button>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto select-all">
                  {previewPrompt.prompt}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <span>Category: <strong className="text-slate-700 dark:text-slate-300">{previewPrompt.category?.title}</strong></span>
                {previewPrompt.subcategory && (
                  <span>• Subcategory: <strong className="text-teal-600 dark:text-teal-400">{previewPrompt.subcategory.title}</strong></span>
                )}
                <span>• Views: <strong className="text-slate-700 dark:text-slate-300">{previewPrompt.views}</strong></span>
                <span>• Likes: <strong className="text-slate-700 dark:text-slate-300">{previewPrompt.likes}</strong></span>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
