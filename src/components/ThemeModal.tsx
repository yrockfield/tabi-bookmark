'use client';

import React from 'react';
import { useTheme, THEME_OPTIONS, ThemeId } from '@/context/ThemeContext';
import { Palette, Check, X, Moon, Sun } from 'lucide-react';

interface ThemeModalProps {
  onClose: () => void;
}

export function ThemeModal({ onClose }: ThemeModalProps) {
  const { theme, setTheme } = useTheme();

  const darkThemes = THEME_OPTIONS.filter((t) => t.category === 'dark');
  const lightThemes = THEME_OPTIONS.filter((t) => t.category === 'light');

  const handleSelectTheme = (id: ThemeId) => {
    setTheme(id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-white/20">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-theme-primary flex items-center gap-2">
            <Palette className="w-5 h-5 text-theme-accent" /> テーマ設定
          </h3>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-primary p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dark Themes */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-theme-secondary flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5 text-theme-accent" /> ダークテーマ (3パターン)
          </span>
          <div className="grid grid-cols-1 gap-2">
            {darkThemes.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                    isSelected
                      ? 'btn-theme-gradient shadow-md border-white/40 ring-2 ring-white/30'
                      : 'sub-box hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center border border-white/30 shadow-xs"
                      style={{ background: t.previewBg }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.previewAccent }} />
                    </div>
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-theme-primary'}`}>
                      {t.name}
                      {t.id === 'dark-blue' ? (
                        <span className="ml-1.5 text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full border border-white/20">
                          デフォルト
                        </span>
                      ) : null}
                    </span>
                  </div>
                  {isSelected ? <Check className="w-4 h-4 text-white font-bold" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Light Themes */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <span className="text-xs font-bold text-theme-secondary flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" /> ライトテーマ (3パターン)
          </span>
          <div className="grid grid-cols-1 gap-2">
            {lightThemes.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                    isSelected
                      ? 'btn-theme-gradient shadow-md border-white/40 ring-2 ring-white/30'
                      : 'sub-box hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center border border-slate-300 shadow-xs"
                      style={{ background: t.previewBg }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.previewAccent }} />
                    </div>
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-theme-primary'}`}>
                      {t.name}
                    </span>
                  </div>
                  {isSelected ? <Check className="w-4 h-4 text-white font-bold" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
