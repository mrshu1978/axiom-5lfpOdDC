import { useEffect, useState } from 'react';
import { requestPermission, subscribeToPush, unsubscribeFromPush } from '../services/pushService';
import { useAuthStore } from '../store/authStore';

interface PushNotificationState {
  isSubscribed: boolean;
  permission: NotificationPermission;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isSubscribed: false,
    permission: 'default',
  });

  const { accessToken, isAuthenticated } = useAuthStore();

  // Check subscription status on mount and when auth changes
  useEffect(() => {
    if (!isAuthenticated || !accessToken || !('serviceWorker' in navigator)) {
      return;
    }

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        setState({
          isSubscribed: !!subscription,
          permission: Notification.permission,
        });
      } catch (error) {
        console.error('Error checking push subscription:', error);
      }
    };

    checkSubscription();
  }, [isAuthenticated, accessToken]);

  // Auto-subscribe if permission already granted but no subscription
  useEffect(() => {
    if (
      state.permission === 'granted' &&
      !state.isSubscribed &&
      isAuthenticated &&
      accessToken
    ) {
      subscribe(accessToken);
    }
  }, [state.permission, state.isSubscribed, isAuthenticated, accessToken]);

  const requestAndSubscribe = async () => {
    const permission = await requestPermission();
    setState((prev) => ({ ...prev, permission }));

    if (permission === 'granted' && accessToken) {
      await subscribe(accessToken);
    }
  };

  const subscribe = async (token: string) => {
    const subscription = await subscribeToPush(token);
    if (subscription) {
      setState((prev) => ({ ...prev, isSubscribed: true }));
    }
  };

  const unsubscribe = async () => {
    if (!accessToken) return false;
    const success = await unsubscribeFromPush(accessToken);
    if (success) {
      setState((prev) => ({ ...prev, isSubscribed: false }));
    }
    return success;
  };

  return {
    ...state,
    subscribe: () => accessToken ? subscribe(accessToken) : Promise.resolve(null),
    unsubscribe,
    requestAndSubscribe,
  };
};