import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from '../lib/pushNotifications';

type PushPermission = 'default' | 'granted' | 'denied';

export function usePushNotifications() {
  const { session } = useAuth();
  const [permission, setPermission] = useState<PushPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  useEffect(() => {
    if (!isSupported) return;
    isPushSubscribed().then(setIsSubscribed).catch(() => setIsSubscribed(false));
  }, [isSupported]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!session?.access_token || !isSupported) return false;

    setIsLoading(true);
    try {
      const granted = permission === 'granted' || await requestPermission();
      if (!granted) return false;

      await subscribeToPush(session.access_token);
      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, isSupported, permission, requestPermission]);

  const unsubscribe = useCallback(async () => {
    if (!session?.access_token) return;

    setIsLoading(true);
    try {
      await unsubscribeFromPush(session.access_token);
      setIsSubscribed(false);
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}
