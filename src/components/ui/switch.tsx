'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
}

export function Switch({ checked, onChange, disabled = false, size = 'md', label }: SwitchProps) {
  return (
    <label className={cn('inline-flex items-center gap-2 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 transition-colors duration-200 ease-in-out rounded-full border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
          size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
          checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
            size === 'sm'
              ? 'h-4 w-4' + (checked ? ' translate-x-4' : ' translate-x-0')
              : 'h-5 w-5' + (checked ? ' translate-x-5' : ' translate-x-0')
          )}
        />
      </button>
      {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
    </label>
  );
}
