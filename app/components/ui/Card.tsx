"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { MascotIcon, MascotType } from "./Mascot";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg" | "xl";
}

const PADDING_CLASSES = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-10",
};

export default function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <div
      className={`
        bg-[var(--card-bg)]
        rounded-2xl
        shadow-[0_4px_20px_var(--card-shadow)]
        border border-[var(--card-border)]
        ${PADDING_CLASSES[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Activity Card for homepage - Compact version
interface ActivityCardProps {
  href: string;
  mascot: MascotType;
  character: string;
  title: string;
  colorTheme: "coral" | "sky" | "mint" | "golden";
}

const THEME_HOVER_CLASSES = {
  coral: "hover:border-[var(--color-coral-light)] hover:bg-[var(--color-coral)]/5",
  sky: "hover:border-[var(--color-sky-light)] hover:bg-[var(--color-sky)]/5",
  mint: "hover:border-[var(--color-mint-light)] hover:bg-[var(--color-mint)]/5",
  golden: "hover:border-[var(--color-golden-light)] hover:bg-[var(--color-golden)]/5",
};

const MASCOT_BG_CLASSES = {
  coral: "bg-[var(--color-coral)]/10",
  sky: "bg-[var(--color-sky)]/10",
  mint: "bg-[var(--color-mint)]/10",
  golden: "bg-[var(--color-golden)]/10",
};

export function ActivityCard({
  href,
  mascot,
  character,
  title,
  colorTheme,
}: ActivityCardProps) {
  return (
    <Link
      href={href}
      className={`
        block
        bg-[var(--card-bg)]
        rounded-2xl
        p-4 md:p-5
        shadow-[0_4px_20px_var(--card-shadow)]
        border border-[var(--card-border)]
        transition-all duration-200
        hover:translate-y-[-4px] hover:scale-[1.02]
        hover:shadow-[0_8px_30px_var(--card-shadow)]
        ${THEME_HOVER_CLASSES[colorTheme]}
      `}
    >
      <div className="flex flex-col items-center text-center">
        {/* Mascot and Character - Compact */}
        <div className={`relative w-16 h-16 md:w-20 md:h-20 ${MASCOT_BG_CLASSES[colorTheme]} rounded-full flex items-center justify-center mb-2`}>
          <span className="hanzi-display text-4xl md:text-5xl text-[var(--color-charcoal)]">{character}</span>
          <span className="absolute -bottom-0.5 -right-0.5 text-xl md:text-2xl">
            <MascotIcon type={mascot} size="sm" />
          </span>
        </div>
        
        {/* Title */}
        <h2 className="text-base md:text-lg font-bold text-[var(--color-charcoal)]">
          {title}
        </h2>
      </div>
    </Link>
  );
}
