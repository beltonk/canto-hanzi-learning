'use client';
import React, { useState } from 'react';

const PLANT_EMOJIS = ['🌱', '🌿', '🍀', '🌸', '🌻', '🌺', '🌼', '🌳', '🌲', '🎋'];

interface GardenPanelProps {
  plants: string[];
  className?: string;
}

export default function GardenPanel({ plants, className }: GardenPanelProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (plants.length === 0) {
    return (
      <div
        className={`rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center ${className ?? ''}`}
      >
        <div className="text-4xl mb-2">🌱</div>
        <p className="text-sm text-slate-500">完成學習活動，種植自己的花園！</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-emerald-200 bg-gradient-to-b from-sky-50 to-emerald-50 p-5 shadow-sm ${className ?? ''}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🌿</span>
        <span className="text-sm font-semibold text-emerald-700">我的花園</span>
        <span className="text-xs text-slate-500 ml-auto">{plants.length} 株植物</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {plants.map((plant, idx) => {
          const plantNum = parseInt(plant.replace('garden_plant_', '')) || 1;
          const emoji = PLANT_EMOJIS[(plantNum - 1) % PLANT_EMOJIS.length];
          return (
            <button
              key={plant}
              className="text-2xl hover:scale-125 transition-transform relative"
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setHovered(idx === hovered ? null : idx)}
              aria-label={plant}
            >
              {emoji}
              {hovered === idx && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  植物 {plantNum}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
