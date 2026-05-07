'use client';
import React from 'react';

interface EndOfSessionSummaryProps {
  xpEarned: number;
  charsCount: number;
  streak: number;
  onClose: () => void;
}

export default function EndOfSessionSummary({ xpEarned, charsCount, streak, onClose }: EndOfSessionSummaryProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md mx-auto shadow-2xl border-2 border-indigo-200 animate-float-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded mx-auto mb-4 sm:hidden" />
        <h3 className="text-xl font-bold text-slate-900 text-center mb-5">
          🏆 今日成果
        </h3>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-4 rounded-2xl bg-amber-100 border border-amber-300">
            <div className="text-2xl font-bold text-amber-600">+{xpEarned}</div>
            <div className="text-xs text-slate-600 mt-0.5">經驗值</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-emerald-100 border border-emerald-300">
            <div className="text-2xl font-bold text-emerald-600">{charsCount}</div>
            <div className="text-xs text-slate-600 mt-0.5">學習字數</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-rose-100 border border-rose-300">
            <div className="text-2xl font-bold text-rose-600">{streak} 🔥</div>
            <div className="text-xs text-slate-600 mt-0.5">連續天數</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md"
        >
          返回首頁
        </button>
      </div>
    </div>
  );
}
