'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Sparkles,
  FolderTree,
  Users,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  Code2,
  Star,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserSession } from '@/types';

interface SidebarProps {
  user: UserSession | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  user,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Prompts',
      href: '/prompts',
      icon: Sparkles,
    },
    {
      name: 'Categories',
      href: '/categories',
      icon: FolderTree,
    },
    {
      name: 'Featured',
      href: '/featured',
      icon: Star,
    },
    {
      name: 'Trending',
      href: '/trending',
      icon: TrendingUp,
      badge: 'Hot',
      badgeColor: 'amber',
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
    },
    {
      name: 'Client APIs',
      href: '/client-apis',
      icon: Code2,
      badge: 'REST',
      badgeColor: 'indigo',
    },
    ...(isSuperAdmin
      ? [
          {
            name: 'Admins',
            href: '/admins',
            icon: ShieldCheck,
            badge: 'Super',
            badgeColor: 'purple',
          },
          {
            name: 'Settings',
            href: '/settings',
            icon: Settings,
          },
        ]
      : []),
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/95 dark:bg-[#0b0e1b]/90 backdrop-blur-2xl text-slate-800 dark:text-slate-200 select-none transition-all duration-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200/70 dark:border-white/5 relative">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                  Prompter
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  AI
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase mt-1">
                Studio Platform
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          aria-label="Close sidebar"
          className="lg:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        {!collapsed && (
          <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Workspace
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              title={collapsed ? item.name : undefined}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent text-indigo-600 dark:text-white border border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.04] border border-transparent'
              )}
            >
              {/* Active left indicator glow */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full shadow-glow-indigo" />
              )}

              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                )}
              />
              {!collapsed && (
                <span className="flex-1 truncate tracking-tight">{item.name}</span>
              )}
              {!collapsed && item.badge && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-md border',
                    item.badgeColor === 'amber' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
                    item.badgeColor === 'purple' && 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
                    item.badgeColor === 'indigo' && 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Role Banner / Profile Quick Card */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              <span className="text-[11px] font-bold text-slate-800 dark:text-white tracking-tight">
                {isSuperAdmin ? 'Super Administrator' : 'Administrator'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {user?.email || 'admin@prompter.com'}
            </p>
          </div>
        </div>
      )}

      {/* Footer / Toggle & Logout */}
      <div className="p-3 border-t border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-2">
        <button
          onClick={handleLogout}
          title="Sign Out"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300 transition-colors flex-1',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col shrink-0 border-r border-slate-200/70 dark:border-white/5 transition-all duration-300 ease-in-out z-20',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Slide-out Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
