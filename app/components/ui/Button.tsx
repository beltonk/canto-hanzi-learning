"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "mint" | "sky" | "golden";
  size?: "md" | "lg" | "xl";
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  type?: "button" | "submit";
}

const VARIANT_CLASSES = {
  primary: `
    bg-gradient-to-br from-[#FF6B6B] to-[#E55555]
    text-white
    shadow-[0_4px_12px_rgba(255,107,107,0.3)]
    hover:shadow-[0_6px_16px_rgba(255,107,107,0.4)]
  `,
  secondary: `
    bg-white
    text-[#2D3436]
    border-3 border-[#FFE5B4]
    hover:bg-[#FFF2D9] hover:border-[#FF8E8E]
  `,
  mint: `
    bg-gradient-to-br from-[#98D8AA] to-[#7BC88E]
    text-white
    shadow-[0_4px_12px_rgba(152,216,170,0.3)]
    hover:shadow-[0_6px_16px_rgba(152,216,170,0.4)]
  `,
  sky: `
    bg-gradient-to-br from-[#7EC8E3] to-[#5BB8D8]
    text-white
    shadow-[0_4px_12px_rgba(126,200,227,0.3)]
    hover:shadow-[0_6px_16px_rgba(126,200,227,0.4)]
  `,
  golden: `
    bg-gradient-to-br from-[#FFD93D] to-[#F5C800]
    text-[#2D3436]
    shadow-[0_4px_12px_rgba(255,217,61,0.3)]
    hover:shadow-[0_6px_16px_rgba(255,217,61,0.4)]
  `,
};

const SIZE_CLASSES = {
  md: "text-lg px-6 py-3 min-h-[48px]",
  lg: "text-xl px-8 py-4 min-h-[56px]",
  xl: "text-2xl px-10 py-5 min-h-[64px]",
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  size = "lg",
  disabled = false,
  fullWidth = false,
  className = "",
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${VARIANT_CLASSES[variant]}
        ${SIZE_CLASSES[size]}
        font-semibold
        rounded-2xl
        transition-all duration-200
        hover:scale-[1.02]
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
