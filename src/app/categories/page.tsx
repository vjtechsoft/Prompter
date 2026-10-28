'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import {
  FolderTree,
  Plus,
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Upload,
  Loader2,
  AlertCircle,
  Sparkles,
  CornerDownRight,
  Layers,
  Star,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryItem, SubcategoryItem } from '@/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('position');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Create / Edit Category Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalImage, setModalImage] = useState(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
  );
  const [modalFeatured, setModalFeatured] = useState(false);
  const [modalStatus, setModalStatus] = useState(true);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete Category State
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Create / Edit Subcategory Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<SubcategoryItem | null>(null);
  const [subModalCategoryId, setSubModalCategoryId] = useState('');
  const [subModalTitle, setSubModalTitle] = useState('');
  const [subModalImage, setSubModalImage] = useState('');
  const [subModalStatus, setSubModalStatus] = useState(true);
  const [subModalSubmitting, setSubModalSubmitting] = useState(false);
  const [uploadingSubImage, setUploadingSubImage] = useState(false);

  // Delete Subcategory State
  const [deleteSubTarget, setDeleteSubTarget] = useState<SubcategoryItem | null>(null);
  const [deletingSub, setDeletingSub] = useState(false);

  const { success, error } = useToast();

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        sortBy,
      });

      const res = await fetch(`/api/categories?${params.toString()}`);
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch {
      error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy, error]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const toggleExpand = (catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  // Open Category Modal
  const openCreateModal = () => {
    setEditingCategory(null);
    setModalTitle('');
    setModalImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80');
    setModalFeatured(false);
    setModalStatus(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setModalTitle(cat.title);
    setModalImage(cat.image);
    setModalFeatured(cat.isFeatured || false);
    setModalStatus(cat.status);
    setIsModalOpen(true);
  };

  // Open Subcategory Modal
  const openCreateSubModal = (categoryId?: string) => {
    setEditingSubcategory(null);
    setSubModalCategoryId(categoryId || (categories[0]?.id || ''));
    setSubModalTitle('');
    setSubModalImage('');
    setSubModalStatus(true);
    setIsSubModalOpen(true);
  };

  const openEditSubModal = (sub: SubcategoryItem) => {
    setEditingSubcategory(sub);
    setSubModalCategoryId(sub.categoryId);
    setSubModalTitle(sub.title);
    setSubModalImage(sub.image || '');
    setSubModalStatus(sub.status);
    setIsSubModalOpen(true);
  };

  // Category Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/pjpeg', 'image/x-png'];
    const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';

    if (!validMimes.includes(file.type?.toLowerCase()) && !validExts.includes(ext)) {
      error('Only JPG, PNG, and WEBP formats are accepted');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error('Image exceeds 5MB size limit');
      e.target.value = '';
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setModalImage(data.url);
      success('Image uploaded successfully');
    } catch (err: any) {
      error(err.message || 'Failed to upload category image');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Subcategory Image upload
  const handleSubImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/pjpeg', 'image/x-png'];
    const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';

    if (!validMimes.includes(file.type?.toLowerCase()) && !validExts.includes(ext)) {
      error('Only JPG, PNG, and WEBP formats are accepted');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error('Image exceeds 5MB size limit');
      e.target.value = '';
      return;
    }

    setUploadingSubImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setSubModalImage(data.url);
      success('Subcategory image uploaded successfully');
    } catch (err: any) {
      error(err.message || 'Failed to upload subcategory image');
    } finally {
      setUploadingSubImage(false);
      e.target.value = '';
    }
  };

  // Submit Category
  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) {
      error('Category title is required');
      return;
    }

    setModalSubmitting(true);
    try {
      const payload = {
        title: modalTitle.trim(),
        image: modalImage,
        isFeatured: modalFeatured,
        status: modalStatus,
      };

      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save category');

      success(editingCategory ? 'Category updated successfully' : 'Category created successfully');
      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      error(err.message || 'Error saving category');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Submit Subcategory
  const handleSubmitSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subModalTitle.trim()) {
      error('Subcategory title is required');
      return;
    }

    if (!subModalCategoryId) {
      error('Please select a parent category');
      return;
    }

    setSubModalSubmitting(true);
    try {
      const payload = {
        title: subModalTitle.trim(),
        categoryId: subModalCategoryId,
        image: subModalImage.trim() || null,
        status: subModalStatus,
      };

      const url = editingSubcategory ? `/api/subcategories/${editingSubcategory.id}` : '/api/subcategories';
      const method = editingSubcategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save subcategory');

      success(editingSubcategory ? 'Subcategory updated successfully' : 'Subcategory created successfully');
      setIsSubModalOpen(false);
      // Auto expand the parent category so user sees the newly added subcategory
      setExpandedCategories((prev) => new Set(prev).add(subModalCategoryId));
      loadCategories();
    } catch (err: any) {
      error(err.message || 'Error saving subcategory');
    } finally {
      setSubModalSubmitting(false);
    }
  };

  // Reorder Category
  const handleMove = async (id: string, direction: 'up' | 'down') => {
    try {
      const res = await fetch('/api/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, direction }),
      });

      if (!res.ok) throw new Error();
      loadCategories();
    } catch {
      error('Failed to change position');
    }
  };

  // Reorder Subcategory
  const handleSubMove = async (subId: string, direction: 'up' | 'down', catId: string) => {
    try {
      const res = await fetch('/api/subcategories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subId, direction, categoryId: catId }),
      });

      if (!res.ok) throw new Error();
      loadCategories();
    } catch {
      error('Failed to change subcategory position');
    }
  };

  // Confirm delete Category
  const confirmDeleteCategory = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');

      success('Category deleted successfully');
      setDeleteTarget(null);
      loadCategories();
    } catch (err: any) {
      error(err.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  // Confirm delete Subcategory
  const confirmDeleteSubcategory = async () => {
    if (!deleteSubTarget) return;
    setDeletingSub(true);
    try {
      const res = await fetch(`/api/subcategories/${deleteSubTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete subcategory');

      success(
        data.promptsUnlinked > 0
          ? `Subcategory deleted. ${data.promptsUnlinked} prompt(s) unlinked safely.`
          : 'Subcategory deleted successfully'
      );
      setDeleteSubTarget(null);
      loadCategories();
    } catch (err: any) {
      error(err.message || 'Failed to delete subcategory');
    } finally {
      setDeletingSub(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <FolderTree className="w-7 h-7 text-indigo-600" />
              Category & Subcategory Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Organize prompt taxonomy with parent categories and nested subcategories, cover artwork, and display order.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => openCreateSubModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Subcategory
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Status: All</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>

            {/* Sorting */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="position">Position (Order)</option>
                <option value="alphabetical">Alphabetical (A-Z)</option>
                <option value="prompt_count">Prompt Count</option>
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories & Subcategories Table */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-3 w-16 text-center">Order</th>
                  <th className="py-4 px-3 w-16">Image</th>
                  <th className="py-4 px-3">Title & Slug</th>
                  <th className="py-4 px-3 text-center">Subcategories</th>
                  <th className="py-4 px-3 text-center">Total Prompts</th>
                  <th className="py-4 px-3 text-center">Status</th>
                  <th className="py-4 px-3">Created By</th>
                  <th className="py-4 px-3">Created Date</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={9} className="p-4">
                        <Skeleton className="h-12 w-full rounded-lg" />
                      </td>
                    </tr>
                  ))
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <FolderTree className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      No categories found. Click &apos;Add Category&apos; to create one!
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, index) => {
                    const isExpanded = expandedCategories.has(cat.id);
                    const subCount = cat.subcategories?.length || 0;

                    return (
                      <React.Fragment key={cat.id}>
                        <tr
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            isExpanded ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
                          }`}
                        >
                          {/* Position & Move Buttons + Accordion expand */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => toggleExpand(cat.id)}
                                title={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
                                className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                              <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                                {cat.position}
                              </span>
                              <div className="flex flex-col">
                                <button
                                  disabled={index === 0}
                                  onClick={() => handleMove(cat.id, 'up')}
                                  title="Move Up"
                                  className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-20"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  disabled={index === categories.length - 1}
                                  onClick={() => handleMove(cat.id, 'down')}
                                  title="Move Down"
                                  className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-20"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Image Thumbnail */}
                          <td className="py-3 px-3">
                            <img
                              src={cat.image}
                              alt={cat.title}
                              className="w-12 h-12 rounded-xl object-cover shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                          </td>

                          {/* Title & Slug */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white text-sm">
                              {cat.isFeatured && (
                                <span title="Featured Category" className="inline-flex items-center">
                                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                                </span>
                              )}
                              <span>{cat.title}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              /category/{cat.slug}
                            </div>
                          </td>

                          {/* Subcategories Count & Quick Expand */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => toggleExpand(cat.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                                subCount > 0
                                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>{subCount} Sub{subCount === 1 ? '' : 's'}</span>
                            </button>
                          </td>

                          {/* Total Prompts */}
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {cat._count?.prompts || 0} prompts
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                cat.status
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                              }`}
                            >
                              {cat.status ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* Created By */}
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                            {cat.createdBy?.name || 'Admin'}
                          </td>

                          {/* Created Date */}
                          <td className="py-3 px-3 text-slate-500">
                            {new Date(cat.createdAt).toLocaleDateString()}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openCreateSubModal(cat.id)}
                                title="Add Subcategory under this category"
                                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/60 rounded-lg border border-teal-200/60 dark:border-teal-800/60 transition-colors"
                              >
                                <Plus className="w-3 h-3" /> Sub
                              </button>
                              <button
                                onClick={() => openEditModal(cat)}
                                title="Edit Category"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(cat)}
                                title="Delete Category"
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Nested Subcategories Expandable Drawer */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-slate-800">
                            <td colSpan={9} className="p-4 pl-10 pr-6">
                              <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden">
                                {/* Subcategory Header Bar */}
                                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800">
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                    <CornerDownRight className="w-4 h-4 text-indigo-500" />
                                    <span>Subcategories of &ldquo;{cat.title}&rdquo;</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                                      {subCount} total
                                    </span>
                                  </div>

                                  <button
                                    onClick={() => openCreateSubModal(cat.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-semibold shadow-sm transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Add Subcategory
                                  </button>
                                </div>

                                {/* Subcategories List Table */}
                                {!cat.subcategories || cat.subcategories.length === 0 ? (
                                  <div className="p-6 text-center text-slate-400 text-xs">
                                    <Layers className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-1.5" />
                                    No subcategories created yet for &ldquo;{cat.title}&rdquo;.
                                    <div className="mt-2">
                                      <button
                                        onClick={() => openCreateSubModal(cat.id)}
                                        className="text-teal-600 dark:text-teal-400 font-semibold hover:underline text-xs"
                                      >
                                        + Create first subcategory
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[9px] tracking-wider font-semibold">
                                          <th className="py-2.5 px-3 w-14 text-center">Order</th>
                                          <th className="py-2.5 px-3 w-12">Thumb</th>
                                          <th className="py-2.5 px-3">Title & Slug</th>
                                          <th className="py-2.5 px-3 text-center">Prompts</th>
                                          <th className="py-2.5 px-3 text-center">Status</th>
                                          <th className="py-2.5 px-3 text-right">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {cat.subcategories.map((sub, sIdx) => (
                                          <tr
                                            key={sub.id}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                          >
                                            {/* Sub Position */}
                                            <td className="py-2 px-3 text-center">
                                              <div className="flex items-center justify-center gap-1">
                                                <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-400">
                                                  {sub.position}
                                                </span>
                                                <div className="flex flex-col">
                                                  <button
                                                    disabled={sIdx === 0}
                                                    onClick={() => handleSubMove(sub.id, 'up', cat.id)}
                                                    title="Move Up"
                                                    className="p-0.5 text-slate-400 hover:text-teal-600 disabled:opacity-20"
                                                  >
                                                    <ChevronUp className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    disabled={sIdx === (cat.subcategories?.length || 0) - 1}
                                                    onClick={() => handleSubMove(sub.id, 'down', cat.id)}
                                                    title="Move Down"
                                                    className="p-0.5 text-slate-400 hover:text-teal-600 disabled:opacity-20"
                                                  >
                                                    <ChevronDown className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              </div>
                                            </td>

                                            {/* Sub Image */}
                                            <td className="py-2 px-3">
                                              {sub.image ? (
                                                <img
                                                  src={sub.image}
                                                  alt={sub.title}
                                                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                                />
                                              ) : (
                                                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 font-bold text-xs">
                                                  {sub.title.charAt(0)}
                                                </div>
                                              )}
                                            </td>

                                            {/* Sub Title & Slug */}
                                            <td className="py-2 px-3">
                                              <div className="font-medium text-slate-900 dark:text-white">
                                                {sub.title}
                                              </div>
                                              <div className="text-[10px] text-slate-400 font-mono">
                                                /sub/{sub.slug}
                                              </div>
                                            </td>

                                            {/* Sub Prompts */}
                                            <td className="py-2 px-3 text-center">
                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                {sub._count?.prompts || 0} prompts
                                              </span>
                                            </td>

                                            {/* Sub Status */}
                                            <td className="py-2 px-3 text-center">
                                              <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                  sub.status
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                                }`}
                                              >
                                                {sub.status ? 'Active' : 'Inactive'}
                                              </span>
                                            </td>

                                            {/* Sub Actions */}
                                            <td className="py-2 px-3 text-right">
                                              <div className="flex items-center justify-end gap-1">
                                                <button
                                                  onClick={() => openEditSubModal(sub)}
                                                  title="Edit Subcategory"
                                                  className="p-1 text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                                >
                                                  <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => setDeleteSubTarget(sub)}
                                                  title="Delete Subcategory"
                                                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Category Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCategory ? 'Edit Category' : 'Create New Category'}
          description="Categories group and organize prompts in mobile applications and APIs."
          maxWidth="md"
        >
          <form onSubmit={handleSubmitCategory} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Category Title *
              </label>
              <input
                type="text"
                required
                value={modalTitle}
                onChange={(e) => setModalTitle(e.target.value)}
                placeholder="e.g. Midjourney & AI Art"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Cover Image
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={modalImage}
                  alt="Preview"
                  className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                />
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors">
                    {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">JPG, PNG, or WEBP up to 5MB</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-[11px] text-slate-400 mb-1">Or direct image URL / path:</label>
              <input
                type="text"
                value={modalImage}
                onChange={(e) => setModalImage(e.target.value)}
                placeholder="https://images.unsplash.com/... or /uploads/..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Featured Category
                </span>
                <p className="text-[10px] text-slate-400">Highlight in featured categories section</p>
              </div>
              <Switch checked={modalFeatured} onChange={setModalFeatured} />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Active Status</span>
                <p className="text-[10px] text-slate-400">Display this category on public client endpoints</p>
              </div>
              <Switch checked={modalStatus} onChange={setModalStatus} />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={modalSubmitting}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {modalSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Category Confirmation */}
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={`Delete Category: ${deleteTarget?.title}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <span>Are you sure you want to delete this category?</span>
                {deleteTarget && (deleteTarget._count?.prompts || 0) > 0 && (
                  <p className="font-bold text-rose-600 dark:text-rose-400 mt-1">
                    Warning: This category has {deleteTarget._count?.prompts} prompt(s). You must move or delete those prompts before deleting this category.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={deleting || (deleteTarget?._count?.prompts || 0) > 0}
                onClick={confirmDeleteCategory}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl shadow-md shadow-rose-600/20"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Create / Edit Subcategory Modal */}
        <Modal
          isOpen={isSubModalOpen}
          onClose={() => setIsSubModalOpen(false)}
          title={editingSubcategory ? 'Edit Subcategory' : 'Create Subcategory'}
          description="Subcategories allow deeper organization under a parent category."
          maxWidth="md"
        >
          <form onSubmit={handleSubmitSubcategory} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Parent Category *
              </label>
              <select
                required
                value={subModalCategoryId}
                onChange={(e) => setSubModalCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Subcategory Title *
              </label>
              <input
                type="text"
                required
                value={subModalTitle}
                onChange={(e) => setSubModalTitle(e.target.value)}
                placeholder="e.g. Anime Portraits, Landscapes, Coding Assistants"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Cover Image (Optional)
              </label>
              <div className="flex items-center gap-3">
                {subModalImage ? (
                  <img
                    src={subModalImage}
                    alt="Preview"
                    className="w-14 h-14 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 font-bold text-sm shrink-0">
                    {subModalTitle ? subModalTitle.charAt(0) : 'Sub'}
                  </div>
                )}
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 text-xs font-semibold hover:bg-teal-100 transition-colors">
                    {uploadingSubImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {uploadingSubImage ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      onChange={handleSubImageUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">Optional image icon</p>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <label className="block text-[11px] text-slate-400 mb-1">Or direct image URL / path:</label>
              <input
                type="text"
                value={subModalImage}
                onChange={(e) => setSubModalImage(e.target.value)}
                placeholder="https://... or /uploads/..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">Active Status</span>
                <p className="text-[10px] text-slate-400">Display this subcategory in feeds and client apps</p>
              </div>
              <Switch checked={subModalStatus} onChange={setSubModalStatus} />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSubModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={subModalSubmitting}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {subModalSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {editingSubcategory ? 'Update Subcategory' : 'Create Subcategory'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Subcategory Confirmation */}
        <Modal
          isOpen={!!deleteSubTarget}
          onClose={() => setDeleteSubTarget(null)}
          title={`Delete Subcategory: ${deleteSubTarget?.title}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <span>Are you sure you want to delete this subcategory?</span>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  Associated prompts will remain in the parent category, but their subcategory link will be removed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteSubTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={deletingSub}
                onClick={confirmDeleteSubcategory}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl shadow-md shadow-rose-600/20"
              >
                {deletingSub ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
