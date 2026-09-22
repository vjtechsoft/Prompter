'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import {
  Code2,
  Copy,
  Check,
  Play,
  Terminal,
  ExternalLink,
  Sparkles,
  FolderTree,
  DollarSign,
  Smartphone,
  Globe,
  ShieldAlert,
  ArrowRight,
  Layers,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
  Key,
  ShieldCheck,
  Shield,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Switch } from '@/components/ui/switch';

interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  defaultVal?: string;
  description: string;
}

interface EndpointDoc {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  category: 'Prompts' | 'Categories' | 'Monetization' | 'App Config' | 'Users';
  summary: string;
  description: string;
  params?: EndpointParam[];
  bodyExample?: string;
  sampleCurl?: string;
  defaultTestPath: string;
}

export default function ClientApisPage() {
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');
  const [copiedBase, setCopiedBase] = useState(false);
  const [activeTab, setActiveTab] = useState<'client' | 'admin'>('client');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // API Key Security state
  const [clientApiKey, setClientApiKey] = useState('prompter_live_sec_7f8a9b1c2d3e4f5a');
  const [requireApiKey, setRequireApiKey] = useState(true);
  const [revealKey, setRevealKey] = useState(false);
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);
  const [sendKeyInTest, setSendKeyInTest] = useState(true);

  // Live test state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [liveResponses, setLiveResponses] = useState<Record<string, { status: number; timeMs: number; data: any }>>({});
  const [expandedResponses, setExpandedResponses] = useState<Record<string, boolean>>({});

  const { success, error } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }

    async function loadKeyConfig() {
      try {
        const res = await fetch('/api/settings/api-key');
        const data = await res.json();
        if (data.clientApiKey) {
          setClientApiKey(data.clientApiKey);
          setRequireApiKey(data.requireApiKey);
        }
      } catch {
        // Fallback to default
      }
    }
    loadKeyConfig();
  }, []);

  const handleToggleRequireKey = async (val: boolean) => {
    setIsUpdatingKey(true);
    try {
      const res = await fetch('/api/settings/api-key', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requireApiKey: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRequireApiKey(data.requireApiKey);
      success(val ? 'API Key authentication is now ENFORCED' : 'API Key authentication is now DISABLED');
    } catch (e: any) {
      error(e.message || 'Failed to update security settings');
    } finally {
      setIsUpdatingKey(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!confirm('Are you sure you want to regenerate the Client API Key? Existing client apps using the previous key will need to be updated.')) {
      return;
    }
    setIsUpdatingKey(true);
    try {
      const res = await fetch('/api/settings/api-key', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generateNew: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClientApiKey(data.clientApiKey);
      success('New Client API Key generated successfully');
    } catch (e: any) {
      error(e.message || 'Failed to regenerate key');
    } finally {
      setIsUpdatingKey(false);
    }
  };

  const endpoints: EndpointDoc[] = [
    {
      id: 'get-prompts',
      method: 'GET',
      path: '/api/v1/prompts',
      category: 'Prompts',
      summary: 'List Published Prompts with Filtering & Sorting',
      description:
        'Returns a paginated list of active, non-deleted prompts with computed trending & popular scores, author category metadata, and deep links. Secured via x-api-key header.',
      defaultTestPath: '/api/v1/prompts?limit=3&sortBy=trending',
      params: [
        { name: 'page', type: 'integer', required: false, defaultVal: '1', description: 'Page number for pagination' },
        { name: 'limit', type: 'integer', required: false, defaultVal: '10', description: 'Items per page (max 50)' },
        { name: 'search', type: 'string', required: false, description: 'Search term across title, prompt, and tags' },
        { name: 'category', type: 'string', required: false, description: 'Category ID or category slug to filter by' },
        { name: 'subcategory', type: 'string', required: false, description: 'Subcategory ID or subcategory slug to filter by' },
        { name: 'isPremium', type: 'string', required: false, defaultVal: 'all', description: "'true' for VIP only, 'false' for free" },
        { name: 'sortBy', type: 'string', required: false, defaultVal: 'latest', description: "'latest' | 'oldest' | 'random' | 'trending' | 'popular' | 'views' | 'likes'" },
        { name: 'seed', type: 'integer', required: false, description: "Random seed for 'sortBy=random'. Pass the seed returned in pagination across subsequent pages to guarantee ZERO item repetition" },
      ],
    },
    {
      id: 'get-prompt-detail',
      method: 'GET',
      path: '/api/v1/prompts/:id',
      category: 'Prompts',
      summary: 'Get Prompt Details by ID or Slug',
      description:
        'Fetches complete details for a single published prompt. Supports querying either by database ID or human-readable URL slug.',
      defaultTestPath: '/api/v1/prompts/full-stack-next-js-14-clean-architecture-prompter',
      params: [
        { name: 'id', type: 'string (path)', required: true, description: 'Prompt ID or URL slug (e.g. "full-stack-next-js-14-clean-architecture-prompter")' },
      ],
    },
    {
      id: 'post-prompt-action',
      method: 'POST',
      path: '/api/v1/prompts/:id/action',
      category: 'Prompts',
      summary: 'Register Client Engagement (Unique Like, View, Share)',
      description:
        'Allows client apps to register user engagement. Likes are strictly unique per user/device (calling like again prevents duplicate counting or toggles unlike). Views and shares increment engagement scores in real-time.',
      defaultTestPath: '/api/v1/prompts/full-stack-next-js-14-clean-architecture-prompter/action',
      params: [
        { name: 'id', type: 'string (path)', required: true, description: 'Prompt ID or URL slug' },
        { name: 'type', type: 'string (body)', required: true, defaultVal: 'like', description: "'like' | 'unlike' | 'view' | 'share'" },
        { name: 'userId', type: 'string (body)', required: false, description: 'User ID or Google email (enforces unique like)' },
        { name: 'deviceId', type: 'string (body)', required: false, description: 'Client device installation UUID' },
      ],
      bodyExample: JSON.stringify({ type: 'like', userId: 'sarah.jenkins@gmail.com' }, null, 2),
    },
    {
      id: 'get-categories',
      method: 'GET',
      path: '/api/v1/categories',
      category: 'Categories',
      summary: 'List Active Categories with Nested Subcategories & Counts',
      description:
        'Returns all active categories sorted in display order (`position asc`), including live active prompt counts, nested active subcategories array, and deep links.',
      defaultTestPath: '/api/v1/categories',
    },
    {
      id: 'get-subcategories',
      method: 'GET',
      path: '/api/v1/subcategories',
      category: 'Categories',
      summary: 'List Active Subcategories with Parent Category & Deep Links',
      description:
        'Retrieves all active subcategories, optionally filtered by parent category ID or slug. Includes parent category details and deep links.',
      defaultTestPath: '/api/v1/subcategories',
      params: [
        { name: 'category', type: 'string', required: false, description: 'Filter by Parent Category ID or Slug' },
        { name: 'search', type: 'string', required: false, description: 'Search subcategories by title or slug' },
      ],
    },
    {
      id: 'get-ads-config',
      method: 'GET',
      path: '/api/v1/ads',
      category: 'Monetization',
      summary: 'Get Active Ad Network Configuration & Unit Placements',
      description:
        'Mobile client app should query this on startup to determine which ad SDK to initialize (Google AdMob, Meta Audience Network, or Unity Ads) and retrieve placement IDs. Only the single currently active provider is returned.',
      defaultTestPath: '/api/v1/ads',
    },
    {
      id: 'get-app-config',
      method: 'GET',
      path: '/api/v1/app-config',
      category: 'App Config',
      summary: 'Get App Settings, Logo & Maintenance Mode Status',
      description:
        'Provides essential app boot information including current app version, support email, branding logos, and the `maintenanceMode` boolean flag to gracefully disable client app usage during updates.',
      defaultTestPath: '/api/v1/app-config',
    },
    {
      id: 'get-app-urls',
      method: 'GET',
      path: '/api/v1/urls',
      category: 'App Config',
      summary: 'Get Legal Policies, Store Links & Social Channels',
      description:
        'Retrieves live links for Privacy Policy, Terms of Service, Refund Policy, Contact URL, and social channels (Twitter, Telegram, YouTube, Instagram, Facebook).',
      defaultTestPath: '/api/v1/urls',
    },
    {
      id: 'post-user-sync',
      method: 'POST',
      path: '/api/v1/users/sync',
      category: 'Users',
      summary: 'Register or Synchronize Google App User',
      description:
        'Allows the mobile or web app client to register or synchronize a user profile after signing in with Google OAuth. Updates display name, avatar, and last active timestamp.',
      defaultTestPath: '/api/v1/users/sync',
      bodyExample: JSON.stringify(
        {
          email: 'sarah.jenkins@gmail.com',
          name: 'Sarah Jenkins',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          appVersion: '1.2.0',
        },
        null,
        2
      ),
      params: [
        { name: 'email', type: 'string (body)', required: true, description: 'Google email address of the user' },
        { name: 'name', type: 'string (body)', required: false, description: 'Display name of the user' },
        { name: 'avatar', type: 'string (body)', required: false, description: 'Avatar image URL' },
        { name: 'appVersion', type: 'string (body)', required: false, description: 'Client app build version' },
      ],
    },
  ];

  const adminEndpoints = [
    {
      path: '/api/users',
      method: 'GET, POST',
      role: 'Admin + Super Admin',
      description: 'List, filter, paginate, and create client app users with live Google OAuth data and engagement metrics.',
    },
    {
      path: '/api/users/:id',
      method: 'GET, PUT, DELETE',
      role: 'Admin + Super Admin',
      description: 'Manage single client app user profile, toggle ACTIVE / BLOCKED status, toggle VIP membership, or delete.',
    },
    {
      path: '/api/users/bulk',
      method: 'POST',
      role: 'Admin + Super Admin',
      description: 'Execute batch operations on selected users: ACTIVATE, BLOCK, VIP_ENABLE, VIP_DISABLE, DELETE.',
    },
    {
      path: '/api/auth/login',
      method: 'POST',
      role: 'Public / Auth',
      description: 'Authenticates administrator credentials, returns JWT token, and sets secure HttpOnly cookie.',
    },
    {
      path: '/api/auth/logout',
      method: 'POST',
      role: 'Admin + Super Admin',
      description: 'Revokes administrator session and clears authentication cookies.',
    },
    {
      path: '/api/dashboard/stats',
      method: 'GET',
      role: 'Admin + Super Admin',
      description: 'Aggregates all 12 metric cards, monthly growth graphs, category distribution, and engagement curves.',
    },
    {
      path: '/api/prompts',
      method: 'GET, POST',
      role: 'Admin + Super Admin',
      description: 'Admin prompt management with advanced multi-filters, CSV/Excel export, character counters, and creation.',
    },
    {
      path: '/api/prompts/:id',
      method: 'GET, PUT, DELETE, PATCH',
      role: 'Admin + Super Admin',
      description: 'Full CRUD operations on prompts including soft delete, restore, force purge, and status/VIP toggles.',
    },
    {
      path: '/api/prompts/:id/duplicate',
      method: 'POST',
      role: 'Admin + Super Admin',
      description: '1-click cloning of any existing prompt with automatic title numbering and unique slug creation.',
    },
    {
      path: '/api/categories',
      method: 'GET, POST',
      role: 'Admin + Super Admin',
      description: 'Category taxonomy management with thumbnail upload and auto prompt counter.',
    },
    {
      path: '/api/categories/reorder',
      method: 'PUT',
      role: 'Admin + Super Admin',
      description: 'Reorders category positions for frontend display (Move Up / Move Down / Drag & Drop).',
    },
    {
      path: '/api/admins',
      method: 'GET, POST',
      role: 'Super Admin Only',
      description: 'Strict staff administrator management. Enforces maximum 4 Admins quota and prohibits second Super Admin.',
    },
    {
      path: '/api/admins/:id',
      method: 'PUT, DELETE',
      role: 'Super Admin Only',
      description: 'Update staff credentials or revoke accounts. Protects Super Admin account from deletion.',
    },
    {
      path: '/api/settings/ads',
      method: 'GET, PUT',
      role: 'Super Admin Only',
      description: 'Configures ad networks (AdMob, Meta, Unity). Strictly enforces single active provider rule.',
    },
    {
      path: '/api/settings/notifications',
      method: 'GET, PUT',
      role: 'Super Admin Only',
      description: 'OneSignal Push Notification integration settings and historical broadcast log.',
    },
    {
      path: '/api/settings/notifications/send',
      method: 'POST',
      role: 'Super Admin Only',
      description: 'Dispatches instant or scheduled push notification broadcasts to all mobile devices.',
    },
    {
      path: '/api/settings/app',
      method: 'GET, PUT',
      role: 'Super Admin Only',
      description: 'App branding settings, logo assets, package IDs, contact info, and Maintenance Mode switch.',
    },
    {
      path: '/api/settings/urls',
      method: 'GET, PUT',
      role: 'Super Admin Only',
      description: 'App legal policy URLs and social media community links.',
    },
    {
      path: '/api/profile',
      method: 'GET, PUT, DELETE',
      role: 'Admin + Super Admin',
      description: 'Manage personal account credentials, avatar, and security.',
    },
    {
      path: '/api/profile/password',
      method: 'PUT',
      role: 'Admin + Super Admin',
      description: 'Change password with verification of current password and confirmation check.',
    },
  ];

  const categories = ['All', 'Prompts', 'Categories', 'Monetization', 'App Config', 'Users'];

  const filteredEndpoints = activeCategory === 'All'
    ? endpoints
    : endpoints.filter((e) => e.category === activeCategory);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyBase = () => {
    navigator.clipboard.writeText(baseUrl);
    setCopiedBase(true);
    success('Base URL copied to clipboard');
    setTimeout(() => setCopiedBase(false), 2000);
  };

  const executeLiveTest = async (endpoint: EndpointDoc) => {
    setTestingId(endpoint.id);
    const start = performance.now();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (sendKeyInTest) {
        headers['x-api-key'] = clientApiKey;
      }

      let res: Response;
      if (endpoint.method === 'GET') {
        res = await fetch(endpoint.defaultTestPath, { headers });
      } else {
        res = await fetch(endpoint.defaultTestPath, {
          method: 'POST',
          headers,
          body: endpoint.bodyExample || JSON.stringify({ type: 'view' }),
        });
      }

      const timeMs = Math.round(performance.now() - start);
      const data = await res.json();
      setLiveResponses((prev) => ({
        ...prev,
        [endpoint.id]: { status: res.status, timeMs, data },
      }));
      setExpandedResponses((prev) => ({ ...prev, [endpoint.id]: true }));
    } catch (err: any) {
      setLiveResponses((prev) => ({
        ...prev,
        [endpoint.id]: { status: 500, timeMs: 0, data: { error: err.message || 'Network request failed' } },
      }));
      setExpandedResponses((prev) => ({ ...prev, [endpoint.id]: true }));
    } finally {
      setTestingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        {/* Header & Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white border border-slate-800 shadow-xl">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-32 -bottom-16 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Secured API Architecture
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Secured API URLs & Credentials
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Production API endpoints for both the <strong>mobile client application</strong> (secured with high-entropy Client API Keys) and the <strong>administrative management system</strong> (secured with JWT tokens and strict Role-Based Access Control).
            </p>

            {/* Base URL bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-mono text-indigo-300 w-full sm:w-auto">
                <span className="text-slate-400 select-none">Base URL:</span>
                <span className="font-semibold text-white truncate">{baseUrl}</span>
              </div>
              <button
                onClick={handleCopyBase}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
              >
                {copiedBase ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                {copiedBase ? 'Copied!' : 'Copy Base URL'}
              </button>
            </div>
          </div>
        </div>

        {/* Client API Key Security Management Panel */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Client App Security Credentials
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      requireApiKey
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {requireApiKey ? 'API Key Enforced (Active)' : 'Open / Unenforced (Testing)'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mobile applications must supply this key via the <code className="text-indigo-600 dark:text-indigo-400 font-mono">x-api-key</code> HTTP header.
                </p>
              </div>
            </div>

            {/* Enforce Key Toggle */}
            <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Enforce API Key:
              </span>
              <Switch
                checked={requireApiKey}
                onChange={handleToggleRequireKey}
                disabled={isUpdatingKey}
              />
            </div>
          </div>

          {/* Active Key Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <input
                type={revealKey ? 'text' : 'password'}
                readOnly
                value={clientApiKey}
                className="w-full font-mono text-xs px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setRevealKey(!revealKey)}
                title={revealKey ? 'Hide key' : 'Reveal key'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {revealKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={() => copyToClipboard(clientApiKey, 'client-key')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              {copiedId === 'client-key' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copiedId === 'client-key' ? 'Copied' : 'Copy Key'}
            </button>

            <button
              onClick={handleRegenerateKey}
              disabled={isUpdatingKey}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isUpdatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Regenerate Key
            </button>
          </div>

          {/* Test Option */}
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
            <input
              type="checkbox"
              id="sendKeyCheckbox"
              checked={sendKeyInTest}
              onChange={(e) => setSendKeyInTest(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="sendKeyCheckbox" className="cursor-pointer">
              Automatically include <code className="font-mono text-indigo-600 dark:text-indigo-400">x-api-key</code> in live endpoint tests below (Uncheck to verify 401 Unauthorized protection)
            </label>
          </div>
        </div>

        {/* View Switcher: Client App APIs vs Admin System APIs */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('client')}
            className={`pb-2 text-sm font-bold transition-all relative ${
              activeTab === 'client'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Client App Endpoints (API Key Secured)
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`pb-2 text-sm font-bold transition-all relative ${
              activeTab === 'admin'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Admin Panel Endpoints (JWT / RBAC Secured)
          </button>
        </div>

        {activeTab === 'client' ? (
          <>
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Endpoint Cards List */}
            <div className="space-y-6">
              {filteredEndpoints.map((ep) => {
                const hasResponse = !!liveResponses[ep.id];
                const isExpanded = expandedResponses[ep.id];
                const fullUrl = `${baseUrl}${ep.path}`;

                return (
                  <div
                    key={ep.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:border-indigo-500/40"
                  >
                    {/* Endpoint Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start md:items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider uppercase font-mono ${
                            ep.method === 'GET'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                              {ep.path}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {ep.category}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> API Key
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                            {ep.summary}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto">
                        {/* Copy URL */}
                        <button
                          onClick={() => copyToClipboard(fullUrl, `${ep.id}-url`)}
                          title="Copy full URL"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          {copiedId === `${ep.id}-url` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">Copy URL</span>
                        </button>

                        {/* Copy cURL */}
                        <button
                          onClick={() => {
                            const curlCmd =
                              ep.method === 'GET'
                                ? `curl -X GET "${baseUrl}${ep.defaultTestPath}" -H "x-api-key: ${clientApiKey}"`
                                : `curl -X POST "${baseUrl}${ep.defaultTestPath}" -H "Content-Type: application/json" -H "x-api-key: ${clientApiKey}" -d '${ep.bodyExample || '{}'}'`;
                            copyToClipboard(curlCmd, `${ep.id}-curl`);
                          }}
                          title="Copy cURL Command with API key"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          {copiedId === `${ep.id}-curl` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Terminal className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">cURL</span>
                        </button>

                        {/* Live Test Button */}
                        <button
                          onClick={() => executeLiveTest(ep)}
                          disabled={testingId === ep.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                          {testingId === ep.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                          Test Live
                        </button>
                      </div>
                    </div>

                    {/* Endpoint Description & Parameters */}
                    <div className="p-5 space-y-4">
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {ep.description}
                      </p>

                      {/* Required Header */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Required Header:
                          </span>{' '}
                          <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                            x-api-key: {revealKey ? clientApiKey : '••••••••••••••••'}
                          </code>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          (or query parameter <code className="font-mono">?api_key=...</code>)
                        </span>
                      </div>

                      {/* Parameters Table */}
                      {ep.params && ep.params.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Query / Path Parameters
                          </div>
                          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                                <tr>
                                  <th className="py-2 px-3 font-semibold">Parameter</th>
                                  <th className="py-2 px-3 font-semibold">Type</th>
                                  <th className="py-2 px-3 font-semibold">Required</th>
                                  <th className="py-2 px-3 font-semibold">Default</th>
                                  <th className="py-2 px-3 font-semibold">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                {ep.params.map((p) => (
                                  <tr key={p.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="py-2 px-3 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                                      {p.name}
                                    </td>
                                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                                      {p.type}
                                    </td>
                                    <td className="py-2 px-3">
                                      {p.required ? (
                                        <span className="text-[10px] font-bold text-rose-500">Yes</span>
                                      ) : (
                                        <span className="text-[10px] text-slate-400">Optional</span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                                      {p.defaultVal || '-'}
                                    </td>
                                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                                      {p.description}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Body example for POST */}
                      {ep.bodyExample && (
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            JSON Request Body
                          </div>
                          <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800">
                            {ep.bodyExample}
                          </pre>
                        </div>
                      )}

                      {/* Live Response Panel */}
                      {hasResponse && (
                        <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                          <div
                            onClick={() =>
                              setExpandedResponses((prev) => ({ ...prev, [ep.id]: !prev[ep.id] }))
                            }
                            className="cursor-pointer px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                Live Test Result
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  liveResponses[ep.id].status >= 200 && liveResponses[ep.id].status < 300
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                }`}
                              >
                                HTTP {liveResponses[ep.id].status}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {liveResponses[ep.id].timeMs} ms
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>

                          {isExpanded && (
                            <div className="p-3 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-72">
                              <pre>{JSON.stringify(liveResponses[ep.id].data, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Admin System Endpoints Directory */
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Administrative System Endpoints (JWT / RBAC Protected)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                These endpoints require administrator authentication via <code className="font-mono">prompt_auth_token</code> (HttpOnly cookie) or <code className="font-mono">Authorization: Bearer &lt;JWT&gt;</code> header.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3.5 font-semibold">Endpoint Route</th>
                    <th className="py-2.5 px-3.5 font-semibold">Method</th>
                    <th className="py-2.5 px-3.5 font-semibold">Required Role</th>
                    <th className="py-2.5 px-3.5 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {adminEndpoints.map((ep) => (
                    <tr key={ep.path} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                        {ep.path}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-500">
                        {ep.method}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ep.role === 'Super Admin Only'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                              : ep.role === 'Admin + Super Admin'
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {ep.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 text-xs">
                        {ep.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
