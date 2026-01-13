"use client";

import { useTheme } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/context";

interface ThemeSwitcherProps {
  /** Compact mode - just show icon */
  compact?: boolean;
}

export default function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        className="w-8 h-8 flex items-center justify-center rounded-full 
                   bg-white/80 dark:bg-[#2D3436]/80 shadow-sm
                   hover:bg-white dark:hover:bg-[#3D4446] transition-colors"
        title={theme === "light" ? t("switchToDark") : t("switchToLight")}
        aria-label={theme === "light" ? t("switchToDark") : t("switchToLight")}
      >
        {theme === "light" ? (
          <span className="text-lg">🌙</span>
        ) : (
          <span className="text-lg">☀️</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
        ${theme === "light" 
          ? "bg-white text-[#636E72] hover:bg-[#FFF5F5] border border-[#E8E0D8]" 
          : "bg-[#3D4446] text-[#E8E0D8] hover:bg-[#4D5456] border border-[#4D5456]"
        }`}
    >
      {theme === "light" ? (
        <>
          <span>🌙</span> Dark
        </>
      ) : (
        <>
          <span>☀️</span> Light
        </>
      )}
    </button>
  );
}
