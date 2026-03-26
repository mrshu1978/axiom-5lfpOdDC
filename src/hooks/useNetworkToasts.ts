import { useEffect } from 'react';
import { useToastStore } from '../store/toastStore';

let offlineToastId: string | null = null;

export const useNetworkToasts = () => {
  const { addToast, removeToast } = useToastStore();

  useEffect(() => {
    const handleOffline = () => {
      if (offlineToastId) return;
      const toast = {
        message: 'Sei offline – le modifiche saranno sincronizzate al ritorno della connessione',
        type: 'warning' as const,
        duration: 0,
      };
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      addToast({ ...toast, id });
      offlineToastId = id;
    };

    const handleOnline = () => {
      if (offlineToastId) {
        removeToast(offlineToastId);
        offlineToastId = null;
      }
      addToast({
        message: 'Connessione ripristinata',
        type: 'success',
      });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [addToast, removeToast]);
};