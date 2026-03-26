import { useState, useEffect } from 'react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const BANNER_DISMISSED_KEY = 'push-permission-banner-dismissed';

export const PushPermissionBanner = () => {
  const { permission, requestAndSubscribe } = usePushNotifications();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY) === 'true';
    setIsVisible(!dismissed && permission === 'default');
  }, [permission]);

  const handleEnable = async () => {
    await requestAndSubscribe();
    handleDismiss();
  };

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-[#1A1A1A] border-b border-[#6366F1]/40 py-3 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p className="text-sm text-white">
          Abilita le notifiche per i promemoria
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEnable}
            className="px-4 py-1.5 bg-[#6366F1] text-white rounded-lg text-sm font-medium hover:bg-[#818CF8] transition-colors"
          >
            Abilita
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-1.5 bg-transparent text-[#A1A1AA] border border-[#3A3A3A] rounded-lg text-sm font-medium hover:bg-[#2A2A2A] transition-colors"
          >
            Non ora
          </button>
        </div>
      </div>
    </div>
  );
};