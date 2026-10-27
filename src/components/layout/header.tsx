'use client';

import React, { useState } from 'react';
import {
  Search,
  Moon,
  Sun,
  Laptop,
  Menu,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { UserSession } from '@/types';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  user: UserSession | null;
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
}

export function Header({ user, onOpenSidebar, onOpenSearch }: HeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200/70 dark:border-white/5 bg-white/75 dark:bg-[#070913]/75 backdrop-blur-xl transition-all duration-200">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Left: Mobile hamburger & Search bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            aria-label="Open mobile menu"
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200/70 dark:hover:bg-white/[0.08] border border-slate-200/70 dark:border-white/5 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 text-slate-400 transition-all text-xs w-48 sm:w-64 md:w-80 group shadow-sm"
          >
            <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
            <span className="flex-1 text-left truncate text-slate-500 dark:text-slate-400 font-medium">Search prompts, tags, categories...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-[#121626] text-slate-600 dark:text-slate-300 rounded-md shadow-sm border border-slate-200/80 dark:border-white/10">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Theme Switcher & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setThemeDropdownOpen(!themeDropdownOpen);
                setProfileDropdownOpen(false);
              }}
              aria-label="Toggle theme mode"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-transparent hover:border-slate-200 dark:hover:border-white/5 transition-all"
              title="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>

            {themeDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-36 bg-white/95 dark:bg-[#0c101c]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/10 py-1.5 z-40 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setThemeDropdownOpen(false)}
              >
                <button
                  onClick={() => {
                    setTheme('light');
                    setThemeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold ${
                    theme === 'light'
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-700 dark:text-slate-300'
                  } hover:bg-slate-100 dark:hover:bg-white/5 transition-colors`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Light
                </button>
                <button
                  onClick={() => {
                    setTheme('dark');
                    setThemeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold ${
                    theme === 'dark'
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-700 dark:text-slate-300'
                  } hover:bg-slate-100 dark:hover:bg-white/5 transition-colors`}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" /> Dark
                </button>
                <button
                  onClick={() => {
                    setTheme('system');
                    setThemeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold ${
                    theme === 'system'
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-700 dark:text-slate-300'
                  } hover:bg-slate-100 dark:hover:bg-white/5 transition-colors`}
                >
                  <Laptop className="w-3.5 h-3.5 text-slate-400" /> System
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-200 dark:bg-white/10" />

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setThemeDropdownOpen(false);
              }}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] border border-transparent hover:border-slate-200 dark:hover:border-white/5 transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-sm shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white font-bold text-xs uppercase">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </span>
              </div>
              <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown Card */}
            {profileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-[#0c101c]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/10 py-2 z-40 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setProfileDropdownOpen(false)}
              >
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user?.email}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    {user?.role}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      router.push('/profile');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" /> Account Profile
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-white/5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
