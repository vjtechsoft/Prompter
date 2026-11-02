import prisma from '@/lib/prisma';
import { sendFcmNotification } from '@/lib/fcm';

export interface DispatchSummary {
  processed: number;
  successful: number;
  failed: number;
  results: Array<{
    id: string;
    title: string;
    status: 'SENT' | 'FAILED';
    error?: string;
  }>;
}

/**
 * Checks database for notifications where status = 'SCHEDULED' and scheduledAt <= NOW(),
 * dispatches them via Firebase Cloud Messaging, and updates their status to SENT or FAILED.
 * Prevents race conditions with atomic status transitions.
 */
export async function processScheduledNotifications(): Promise<DispatchSummary> {
  const now = new Date();

  // Find due scheduled notifications
  const dueNotifications = await prisma.notification.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: {
        lte: now,
      },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 25,
  });

  if (dueNotifications.length === 0) {
    return { processed: 0, successful: 0, failed: 0, results: [] };
  }

  // Fetch active notification configuration
  const config = await prisma.notificationSetting.findUnique({
    where: { id: 'default' },
  });

  const results: DispatchSummary['results'] = [];
  let successful = 0;
  let failed = 0;

  for (const notif of dueNotifications) {
    // Atomically claim the notification to prevent concurrent duplicate sends
    const claim = await prisma.notification.updateMany({
      where: {
        id: notif.id,
        status: 'SCHEDULED',
      },
      data: {
        status: 'DISPATCHING',
      },
    });

    if (claim.count === 0) {
      // Already picked up by a parallel runner
      continue;
    }

    const effectiveTopic = (notif.targetTopic || config?.fcmTopic || 'all_users')
      .trim()
      .replace(/^\/topics\//, '');

    let fcmResult: {
      success: boolean;
      successCount: number;
      failureCount: number;
      error?: string;
    } = {
      success: false,
      successCount: 0,
      failureCount: 1,
      error: 'Push notifications are disabled or not configured in settings',
    };

    if (config && config.isEnabled) {
      if (config.provider === 'FCM' || config.fcmProjectId || config.fcmServerKey) {
        try {
          fcmResult = await sendFcmNotification({
            title: notif.title.trim(),
            message: notif.message.trim(),
            image: notif.image ? notif.image.trim() : null,
            deepLink: notif.deepLink ? notif.deepLink.trim() : null,
            topic: effectiveTopic,
            config: {
              fcmProjectId: config.fcmProjectId,
              fcmClientEmail: config.fcmClientEmail,
              fcmPrivateKey: config.fcmPrivateKey,
              fcmServerKey: config.fcmServerKey,
              fcmTopic: effectiveTopic,
            },
          });
        } catch (err: any) {
          fcmResult = {
            success: false,
            successCount: 0,
            failureCount: 1,
            error: err.message || 'FCM dispatch failed',
          };
        }
      }
    }

    const finalStatus = fcmResult.success ? 'SENT' : 'FAILED';
    if (fcmResult.success) {
      successful++;
    } else {
      failed++;
    }

    await prisma.notification.update({
      where: { id: notif.id },
      data: {
        status: finalStatus,
        sentAt: new Date(),
        successCount: fcmResult.successCount,
        failureCount: fcmResult.failureCount,
        errorMessage: fcmResult.error || null,
      },
    });

    results.push({
      id: notif.id,
      title: notif.title,
      status: finalStatus,
      error: fcmResult.error,
    });
  }

  return {
    processed: dueNotifications.length,
    successful,
    failed,
    results,
  };
}

// In-memory periodic scheduler for long-running Node.js environments (dev & persistent containers)
declare global {
  var __notificationSchedulerRunning: boolean | undefined;
}

export function initBackgroundScheduler() {
  if (typeof window !== 'undefined') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  if (globalThis.__notificationSchedulerRunning) return;
  globalThis.__notificationSchedulerRunning = true;

  // Run initial check 3 seconds after boot, then every 30 seconds
  const timeoutId = setTimeout(() => {
    processScheduledNotifications().catch((err) => {
      console.error('[NotificationScheduler] Initial check error:', err);
    });
  }, 3000);
  if (typeof timeoutId?.unref === 'function') timeoutId.unref();

  const intervalId = setInterval(() => {
    processScheduledNotifications().catch((err) => {
      console.error('[NotificationScheduler] Periodic check error:', err);
    });
  }, 30000);
  if (typeof intervalId?.unref === 'function') intervalId.unref();
}

// Auto-initialize when loaded on server
initBackgroundScheduler();
