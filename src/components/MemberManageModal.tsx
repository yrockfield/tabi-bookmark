'use client';

import React, { useState } from 'react';
import { TripMember } from '@/types';
import { Users, UserPlus, Wallet, Trash2, X } from 'lucide-react';

interface MemberManageModalProps {
  tripId: string;
  members: TripMember[];
  ownerEmail: string;
  isOwner: boolean;
  onClose: () => void;
  onRefreshTrip: () => void;
}

export function MemberManageModal({
  tripId,
  members,
  ownerEmail,
  isOwner,
  onClose,
  onRefreshTrip,
}: MemberManageModalProps) {
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newCanExpense, setNewCanExpense] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          email: newEmail,
          name: newName,
          canExpense: newCanExpense,
        }),
      });

      if (res.ok) {
        setNewEmail('');
        setNewName('');
        setNewCanExpense(false);
        onRefreshTrip();
      } else {
        const data = await res.json();
        alert(data.error || 'メンバーの追加に失敗しました');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleExpense = async (member: TripMember) => {
    if (!isOwner) return;
    try {
      await fetch(`/api/trips/${tripId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          email: member.email,
          canExpense: !member.canExpense,
        }),
      });
      onRefreshTrip();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (!isOwner) return;
    if (!confirm(`${email} をこのしおりから削除しますか？`)) return;

    try {
      await fetch(`/api/trips/${tripId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          email,
        }),
      });
      onRefreshTrip();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-white/20 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-theme-primary flex items-center gap-2">
            <Users className="w-5 h-5 text-theme-accent" /> メンバー・閲覧権限設定
          </h3>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-primary p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Members List */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-theme-secondary block">参加メンバー ({members.length}名)</label>
          <div className="space-y-1.5">
            {members.map((m) => {
              const isTripOwner = m.email.toLowerCase() === ownerEmail.toLowerCase();
              return (
                <div
                  key={m.email}
                  className="flex items-center justify-between p-2.5 sub-box rounded-2xl"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-theme-primary truncate">
                        {m.name || m.email.split('@')[0]}
                      </span>
                      {isTripOwner ? (
                        <span className="text-[10px] font-extrabold bg-theme-accent text-theme-primary px-1.5 py-0.2 rounded-full border border-white/10">
                          管理者
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[10px] text-theme-muted truncate block">{m.email}</span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Expense Permission Badge / Toggle */}
                    {isOwner && !isTripOwner ? (
                      <button
                        onClick={() => handleToggleExpense(m)}
                        className={`px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition ${
                          m.canExpense
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white/10 text-theme-muted border border-white/10'
                        }`}
                        title="精算機能の利用権限を切替"
                      >
                        <Wallet className="w-3 h-3" />
                        {m.canExpense ? '精算可' : '精算不可'}
                      </button>
                    ) : (
                      <span
                        className={`px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 ${
                          m.canExpense ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-theme-muted'
                        }`}
                      >
                        <Wallet className="w-3 h-3" />
                        {m.canExpense ? '精算可' : '精算不可'}
                      </span>
                    )}

                    {isOwner && !isTripOwner ? (
                      <button
                        onClick={() => handleRemoveMember(m.email)}
                        className="text-theme-muted hover:text-red-400 p-1.5 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Member Form (Owner only) */}
        {isOwner ? (
          <form onSubmit={handleAddMember} className="space-y-3 pt-2 border-t border-white/10">
            <label className="text-xs font-bold text-theme-primary flex items-center gap-1">
              <UserPlus className="w-4 h-4 text-theme-accent" /> 家族のGoogleアカウントを招待
            </label>

            <div>
              <input
                type="email"
                required
                placeholder="Googleメール (example@gmail.com)"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <input
                type="text"
                placeholder="お名前 (例: はなこ)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />

              <label className="flex items-center gap-1.5 text-xs text-theme-secondary font-semibold cursor-pointer sub-box p-2 rounded-xl">
                <input
                  type="checkbox"
                  checked={newCanExpense}
                  onChange={(e) => setNewCanExpense(e.target.checked)}
                  className="rounded text-indigo-500 focus:ring-indigo-500"
                />
                <span>精算権限を付与</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 btn-theme-gradient font-bold rounded-xl text-xs shadow-md"
            >
              メンバーを追加
            </button>
          </form>
        ) : (
          <div className="text-[11px] text-theme-muted sub-box p-2.5 rounded-xl text-center">
            メンバーの追加・権限変更は管理者のみ行えます
          </div>
        )}
      </div>
    </div>
  );
}
