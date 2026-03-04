import { api } from './api';

/**
 * Converts a base64 URL-safe string to a Uint8Array for the PushManager API.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Gets the VAPID public key from the backend.
 */
export async function getVapidPublicKey(): Promise<string> {
  return api.push.vapidPublicKey();
}

/**
 * Subscribes the browser to push notifications and sends the subscription to the backend.
 */
export async function subscribeToPush(accessToken: string): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;
  const vapidPublicKey = await getVapidPublicKey();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Invalid push subscription');
  }

  await api.push.subscribe(accessToken, {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  });

  return true;
}

/**
 * Unsubscribes the browser from push notifications.
 */
export async function unsubscribeFromPush(accessToken: string): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }

  // Also remove from backend
  const subs = await api.push.list(accessToken);
  for (const sub of subs) {
    await api.push.unsubscribe(accessToken, sub.id);
  }
}

/**
 * Checks if the browser has an active push subscription.
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return subscription !== null;
}
