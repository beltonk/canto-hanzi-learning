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
    <div className="fixed bottom-24 right-4 z-50 animate-float-in pointer-events-none">
      <div className="bg-[var(--color-golden)] text-[var(--color-charcoal)] font-bold px-4 py-2 rounded-full shadow-lg text-sm">
        +{amount} XP ⭐
      </div>
    </div>
  );
}
