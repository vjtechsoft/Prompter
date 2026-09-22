import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function calculateTrendingScore(views: number, likes: number, shares: number): number {
  // Trending Score = Views × 0.4 + Likes × 0.4 + Shares × 0.2
  return Math.round((views * 0.4 + likes * 0.4 + shares * 0.2) * 100) / 100;
}

export function calculatePopularScore(views: number, likes: number, shares: number): number {
  // Popular Score = Likes + Shares + Views
  return likes + shares + views;
}

export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function truncate(str: string, length: number): string {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Deterministic pseudo-random hash for an ID and numeric seed.
 * Produces a stable 32-bit unsigned number for stable random pagination without data repetition.
 */
export function seededHash(id: string, seed: number): number {
  let h = (seed ^ 0xdeadbeef) >>> 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 2654435761);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

