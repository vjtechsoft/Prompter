'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Upload,
  X,
  Copy,
  Check,
  Crown,
  Star,
  Loader2,
  Image as ImageIcon,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { Switch } from '@/components/ui/switch';
import { slugify } from '@/lib/utils';
import { CategoryItem, PromptItem } from '@/types';

interface PromptFormProps {
  initialData?: PromptItem;
  isEdit?: boolean;
}

export function PromptForm({ initialData, isEdit = false }: PromptFormProps) {
  const router = useRouter();
  const { success, error } = useToast();

  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [prompt, setPrompt] = useState(initialData?.prompt || '');
  const [featuredImage, setFeaturedImage] = useState(
    initialData?.featuredImage ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [subcategoryId, setSubcategoryId] = useState(initialData?.subcategoryId || '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isPremium, setIsPremium] = useState(initialData?.isPremium || false);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);
  const [status, setStatus] = useState(initialData?.status ?? true);
  const [likes, setLikes] = useState(initialData?.likes || 0);
  const [views, setViews] = useState(initialData?.views || 0);
  const [shares, setShares] = useState(initialData?.shares || 0);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-slug when title changes (if not in manual edit)
  const [isSlugManual, setIsSlugManual] = useState(Boolean(initialData));

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.categories) {
          setCategories(data.categories);
          if (!categoryId && data.categories.length > 0) {
            setCategoryId(data.categories[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load categories', e);
      }
    }
    loadCategories();
  }, [categoryId]);

  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    const newCat = categories.find((c) => c.id === newCatId);
    const validSubs = newCat?.subcategories || [];
    if (!validSubs.some((s) => s.id === subcategoryId)) {
      setSubcategoryId('');
    }
  };

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);
  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isSlugManual) {
      setSlug(slugify(val));
    }
  };

  // Add Tag
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '').toLowerCase();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Image File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setFeaturedImage(data.url);
      success('Image uploaded successfully');
    } catch (err: any) {
      error(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Copy prompt helper
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    success('Prompt copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !prompt.trim() || !categoryId) {
      error('Title, Prompt Content, and Category are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        slug: slug || slugify(title),
        prompt,
        featuredImage,
        categoryId,
        subcategoryId: subcategoryId || null,
        tags,
        isPremium,
        isFeatured,
        status,
        likes: Number(likes),
        views: Number(views),
        shares: Number(shares),
      };

      const url = isEdit ? `/api/prompts/${initialData?.id}` : '/api/prompts';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save prompt');
      }

      success(isEdit ? 'Prompt updated successfully!' : 'Prompt created successfully!');
      router.push('/prompts');
      router.refresh();
    } catch (err: any) {
      error(err.message || 'Failed to save prompt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/prompts"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {isEdit ? `Edit Prompt: ${initialData?.title}` : 'Create New Prompt'}
            </h1>
            <p className="text-xs text-slate-500">
              Configure prompt content, metadata, tags, and engagement counters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/prompts"
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : isEdit ? (
              'Update Prompt'
            ) : (
              'Publish Prompt'
            )}
          </button>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Content & Editor (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Prompt Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. Next.js 14 Enterprise Clean Architecture Blueprint"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                URL Slug (Auto-generated)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">/prompts/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsSlugManual(true);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Prompt Editor */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Prompt Body / Code Content *
                </label>
                <p className="text-[11px] text-slate-400">
                  Include instructions, context tokens (e.g. [TOPIC]), and output parameters.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">
                  {prompt.length} chars
                </span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                required
                rows={12}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Act as a Principal Engineer. Design an end-to-end..."
                className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-950 text-slate-100 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              />
            </div>
          </div>

          {/* Tag Manager */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Multiple Tags
            </label>
            <p className="text-[11px] text-slate-400">
              Type a keyword and press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">Enter</kbd> or comma.
            </p>

            <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 min-h-[48px] items-center">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-indigo-900 dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? "Add tags e.g. 'midjourney', 'coding'..." : "Add another..."}
                className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none min-w-[120px]"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Taxonomy, Image, Engagement & Settings (1 Col) */}
        <div className="space-y-6">
          {/* Category & Switches */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Category *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Subcategory (Optional)
              </label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                disabled={availableSubcategories.length === 0}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {availableSubcategories.length === 0
                    ? '— No subcategories in this category —'
                    : '— Select Subcategory (Optional) —'}
                </option>
                {availableSubcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500" /> Premium VIP Prompt
                  </div>
                  <div className="text-[11px] text-slate-400">Requires VIP access on client</div>
                </div>
                <Switch checked={isPremium} onChange={setIsPremium} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Featured Prompt
                  </div>
                  <div className="text-[11px] text-slate-400">Highlight in client app featured section</div>
                </div>
                <Switch checked={isFeatured} onChange={setIsFeatured} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Publish Status
                  </div>
                  <div className="text-[11px] text-slate-400">Visible to mobile and web users</div>
                </div>
                <Switch checked={status} onChange={setStatus} />
              </div>
            </div>
          </div>

          {/* Featured Image Upload & Preview */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Featured Image
            </label>
            <p className="text-[11px] text-slate-400">
              Upload high-resolution JPG, PNG, or WEBP (max 5MB).
            </p>

            <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-800">
              <img
                src={featuredImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Uploading...
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors">
                <Upload className="w-3.5 h-3.5" /> Upload File
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-2">
              <label className="block text-[11px] text-slate-400 mb-1">Or direct image URL / path:</label>
              <input
                type="text"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://images.unsplash.com/... or /uploads/..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Engagement Tuning (Likes, Views, Shares) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Engagement Metrics
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Views</label>
                <input
                  type="number"
                  min={0}
                  value={views}
                  onChange={(e) => setViews(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Likes</label>
                <input
                  type="number"
                  min={0}
                  value={likes}
                  onChange={(e) => setLikes(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Shares</label>
                <input
                  type="number"
                  min={0}
                  value={shares}
                  onChange={(e) => setShares(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
