'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Search, Sparkles, FolderTree, Users, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    prompts: any[];
    categories: any[];
    subcategories?: any[];
    users: any[];
    appUsers?: any[];
  }>({ prompts: [], categories: [], subcategories: [], users: [], appUsers: [] });

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults({ prompts: [], categories: [], users: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ prompts: [], categories: [], users: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch (e) {
        console.error('Search query failed:', e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  const hasResults =
    results.prompts.length > 0 ||
    results.categories.length > 0 ||
    results.users.length > 0 ||
    (results.appUsers && results.appUsers.length > 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Search" maxWidth="2xl">
      <div className="flex flex-col gap-4">
        {/* Search input */}
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search prompts, categories, tags, or admins..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-base"
          />
          {loading && <Loader2 className="absolute right-4 w-5 h-5 text-indigo-500 animate-spin" />}
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto space-y-4 pt-2">
          {query.length >= 2 && !loading && !hasResults && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No matching items found for &quot;<span className="text-slate-200">{query}</span>&quot;
            </div>
          )}

          {/* Prompts results */}
          {results.prompts.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Prompts ({results.prompts.length})
              </div>
              <div className="space-y-1">
                {results.prompts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(`/prompts`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/70 dark:hover:bg-slate-800/80 text-left transition-colors group"
                  >
                    <div className="flex flex-col min-w-0 pr-3">
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {p.title}
                      </span>
                      <span className="text-xs text-slate-400">
                        Category: {p.category?.title || 'General'}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories results */}
          {results.categories.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
                <FolderTree className="w-3.5 h-3.5 text-emerald-500" />
                Categories ({results.categories.length})
              </div>
              <div className="space-y-1">
                {results.categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(`/categories`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/70 dark:hover:bg-slate-800/80 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={c.image}
                        alt={c.title}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          {c.title}
                        </div>
                        <div className="text-xs text-slate-400">
                          {c._count?.prompts || 0} prompts
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subcategories results */}
          {results.subcategories && results.subcategories.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
                <FolderTree className="w-3.5 h-3.5 text-teal-500" />
                Subcategories ({results.subcategories.length})
              </div>
              <div className="space-y-1">
                {results.subcategories.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(`/categories`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-teal-50/70 dark:hover:bg-slate-800/80 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {s.image ? (
                        <img
                          src={s.image}
                          alt={s.title}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 font-bold text-xs">
                          {s.title.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">
                          {s.title}
                        </div>
                        <div className="text-xs text-slate-400">
                          in <span className="font-semibold text-slate-600 dark:text-slate-300">{s.category?.title}</span> • {s._count?.prompts || 0} prompts
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-teal-500 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Admins results */}
          {results.users.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
                <Users className="w-3.5 h-3.5 text-purple-500" />
                Administrators ({results.users.length})
              </div>
              <div className="space-y-1">
                {results.users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelect(`/admins`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50/70 dark:hover:bg-slate-800/80 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {u.name}
                        </div>
                        <div className="text-xs text-slate-400">{u.email} ({u.role})</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-purple-500 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Client App Users results */}
          {results.appUsers && results.appUsers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Client App Users ({results.appUsers.length})
              </div>
              <div className="space-y-1">
                {results.appUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelect(`/users`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/70 dark:hover:bg-slate-800/80 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                          {u.name}
                          {u.isVip && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              VIP
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
