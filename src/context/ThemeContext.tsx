'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId =
  | 'dark-blue'
  | 'dark-emerald'
  | 'dark-purple'
  | 'light-orange'
  | 'light-cyan'
  | 'light-rose';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  category: 'dark' | 'light';
  previewBg: string;
  previewAccent: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  // Dark Themes (3 patterns)
  {
    id: 'dark-blue',
    name: 'ダークネイビー',
    category: 'dark',
    previewBg: '#0f172a',
    previewAccent: '#3b82f6',
  },
  {
    id: 'dark-emerald',
    name: 'ダークエメラルド',
    category: 'dark',
    previewBg: '#064e3b',
    previewAccent: '#10b981',
  },
  {
    id: 'dark-purple',
    name: 'ダークミッドナイト',
    category: 'dark',
    previewBg: '#2e1065',
    previewAccent: '#a855f7',
  },
  // Light Themes (3 patterns)
  {
    id: 'light-orange',
    name: 'サンセットオレンジ',
    category: 'light',
    previewBg: '#fff7ed',
    previewAccent: '#f97316',
  },
  {
    id: 'light-cyan',
    name: 'オーシャンブルー',
    category: 'light',
    previewBg: '#ecfeff',
    previewAccent: '#06b6d4',
  },
  {
    id: 'light-rose',
    name: 'スイートローズ',
    category: 'light',
    previewBg: '#fff1f2',
    previewAccent: '#f43f5e',
  },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark-blue',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('dark-blue');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('tabibookmark-theme') as ThemeId | null;
    if (savedTheme && THEME_OPTIONS.some((t) => t.id === savedTheme)) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark-blue');
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem('tabibookmark-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={mounted ? '' : 'opacity-0'}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
