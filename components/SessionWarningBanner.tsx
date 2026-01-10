'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface SessionWarningBannerProps {
  message: string;
  duration: number; // in milliseconds
  onDismiss?: () => void;
}

export default function SessionWarningBanner({
  message,
  duration,
  onDismiss
}: SessionWarningBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  if (isDismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{message}</p>
              <p className="text-sm text-yellow-100 mt-0.5">
                Time remaining: {formatTime(timeRemaining)}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-yellow-600 rounded-full transition-colors flex-shrink-0"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
