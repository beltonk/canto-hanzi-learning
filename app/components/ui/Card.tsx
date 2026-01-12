"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { MascotIcon, MascotType } from "./Mascot";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "md" | "lg" | "xl";
}

const PADDING_CLASSES = {
  md: "p-6",
  lg: "p-8",
  xl: "p-10",
};

export default function Card({ children, className = "", padding = "lg" }: CardProps) {
  return (
    <div
      className={`
        bg-white
        rounded-3xl
        shadow-[0_8px_32px_rgba(0,0,0,0.12)]
        border-2 border-white/80
        ${PADDING_CLASSES[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Activity Card for homepage
interface ActivityCardProps {
  href: string;
  mascot: MascotType;
  character: string;
  title: string;
  description: string;
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
  description,
  colorTheme,
}: ActivityCardProps) {
  return (
    <Link
      href={href}
      className={`
        block
        bg-white
        rounded-3xl
        p-8
        shadow-[0_8px_32px_rgba(0,0,0,0.12)]
        border-2 border-[#E8E0D8]
        transition-all duration-300
        hover:translate-y-[-6px] hover:scale-[1.02]
        hover:shadow-[0_16px_40px_rgba(0,0,0,0.18)]
        ${THEME_HOVER_CLASSES[colorTheme]}
      `}
    >
      <div className="flex flex-col items-center text-center">
        {/* Mascot and Character */}
        <div className={`relative w-32 h-32 ${MASCOT_BG_CLASSES[colorTheme]} rounded-full flex items-center justify-center mb-4`}>
          <span className="hanzi-display text-7xl text-[#2D3436]">{character}</span>
          <span className="absolute -bottom-1 -right-1 text-4xl">
            <MascotIcon type={mascot} size="sm" />
          </span>
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-[#2D3436] mb-2">
          {title}
        </h2>
        
        {/* Description */}
        <p className="text-lg text-[#636E72]">
          {description}
        </p>
      </div>
    </Link>
  );
}
