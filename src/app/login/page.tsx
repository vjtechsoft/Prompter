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
  ShieldCheck,
  Eye,
  EyeOff,
  Crown,
  Shield,
  Star,
  Copy,
  Check,
  Zap,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeDemo, setActiveDemo] = useState<'super' | 'admin' | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

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

  const fillCredentials = (type: 'super' | 'admin') => {
    setActiveDemo(type);
    setError('');
    if (type === 'super') {
      setEmail('admin@promptmanager.com');
      setPassword('Admin@123456');
    } else {
      setEmail('sarah.jenkins@promptmanager.com');
      setPassword('Admin@123456');
    }
  };

  const samplePrompt =
    'Cinematic architectural photograph of a brutalist glass villa floating over misty Scandinavian pine forests, golden hour volumetric illumination, photorealistic 8K, Hasselblad X2D 100C rendering --ar 16:9 --v 6.1 --style raw';

  const copySamplePrompt = () => {
    navigator.clipboard.writeText(samplePrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
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

      {/* Left Column: Interactive Product Showcase */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative z-10 flex-col justify-between p-12 xl:p-16 border-r border-slate-800/60 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-950/60 backdrop-blur-sm">
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
              <p className="text-xs text-slate-400 font-medium">Enterprise Prompt Management Engine</p>
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

        {/* Centerpiece: High-Tech Interactive Showcase Card */}
        <div className="my-auto py-10 max-w-xl space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Next-Gen Prompt Optimization & Distribution
            </div>
            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Curate, Scale & Monetize{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                AI Prompts
              </span>{' '}
              with Precision.
            </h2>
            <p className="text-sm xl:text-base text-slate-400 leading-relaxed font-normal">
              High-throughput prompt publishing hub equipped with strict Role-Based Access Control, OneSignal push broadcasts, and sub-50ms REST APIs.
            </p>
          </div>

          {/* Interactive Floating Live Prompt Snippet Card */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
            <div className="relative rounded-2xl bg-slate-900/90 border border-slate-700/60 p-5 shadow-2xl backdrop-blur-xl space-y-4">
              {/* Card Meta Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold">
                    <Zap className="w-3 h-3 text-indigo-400" /> Midjourney v6.1
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25 text-[11px] font-medium">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Featured
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copySamplePrompt}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  title="Copy Prompt"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Snippet Box */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 font-mono text-xs text-slate-300 leading-relaxed relative">
                <span className="text-indigo-400 select-none">$ </span>
                {samplePrompt}
              </div>

              {/* Engagement Stat Strip */}
              <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-medium text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    14.8k Likes
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-300">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    92.4k Views
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-purple-300 font-medium">
                    <Crown className="w-3 h-3 text-amber-400" /> VIP Access
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">ID: pr_8f93a</div>
              </div>
            </div>
          </div>

          {/* Micro Value Metric Grid */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/70">
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm">
              <div className="text-xl xl:text-2xl font-bold text-white tracking-tight">99.98%</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">High-Availability SLA</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm">
              <div className="text-xl xl:text-2xl font-bold text-indigo-400 tracking-tight">&lt; 35ms</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Edge Route Response</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm">
              <div className="text-xl xl:text-2xl font-bold text-purple-400 tracking-tight">RBAC 2.0</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Multi-Admin Enforced</div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800/40">
          <span>© 2026 Prompter Cloud Architecture</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              SQLite ACID Verified
            </span>
          </div>
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
            <p className="text-xs text-indigo-300 font-medium mt-0.5">Admin Management Portal</p>
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
                  <span className="inline-block animate-wave select-none text-xl">👋</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400">
                  Authenticate to access the administrative dashboard.
                </p>
              </div>

              {/* Quick Demo Account Selector Cards */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Quick Demo Credentials
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">1-Click Fill</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Super Admin Pill */}
                  <button
                    type="button"
                    onClick={() => fillCredentials('super')}
                    className={`group relative text-left p-2.5 rounded-xl border transition-all duration-200 ${
                      activeDemo === 'super'
                        ? 'bg-amber-950/40 border-amber-500/60 ring-2 ring-amber-500/30 shadow-md shadow-amber-900/20'
                        : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        Super Admin
                      </span>
                      {activeDemo === 'super' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-1">Alex Vance</p>
                  </button>

                  {/* Admin Pill */}
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin')}
                    className={`group relative text-left p-2.5 rounded-xl border transition-all duration-200 ${
                      activeDemo === 'admin'
                        ? 'bg-indigo-950/40 border-indigo-500/60 ring-2 ring-indigo-500/30 shadow-md shadow-indigo-900/20'
                        : 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                        <Shield className="w-3.5 h-3.5 text-indigo-400" />
                        Staff Admin
                      </span>
                      {activeDemo === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-1">Sarah Jenkins</p>
                  </button>
                </div>
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
                      placeholder="admin@promptmanager.com"
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
            <span>•</span>
            <span className="text-slate-600">SQLite Single Node</span>
          </div>
        </div>
      </div>
    </div>
  );
}
