"use client";

import { useState, useEffect } from "react";

export type MascotType = "panda" | "rabbit" | "monkey" | "owl";

interface MascotProps {
  type: MascotType;
  message?: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}

const MASCOT_CONFIG: Record<MascotType, { emoji: string; name: string; defaultMessage: string }> = {
  panda: {
    emoji: "🐼",
    name: "小熊貓",
    defaultMessage: "一起學習漢字！",
  },
  rabbit: {
    emoji: "🐰",
    name: "小白兔",
    defaultMessage: "開始字卡練習！",
  },
  monkey: {
    emoji: "🐵",
    name: "小猴子",
    defaultMessage: "拆字真有趣！",
  },
  owl: {
    emoji: "🦉",
    name: "貓頭鷹",
    defaultMessage: "專心聆聽！",
  },
};

const SIZE_CLASSES = {
  sm: "text-4xl",
  md: "text-6xl",
  lg: "text-8xl",
};

export default function Mascot({
  type,
  message,
  size = "md",
  animate = true,
  className = "",
}: MascotProps) {
  const config = MASCOT_CONFIG[type];
  const displayMessage = message || config.defaultMessage;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div 
        className={`${SIZE_CLASSES[size]} ${animate ? "animate-float" : ""}`}
        role="img"
        aria-label={config.name}
      >
        {config.emoji}
      </div>
      {displayMessage && (
        <div className="mt-2 px-4 py-2 bg-white rounded-full shadow-md border-2 border-peach">
          <p className="text-charcoal text-lg font-medium text-center">
            {displayMessage}
          </p>
        </div>
      )}
    </div>
  );
}

// Inline mascot for cards (no message bubble)
export function MascotIcon({ type, size = "md", className = "" }: Omit<MascotProps, "message" | "animate">) {
  const config = MASCOT_CONFIG[type];
  
  return (
    <span 
      className={`${SIZE_CLASSES[size]} ${className}`}
      role="img" 
      aria-label={config.name}
    >
      {config.emoji}
    </span>
  );
}

// Success celebration mascot
export function MascotCelebration({ type, message = "做得好！" }: { type: MascotType; message?: string }) {
  return (
    <div className="flex flex-col items-center animate-bounce-in">
      <div className="relative">
        <span className="text-7xl" role="img" aria-label="celebration">
          {MASCOT_CONFIG[type].emoji}
        </span>
        <span className="absolute -top-2 -right-2 text-3xl animate-star-burst">⭐</span>
        <span className="absolute -top-4 -left-2 text-2xl animate-star-burst" style={{ animationDelay: "0.1s" }}>✨</span>
        <span className="absolute -bottom-1 -right-4 text-2xl animate-star-burst" style={{ animationDelay: "0.2s" }}>🌟</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-mint-dark">{message}</p>
    </div>
  );
}
