'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextType = {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const success = useCallback((msg: string) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, 'error'), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-5',
              t.type === 'success' &&
                'bg-white/95 dark:bg-[#0c121e]/90 text-slate-900 dark:text-emerald-100 border-emerald-500/30 shadow-[0_8px_30px_rgb(16,185,129,0.15)]',
              t.type === 'error' &&
                'bg-white/95 dark:bg-[#180d14]/90 text-slate-900 dark:text-rose-100 border-rose-500/30 shadow-[0_8px_30px_rgb(244,63,94,0.15)]',
              t.type === 'info' &&
                'bg-white/95 dark:bg-[#0c1020]/90 text-slate-900 dark:text-indigo-100 border-indigo-500/30 shadow-[0_8px_30px_rgb(99,102,241,0.15)]'
            )}
          >
            {t.type === 'success' && (
              <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
            {t.type === 'error' && (
              <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
            {t.type === 'info' && (
              <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                <Info className="w-4 h-4" />
              </div>
            )}
            <span className="text-xs font-semibold leading-relaxed flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
