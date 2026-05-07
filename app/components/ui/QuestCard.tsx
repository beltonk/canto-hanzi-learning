'use client';
import React from 'react';

interface Quest {
  id: string;
  label: string;
  progress: number;
  target: number;
  done: boolean;
}

export default function QuestCard({ quest }: { quest: Quest }) {
  const pct = Math.min(100, Math.round((quest.progress / quest.target) * 100));
  return (
    <div
      className={`rounded-2xl border p-4 transition-all shadow-sm ${
        quest.done
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{quest.done ? '✅' : '🎯'}</span>
        <span className="text-sm font-semibold text-slate-800 truncate">
          {quest.label}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            quest.done ? 'bg-emerald-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-slate-500 mt-1.5 text-right font-medium">
        {quest.progress} / {quest.target}
      </div>
    </div>
  );
}
