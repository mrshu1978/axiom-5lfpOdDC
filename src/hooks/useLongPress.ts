import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  duration?: number;
  onStart?: () => void;
  onCancel?: () => void;
}

export const useLongPress = (
  callback: () => void,
  { duration = 1500, onStart, onCancel }: UseLongPressOptions = {}
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = useRef(false);

  const start = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      cancelledRef.current = false;
      onStart?.();

      timerRef.current = setTimeout(() => {
        if (!cancelledRef.current) {
          callback();
        }
      }, duration);
    },
    [callback, duration, onStart]
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!cancelledRef.current) {
      onCancel?.();
    }
    cancelledRef.current = true;
  }, [onCancel]);

  const eventHandlers = {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
  };

  return eventHandlers;
};