import { apiClient } from './apiClient';

/**
 * Converts a base64 string to a Uint8Array.
 * Required for VAPID public key conversion.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Requests permission to show notifications.
 * @returns Promise resolving to 'granted' | 'denied' | 'default'
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.requestPermission();
}

/**
 * Subscribes to push notifications.
 * Requires a service worker registration and an access token.
 */
export async function subscribeToPush(accessToken: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    // Fetch VAPID public key from backend
    const { data: { publicKey } } = await apiClient.get<{ publicKey: string }>('/push/vapid-public-key');

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Send subscription to backend
    await apiClient.post('/push/subscribe', { subscription }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribes from push notifications and removes subscription from backend.
 */
export async function unsubscribeFromPush(accessToken: string): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const unsubscribed = await subscription.unsubscribe();
      if (unsubscribed) {
        // Delete subscription from backend
        await apiClient.delete('/push/subscribe', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}