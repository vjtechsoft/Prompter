'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  description?: string;
}

export function Switch({
  checked,
  onChange,
  onCheckedChange,
  disabled = false,
  size = 'md',
  label,
  description,
}: SwitchProps) {
  const handleToggle = () => {
    if (disabled) return;
    const nextVal = !checked;
    onChange?.(nextVal);
    onCheckedChange?.(nextVal);
  };

  return (
    <label
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer select-none group',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'relative inline-flex shrink-0 transition-all duration-300 ease-in-out rounded-full border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 dark:focus:ring-offset-slate-950',
          size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
          checked
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-glow-indigo/50'
            : 'bg-slate-300 dark:bg-slate-800'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-md transform ring-0 transition duration-300 ease-in-out',
            size === 'sm'
              ? 'h-4 w-4' + (checked ? ' translate-x-4 shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ' translate-x-0')
              : 'h-5 w-5' + (checked ? ' translate-x-5 shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ' translate-x-0')
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}
