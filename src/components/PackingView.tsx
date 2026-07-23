'use client';

import React, { useState } from 'react';
import { PackingItem, PackingCategory } from '@/types';
import { Plus, CheckSquare, Square, Trash2, CheckCircle2 } from 'lucide-react';

interface PackingViewProps {
  items: PackingItem[];
  onSaveItems: (items: PackingItem[]) => void;
  isEditor: boolean;
}

export function PackingView({ items, onSaveItems, isEditor }: PackingViewProps) {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<PackingCategory>('shared');

  const categories: { id: string; label: string; icon: string }[] = [
    { id: 'all', label: 'すべて', icon: '📋' },
    { id: 'shared', label: '家族共通', icon: '👨‍👩‍👧‍👦' },
    { id: 'clothes', label: '着替え', icon: '👕' },
    { id: 'electronics', label: '電化製品', icon: '🔌' },
    { id: 'documents', label: '貴重品・書類', icon: '👛' },
    { id: 'medicine', label: '常備薬', icon: '💊' },
    { id: 'other', label: 'その他', icon: '📦' },
  ];

  const filteredItems = selectedCat === 'all' ? items : items.filter((i) => i.category === selectedCat);

  const packedCount = items.filter((i) => i.isPacked).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  const togglePacked = (id: string) => {
    if (!isEditor) return;
    onSaveItems(items.map((i) => (i.id === id ? { ...i, isPacked: !i.isPacked } : i)));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    const newItem: PackingItem = {
      id: `pack-${Date.now()}`,
      category: newCategory,
      title: newTitle,
      isPacked: false,
    };
    onSaveItems([...items, newItem]);
    setNewTitle('');
    setShowAddModal(false);
  };

  const handleDeleteItem = (id: string) => {
    onSaveItems(items.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-4 tab-content">
      {/* Progress Bar Card */}
      <div className="glass-card rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-theme-primary flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-theme-accent" /> 準備進捗
          </span>
          <span className="text-xs font-extrabold text-theme-accent font-mono">
            {packedCount} / {totalCount} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div
            className="h-full btn-theme-gradient rounded-full transition-all duration-300 shadow-xs"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCat === cat.id
                ? 'btn-theme-gradient shadow-xs'
                : 'glass-card text-theme-secondary hover:text-theme-primary'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center text-xs text-theme-secondary">
            該当する持ち物は登録されていません
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => togglePacked(item.id)}
              className={`glass-card rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer transition ${
                item.isPacked ? 'opacity-60 bg-white/5' : 'hover:border-white/40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button type="button" className="text-theme-accent flex-shrink-0">
                  {item.isPacked ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Square className="w-5 h-5 text-theme-muted" />
                  )}
                </button>
                <span
                  className={`text-xs font-semibold truncate ${
                    item.isPacked ? 'line-through text-theme-muted' : 'text-theme-primary'
                  }`}
                >
                  {item.title}
                </span>
              </div>

              {isEditor ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item.id);
                  }}
                  className="text-theme-muted hover:text-red-400 p-1 rounded transition flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>

      {/* Add Button */}
      {isEditor ? (
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-3 btn-theme-gradient text-white rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition transform active:scale-98"
        >
          <Plus className="w-4 h-4" /> 持ち物を追加する
        </button>
      ) : null}

      {/* Add Modal */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-white/20">
            <h3 className="font-bold text-base text-theme-primary">持ち物の追加</h3>
            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">持ち物名 *</label>
                <input
                  type="text"
                  required
                  placeholder="例: パスポート、子供用おやつ"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">カテゴリー</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as PackingCategory)}
                  className="w-full px-3 py-2 bg-slate-900 text-theme-primary border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="shared">👨‍👩‍👧‍👦 家族共通</option>
                  <option value="clothes">👕 着替え</option>
                  <option value="electronics">🔌 電化製品</option>
                  <option value="documents">👛 貴重品・書類</option>
                  <option value="medicine">💊 常備薬</option>
                  <option value="other">📦 その他</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-theme-muted hover:text-theme-primary"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 btn-theme-gradient text-white rounded-xl text-xs font-bold shadow-md"
                >
                  追加
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
