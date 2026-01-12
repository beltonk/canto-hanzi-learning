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
        bg-white
        rounded-2xl
        shadow-[0_4px_20px_rgba(0,0,0,0.1)]
        border border-[#E8E0D8]
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
  coral: "hover:border-[#FF8E8E] hover:bg-gradient-to-br hover:from-white hover:to-[#FFF5F5]",
  sky: "hover:border-[#A5DBF0] hover:bg-gradient-to-br hover:from-white hover:to-[#F0F9FF]",
  mint: "hover:border-[#B8E8C4] hover:bg-gradient-to-br hover:from-white hover:to-[#F0FFF4]",
  golden: "hover:border-[#FFE566] hover:bg-gradient-to-br hover:from-white hover:to-[#FFFBEB]",
};

const MASCOT_BG_CLASSES = {
  coral: "bg-[#FFF5F5]",
  sky: "bg-[#F0F9FF]",
  mint: "bg-[#F0FFF4]",
  golden: "bg-[#FFFBEB]",
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
        bg-white
        rounded-2xl
        p-4 md:p-5
        shadow-[0_4px_20px_rgba(0,0,0,0.1)]
        border border-[#E8E0D8]
        transition-all duration-200
        hover:translate-y-[-4px] hover:scale-[1.02]
        hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)]
        ${THEME_HOVER_CLASSES[colorTheme]}
      `}
    >
      <div className="flex flex-col items-center text-center">
        {/* Mascot and Character - Compact */}
        <div className={`relative w-16 h-16 md:w-20 md:h-20 ${MASCOT_BG_CLASSES[colorTheme]} rounded-full flex items-center justify-center mb-2`}>
          <span className="hanzi-display text-4xl md:text-5xl text-[#2D3436]">{character}</span>
          <span className="absolute -bottom-0.5 -right-0.5 text-xl md:text-2xl">
            <MascotIcon type={mascot} size="sm" />
          </span>
        </div>
        
        {/* Title */}
        <h2 className="text-base md:text-lg font-bold text-[#2D3436]">
          {title}
        </h2>
      </div>
    </Link>
  );
}
