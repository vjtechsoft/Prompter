'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Zap,
  Heart,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const SLIDES = [
  {
    id: 1,
    image: '/uploads/1788597760306-261ab5efb6c3.jpg',
    title: 'A Royal Folk Dance Portrait',
    category: 'Cinematic Portraits',
    engine: 'Midjourney v6.1',
    prompt: 'Regal Indian dancer in opulent embroidered crimson attire, cinematic atmospheric backlighting, 85mm portrait lens, photorealistic 8K',
    likes: '14.8k',
    copies: '3.2k',
  },
  {
    id: 2,
    image: '/uploads/1788598874149-94b72e09b18b.jpg',
    title: '3D Cybernetic Character Design',
    category: '3D Digital Art',
    engine: 'DALL-E 3 Precision',
    prompt: 'Hyper-detailed 3D digital sculpture of an android explorer, neon chromatic aberration, volumetric studio rim lighting, octane render',
    likes: '18.2k',
    copies: '4.5k',
  },
  {
    id: 3,
    image: '/uploads/1788699560023-0cfcf09cab5a.jpg',
    title: 'Dreamy Double Exposure Scrapbook',
    category: 'Artistic Collages',
    engine: 'SDXL Turbo',
    prompt: 'Vintage scrapbook collage aesthetic, dual exposure silhouette over misty pine mountains, warm sepia film grain, mixed media',
    likes: '11.6k',
    copies: '2.8k',
  },
  {
    id: 4,
    image: '/uploads/1788778824061-2b182481e526.jpg',
    title: 'Festival of Lights Twilight Celebration',
    category: 'Festivals & Moments',
    engine: 'Midjourney v6.1',
    prompt: 'Warm golden diya candlelight reflection, festive celebration portrait, soft bokeh background, photorealistic 8K, cinematic depth',
    likes: '22.4k',
    copies: '6.1k',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 4-Slide Image Animation State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const router = useRouter();
  const { success, error: toastError } = useToast();

  // Auto-advance slides every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

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

  const copySlidePrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const activeSlide = SLIDES[currentSlide];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#080B14] text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Ambient Mesh & Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-transparent rounded-full blur-[130px]" />
        <div className="absolute top-1/2 -right-40 w-[550px] h-[550px] bg-gradient-to-bl from-blue-600/15 via-indigo-600/10 to-transparent rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-gradient-to-t from-purple-800/15 to-transparent rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Left Column: Interactive Product Showcase & 4-Slide Animation */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative z-10 flex-col justify-between p-10 xl:p-14 border-r border-slate-800/60 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-950/60 backdrop-blur-sm">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
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

        {/* Centerpiece: Animated Tagline & 4-Slide Image Animation */}
        <div className="my-auto py-6 max-w-xl w-full space-y-5">
          {/* Animated Next-Gen Prompt Line */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            Next-Gen Prompt Optimization &amp; Distribution
          </div>

          {/* 4-Slide Animated Visual Showcase Frame */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-800/90 bg-slate-950/80 shadow-2xl group">
            {/* Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-lg opacity-40 group-hover:opacity-70 transition duration-700 pointer-events-none" />

            {/* Slides Container */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
              {SLIDES.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-all duration-700 ease-out transform ${
                    idx === currentSlide
                      ? 'opacity-100 scale-100 z-10 pointer-events-auto'
                      : 'opacity-0 scale-105 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                </div>
              ))}

              {/* Slide Navigation Arrows */}
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/10 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/10 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Floating Slide Details Glass Card */}
              <div className="absolute bottom-3 left-3 right-3 z-20 p-4 rounded-2xl bg-slate-900/85 border border-slate-700/60 backdrop-blur-xl shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">
                      <Zap className="w-3 h-3 text-indigo-400" />
                      {activeSlide.engine}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {activeSlide.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400">
                      <Heart className="w-3 h-3 fill-rose-500" />
                      {activeSlide.likes}
                    </span>
                    <span className="text-[11px] font-medium text-indigo-300">
                      📋 {activeSlide.copies}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-slate-300 font-mono line-clamp-1 flex-1">
                    <span className="text-indigo-400">$ </span>
                    {activeSlide.prompt}
                  </p>

                  <button
                    type="button"
                    onClick={() => copySlidePrompt(activeSlide.prompt)}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-3 h-3 text-white" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Slide Progress / Indicators Bar */}
            <div className="p-3 bg-slate-950 flex items-center justify-between border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                {SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentSlide
                        ? 'w-7 bg-gradient-to-r from-indigo-500 to-purple-500'
                        : 'w-2 bg-slate-700 hover:bg-slate-600'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Slide {currentSlide + 1} of {SLIDES.length}
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-col text-xs text-slate-500 pt-4 border-t border-slate-800/40">
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

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@prompter.io"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 hover:border-slate-700 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Password Field with Show/Hide Toggle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-300">Password</label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 hover:border-slate-700 transition-all duration-200 font-mono tracking-wider placeholder:tracking-normal placeholder:font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-slate-950 cursor-pointer"
                    />
                    <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                      Remember this browser (30 days)
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition-all duration-200 active:scale-[0.99]"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-xl" />
                  <span className="relative flex items-center justify-center gap-2 py-3 px-4 rounded-[11px] bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 group-hover:from-indigo-500 group-hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all duration-200">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Workspace</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* Security Badge Footer */}
              <div className="pt-4 border-t border-slate-800/80 text-center">
                <div className="inline-flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>256-bit SSL Encrypted • Role-Protected Session Gate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Help Links */}
          <div className="mt-6 text-center text-xs text-slate-500 space-x-3">
            <span>Prompter System v2.4</span>
            <span>•</span>
            <Link href="/client-apis" className="hover:text-indigo-400 transition-colors">
              Developer APIs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
