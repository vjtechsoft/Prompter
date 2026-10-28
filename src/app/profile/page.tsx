'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import {
  User,
  Mail,
  Lock,
  Upload,
  Clock,
  Laptop,
  ShieldCheck,
  Shield,
  Activity,
  AlertTriangle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const { success, error } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const [resProfile, resActivity] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/profile/activity'),
        ]);

        const dataProfile = await resProfile.json();
        const dataActivity = await resActivity.json();

        if (dataProfile.profile) {
          setProfile(dataProfile.profile);
          setName(dataProfile.profile.name);
          setEmail(dataProfile.profile.email);
          setAvatar(dataProfile.profile.avatar || '');
        }

        if (dataActivity.activityLogs) setActivityLogs(dataActivity.activityLogs);
        if (dataActivity.loginLogs) setLoginLogs(dataActivity.loginLogs);
      } catch (err) {
        error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [error]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/pjpeg', 'image/x-png'];
    const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = file.name ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';

    if (!validMimes.includes(file.type?.toLowerCase()) && !validExts.includes(ext)) {
      error('Only JPG, PNG, and WEBP are supported');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error('Image exceeds 5MB size limit');
      e.target.value = '';
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAvatar(data.url);
      success('Avatar uploaded');
    } catch (err: any) {
      error(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, avatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success('Profile updated successfully');
    } catch (err: any) {
      error(err.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      error('Password must be at least 8 characters');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.message || 'Failed to change password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteSelf = async () => {
    if (profile?.role === 'SUPER_ADMIN') {
      error('Super Admin profile cannot be deleted');
      return;
    }

    if (!confirm('Are you absolutely sure you want to permanently delete your admin account?')) {
      return;
    }

    try {
      const res = await fetch('/api/profile', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      success('Account deleted');
      router.push('/login');
    } catch {
      error('Failed to delete account');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <User className="w-7 h-7 text-indigo-600" />
              My Account Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage personal credentials, security keys, and inspect recent authentication logs.
            </p>
          </div>

          {profile?.role !== 'SUPER_ADMIN' && (
            <button
              onClick={handleDeleteSelf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          )}
        </div>

        {/* Profile Card & Password Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <form onSubmit={handleUpdateProfile} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Profile Information
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  profile?.role === 'SUPER_ADMIN'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300'
                }`}
              >
                {profile?.role === 'SUPER_ADMIN' ? (
                  <ShieldCheck className="w-3 h-3" />
                ) : (
                  <Shield className="w-3 h-3" />
                )}
                {profile?.role}
              </span>
            </div>

            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <img
                src={
                  avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'
                }
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0"
              />
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors">
                  {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Change Avatar
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-400 mt-1">Recommended 256x256 square format</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={updatingProfile}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {updatingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save Profile
              </button>
            </div>
          </form>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Security & Password
              </h3>
              <p className="text-xs text-slate-500">
                Ensure your account is utilizing a strong, unique 8+ character password.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={updatingPassword}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {updatingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Audit Trail: Activity Logs & Login History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Log */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <Activity className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Personal Activity Trail
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2">
              {activityLogs.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">No activity logged yet.</div>
              ) : (
                activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                      <span>{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{log.details}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Login History */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <Laptop className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Authentication Sessions
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2">
              {loginLogs.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">No logins recorded.</div>
              ) : (
                loginLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {log.status === 'SUCCESS' ? 'Successful Login' : 'Failed Login Attempt'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        IP: {log.ipAddress || '127.0.0.1'}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
