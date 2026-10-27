'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { GlobalSearchModal } from '@/components/search/global-search-modal';
import { UserSession } from '@/types';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch (e) {
        console.error('Session load error:', e);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [router]);

  // Global keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070913] relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-glow-indigo">
              <div className="w-full h-full bg-[#070913] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">Prompter Studio</span>
            <span className="text-xs text-slate-400">Loading workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#070913] relative">
      {/* Background ambient radial lighting */}
      <div className="ambient-glow" />

      {/* Sidebar */}
      <Sidebar
        user={user}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        <Header
          user={user}
          onOpenSidebar={() => setMobileOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 pb-12">{children}</div>
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
