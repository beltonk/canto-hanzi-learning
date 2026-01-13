"use client";

import { useLanguage } from "@/lib/i18n/context";

interface NavArrowProps {
  direction: "left" | "right";
  onClick: () => void;
  disabled?: boolean;
  size?: "md" | "lg";
  className?: string;
}

export default function NavArrow({
  direction,
  onClick,
  disabled = false,
  size = "lg",
  className = "",
}: NavArrowProps) {
  const { t } = useLanguage();
  const sizeClasses = size === "lg" 
    ? "w-[72px] h-[72px] text-4xl" 
    : "w-[56px] h-[56px] text-3xl";
  
  const arrow = direction === "left" ? "←" : "→";
  const label = direction === "left" ? t("previous") : t("next");

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`
        ${sizeClasses}
        rounded-full
        bg-[var(--card-bg)]
        shadow-lg
        flex items-center justify-center
        text-[var(--color-charcoal)]
        transition-all duration-200
        hover:bg-[var(--color-peach)]/30 hover:scale-110
        active:scale-95
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-[var(--card-bg)]
        ${className}
      `}
      style={{
        boxShadow: disabled ? "none" : "0 4px 16px var(--card-shadow)",
      }}
    >
      {arrow}
    </button>
  );
}
