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
  Clock,
  Layers,
  Flame,
  Trash2,
  Key,
  RefreshCw,
  FileJson,
  Eye,
  EyeOff,
  Check,
  ExternalLink,
  ShieldCheck,
  X,
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

  // 2. Notifications State (Firebase Cloud Messaging + OneSignal)
  const [notificationConfig, setNotificationConfig] = useState({
    provider: 'FCM',
    fcmProjectId: '',
    fcmClientEmail: '',
    fcmPrivateKey: '',
    fcmServerKey: '',
    fcmTopic: 'all_users',
    oneSignalAppId: '',
    oneSignalRestKey: '',
    isEnabled: false,
  });
  const [notificationMetrics, setNotificationMetrics] = useState({
    totalDevices: 0,
    androidDevices: 0,
    iosDevices: 0,
    otherDevices: 0,
    totalSent: 0,
  });
  const [notificationsHistory, setNotificationsHistory] = useState<any[]>([]);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifImage, setNotifImage] = useState('');
  const [notifDeepLink, setNotifDeepLink] = useState('');
  const [notifSchedule, setNotifSchedule] = useState('');
  const [notifTargetTopic, setNotifTargetTopic] = useState('all_users');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [testingFcm, setTestingFcm] = useState(false);
  const [processingScheduled, setProcessingScheduled] = useState(false);
  const [sendingNowId, setSendingNowId] = useState<string | null>(null);
  const [fcmTestStatus, setFcmTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [jsonPasteModalOpen, setJsonPasteModalOpen] = useState(false);
  const [pastedJson, setPastedJson] = useState('');

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
        if (dataNotif.config) setNotificationConfig((prev) => ({ ...prev, ...dataNotif.config }));
        if (dataNotif.history) setNotificationsHistory(dataNotif.history);
        if (dataNotif.metrics) setNotificationMetrics(dataNotif.metrics);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      const isFcm = notificationConfig.provider === 'FCM';
      success(`${isFcm ? 'Firebase Cloud Messaging (FCM)' : 'OneSignal'} settings saved successfully`);
    } catch (err: any) {
      error(err.message || 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  // Test FCM Connection
  const handleTestFcm = async () => {
    setTestingFcm(true);
    setFcmTestStatus(null);
    try {
      const res = await fetch('/api/settings/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationConfig),
      });
      const data = await res.json();
      setFcmTestStatus({ success: data.success, message: data.message });
      if (data.success) {
        success(data.message);
      } else {
        error(data.message);
      }
    } catch {
      error('Failed to test FCM connection');
      setFcmTestStatus({ success: false, message: 'Connection test failed' });
    } finally {
      setTestingFcm(false);
    }
  };

  // Apply Pasted Service Account JSON
  const handleApplyServiceAccountJson = () => {
    try {
      const parsed = JSON.parse(pastedJson.trim());
      if (!parsed.project_id && !parsed.client_email && !parsed.private_key) {
        error('Invalid Service Account JSON: missing project_id, client_email, or private_key');
        return;
      }
      setNotificationConfig((prev) => ({
        ...prev,
        fcmProjectId: parsed.project_id || prev.fcmProjectId,
        fcmClientEmail: parsed.client_email || prev.fcmClientEmail,
        fcmPrivateKey: parsed.private_key || prev.fcmPrivateKey,
      }));
      setJsonPasteModalOpen(false);
      setPastedJson('');
      success('Service Account JSON parsed and applied successfully!');
    } catch {
      error('Invalid JSON format. Please paste the complete service-account.json content.');
    }
  };

  // Delete notification record
  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification record?')) return;
    try {
      const res = await fetch(`/api/settings/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setNotificationsHistory((prev) => prev.filter((n) => n.id !== id));
      success('Notification record removed');
    } catch {
      error('Failed to delete notification record');
    }
  };

  // Trigger immediate dispatch of a scheduled notification
  const handleSendNow = async (id: string) => {
    if (!confirm('Are you sure you want to dispatch this scheduled notification immediately now?')) return;
    setSendingNowId(id);
    try {
      const res = await fetch(`/api/settings/notifications/${id}/send-now`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success(data.message || 'Notification dispatched immediately');

      // Refresh notification history & metrics
      const resNotif = await fetch('/api/settings/notifications');
      const dataNotif = await resNotif.json();
      if (dataNotif.history) setNotificationsHistory(dataNotif.history);
      if (dataNotif.metrics) setNotificationMetrics(dataNotif.metrics);
    } catch (err: any) {
      error(err.message || 'Failed to dispatch notification immediately');
    } finally {
      setSendingNowId(null);
    }
  };

  // Manually check and dispatch due scheduled notifications
  const handleProcessScheduled = async () => {
    setProcessingScheduled(true);
    try {
      const res = await fetch('/api/settings/notifications/process-scheduled', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      success(data.message || 'Scheduled notifications check complete');

      // Refresh notification history & metrics
      const resNotif = await fetch('/api/settings/notifications');
      const dataNotif = await resNotif.json();
      if (dataNotif.history) setNotificationsHistory(dataNotif.history);
      if (dataNotif.metrics) setNotificationMetrics(dataNotif.metrics);
    } catch (err: any) {
      error(err.message || 'Failed to process scheduled notifications');
    } finally {
      setProcessingScheduled(false);
    }
  };

  // Dispatch Broadcast Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      error('Notification title and message are required');
      return;
    }

    let scheduledIso: string | null = null;
    if (notifSchedule) {
      const dateObj = new Date(notifSchedule);
      if (isNaN(dateObj.getTime())) {
        error('Invalid scheduled delivery date');
        return;
      }
      if (dateObj.getTime() <= Date.now()) {
        error('Scheduled delivery time must be set in the future');
        return;
      }
      scheduledIso = dateObj.toISOString();
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
          targetTopic: notifTargetTopic || 'all_users',
          sendToAll: true,
          scheduledAt: scheduledIso,
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

      // Refresh history & metrics
      const resNotif = await fetch('/api/settings/notifications');
      const dataNotif = await resNotif.json();
      if (dataNotif.history) setNotificationsHistory(dataNotif.history);
      if (dataNotif.metrics) setNotificationMetrics(dataNotif.metrics);
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

        {/* Tab 2: Push Notifications (Firebase Cloud Messaging + OneSignal) */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Device Fleet Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Active Devices</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {notificationMetrics.totalDevices.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Android Fleet</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {notificationMetrics.androidDevices.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">iOS / Flutter Fleet</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {notificationMetrics.iosDevices.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Broadcasts Dispatched</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {notificationMetrics.totalSent.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Selector & Gateway Configuration */}
            <form onSubmit={handleSaveNotificationConfig} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Push Notification Gateway (FCM / OneSignal)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure Google Firebase Cloud Messaging HTTP v1 or OneSignal for mobile broadcasts.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {notificationConfig.provider === 'FCM' && (
                    <button
                      type="button"
                      onClick={() => setJsonPasteModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                    >
                      <FileJson className="w-3.5 h-3.5 text-indigo-500" />
                      Paste Service Account JSON
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Gateway Settings
                  </button>
                </div>
              </div>

              {/* Provider Selection Tabs */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setNotificationConfig({ ...notificationConfig, provider: 'FCM' })}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    notificationConfig.provider === 'FCM'
                      ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  Firebase Cloud Messaging (FCM v1)
                </button>

                <button
                  type="button"
                  onClick={() => setNotificationConfig({ ...notificationConfig, provider: 'ONESIGNAL' })}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    notificationConfig.provider === 'ONESIGNAL'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  OneSignal Push
                </button>
              </div>

              {/* Firebase Cloud Messaging Fields */}
              {notificationConfig.provider === 'FCM' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Firebase Project ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={notificationConfig.fcmProjectId}
                        onChange={(e) =>
                          setNotificationConfig({ ...notificationConfig, fcmProjectId: e.target.value })
                        }
                        placeholder="e.g. prompter-ai-studio"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Firebase Client Email (Service Account) *
                      </label>
                      <input
                        type="email"
                        required
                        value={notificationConfig.fcmClientEmail}
                        onChange={(e) =>
                          setNotificationConfig({ ...notificationConfig, fcmClientEmail: e.target.value })
                        }
                        placeholder="firebase-adminsdk-xxx@prompter-ai.iam.gserviceaccount.com"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Firebase Private Key (RSA Private Key from Service Account) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showPrivateKey ? 'Hide Private Key' : 'Reveal Key'}
                      </button>
                    </div>
                    <textarea
                      rows={showPrivateKey ? 6 : 2}
                      required
                      value={notificationConfig.fcmPrivateKey}
                      onChange={(e) =>
                        setNotificationConfig({ ...notificationConfig, fcmPrivateKey: e.target.value })
                      }
                      placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
                      className={`w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono ${
                        !showPrivateKey ? 'filter blur-[3px] select-none' : ''
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Default Broadcast Topic
                      </label>
                      <input
                        type="text"
                        value={notificationConfig.fcmTopic}
                        onChange={(e) =>
                          setNotificationConfig({ ...notificationConfig, fcmTopic: e.target.value })
                        }
                        placeholder="all_users"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Client apps subscribe to this topic (e.g. `all_users`)</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Legacy Server Key (Optional Fallback)
                      </label>
                      <input
                        type="password"
                        value={notificationConfig.fcmServerKey}
                        onChange={(e) =>
                          setNotificationConfig({ ...notificationConfig, fcmServerKey: e.target.value })
                        }
                        placeholder="AAAA...:APA91b..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Optional legacy FCM key if HTTP v1 is not used</p>
                    </div>
                  </div>

                  {/* Test FCM Connection Button & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleTestFcm}
                      disabled={testingFcm || !notificationConfig.fcmProjectId}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {testingFcm ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />}
                      Test FCM Connection (Dry Run)
                    </button>

                    {fcmTestStatus && (
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${
                          fcmTestStatus.success
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {fcmTestStatus.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        {fcmTestStatus.message}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* OneSignal Fields */}
              {notificationConfig.provider === 'ONESIGNAL' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>
              )}

              {/* Enable / Disable Gateway Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Enable Push Notifications Broadcasts
                  </span>
                  <p className="text-[10px] text-slate-400">
                    When enabled, outgoing messages will be pushed to all registered devices and topic subscribers
                  </p>
                </div>
                <Switch
                  checked={notificationConfig.isEnabled}
                  onChange={(val) =>
                    setNotificationConfig({ ...notificationConfig, isEnabled: val })
                  }
                />
              </div>
            </form>

            {/* Broadcast Sender & History Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Broadcast Notification Composer */}
              <form onSubmit={handleSendNotification} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-500" />
                    Broadcast Notification Composer
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dispatch an instant or scheduled alert to all active mobile devices via FCM.
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
                    placeholder="e.g. 🔥 50+ New Midjourney Prompts Live!"
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
                    placeholder="Explore our curated collection of photorealistic lighting and UI design prompts..."
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
                    {notifImage && (
                      <div className="mt-2 relative w-full h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                        <img
                          src={notifImage}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                          onError={(e) => ((e.target as any).style.display = 'none')}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Deep Link (Optional)
                    </label>
                    <input
                      type="text"
                      value={notifDeepLink}
                      onChange={(e) => setNotifDeepLink(e.target.value)}
                      placeholder="prompter://trending"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                    {/* Quick insert chips */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['prompter://trending', 'prompter://category/midjourney', 'prompter://vip'].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setNotifDeepLink(chip)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                        >
                          {chip.replace('prompter://', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Target Audience (FCM Topic)
                    </label>
                    <input
                      type="text"
                      value={notifTargetTopic}
                      onChange={(e) => setNotifTargetTopic(e.target.value)}
                      placeholder="all_users"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-slate-500">
                        Schedule Delivery (Leave empty for instant)
                      </label>
                      {notifSchedule && (
                        <button
                          type="button"
                          onClick={() => setNotifSchedule('')}
                          className="text-[10px] text-rose-500 hover:text-rose-600 font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="datetime-local"
                      value={notifSchedule}
                      onChange={(e) => setNotifSchedule(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {notifSchedule ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          Will send automatically on {new Date(notifSchedule).toLocaleString()}
                        </span>
                      ) : (
                        `Local timezone: ${typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Local'}`
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sendingNotif}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all active:scale-[0.99]"
                >
                  {sendingNotif ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {notifSchedule ? 'Schedule Notification' : 'Send Broadcast to All Devices Now'}
                </button>
              </form>

              {/* Notification History */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Recent Broadcasts Log
                    </h3>
                    <p className="text-xs text-slate-500">Audit trail of dispatched & scheduled alerts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleProcessScheduled}
                      disabled={processingScheduled}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold transition-colors disabled:opacity-50"
                      title="Trigger delivery check for any scheduled alerts that are now due"
                    >
                      <RefreshCw className={`w-3 h-3 ${processingScheduled ? 'animate-spin' : ''}`} />
                      Check Due
                    </button>
                    <span className="text-xs font-semibold text-slate-400">
                      {notificationsHistory.length} recorded
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[380px] space-y-3 pr-1">
                  {notificationsHistory.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No notifications sent yet. Use the composer to broadcast your first alert!
                    </div>
                  ) : (
                    notificationsHistory.map((n) => (
                      <div
                        key={n.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {n.title}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {n.status === 'SCHEDULED' && (
                              <button
                                type="button"
                                onClick={() => handleSendNow(n.id)}
                                disabled={sendingNowId === n.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 shadow-sm"
                                title="Send this scheduled notification immediately"
                              >
                                {sendingNowId === n.id ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Send className="w-2.5 h-2.5" />
                                )}
                                Send Now
                              </button>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                n.status === 'SENT'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : n.status === 'SCHEDULED'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {n.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteNotification(n.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                              title="Delete broadcast record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {n.message}
                        </p>

                        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span>Topic: <code className="text-indigo-600 dark:text-indigo-400">{n.targetTopic || 'all_users'}</code></span>
                            {n.deepLink && (
                              <span className="text-slate-400 truncate max-w-[140px]" title={n.deepLink}>
                                🔗 {n.deepLink}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {n.status === 'SCHEDULED' && n.scheduledAt ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                ⏰ Due: {new Date(n.scheduledAt).toLocaleString()}
                              </span>
                            ) : (
                              <span>{new Date(n.sentAt || n.createdAt).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Paste Service Account JSON Modal */}
            {jsonPasteModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <FileJson className="w-5 h-5 text-indigo-500" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Paste Firebase Service Account JSON
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setJsonPasteModalOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500">
                    Open your downloaded <code className="text-indigo-600 dark:text-indigo-400 font-mono">service-account.json</code> file from Firebase Console (Project Settings → Service Accounts → Generate new private key), copy its full contents, and paste them below.
                  </p>

                  <textarea
                    rows={8}
                    value={pastedJson}
                    onChange={(e) => setPastedJson(e.target.value)}
                    placeholder='{\n  "type": "service_account",\n  "project_id": "your-project-id",\n  "private_key_id": "...",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n...",\n  "client_email": "firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com"\n}'
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setJsonPasteModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyServiceAccountJson}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
                    >
                      <Check className="w-4 h-4" />
                      Parse & Apply Credentials
                    </button>
                  </div>
                </div>
              </div>
            )}
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
