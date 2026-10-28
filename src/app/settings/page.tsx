'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import {
  Settings,
  Radio,
  Bell,
  Smartphone,
  Link2,
  Save,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Calendar,
  Share2,
  Sliders,
  Timer,
  Layers,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'ads' | 'notifications' | 'app' | 'urls'>('ads');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  // 1. Ads State
  const [ads, setAds] = useState({
    activeProvider: 'ADMOB',
    interstitialInterval: 3,
    nativeInterval: 5,
    admobAppId: '',
    admobBannerId: '',
    admobInterstitialId: '',
    admobRewardedId: '',
    admobNativeId: '',
    admobAppOpenId: '',
    metaBannerId: '',
    metaInterstitialId: '',
    metaRewardedId: '',
    metaNativeId: '',
    unityGameId: '',
    unityBannerPlacement: '',
    unityInterstitialPlacement: '',
    unityRewardedPlacement: '',
  });

  // 2. Notifications State
  const [notificationConfig, setNotificationConfig] = useState({
    oneSignalAppId: '',
    oneSignalRestKey: '',
    isEnabled: false,
  });
  const [notificationsHistory, setNotificationsHistory] = useState<any[]>([]);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifImage, setNotifImage] = useState('');
  const [notifDeepLink, setNotifDeepLink] = useState('');
  const [notifSchedule, setNotifSchedule] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  // 3. App Settings State
  const [appSettings, setAppSettings] = useState({
    appName: '',
    developerName: '',
    packageName: '',
    versionName: '',
    versionCode: '',
    supportEmail: '',
    website: '',
    contactNumber: '',
    copyright: '',
    defaultLanguage: 'en',
    theme: 'system',
    timezone: 'UTC',
    currency: 'USD ($)',
    maintenanceMode: false,
    appLogo: '',
    splashLogo: '',
    appIcon: '',
    favicon: '',
  });

  // 4. URLs State
  const [appUrls, setAppUrls] = useState({
    privacyPolicy: '',
    termsOfService: '',
    refundPolicy: '',
    dataDeletionPolicy: '',
    contactUs: '',
    aboutUs: '',
    website: '',
    playStore: '',
    facebook: '',
    instagram: '',
    youtube: '',
    twitter: '',
    telegram: '',
  });

  // Load all configurations
  useEffect(() => {
    async function loadAllSettings() {
      setLoading(true);
      try {
        const [resAds, resNotif, resApp, resUrls] = await Promise.all([
          fetch('/api/settings/ads'),
          fetch('/api/settings/notifications'),
          fetch('/api/settings/app'),
          fetch('/api/settings/urls'),
        ]);

        const dataAds = await resAds.json();
        const dataNotif = await resNotif.json();
        const dataApp = await resApp.json();
        const dataUrls = await resUrls.json();

        if (dataAds.ads) setAds((prev) => ({ ...prev, ...dataAds.ads }));
        if (dataNotif.config) setNotificationConfig(dataNotif.config);
        if (dataNotif.history) setNotificationsHistory(dataNotif.history);
        if (dataApp.settings) setAppSettings(dataApp.settings);
        if (dataUrls.urls) setAppUrls(dataUrls.urls);
      } catch (err) {
        error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadAllSettings();
  }, [error]);

  // Save Ads
  const handleSaveAds = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ads),
      });
      if (!res.ok) throw new Error();
      success(`Saved ad configuration. Active Provider: ${ads.activeProvider}`);
    } catch {
      error('Failed to save ad settings');
    } finally {
      setSaving(false);
    }
  };

  // Save Notification Config
  const handleSaveNotificationConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationConfig),
      });
      if (!res.ok) throw new Error();
      success('OneSignal notification settings saved');
    } catch {
      error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  // Dispatch Broadcast Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      error('Notification title and message are required');
      return;
    }

    setSendingNotif(true);
    try {
      const res = await fetch('/api/settings/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notifTitle,
          message: notifMessage,
          image: notifImage,
          deepLink: notifDeepLink,
          sendToAll: true,
          scheduledAt: notifSchedule ? notifSchedule : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success(data.message);
      setNotifTitle('');
      setNotifMessage('');
      setNotifImage('');
      setNotifDeepLink('');
      setNotifSchedule('');

      // Refresh history
      const resNotif = await fetch('/api/settings/notifications');
      const dataNotif = await resNotif.json();
      if (dataNotif.history) setNotificationsHistory(dataNotif.history);
    } catch (err: any) {
      error(err.message || 'Failed to dispatch notification');
    } finally {
      setSendingNotif(false);
    }
  };

  // Save App Settings
  const handleSaveAppSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/app', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appSettings),
      });
      if (!res.ok) throw new Error();
      success('Application settings updated');
    } catch {
      error('Failed to update app settings');
    } finally {
      setSaving(false);
    }
  };

  // Save App URLs
  const handleSaveAppUrls = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/urls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appUrls),
      });
      if (!res.ok) throw new Error();
      success('Legal URLs & Social Media links updated');
    } catch {
      error('Failed to update URL settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Settings className="w-7 h-7 text-indigo-600" />
              System Settings & Integrations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Configure monetization, push notifications, application identity, and legal endpoints.
            </p>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setActiveTab('ads')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ads'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" /> Advertisements
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'notifications'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" /> Push Notifications
          </button>

          <button
            onClick={() => setActiveTab('app')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'app'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" /> App Settings
          </button>

          <button
            onClick={() => setActiveTab('urls')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'urls'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Link2 className="w-4 h-4" /> App URLs & Socials
          </button>
        </div>

        {/* Tab 1: Advertisements Management */}
        {activeTab === 'ads' && (
          <form onSubmit={handleSaveAds} className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Active Ad Network Provider
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rule: Only ONE ad provider network can be active at a time to prevent SDK conflicts.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              </div>

              {/* Provider Radio Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { id: 'ADMOB', label: 'Google AdMob', desc: 'Global banner & interstitials' },
                  { id: 'META', label: 'Meta Audience Network', desc: 'Facebook & Instagram ads' },
                  { id: 'UNITY', label: 'Unity Ads', desc: 'Rewarded game video ads' },
                  { id: 'NONE', label: 'Disable All Ads', desc: 'No advertisements shown' },
                ].map((prov) => (
                  <label
                    key={prov.id}
                    onClick={() => setAds({ ...ads, activeProvider: prov.id })}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                      ads.activeProvider === prov.id
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs">{prov.label}</span>
                      <input
                        type="radio"
                        name="activeProvider"
                        checked={ads.activeProvider === prov.id}
                        onChange={() => setAds({ ...ads, activeProvider: prov.id })}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{prov.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ad Frequency & Display Intervals */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Ad Frequency & Placement Intervals
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Control how frequently full-screen interstitial popups trigger and how often native ad cards appear in feeds.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                {/* Interstitial Ad Interval Counter */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        <Timer className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Interstitial Ad Interval Counter
                        </label>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Every X user clicks / actions</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      {ads.interstitialInterval} {ads.interstitialInterval === 1 ? 'action' : 'actions'}
                    </span>
                  </div>
                  <div className="pt-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={ads.interstitialInterval}
                      onChange={(e) =>
                        setAds({
                          ...ads,
                          interstitialInterval: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                      Frequency of full-screen interstitial ads. For example, setting to <strong>3</strong> displays an interstitial ad after every 3 prompt copies, detail views, or user clicks.
                    </p>
                  </div>
                </div>

                {/* Native Ad Interval Counter */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Native Ad Interval Counter
                        </label>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Every X items in prompt feeds</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                      Every {ads.nativeInterval} {ads.nativeInterval === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className="pt-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={ads.nativeInterval}
                      onChange={(e) =>
                        setAds({
                          ...ads,
                          nativeInterval: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                      Placement spacing of inline native ad cards. For example, setting to <strong>5</strong> inserts a native ad card after every 5 prompt cards in the list feed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Detailed Placement IDs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* AdMob Panel */}
              <div
                className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm space-y-3 ${
                  ads.activeProvider === 'ADMOB'
                    ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Google AdMob IDs
                  </h4>
                  {ads.activeProvider === 'ADMOB' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">App ID</label>
                  <input
                    type="text"
                    value={ads.admobAppId}
                    onChange={(e) => setAds({ ...ads, admobAppId: e.target.value })}
                    placeholder="ca-app-pub-3940256099942544~3347511713"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Banner ID</label>
                  <input
                    type="text"
                    value={ads.admobBannerId}
                    onChange={(e) => setAds({ ...ads, admobBannerId: e.target.value })}
                    placeholder="ca-app-pub-..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Interstitial ID</label>
                  <input
                    type="text"
                    value={ads.admobInterstitialId}
                    onChange={(e) => setAds({ ...ads, admobInterstitialId: e.target.value })}
                    placeholder="ca-app-pub-..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Rewarded ID</label>
                  <input
                    type="text"
                    value={ads.admobRewardedId}
                    onChange={(e) => setAds({ ...ads, admobRewardedId: e.target.value })}
                    placeholder="ca-app-pub-..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Native ID</label>
                  <input
                    type="text"
                    value={ads.admobNativeId}
                    onChange={(e) => setAds({ ...ads, admobNativeId: e.target.value })}
                    placeholder="ca-app-pub-..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">App Open ID</label>
                  <input
                    type="text"
                    value={ads.admobAppOpenId}
                    onChange={(e) => setAds({ ...ads, admobAppOpenId: e.target.value })}
                    placeholder="ca-app-pub-..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Meta Audience Network Panel */}
              <div
                className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm space-y-3 ${
                  ads.activeProvider === 'META'
                    ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Meta Audience Network
                  </h4>
                  {ads.activeProvider === 'META' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Banner ID</label>
                  <input
                    type="text"
                    value={ads.metaBannerId}
                    onChange={(e) => setAds({ ...ads, metaBannerId: e.target.value })}
                    placeholder="IMG_16_9_APP_INSTALL#YOUR_PLACEMENT_ID"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Interstitial ID</label>
                  <input
                    type="text"
                    value={ads.metaInterstitialId}
                    onChange={(e) => setAds({ ...ads, metaInterstitialId: e.target.value })}
                    placeholder="YOUR_PLACEMENT_ID"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Rewarded ID</label>
                  <input
                    type="text"
                    value={ads.metaRewardedId}
                    onChange={(e) => setAds({ ...ads, metaRewardedId: e.target.value })}
                    placeholder="YOUR_PLACEMENT_ID"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Native ID</label>
                  <input
                    type="text"
                    value={ads.metaNativeId}
                    onChange={(e) => setAds({ ...ads, metaNativeId: e.target.value })}
                    placeholder="YOUR_PLACEMENT_ID"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Unity Ads Panel */}
              <div
                className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm space-y-3 ${
                  ads.activeProvider === 'UNITY'
                    ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Unity Ads
                  </h4>
                  {ads.activeProvider === 'UNITY' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Game ID</label>
                  <input
                    type="text"
                    value={ads.unityGameId}
                    onChange={(e) => setAds({ ...ads, unityGameId: e.target.value })}
                    placeholder="1234567"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Banner Placement</label>
                  <input
                    type="text"
                    value={ads.unityBannerPlacement}
                    onChange={(e) => setAds({ ...ads, unityBannerPlacement: e.target.value })}
                    placeholder="Banner_Android"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Interstitial Placement</label>
                  <input
                    type="text"
                    value={ads.unityInterstitialPlacement}
                    onChange={(e) => setAds({ ...ads, unityInterstitialPlacement: e.target.value })}
                    placeholder="Interstitial_Android"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Rewarded Placement</label>
                  <input
                    type="text"
                    value={ads.unityRewardedPlacement}
                    onChange={(e) => setAds({ ...ads, unityRewardedPlacement: e.target.value })}
                    placeholder="Rewarded_Android"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Push Notifications (OneSignal Integration) */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* OneSignal Configuration Form */}
            <form onSubmit={handleSaveNotificationConfig} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    OneSignal SDK Settings
                  </h3>
                  <p className="text-xs text-slate-500">
                    Connect your OneSignal app keys to broadcast push notifications.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save API Keys
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    OneSignal App ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={notificationConfig.oneSignalAppId}
                    onChange={(e) =>
                      setNotificationConfig({ ...notificationConfig, oneSignalAppId: e.target.value })
                    }
                    placeholder="b2f7f966-d8cc-..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    OneSignal REST API Key *
                  </label>
                  <input
                    type="password"
                    required
                    value={notificationConfig.oneSignalRestKey}
                    onChange={(e) =>
                      setNotificationConfig({ ...notificationConfig, oneSignalRestKey: e.target.value })
                    }
                    placeholder="••••••••••••••••••••"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Enable Notifications
                    </span>
                    <p className="text-[10px] text-slate-400">Allow broadcast queue</p>
                  </div>
                  <Switch
                    checked={notificationConfig.isEnabled}
                    onChange={(val) =>
                      setNotificationConfig({ ...notificationConfig, isEnabled: val })
                    }
                  />
                </div>
              </div>
            </form>

            {/* Broadcast Sender & History Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Broadcast Notification Composer */}
              <form onSubmit={handleSendNotification} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Broadcast Notification Composer
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dispatch an instant or scheduled alert to all active mobile devices.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notification Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="e.g. 50+ New Midjourney Prompts Live!"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Message Body *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Explore our curated collection of photorealistic lighting..."
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Banner Image URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={notifImage}
                      onChange={(e) => setNotifImage(e.target.value)}
                      placeholder="https://... or /uploads/..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Deep Link (Optional)
                    </label>
                    <input
                      type="text"
                      value={notifDeepLink}
                      onChange={(e) => setNotifDeepLink(e.target.value)}
                      placeholder="prompter://category/midjourney"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Schedule Delivery (Leave empty to send immediately)
                  </label>
                  <input
                    type="datetime-local"
                    value={notifSchedule}
                    onChange={(e) => setNotifSchedule(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingNotif}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {sendingNotif ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {notifSchedule ? 'Schedule Notification' : 'Send to All Users Now'}
                </button>
              </form>

              {/* Notification History */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Recent Broadcasts Log
                  </h3>
                  <p className="text-xs text-slate-500">Audit record of sent & scheduled alerts</p>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3">
                  {notificationsHistory.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No notifications sent yet.
                    </div>
                  ) : (
                    notificationsHistory.map((n) => (
                      <div
                        key={n.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {n.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              n.status === 'SENT'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {n.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {n.message}
                        </p>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                          <span>By {n.createdBy?.name || 'Super Admin'}</span>
                          <span>{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: App Settings */}
        {activeTab === 'app' && (
          <form onSubmit={handleSaveAppSettings} className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Application Branding & Identity
                  </h3>
                  <p className="text-xs text-slate-500">
                    Metadata served to mobile apps, web manifests, and client SDKs.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Settings
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Application Name
                  </label>
                  <input
                    type="text"
                    value={appSettings.appName}
                    onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Developer Organization
                  </label>
                  <input
                    type="text"
                    value={appSettings.developerName}
                    onChange={(e) => setAppSettings({ ...appSettings, developerName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Package Name (Android / iOS)
                  </label>
                  <input
                    type="text"
                    value={appSettings.packageName}
                    onChange={(e) => setAppSettings({ ...appSettings, packageName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Version Name
                  </label>
                  <input
                    type="text"
                    value={appSettings.versionName}
                    onChange={(e) => setAppSettings({ ...appSettings, versionName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Version Code
                  </label>
                  <input
                    type="text"
                    value={appSettings.versionCode}
                    onChange={(e) => setAppSettings({ ...appSettings, versionCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={appSettings.supportEmail}
                    onChange={(e) => setAppSettings({ ...appSettings, supportEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={appSettings.contactNumber}
                    onChange={(e) => setAppSettings({ ...appSettings, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={appSettings.timezone}
                    onChange={(e) => setAppSettings({ ...appSettings, timezone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Currency Display
                  </label>
                  <input
                    type="text"
                    value={appSettings.currency}
                    onChange={(e) => setAppSettings({ ...appSettings, currency: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Maintenance Mode & Logos */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <div>
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Maintenance Mode
                    </span>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                      When active, client apps display a friendly maintenance splash screen.
                    </p>
                  </div>
                  <Switch
                    checked={appSettings.maintenanceMode}
                    onChange={(val) => setAppSettings({ ...appSettings, maintenanceMode: val })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      App Logo URL
                    </label>
                    <input
                      type="url"
                      value={appSettings.appLogo}
                      onChange={(e) => setAppSettings({ ...appSettings, appLogo: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Splash Screen Artwork URL
                    </label>
                    <input
                      type="url"
                      value={appSettings.splashLogo}
                      onChange={(e) => setAppSettings({ ...appSettings, splashLogo: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Tab 4: App URLs & Socials */}
        {activeTab === 'urls' && (
          <form onSubmit={handleSaveAppUrls} className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Legal Policies & Social Endpoints
                  </h3>
                  <p className="text-xs text-slate-500">
                    Terms, privacy, and community links consumed by mobile and web clients.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save URLs
                </button>
              </div>

              {/* Policy URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Privacy Policy URL
                  </label>
                  <input
                    type="url"
                    value={appUrls.privacyPolicy}
                    onChange={(e) => setAppUrls({ ...appUrls, privacyPolicy: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Terms of Service URL
                  </label>
                  <input
                    type="url"
                    value={appUrls.termsOfService}
                    onChange={(e) => setAppUrls({ ...appUrls, termsOfService: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Refund Policy URL
                  </label>
                  <input
                    type="url"
                    value={appUrls.refundPolicy}
                    onChange={(e) => setAppUrls({ ...appUrls, refundPolicy: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data Deletion Policy URL
                  </label>
                  <input
                    type="url"
                    value={appUrls.dataDeletionPolicy}
                    onChange={(e) => setAppUrls({ ...appUrls, dataDeletionPolicy: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Play Store URL
                  </label>
                  <input
                    type="url"
                    value={appUrls.playStore}
                    onChange={(e) => setAppUrls({ ...appUrls, playStore: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Us URL
                  </label>
                  <input
                    type="url"
                    value={appUrls.contactUs}
                    onChange={(e) => setAppUrls({ ...appUrls, contactUs: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Social Channels
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Twitter / X</label>
                    <input
                      type="url"
                      value={appUrls.twitter}
                      onChange={(e) => setAppUrls({ ...appUrls, twitter: e.target.value })}
                      placeholder="https://x.com/..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Telegram Community</label>
                    <input
                      type="url"
                      value={appUrls.telegram}
                      onChange={(e) => setAppUrls({ ...appUrls, telegram: e.target.value })}
                      placeholder="https://t.me/..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">YouTube Channel</label>
                    <input
                      type="url"
                      value={appUrls.youtube}
                      onChange={(e) => setAppUrls({ ...appUrls, youtube: e.target.value })}
                      placeholder="https://youtube.com/@..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Instagram</label>
                    <input
                      type="url"
                      value={appUrls.instagram}
                      onChange={(e) => setAppUrls({ ...appUrls, instagram: e.target.value })}
                      placeholder="https://instagram.com/..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Facebook Page</label>
                    <input
                      type="url"
                      value={appUrls.facebook}
                      onChange={(e) => setAppUrls({ ...appUrls, facebook: e.target.value })}
                      placeholder="https://facebook.com/..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
