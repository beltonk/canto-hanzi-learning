"use client";

import { useLanguage } from "@/lib/i18n/context";
import type { Language } from "@/lib/i18n/translations";

interface LanguageSwitcherProps {
  /** Compact mode - just show flags/short text */
  compact?: boolean;
}

export default function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string; short: string }[] = [
    { code: "zh-HK", label: "粵語", short: "粵" },
    { code: "en", label: "EN", short: "EN" },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1 bg-white/80 rounded-full px-1 py-0.5 shadow-sm">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
              language === lang.code
                ? "bg-[#FF6B6B] text-white"
                : "text-[#636E72] hover:bg-[#FFF5F5]"
            }`}
          >
            {lang.short}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            language === lang.code
              ? "bg-[#FF6B6B] text-white shadow-md"
              : "bg-white text-[#636E72] hover:bg-[#FFF5F5] border border-[#E8E0D8]"
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
