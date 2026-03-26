import { useEffect } from 'react';
import { Toast as ToastType } from '../../store/toastStore';

interface ToastProps extends ToastType {
  onDismiss: (id: string) => void;
}

const typeColors: Record<ToastType, string> = {
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#6366F1',
};

export const Toast = ({ id, message, type, duration = 4000, onDismiss }: ToastProps) => {
  useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, id, onDismiss]);

  const bgColor = typeColors[type];

  return (
    <div
      className="relative p-4 rounded-lg shadow-lg text-white text-sm max-w-xs animate-slide-in"
      style={{ backgroundColor: bgColor }}
    >
      <div className="pr-6">{message}</div>
      <button
        onClick={() => onDismiss(id)}
        className="absolute top-2 right-2 text-white/80 hover:text-white text-lg leading-none"
        aria-label="Close"
      >
        &times;
      </button>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(120%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};