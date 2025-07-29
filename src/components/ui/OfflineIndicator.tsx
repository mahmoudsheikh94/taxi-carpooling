import { useEffect, useState } from 'react';
import { pwaManager } from '../../utils/pwa';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(!navigator.onLine);

  useEffect(() => {
    const unsubscribe = pwaManager.onConnectionChange((online) => {
      setIsOnline(online);
      
      if (!online) {
        setShowIndicator(true);
      } else {
        // Hide indicator after a short delay when coming back online
        setTimeout(() => {
          setShowIndicator(false);
        }, 3000);
      }
    });

    return unsubscribe;
  }, []);

  if (!showIndicator) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isOnline ? 'bg-green-500' : 'bg-amber-500'
    } text-white text-center py-2 text-sm font-medium`}>
      <div className="flex items-center justify-center space-x-2">
        {isOnline ? (
          <>
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Connection restored</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>You're offline - Some features may be limited</span>
          </>
        )}
      </div>
    </div>
  );
}