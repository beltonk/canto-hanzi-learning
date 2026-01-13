"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/translations";

export type MascotType = "panda" | "rabbit" | "monkey" | "owl";

interface MascotProps {
  type: MascotType;
  message?: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}

const MASCOT_CONFIG: Record<MascotType, { emoji: string; nameKey: TranslationKey; messageKey: TranslationKey }> = {
  panda: {
    emoji: "🐼",
    nameKey: "pandaName",
    messageKey: "pandaMessage",
  },
  rabbit: {
    emoji: "🐰",
    nameKey: "rabbitName",
    messageKey: "rabbitMessage",
  },
  monkey: {
    emoji: "🐵",
    nameKey: "monkeyName",
    messageKey: "monkeyMessage",
  },
  owl: {
    emoji: "🦉",
    nameKey: "owlName",
    messageKey: "owlMessage",
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
  const { t } = useLanguage();
  const config = MASCOT_CONFIG[type];
  const displayMessage = message || t(config.messageKey);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div 
        className={`${SIZE_CLASSES[size]} ${animate ? "animate-float" : ""}`}
        role="img"
        aria-label={t(config.nameKey)}
      >
        {config.emoji}
      </div>
      {displayMessage && (
        <div className="mt-2 px-4 py-2 bg-[var(--card-bg)] rounded-full shadow-md border-2 border-[var(--color-peach)]">
          <p className="text-[var(--color-charcoal)] text-lg font-medium text-center">
            {displayMessage}
          </p>
        </div>
      )}
    </div>
  );
}

// Inline mascot for cards (no message bubble)
export function MascotIcon({ type, size = "md", className = "" }: Omit<MascotProps, "message" | "animate">) {
  const { t } = useLanguage();
  const config = MASCOT_CONFIG[type];
  
  return (
    <span 
      className={`${SIZE_CLASSES[size]} ${className}`}
      role="img" 
      aria-label={t(config.nameKey)}
    >
      {config.emoji}
    </span>
  );
}

// Success celebration mascot
export function MascotCelebration({ type, message }: { type: MascotType; message?: string }) {
  const { t } = useLanguage();
  const displayMessage = message || t("wellDone");
  
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
      <p className="mt-3 text-2xl font-bold text-[var(--color-mint-dark)]">{displayMessage}</p>
    </div>
  );
}
