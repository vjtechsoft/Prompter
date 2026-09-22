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
  Radio,
  Code2,
  Star,
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
      name: 'Users',
      href: '/users',
      icon: Users,
    },
    {
      name: 'Client APIs',
      href: '/client-apis',
      icon: Code2,
      badge: 'Public',
    },
    ...(isSuperAdmin
      ? [
          {
            name: 'Admins',
            href: '/admins',
            icon: ShieldCheck,
            badge: 'Super',
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
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-white select-none transition-colors duration-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200/80 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group">
          <img
            src="/logo.png"
            alt="Prompter"
            className="w-9 h-9 object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                Prompter
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-widest uppercase">
                Admin Panel
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
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
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110',
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                )}
              />
              {!collapsed && (
                <span className="flex-1 truncate tracking-wide">{item.name}</span>
              )}
              {!collapsed && item.badge && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded border',
                    isActive
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30'
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
        <div className="px-4 py-3 mx-3 mb-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 transition-colors">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck
              className={cn(
                'w-4 h-4',
                isSuperAdmin
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-indigo-600 dark:text-indigo-400'
              )}
            />
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
              {isSuperAdmin ? 'Super Admin Mode' : 'Admin Mode'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
            {isSuperAdmin
              ? 'Full system access & settings'
              : 'Prompt & category management'}
          </p>
        </div>
      )}

      {/* Footer / Toggle & Logout */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={handleLogout}
          title="Sign Out"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition-colors w-full',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1 shrink-0"
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
          'hidden lg:flex flex-col shrink-0 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 ease-in-out',
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
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
