'use client';

import React, { useEffect, useState } from 'react';
import { isFavorite, toggleFavorite, type AddFavoriteInput } from '@/lib/favorites';

interface FavoriteButtonProps extends Omit<AddFavoriteInput, 'kind'> {
  kind?: 'char' | 'word';
  /** Visual variant */
  variant?: 'pill' | 'icon' | 'chip';
  /** Optional callback after toggle */
  onToggle?: (added: boolean) => void;
  /** Smaller / compact size */
  size?: 'sm' | 'md';
  /** Additional className */
  className?: string;
}

/**
 * A button to add/remove a character or word from the user's "我的收藏" favorites.
 * Renders a heart that toggles between outline (not saved) and filled (saved).
 */
export default function FavoriteButton({
  text,
  kind,
  source,
  jyutping,
  reason,
  variant = 'pill',
  onToggle,
  size = 'md',
  className,
}: FavoriteButtonProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isFavorite(text));
  }, [text]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const added = toggleFavorite({ text, kind, source, jyutping, reason });
    setSaved(added);
    onToggle?.(added);
  };

  const sizes = size === 'sm'
    ? { btn: 'px-2 py-1 text-xs gap-1 min-h-11', icon: 'text-sm' }
    : { btn: 'px-3 py-1.5 text-sm gap-1.5 min-h-11', icon: 'text-base' };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={saved ? '已加入我的收藏' : '加入我的收藏'}
        aria-label={saved ? '從我的收藏移除' : '加入我的收藏'}
        aria-pressed={saved}
        className={`shrink-0 inline-flex items-center justify-center rounded-full transition-all active:scale-90 ${
          size === 'sm' ? 'w-11 h-11 text-base' : 'w-11 h-11 text-lg'
        } focus-visible:outline-2 focus-visible:outline-indigo-500 focus-visible:outline-offset-2 ${
          saved
            ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
            : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500'
        } ${className ?? ''}`}
      >
        {saved ? '❤️' : '🤍'}
      </button>
    );
  }

  if (variant === 'chip') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={saved ? '已加入我的收藏' : '加入我的收藏'}
        aria-pressed={saved}
        className={`inline-flex items-center font-semibold rounded-full border-2 transition-all active:scale-95 shrink-0 ${sizes.btn} ${
          saved
            ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600'
            : 'bg-white text-rose-600 border-rose-300 hover:bg-rose-50'
        } ${className ?? ''}`}
      >
        <span className={sizes.icon}>{saved ? '❤️' : '🤍'}</span>
        <span>{saved ? '已收藏' : '加入收藏'}</span>
      </button>
    );
  }

  // default: pill
  return (
    <button
      type="button"
      onClick={handleClick}
      title={saved ? '已加入我的收藏' : '加入我的收藏'}
      aria-pressed={saved}
      className={`inline-flex items-center font-medium rounded-xl transition-all active:scale-95 shrink-0 shadow-sm ${sizes.btn} ${
        saved
          ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white hover:shadow-md'
          : 'bg-white border-2 border-rose-200 text-rose-600 hover:border-rose-400 hover:bg-rose-50'
      } ${className ?? ''}`}
    >
      <span className={sizes.icon}>{saved ? '❤️' : '🤍'}</span>
      <span>{saved ? '已收藏' : '收藏'}</span>
    </button>
  );
}
