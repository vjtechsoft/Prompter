'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface ShowcaseCard {
  tag: string;
  image: string;
}

const COLUMN_1: ShowcaseCard[] = [
  { tag: 'SPIRITUAL', image: '/images/prompts/group-portrait-1.webp' },
  { tag: 'FASHION', image: '/images/prompts/couple-portrait-2.webp' },
  { tag: 'CELEBRATION', image: '/uploads/1788778824061-2b182481e526.jpg' },
  { tag: 'MYTHOLOGY', image: '/uploads/1788700421150-739bb7979eee.jpg' },
  { tag: 'RETRO', image: '/images/prompts/photo-collage-1.webp' },
];

const COLUMN_2: ShowcaseCard[] = [
  { tag: 'PORTRAIT', image: '/images/prompts/solo-portrait-1.webp' },
  { tag: 'POSTER', image: '/images/prompts/poster-typography-1.webp' },
  { tag: 'CINEMATIC', image: '/images/prompts/solo-portrait-2.webp' },
  { tag: 'ROYAL', image: '/uploads/1788597760306-261ab5efb6c3.jpg' },
  { tag: 'ACTION', image: '/images/prompts/fan-cdp-2.webp' },
];

const COLUMN_3: ShowcaseCard[] = [
  { tag: 'ARTWORK', image: '/images/prompts/stylized-illustration-1.webp' },
  { tag: 'KIDS', image: '/images/prompts/scrapbook-page-1.webp' },
  { tag: '3D ART', image: '/uploads/1788598874149-94b72e09b18b.jpg' },
  { tag: 'WALLPAPER', image: '/images/prompts/wallpaper-1.webp' },
  { tag: 'DOUBLE EXPOSURE', image: '/images/prompts/double-exposure-1.webp' },
];

