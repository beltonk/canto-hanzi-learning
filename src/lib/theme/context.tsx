"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "canto-hanzi-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved && (saved === "light" || saved === "dark")) {
      // Schedule state update to avoid synchronous setState in effect
      setTimeout(() => {
        setThemeState(saved);
      }, 0);
    }
    // Schedule mounted state update to avoid synchronous setState in effect
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", theme);
      // Also set class for Tailwind dark mode if needed
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme, mounted]);

  // Save theme preference
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "light", setTheme, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
