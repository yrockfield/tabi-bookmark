'use client';

import React, { useState } from 'react';
import { ExpenseItem, ExpenseCategory, TripMember } from '@/types';
import { Plus, Lock, ArrowRight, Trash2, PieChart, ShieldAlert } from 'lucide-react';

interface ExpenseViewProps {
  items: ExpenseItem[];
  members: TripMember[];
  onSaveItems: (items: ExpenseItem[]) => void;
  canExpense: boolean;
  onOpenMembers?: () => void;
}

export function ExpenseView({ items, members, onSaveItems, canExpense, onOpenMembers }: ExpenseViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('food');
  const [formPaidBy, setFormPaidBy] = useState(members[0]?.name || members[0]?.email || '自分');
  const [selectedSplit, setSelectedSplit] = useState<string[]>(members.map((m) => m.name || m.email));

  if (!canExpense) {
    return (
      <div className="glass-card rounded-3xl p-6 text-center space-y-4 tab-content border">
        <div className="w-12 h-12 bg-amber-500/20 text-amber-300 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-base text-theme-primary mb-1">精算機能へのアクセス制限</h3>
          <p className="text-xs text-theme-secondary max-w-xs mx-auto leading-relaxed">
            精算・旅費の記録機能は現在制限されています。管理者がメンバー権限設定で閲覧・入力権限を付与することで利用可能になります。
          </p>
        </div>
        {onOpenMembers ? (
          <button
            onClick={onOpenMembers}
            className="px-4 py-2 bg-theme-accent text-theme-accent border border-white/20 rounded-xl text-xs font-bold hover:opacity-80 transition inline-flex items-center gap-1.5"
          >
            <ShieldAlert className="w-4 h-4" /> 権限設定を開く (管理者用)
          </button>
        ) : null}
      </div>
    );
  }

  // Calculate totals and balances
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  // Paid by totals
  const paidTotals: Record<string, number> = {};
  items.forEach((item) => {
    paidTotals[item.paidBy] = (paidTotals[item.paidBy] || 0) + item.amount;
  });

  // Calculate net balances per member for settlement
  const balances: Record<string, number> = {};
  items.forEach((item) => {
    if (!item.splitAmong || item.splitAmong.length === 0) return;
    const splitShare = item.amount / item.splitAmong.length;

    balances[item.paidBy] = (balances[item.paidBy] || 0) + item.amount;
    item.splitAmong.forEach((person) => {
      balances[person] = (balances[person] || 0) - splitShare;
    });
  });

  // Calculate simplified debts
  const settlements: { from: string; to: string; amount: number }[] = [];
  const debtors = Object.entries(balances)
    .filter(([_, bal]) => bal < -1)
    .map(([person, bal]) => ({ person, amount: -bal }));
  const creditors = Object.entries(balances)
    .filter(([_, bal]) => bal > 1)
    .map(([person, bal]) => ({ person, amount: bal }));

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    settlements.push({
      from: debtors[i].person,
      to: creditors[j].person,
      amount: Math.round(pay),
    });
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount <= 1) i++;
    if (creditors[j].amount <= 1) j++;
  }

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formAmount) return;

    const newItem: ExpenseItem = {
      id: `exp-${Date.now()}`,
      title: formTitle,
      amount: parseInt(formAmount, 10),
      category: formCategory,
      paidBy: formPaidBy,
      splitAmong: selectedSplit.length > 0 ? selectedSplit : members.map((m) => m.name || m.email),
      date: new Date().toLocaleDateString('ja-JP'),
    };

    onSaveItems([newItem, ...items]);
    setFormTitle('');
    setFormAmount('');
    setShowAddModal(false);
  };

  const handleDeleteExpense = (id: string) => {
    onSaveItems(items.filter((i) => i.id !== id));
  };

  const toggleSplitPerson = (personName: string) => {
    if (selectedSplit.includes(personName)) {
      if (selectedSplit.length > 1) {
        setSelectedSplit(selectedSplit.filter((p) => p !== personName));
      }
    } else {
      setSelectedSplit([...selectedSplit, personName]);
    }
  };

  return (
    <div className="space-y-4 tab-content">
      {/* Total & Settlement Summary Card */}
      <div className="glass-card rounded-3xl p-5 border space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-theme-accent uppercase tracking-wider block">合計旅費支出</span>
            <div className="text-2xl font-black text-theme-primary font-mono">¥{totalAmount.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 bg-theme-accent text-theme-accent rounded-2xl flex items-center justify-center">
            <PieChart className="w-5 h-5" />
          </div>
        </div>

        {/* Settlement Instructions */}
        {settlements.length > 0 ? (
          <div className="sub-box p-3.5 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-theme-primary flex items-center gap-1">
              ✨ 精算ガイド（だれが・だれに）
            </span>
            <div className="space-y-1.5">
              {settlements.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-semibold text-theme-primary bg-white/10 p-2 rounded-xl border border-white/10">
                  <span className="text-theme-primary">{s.from}</span>
                  <div className="flex items-center gap-1 text-theme-accent text-[11px]">
                    <span>¥{s.amount.toLocaleString()}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-theme-primary">{s.to}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-theme-muted sub-box p-2.5 rounded-xl text-center">
            現時点で精算が必要な差額はありません
          </div>
        )}
      </div>

      {/* Expense History */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-theme-secondary px-1">支出明細</h4>
        {items.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center text-xs text-theme-secondary">
            まだ旅費は記録されていません
          </div>
        ) : (
          items.map((exp) => (
            <div key={exp.id} className="glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3 border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-theme-primary">{exp.title}</span>
                  <span className="text-[10px] font-semibold bg-white/10 text-theme-secondary px-2 py-0.5 rounded-full border border-white/10">
                    {exp.paidBy} が支払
                  </span>
                </div>
                <div className="text-[11px] text-theme-muted mt-0.5">
                  割勘: {exp.splitAmong.join(', ')}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-theme-accent">
                  ¥{exp.amount.toLocaleString()}
                </span>
                <button
                  onClick={() => handleDeleteExpense(exp.id)}
                  className="text-theme-muted hover:text-red-400 p-1 rounded transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Expense FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full py-3 btn-theme-gradient text-white rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition transform active:scale-98"
      >
        <Plus className="w-4 h-4" /> 支出を記録する
      </button>

      {/* Add Modal */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-white/20">
            <h3 className="font-bold text-base text-theme-primary">支出の記録</h3>
            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">内容 *</label>
                <input
                  type="text"
                  required
                  placeholder="例: 夕食代、レンタカー代"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">金額 (円) *</label>
                <input
                  type="number"
                  required
                  placeholder="3500"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">支払った人</label>
                <select
                  value={formPaidBy}
                  onChange={(e) => setFormPaidBy(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-theme-primary border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {members.map((m) => {
                    const name = m.name || m.email;
                    return (
                      <option key={m.email} value={name}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">割り勘の対象者</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {members.map((m) => {
                    const name = m.name || m.email;
                    const isSelected = selectedSplit.includes(name);
                    return (
                      <button
                        type="button"
                        key={m.email}
                        onClick={() => toggleSplitPerson(name)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                          isSelected ? 'btn-theme-gradient shadow-2xs' : 'glass-card text-theme-muted'
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
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
                  保存する
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
