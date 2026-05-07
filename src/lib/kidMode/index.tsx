'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadRoot, updateSettings } from '../storage';

interface KidModeContextValue {
  kidMode: boolean;
  setKidMode: (on: boolean) => void;
}

const KidModeContext = createContext<KidModeContextValue>({ kidMode: true, setKidMode: () => {} });

export function KidModeProvider({ children }: { children: React.ReactNode }) {
  const [kidMode, setKidModeState] = useState(true);

  useEffect(() => {
    const root = loadRoot();
    setTimeout(() => {
      setKidModeState(root.settings.kidMode);
    }, 0);
  }, []);

  const setKidMode = useCallback((on: boolean) => {
    setKidModeState(on);
    updateSettings({ kidMode: on });
  }, []);

  return (
    <KidModeContext.Provider value={{ kidMode, setKidMode }}>
      {children}
    </KidModeContext.Provider>
  );
}

export function useKidMode() {
  return useContext(KidModeContext);
}
