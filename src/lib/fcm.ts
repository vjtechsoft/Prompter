import crypto from 'crypto';

interface FcmConfig {
  fcmProjectId: string;
  fcmClientEmail: string;
  fcmPrivateKey: string;
  fcmServerKey?: string;
  fcmTopic?: string;
}

interface FcmNotificationPayload {
  title: string;
  message: string;
  image?: string | null;
  deepLink?: string | null;
  topic?: string;
  tokens?: string[];
  config: FcmConfig;
}

// In-memory token cache for Google OAuth2
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Generate Google OAuth2 Bearer Token using Service Account credentials.
 * Works natively in Node.js with zero external SDKs.
 */
export async function getGoogleAccessToken(clientEmail: string, rawPrivateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if valid for at least another 60 seconds
  if (cachedAccessToken && tokenExpiresAt > now + 60) {
    return cachedAccessToken;
  }

  if (!clientEmail || !rawPrivateKey) {
    throw new Error('Missing client_email or private_key in Firebase Service Account credentials');
  }

  // Ensure newlines are properly formatted
  let privateKey = rawPrivateKey.trim();
  if (!privateKey.includes('\n') && privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // Create JWT Header & Claim Set
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedClaimSet = Buffer.from(JSON.stringify(claimSet)).toString('base64url');
  const unsignedToken = `${encodedHeader}.${encodedClaimSet}`;

  // Sign JWT using RS256
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(privateKey, 'base64url');

  const signedJwt = `${unsignedToken}.${signature}`;

  // Exchange JWT for OAuth2 Access Token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    throw new Error(`Google OAuth2 Token exchange failed (${tokenResponse.status}): ${errorBody}`);
  }

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error('Google OAuth2 response did not return an access_token');
  }

  cachedAccessToken = tokenData.access_token;
  tokenExpiresAt = now + (tokenData.expires_in || 3600);

  return cachedAccessToken!;
}

/**
 * Dispatch Firebase Cloud Messaging (FCM) Notification.
 * Automatically chooses HTTP v1 (preferred) or Legacy Server Key fallback.
 */
