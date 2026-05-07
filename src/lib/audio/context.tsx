'use client';
import React, { createContext, useContext, useEffect } from 'react';
import { getAudioEngine, type AudioEngine } from './AudioEngine';
import { SOUND_REGISTRY } from './registry';
import { loadRoot } from '../storage';

const AudioContext = createContext<AudioEngine | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const engine = getAudioEngine();
    engine.setRegistry(SOUND_REGISTRY as Parameters<AudioEngine['setRegistry']>[0]);
    const root = loadRoot();
    engine.setGlobalEnabled(root.settings.soundOn);
    engine.setCategoryEnabled('music', root.settings.soundCategories.music);
    engine.setCategoryEnabled('voice', root.settings.soundCategories.voice);
    engine.setCategoryEnabled('effect', root.settings.soundCategories.effect);

    // iOS browsers (including Chrome, which uses WebKit) keep AudioContext
    // suspended until a trusted user gesture. Prime/unlock on first interaction.
    const unlock = () => { void engine.unlock(); };
    const opts: AddEventListenerOptions = { passive: true };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'touchstart', 'mousedown', 'keydown'];
    events.forEach(eventName => window.addEventListener(eventName, unlock, opts));

    return () => {
      events.forEach(eventName => window.removeEventListener(eventName, unlock));
    };
  }, []);

  return (
    <AudioContext.Provider value={getAudioEngine()}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio(): AudioEngine {
  const engine = useContext(AudioContext);
  if (!engine) return getAudioEngine(); // fallback to singleton
  return engine;
}
