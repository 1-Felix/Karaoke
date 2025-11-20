import { useEffect, useRef, useState } from 'react';

export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          const wakeLock = await navigator.wakeLock.request('screen');
          wakeLockRef.current = wakeLock;
          
          wakeLock.addEventListener('release', () => {
            console.log('Wake Lock released');
          });
          
          console.log('Wake Lock active');
        }
      } catch (err) {
        console.error('Error requesting wake lock:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch((err) => {
            console.error('Error releasing wake lock:', err);
        });
        wakeLockRef.current = null;
      }
    };
  }, [enabled]);

  return { error };
}
