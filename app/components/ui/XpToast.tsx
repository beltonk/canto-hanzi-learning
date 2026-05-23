'use client';
import React, { useEffect, useState } from 'react';

interface XpToastProps {
  amount: number;
  onDone?: () => void;
}

export default function XpToast({ amount, onDone }: XpToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  return (
    /* Phone: anchored to top-safe inset. iPad+: top-right corner. */
    <div
      className="fixed z-50 animate-float-in pointer-events-none
                 top-[calc(var(--safe-top)+8px)] right-4
                 md:top-[calc(var(--safe-top)+16px)] md:right-6"
      role="status"
      aria-live="polite"
      aria-label={`獲得 ${amount} 經驗值`}
    >
      <div className="bg-[var(--color-golden)] text-[var(--color-charcoal)] font-bold px-4 py-2 rounded-full shadow-lg text-sm">
        +{amount} XP ⭐
      </div>
    </div>
  );
}
