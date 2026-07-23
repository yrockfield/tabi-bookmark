'use client';

import React from 'react';
import { Calendar, ShoppingBag, Wallet, Image as ImageIcon, Lock } from 'lucide-react';

export type TabType = 'timeline' | 'packing' | 'expense' | 'memories';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  canExpense: boolean;
}

export function BottomNav({ activeTab, onChangeTab, canExpense }: BottomNavProps) {
  const navItems: { id: TabType; label: string; icon: React.ReactNode; requiresExpense?: boolean }[] = [
    { id: 'timeline', label: '日程', icon: <Calendar className="w-5 h-5" /> },
    { id: 'packing', label: '持ち物', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'expense', label: '精算', icon: <Wallet className="w-5 h-5" />, requiresExpense: true },
    { id: 'memories', label: '写真・メモ', icon: <ImageIcon className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-3">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isLocked = item.requiresExpense && !canExpense;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-theme-primary font-bold bg-theme-accent scale-105'
                  : 'text-theme-muted hover:text-theme-secondary font-medium'
              }`}
            >
              <div className="relative">
                {item.icon}
                {isLocked ? (
                  <span className="absolute -top-1 -right-1 bg-slate-600 text-white rounded-full p-0.5 shadow-xs">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
              {isActive ? (
                <span className="w-1.5 h-1.5 bg-theme-accent rounded-full mt-0.5 animate-pulse" />
              ) : (
                <span className="w-1.5 h-1.5 opacity-0 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