function ShowcaseCardItem({ card }: { card: ShowcaseCard }) {
  return (
    <div className="group relative w-[135px] sm:w-[155px] md:w-[170px] xl:w-[195px] h-[190px] sm:h-[220px] md:h-[245px] xl:h-[275px] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 ring-1 ring-white/5 bg-slate-900 shadow-2xl shadow-black/80 shrink-0 transition-transform duration-300 hover:scale-[1.03]">
      <img
        src={card.image}
        alt={card.tag}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 select-none"
        loading="lazy"
      />
      {/* Subtle bottom shadow vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

      {/* Glassmorphic Category Tag (identical to reference image) */}
      <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-bold text-[10px] tracking-wider uppercase shadow-lg select-none">
        {card.tag}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { success, error: toastError } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed');
        toastError(data.error || 'Failed to sign in');
        return;
      }

      success(`Welcome back, ${data.user.name}!`);
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected connection error occurred. Please try again.');
      toastError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#080B14] text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Ambient Mesh & Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-transparent rounded-full blur-[130px]" />
        <div className="absolute top-1/2 -right-40 w-[550px] h-[550px] bg-gradient-to-bl from-blue-600/15 via-indigo-600/10 to-transparent rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-gradient-to-t from-purple-800/15 to-transparent rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Left Column: Tilted Visual Showcase Mosaic matching the Reference Image */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative z-10 flex-col justify-between p-8 xl:p-12 border-r border-slate-800/60 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-950/60 backdrop-blur-sm overflow-hidden">
        {/* Brand Header */}
        <div className="flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3.5 group">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 p-0.5 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center overflow-hidden p-2">
                <Image
                  src="/logo.png"
                  alt="Prompter"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain drop-shadow"
                  priority
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-sans">Prompter</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v2.4 Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">AI Prompt Space</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            System Operational
          </div>
        </div>

        {/* Centerpiece Showcase: Tilted 3-Column Card Mosaic */}
        <div className="relative flex-1 my-5 min-h-[460px] max-h-[640px] rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-950/90 shadow-2xl flex items-center justify-center">
          {/* Ambient Glow */}
          <div className="absolute -inset-10 bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-pink-600/15 blur-3xl opacity-50 pointer-events-none" />

          {/* Top Tagline Pill */}
          <div className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-xl">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            Next-Gen Prompt Space &amp; Curation
          </div>

          {/* Tilted Columns Showcase */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <div className="flex gap-4 sm:gap-5 transform rotate-[12deg] scale-[1.12] xl:scale-[1.18] pointer-events-auto select-none">
              {/* Column 1: Moves upward */}
              <div className="flex flex-col gap-4 sm:gap-5 animate-marquee-col-up hover:[animation-play-state:paused]">
                {[...COLUMN_1, ...COLUMN_1].map((card, i) => (
                  <ShowcaseCardItem key={`c1-${i}`} card={card} />
                ))}
              </div>

              {/* Column 2: Moves downward */}
              <div className="flex flex-col gap-4 sm:gap-5 animate-marquee-col-down hover:[animation-play-state:paused]">
                {[...COLUMN_2, ...COLUMN_2].map((card, i) => (
                  <ShowcaseCardItem key={`c2-${i}`} card={card} />
                ))}
              </div>

              {/* Column 3: Moves upward */}
              <div className="flex flex-col gap-4 sm:gap-5 animate-marquee-col-up-fast hover:[animation-play-state:paused]">
                {[...COLUMN_3, ...COLUMN_3].map((card, i) => (
                  <ShowcaseCardItem key={`c3-${i}`} card={card} />
                ))}
              </div>
            </div>

            {/* Edge Vignette Masks for Seamless Gradient Melt */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#080B14] via-[#080B14]/80 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#080B14] via-[#080B14]/80 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#080B14] via-[#080B14]/70 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#080B14] via-[#080B14]/70 to-transparent z-10" />
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex flex-col text-xs text-slate-500 pt-3 border-t border-slate-800/40 shrink-0">
          <span className="font-medium text-slate-400">© 2026 Prompter AI. All Rights Reserved.</span>
          <span className="text-[11px] text-slate-500 mt-0.5">Created by Codemorio Infotech Pvt. Ltd.</span>
        </div>
      </div>

      {/* Right Column: High-End Login Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Top Brand Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 p-0.5 shadow-xl shadow-indigo-500/20 mb-3.5 ring-1 ring-white/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center p-3">
                <Image src="/logo.png" alt="Prompter" width={40} height={40} className="object-contain" priority />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Prompter</h1>
            <p className="text-xs text-indigo-300 font-medium mt-0.5">AI Prompt Space</p>
          </div>

          {/* Elevated Glass Card */}
          <div className="relative">
            {/* Card Glow Highlight */}
            <div className="absolute -inset-1 bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent rounded-3xl blur-xl opacity-75" />

            <div className="relative rounded-3xl bg-slate-900/85 border border-slate-800/90 shadow-2xl shadow-black/80 backdrop-blur-xl p-7 sm:p-9 space-y-6">
              {/* Header Title */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                    Welcome Back
                  </h2>
                  <span className="inline-block select-none text-xl">👋</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400">
                  Authenticate to access the administrative dashboard.
                </p>
              </div>

              {/* Error Alert Box */}
              {error && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{error}</div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@prompter.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500/50"
                    />
                    <span className="text-xs text-slate-400">Remember this device for 30 days</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden rounded-xl p-px font-semibold text-sm shadow-xl shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-indigo-500/35"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl transition-all duration-300 group-hover:scale-105" />
                  <div className="relative px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[11px] flex items-center justify-center gap-2 text-white group-hover:bg-opacity-90 transition-all">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing in securely...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Prompter</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="text-center text-xs text-slate-500 mt-8 space-y-1 lg:hidden">
            <p className="font-medium text-slate-400">© 2026 Prompter AI. All Rights Reserved.</p>
            <p className="text-[11px] text-slate-500">Created by Codemorio Infotech Pvt. Ltd.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