export async function sendFcmNotification(payload: FcmNotificationPayload): Promise<{
  success: boolean;
  successCount: number;
  failureCount: number;
  messageId?: string;
  error?: string;
}> {
  const { title, message, image, deepLink, topic, tokens, config } = payload;
  const targetTopic = (topic || config.fcmTopic || 'all_users').trim().replace(/^\/topics\//, '');

  // 1. Preferred Method: FCM HTTP v1 API using Google Service Account
  if (config.fcmProjectId && config.fcmClientEmail && config.fcmPrivateKey) {
    try {
      const accessToken = await getGoogleAccessToken(config.fcmClientEmail, config.fcmPrivateKey);
      const endpoint = `https://fcm.googleapis.com/v1/projects/${config.fcmProjectId}/messages:send`;

      // Helper to build HTTP v1 message object
      const buildV1Message = (target: { topic?: string; token?: string }) => ({
        ...target,
        notification: {
          title: title.trim(),
          body: message.trim(),
          ...(image ? { image: image.trim() } : {}),
        },
        data: {
          title: title.trim(),
          message: message.trim(),
          body: message.trim(),
          image: image ? image.trim() : '',
          deepLink: deepLink ? deepLink.trim() : '',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            channel_id: 'prompter_general_notifications',
            ...(image ? { image: image.trim() } : {}),
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'mutable-content': 1,
            },
          },
          fcm_options: image ? { image: image.trim() } : undefined,
        },
      });

      // If specific device tokens provided, dispatch to tokens
      if (tokens && tokens.length > 0) {
        let successCount = 0;
        let failureCount = 0;

        // Dispatch in batches of 50 concurrent requests
        const batchSize = 50;
        for (let i = 0; i < tokens.length; i += batchSize) {
          const slice = tokens.slice(i, i + batchSize);
          const results = await Promise.allSettled(
            slice.map((token) =>
              fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ message: buildV1Message({ token }) }),
              })
            )
          );

          for (const res of results) {
            if (res.status === 'fulfilled' && res.value.ok) {
              successCount++;
            } else {
              failureCount++;
            }
          }
        }

        return {
          success: successCount > 0,
          successCount,
          failureCount,
        };
      }

      // Default: Dispatch to topic (reaches all subscribers instantaneously)
      const topicMessage = {
        message: buildV1Message({ topic: targetTopic }),
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(topicMessage),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FCM HTTP v1 error (${response.status}): ${errorText}`);
      }

      const resData = await response.json();
      return {
        success: true,
        successCount: 1,
        failureCount: 0,
        messageId: resData.name,
      };
    } catch (err: any) {
      console.error('FCM HTTP v1 dispatch error:', err);
      return {
        success: false,
        successCount: 0,
        failureCount: 1,
        error: err.message || 'FCM dispatch failed',
      };
    }
  }

  // 2. Fallback Method: Legacy FCM Server Key
  if (config.fcmServerKey) {
    try {
      const endpoint = 'https://fcm.googleapis.com/fcm/send';
      const legacyPayload = {
        to: `/topics/${targetTopic}`,
        notification: {
          title: title.trim(),
          body: message.trim(),
          image: image ? image.trim() : undefined,
          sound: 'default',
        },
        data: {
          title: title.trim(),
          message: message.trim(),
          image: image ? image.trim() : '',
          deepLink: deepLink ? deepLink.trim() : '',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        priority: 'high',
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${config.fcmServerKey}`,
        },
        body: JSON.stringify(legacyPayload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Legacy FCM error (${res.status}): ${errText}`);
      }

      return {
        success: true,
        successCount: 1,
        failureCount: 0,
      };
    } catch (err: any) {
      console.error('Legacy FCM dispatch error:', err);
      return {
        success: false,
        successCount: 0,
        failureCount: 1,
        error: err.message || 'Legacy FCM dispatch failed',
      };
    }
  }

  return {
    success: false,
    successCount: 0,
    failureCount: 1,
    error: 'Firebase Cloud Messaging is not configured. Please configure your Project ID and Service Account in Notification Settings.',
  };
}

/**
 * Test Firebase Cloud Messaging credentials and connection.
 */
export async function testFcmConnection(config: FcmConfig): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  if (config.fcmProjectId && config.fcmClientEmail && config.fcmPrivateKey) {
    try {
      // 1. Verify token generation
      const token = await getGoogleAccessToken(config.fcmClientEmail, config.fcmPrivateKey);
      if (!token) {
        return { success: false, message: 'Failed to obtain Google OAuth2 access token' };
      }

      // 2. Perform a dry-run test validate request against FCM v1 API
      const endpoint = `https://fcm.googleapis.com/v1/projects/${config.fcmProjectId}/messages:send`;
      const testRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          validate_only: true, // Dry run: validates permissions without sending actual notification
          message: {
            topic: (config.fcmTopic || 'all_users').replace(/^\/topics\//, ''),
            notification: {
              title: 'Prompter Connection Test',
              body: 'Test ping from Prompter Admin Panel',
            },
          },
        }),
      });

      if (testRes.ok) {
        return {
          success: true,
          message: 'Firebase Cloud Messaging credentials verified successfully! (HTTP v1 API ready)',
        };
      }

      const errorText = await testRes.text();
      return {
        success: false,
        message: `FCM validation rejected (${testRes.status}): ${errorText}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to authenticate with Firebase Service Account',
      };
    }
  }

  if (config.fcmServerKey) {
    return {
      success: true,
      message: 'Legacy Server Key configured. (Note: Google recommends migrating to HTTP v1 Service Account).',
    };
  }

  return {
    success: false,
    message: 'No FCM credentials provided. Please provide Firebase Project ID, Client Email, and Private Key.',
  };
}
