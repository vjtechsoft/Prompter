import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'cyan' | 'outline' | 'ai';
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = 'default', className, dot = false }: BadgeProps) {
  const variantStyles = {
    default: 'bg-slate-100/80 text-slate-700 border-slate-200/80 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60',
    success: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
    purple: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30',
    ai: 'bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 shadow-sm',
    outline: 'border border-slate-300/80 text-slate-700 bg-transparent dark:border-slate-700/80 dark:text-slate-300',
  };

  const dotColors = {
    default: 'bg-slate-400 dark:bg-slate-500',
    success: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
    warning: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    danger: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
    purple: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]',
    cyan: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]',
    ai: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]',
    outline: 'bg-slate-400 dark:bg-slate-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm transition-all duration-150',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
