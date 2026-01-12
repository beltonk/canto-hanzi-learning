"use client";

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
  const sizeClasses = size === "lg" 
    ? "w-[72px] h-[72px] text-4xl" 
    : "w-[56px] h-[56px] text-3xl";
  
  const arrow = direction === "left" ? "←" : "→";
  const label = direction === "left" ? "上一個" : "下一個";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`
        ${sizeClasses}
        rounded-full
        bg-white
        shadow-lg
        flex items-center justify-center
        text-charcoal
        transition-all duration-200
        hover:bg-peach-light hover:scale-110
        active:scale-95
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white
        ${className}
      `}
      style={{
        boxShadow: disabled ? "none" : "0 4px 16px rgba(0, 0, 0, 0.1)",
      }}
    >
      {arrow}
    </button>
  );
}
