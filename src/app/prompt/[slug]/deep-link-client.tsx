'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Share2,
  Heart,
  Eye,
  Layers,
  ExternalLink,
  Smartphone,
  ArrowRight,
  Download,
  AlertCircle,
  X,
  Compass
} from 'lucide-react';

interface PromptData {
  id: string;
  title: string;
  slug: string;
  prompt: string;
  featuredImage?: string | null;
  category?: {
    id: string;
    title: string;
    slug: string;
    image?: string | null;
  } | null;
  subcategory?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  tags: string[];
  likes: number;
  views: number;
  shares: number;
  copies: number;
  isPremium?: boolean;
}

interface AppInfo {
  appName: string;
  packageName: string;
  playStoreUrl: string;
  appLogo?: string;
}

interface DeepLinkClientProps {
  prompt: PromptData;
  appInfo: AppInfo;
  initialNoRedirect?: boolean;
}

export default function DeepLinkClient({
  prompt,
  appInfo,
  initialNoRedirect = false,
}: DeepLinkClientProps) {
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Construct URLs
  const customSchemeUrl = `prompter://prompt/${prompt.slug}`;
  const androidIntentUrl = `intent://prompt/${prompt.slug}#Intent;scheme=prompter;package=${appInfo.packageName};S.browser_fallback_url=${encodeURIComponent(
    appInfo.playStoreUrl
  )};end`;

  // Auto-redirect on mobile
  useEffect(() => {
    if (initialNoRedirect) return;

    const ua = navigator.userAgent || '';
    const isAndroid = /android/i.test(ua);
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isMobile = isAndroid || isIOS;
    setIsMobileDevice(isMobile);

    if (!isMobile) {
      setRedirecting(false);
      return;
    }

    setRedirecting(true);

    // Countdown timer
    const countdownTimer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    let launchTimer: NodeJS.Timeout;
    let fallbackTimer: NodeJS.Timeout;

    if (isAndroid) {
      // 1. Attempt Android Intent
      launchTimer = setTimeout(() => {
        window.location.href = androidIntentUrl;
      }, 400);

      // 2. Play Store fallback after 2.5 seconds if intent didn't switch out of browser
      fallbackTimer = setTimeout(() => {
        if (!document.hidden) {
          setRedirecting(false);
          window.location.href = appInfo.playStoreUrl;
        }
      }, 2600);
    } else if (isIOS) {
      // 1. Attempt custom scheme
      launchTimer = setTimeout(() => {
        window.location.href = customSchemeUrl;
      }, 400);

      // 2. Fallback to App Store / Play Store
      fallbackTimer = setTimeout(() => {
        if (!document.hidden) {
          setRedirecting(false);
          window.location.href = appInfo.playStoreUrl;
        }
      }, 2600);
    }

    // Visibility listener to cancel redirect if app successfully launched
    const handleVisibility = () => {
      if (document.hidden) {
        setRedirecting(false);
        clearTimeout(launchTimer);
        clearTimeout(fallbackTimer);
        clearInterval(countdownTimer);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(launchTimer);
      clearTimeout(fallbackTimer);
      clearInterval(countdownTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [initialNoRedirect, androidIntentUrl, customSchemeUrl, appInfo.playStoreUrl]);

  // Copy Prompt to Clipboard
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = prompt.prompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Share Link Handler
  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: prompt.title,
          text: `Check out "${prompt.title}" on ${appInfo.appName}:`,
          url: shareUrl,
        });
      } catch {
        // User dismissed share sheet
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  // Manual Trigger: Open in App (with Play Store fallback)
  const handleOpenInApp = () => {
    const ua = navigator.userAgent || '';
    const isAndroid = /android/i.test(ua);

    if (isAndroid) {
      window.location.href = androidIntentUrl;
    } else {
      window.location.href = customSchemeUrl;
    }

    setTimeout(() => {
      if (!document.hidden) {
        window.location.href = appInfo.playStoreUrl;
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Glow Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/20 blur-[130px] rounded-full" />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-purple-600/15 blur-[120px] rounded-full" />
      </div>

      {/* Auto-Redirect Notice Banner */}
      {redirecting && (
        <div className="bg-indigo-600/90 backdrop-blur-md text-white text-xs py-2.5 px-4 sticky top-0 z-50 shadow-lg border-b border-indigo-400/30 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-[85%]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="truncate">
              Opening in <strong>{appInfo.appName}</strong>... Redirecting to Google Play Store in{' '}
              <strong className="underline">{redirectCountdown}s</strong> if not installed.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setRedirecting(false)}
            className="p-1 rounded-md hover:bg-white/20 transition-colors"
            title="Cancel auto-redirect"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight block">
                {appInfo.appName}
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                AI Prompt Library
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 text-xs font-semibold transition-all"
            >
              {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {shareCopied ? 'Link Copied!' : 'Share'}
            </button>

            <button
              type="button"
              onClick={handleOpenInApp}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-[0.98]"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Open in App
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Prompt Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl transition-all">
          {/* Featured Image Banner */}
          {prompt.featuredImage && (
            <div className="relative w-full h-64 sm:h-80 bg-slate-950 overflow-hidden group">
              <img
                src={prompt.featuredImage}
                alt={prompt.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              {/* Taxonomy Badges on Image */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {prompt.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600/90 backdrop-blur-md text-white shadow-md">
                    {prompt.category.title}
                  </span>
                )}
                {prompt.subcategory && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-slate-200 border border-slate-700 shadow-md">
                    {prompt.subcategory.title}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-6">
            {/* Title & Stats */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {prompt.title}
                </h1>
                {prompt.isPremium && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 uppercase tracking-wider">
                    PRO
                  </span>
                )}
              </div>

              {/* Engagement Metrics */}
              <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  {prompt.views.toLocaleString()} views
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  {prompt.likes.toLocaleString()} likes
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  {prompt.copies.toLocaleString()} copies
                </span>
              </div>
            </div>

            {/* Prompt Content Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider px-1">
                <span>The Prompt</span>
                <span className="text-[10px] text-slate-500 lowercase">Ready to copy & run</span>
              </div>

              <div className="relative group bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-inner">
                <pre className="font-mono text-xs sm:text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed select-all">
                  {prompt.prompt}
                </pre>

                {/* Copy Button */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied to Clipboard!' : 'Copy Prompt'}
                  </button>
                </div>
              </div>
            </div>

            {/* Tags */}
            {prompt.tags && prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {prompt.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/70 border border-slate-700/60 text-slate-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Callouts / App Download Section */}
        <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Unlock 10,000+ AI Prompts
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Get the full experience on {appInfo.appName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
              Explore daily trending prompts, save favorites, copy 1-click parameters for Midjourney, ChatGPT, Stable Diffusion, Claude, and more.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            {/* Primary Open in App Button */}
            <button
              type="button"
              onClick={handleOpenInApp}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
            >
              <Smartphone className="w-4 h-4" />
              Open in App
            </button>

            {/* Google Play Store Direct Link */}
            <a
              href={appInfo.playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700/80 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Get on Google Play
            </a>
          </div>
        </div>
      </main>

      {/* Floating Bottom Action Bar on Mobile */}
      <div className="sm:hidden sticky bottom-0 z-40 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 p-3 flex items-center gap-2 shadow-2xl">
        <button
          type="button"
          onClick={handleCopyPrompt}
          className="flex-1 py-3 px-3 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>

        <button
          type="button"
          onClick={handleOpenInApp}
          className="flex-[2] py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
        >
          <Smartphone className="w-3.5 h-3.5" />
          Open in App
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© {new Date().getFullYear()} {appInfo.appName}. All rights reserved.</p>
        <p className="text-[11px] text-slate-600 mt-1">
          Deep Link Route: <code className="font-mono text-slate-500">{customSchemeUrl}</code>
        </p>
      </footer>
    </div>
  );
}
