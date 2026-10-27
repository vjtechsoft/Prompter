'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Frosted Glass Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog with subtle glowing border */}
      <div
        className={cn(
          'relative w-full bg-white/95 dark:bg-[#0c101c]/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 shadow-glow-indigo/10',
          maxWidthClasses[maxWidth]
        )}
      >
        {/* Subtle Ambient Radial Highlight at top of modal */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-indigo-500/10 dark:from-indigo-500/20 to-transparent pointer-events-none rounded-t-3xl" />

        <div className="relative flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
