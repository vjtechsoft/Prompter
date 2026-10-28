'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  Download,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Crown,
  Sparkles,
  Heart,
  Calendar,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Check,
  Copy,
  Eye,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { AppUserItem, AppUserStats } from '@/types';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function UsersPage() {
  const [users, setUsers] = useState<AppUserItem[]>([]);
  const [stats, setStats] = useState<AppUserStats>({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    vipUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vipFilter, setVipFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Modals
  const [detailUser, setDetailUser] = useState<AppUserItem | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUserItem | null>(null);
  const [deleteUser, setDeleteUser] = useState<AppUserItem | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Form State (Create / Edit)
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formIsVip, setFormIsVip] = useState(false);
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'BLOCKED'>('ACTIVE');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const { success, error } = useToast();

  const loadUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status: statusFilter,
        isVip: vipFilter,
        sortBy,
      });

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to load users');

      setUsers(data.users || []);
      setStats(data.stats || { totalUsers: 0, activeUsers: 0, blockedUsers: 0, vipUsers: 0 });
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: any) {
      error(err.message || 'Error fetching client app users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, search, statusFilter, vipFilter, sortBy, error]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Search input debouncing reset page
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Toggle single user status
  const handleToggleStatus = async (userItem: AppUserItem) => {
    const newStatus = userItem.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/users/${userItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success(`User ${userItem.name} marked as ${newStatus}`);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to update user status');
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormName('');
    setFormEmail('');
    setFormAvatar('');
    setFormIsVip(false);
    setFormStatus('ACTIVE');
    setCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: AppUserItem) => {
    setEditUser(item);
    setFormName(item.name);
    setFormEmail(item.email);
    setFormAvatar(item.avatar || '');
    setFormIsVip(item.isVip);
    setFormStatus(item.status);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) {
      error('Email address is required');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          avatar: formAvatar,
          isVip: formIsVip,
          status: formStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success(`Created client user: ${data.user.name}`);
      setCreateModalOpen(false);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to create user');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    if (!formEmail.trim()) {
      error('Email address is required');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          avatar: formAvatar,
          isVip: formIsVip,
          status: formStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success(`Updated user: ${data.user.name}`);
      setEditUser(null);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to update user');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteSubmit = async () => {
    if (!deleteUser) return;
    try {
      const res = await fetch(`/api/users/${deleteUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success(`Deleted user: ${deleteUser.name}`);
      setDeleteUser(null);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to delete user');
    }
  };

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(users.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: 'ACTIVATE' | 'BLOCK' | 'VIP_ENABLE' | 'VIP_DISABLE' | 'DELETE') => {
    if (selectedIds.length === 0) return;
    if (action === 'DELETE' && !confirm(`Are you sure you want to permanently delete ${selectedIds.length} user(s)?`)) {
      return;
    }

    setBulkProcessing(true);
    try {
      const res = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success(`Successfully updated ${data.count} users`);
      setSelectedIds([]);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Bulk operation failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (users.length === 0) {
      error('No users to export');
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'Auth Provider', 'Status', 'VIP', 'App Version', 'Likes', 'Last Active', 'Joined'];
    const rows = users.map((u) => [
      u.id,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      u.authProvider,
      u.status,
      u.isVip ? 'YES' : 'NO',
      u.appVersion || '',
      u.likesCount,
      new Date(u.lastActiveAt).toISOString(),
      new Date(u.createdAt).toISOString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `prompter_client_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Client users exported to CSV');
  };

  const copyUserId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Client App Users
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage registered mobile and web client application end-users, view Google sign-ins, and control access.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadUsers(true)}
              disabled={refreshing}
              title="Refresh users list"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Users */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {loading ? <Skeleton className="h-8 w-16" /> : stats.totalUsers}
              </h3>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Registered client accounts</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Active Users */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Users</span>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {loading ? <Skeleton className="h-8 w-16" /> : stats.activeUsers}
              </h3>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {stats.totalUsers > 0 ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% active rate` : '100% active'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Blocked Users */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Blocked Users</span>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {loading ? <Skeleton className="h-8 w-16" /> : stats.blockedUsers}
              </h3>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Suspended client accounts</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: VIP Members */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">VIP Members</span>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
                {loading ? <Skeleton className="h-8 w-16" /> : stats.vipUsers}
                <Crown className="w-5 h-5 text-amber-500 inline" />
              </h3>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Premium subscribers</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search users by name or Google email..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="ACTIVE">Active Users</option>
                <option value="BLOCKED">Blocked Users</option>
              </select>

              {/* VIP Filter */}
              <select
                value={vipFilter}
                onChange={(e) => {
                  setVipFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="all">All Tiers</option>
                <option value="true">VIP Subscribers</option>
                <option value="false">Standard Users</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="lastActive">Recently Active</option>
                <option value="name">Name (A-Z)</option>
                <option value="likes">Most Likes</option>
              </select>
            </div>
          </div>

          {/* Active Filter Tags */}
          {(search || statusFilter !== 'all' || vipFilter !== 'all' || sortBy !== 'newest') && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400">Active filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Query: {search}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearch('')} />
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Status: {statusFilter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
                </span>
              )}
              {vipFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  VIP: {vipFilter === 'true' ? 'Yes' : 'No'}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setVipFilter('all')} />
                </span>
              )}
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setVipFilter('all');
                  setSortBy('newest');
                }}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium ml-1"
              >
                Reset All
              </button>
            </div>
          )}
        </div>

        {/* Bulk Action Bar (Floating) */}
        {selectedIds.length > 0 && (
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                {selectedIds.length} user{selectedIds.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Deselect
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('ACTIVATE')}
                disabled={bulkProcessing}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
              >
                Activate All
              </button>
              <button
                onClick={() => handleBulkAction('BLOCK')}
                disabled={bulkProcessing}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
              >
                Block All
              </button>
              <button
                onClick={() => handleBulkAction('VIP_ENABLE')}
                disabled={bulkProcessing}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
              >
                Make VIP
              </button>
              <button
                onClick={() => handleBulkAction('DELETE')}
                disabled={bulkProcessing}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selectedIds.length === users.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Auth</th>
                  <th className="py-3 px-4">Engagement</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-3.5 px-4"><Skeleton className="h-4 w-4 rounded" /></td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-9 h-9 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-3 w-28" />
                            <Skeleton className="h-2.5 w-40" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="py-3.5 px-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-3.5 px-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="py-3.5 px-4"><Skeleton className="h-3 w-16" /></td>
                      <td className="py-3.5 px-4"><Skeleton className="h-3 w-20" /></td>
                      <td className="py-3.5 px-4 text-right"><Skeleton className="h-6 w-16 ml-auto rounded" /></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <p className="font-medium text-sm">No client app users found</p>
                        <p className="text-xs text-slate-400">
                          {search ? 'Try clearing your search filters' : 'Add a user or let mobile clients register via Google Sign-In.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(item.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>

                        {/* User info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              {item.avatar ? (
                                <img
                                  src={item.avatar}
                                  alt={item.name}
                                  className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                                  {item.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {item.isVip && (
                                <div
                                  title="VIP Subscriber"
                                  className="absolute -top-1 -right-1 p-0.5 bg-amber-400 text-amber-950 rounded-full shadow-sm"
                                >
                                  <Crown className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-900 dark:text-white truncate">
                                  {item.name}
                                </span>
                                {item.isVip && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                                    VIP
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                                {item.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Auth Provider */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <svg className="w-3 h-3" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                              />
                            </svg>
                            Google
                          </span>
                        </td>

                        {/* Engagement */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400" title="Prompts Liked">
                            <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                            {item.likesCount}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            title="Click to toggle status"
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-transform active:scale-95 ${
                              item.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 hover:bg-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            {item.status}
                          </button>
                        </td>

                        {/* Last Active */}
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {formatRelativeTime(item.lastActiveAt)}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(item.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setDetailUser(item)}
                              title="View Details"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => openEditModal(item)}
                              title="Edit User"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeleteUser(item)}
                              title="Delete User"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="py-3 px-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{users.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(page * limit, totalCount)}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{totalCount}</span> users
            </div>

            <div className="flex items-center gap-2">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value, 10));
                  setPage(1);
                }}
                className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>

              <div className="inline-flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal 1: User Details Modal */}
        <Modal
          isOpen={!!detailUser}
          onClose={() => setDetailUser(null)}
          title="Client App User Profile"
        >
          {detailUser && (
            <div className="space-y-5 pt-2">
              {/* Header profile banner */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                <div className="relative shrink-0">
                  {detailUser.avatar ? (
                    <img
                      src={detailUser.avatar}
                      alt={detailUser.name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500/20"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                      {detailUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {detailUser.isVip && (
                    <div className="absolute -top-1 -right-1 p-1 bg-amber-400 text-amber-950 rounded-full shadow">
                      <Crown className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                      {detailUser.name}
                    </h3>
                    {detailUser.isVip && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        VIP SUBSCRIBER
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{detailUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        detailUser.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {detailUser.status}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Active {formatRelativeTime(detailUser.lastActiveAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Engagement Stats */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500" /> Total Likes Recorded
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                  {detailUser.likesCount}
                </span>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">User ID</span>
                  <div className="flex items-center gap-1.5">
                    <code className="font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {detailUser.id}
                    </code>
                    <button
                      onClick={() => copyUserId(detailUser.id)}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Copy User ID"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Auth Method</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Google OAuth 2.0</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Client App Build</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {detailUser.appVersion ? `v${detailUser.appVersion}` : 'Default'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Registration Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(detailUser.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Last Active Session</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(detailUser.lastActiveAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal 2: Add User Modal */}
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Add New Client App User"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Google Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="user@gmail.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Avatar Image URL (Optional)
              </label>
              <input
                type="url"
                value={formAvatar}
                onChange={(e) => setFormAvatar(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Account Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'ACTIVE' | 'BLOCKED')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                >
                  <option value="ACTIVE">ACTIVE (Allowed)</option>
                  <option value="BLOCKED">BLOCKED (Suspended)</option>
                </select>
              </div>

              <div className="flex flex-col justify-center">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  VIP Membership
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Switch
                    checked={formIsVip}
                    onChange={setFormIsVip}
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {formIsVip ? 'VIP Member' : 'Regular User'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create User
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal 3: Edit User Modal */}
        <Modal
          isOpen={!!editUser}
          onClose={() => setEditUser(null)}
          title="Edit Client App User"
        >
          {editUser && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Google Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={formAvatar}
                  onChange={(e) => setFormAvatar(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Account Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'ACTIVE' | 'BLOCKED')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    <option value="ACTIVE">ACTIVE (Allowed)</option>
                    <option value="BLOCKED">BLOCKED (Suspended)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    VIP Membership
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Switch
                      checked={formIsVip}
                      onChange={setFormIsVip}
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {formIsVip ? 'VIP Member' : 'Regular User'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* Modal 4: Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteUser}
          onClose={() => setDeleteUser(null)}
          title="Delete Client App User"
        >
          {deleteUser && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-800 dark:text-rose-200">
                  <p className="font-bold">This action cannot be undone.</p>
                  <p className="mt-1">
                    Are you sure you want to permanently delete{' '}
                    <strong className="font-semibold text-rose-900 dark:text-white">
                      {deleteUser.name} ({deleteUser.email})
                    </strong>
                    ? Their saved prompts, liked metrics, and account access will be removed.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
