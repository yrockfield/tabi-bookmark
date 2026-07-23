'use client';

import React, { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Plane, LogIn, LogOut, User, ArrowLeft, Shield, X, Sparkles, Palette } from 'lucide-react';
import { ThemeModal } from '@/components/ThemeModal';
import Link from 'next/link';

interface HeaderProps {
  showBack?: boolean;
  title?: string;
  onOpenMembers?: () => void;
}

export function Header({ showBack, title, onOpenMembers }: HeaderProps) {
  const { data: session } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [devEmail, setDevEmail] = useState('');
  const [devName, setDevName] = useState('');

  const handleDevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devEmail) return;
    await signIn('credentials', {
      email: devEmail,
      name: devName || devEmail.split('@')[0],
      redirect: false,
    });
    setShowLoginModal(false);
  };

  const handleGoogleSignIn = () => {
    signIn('google').catch(() => {});
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-card border-b border-white/10 px-4 py-3 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showBack ? (
              <Link
                href="/"
                className="p-2 -ml-2 text-theme-secondary hover:text-theme-primary rounded-full transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            ) : null}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl btn-theme-gradient flex items-center justify-center text-white shadow-md">
                <Plane className="w-5 h-5 transform -rotate-12" />
              </div>
              <div>
                <span className="font-bold text-lg text-theme-primary">
                  タビブ
                </span>
                <span className="text-[10px] text-theme-muted font-semibold block -mt-1 tracking-wider uppercase">
                  TabiBookmark
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Theme Selector Button */}
            <button
              onClick={() => setShowThemeModal(true)}
              className="p-2 bg-theme-accent text-theme-accent hover:opacity-80 rounded-full text-xs font-medium flex items-center gap-1 transition"
              title="カラーテーマ設定"
            >
              <Palette className="w-4 h-4" />
            </button>

            {onOpenMembers ? (
              <button
                onClick={onOpenMembers}
                className="p-2 bg-theme-accent text-theme-accent hover:opacity-80 rounded-full text-xs font-medium flex items-center gap-1 transition"
                title="メンバー・権限設定"
              >
                <Shield className="w-4 h-4" />
              </button>
            ) : null}

            {session?.user ? (
              <div className="flex items-center gap-2 glass-card rounded-full py-1 px-2.5 shadow-xs">
                {session.user.image ? (
                  <img src={session.user.image} alt="User" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-theme-accent text-theme-accent flex items-center justify-center text-xs font-bold">
                    {session.user.name?.[0] || 'U'}
                  </div>
                )}
                <span className="text-xs font-medium text-theme-primary max-w-[80px] truncate">
                  {session.user.name || session.user.email?.split('@')[0]}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-theme-muted hover:text-red-400 p-0.5 rounded transition"
                  title="ログアウト"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3.5 py-1.5 btn-theme-gradient rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                ログイン
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Login Options Modal */}
      {showLoginModal ? (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-5 max-w-xs w-full shadow-2xl border border-white/20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-theme-primary flex items-center gap-2">
                <User className="w-5 h-5 text-theme-accent" /> タビブにログイン
              </h3>
              <button onClick={() => setShowLoginModal(false)} className="text-theme-muted hover:text-theme-primary p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Google OAuth Option */}
            <div className="space-y-2">
              <button
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-3 bg-white text-slate-800 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs hover:bg-slate-50 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Googleアカウントでログイン
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-500/30"></div>
              <span className="flex-shrink mx-2 text-[10px] font-bold text-theme-muted uppercase">または (ローカルテスト)</span>
              <div className="flex-grow border-t border-slate-500/30"></div>
            </div>

            {/* Dev / Local Login Form */}
            <form onSubmit={handleDevSubmit} className="space-y-3">
              <div className="bg-theme-accent p-2.5 rounded-2xl border border-white/10 space-y-2">
                <span className="text-[11px] font-bold text-theme-primary flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> デモログイン (メール指定)
                </span>
                <div>
                  <label className="text-[10px] font-semibold text-theme-secondary block mb-0.5">Googleメールアドレス</label>
                  <input
                    type="email"
                    required
                    placeholder="taro@gmail.com"
                    value={devEmail}
                    onChange={(e) => setDevEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-theme-secondary block mb-0.5">表示名 (任意)</label>
                  <input
                    type="text"
                    placeholder="たろう"
                    value={devName}
                    onChange={(e) => setDevName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 btn-theme-gradient rounded-xl text-xs font-bold shadow-md active:scale-98 transition"
              >
                ログインして利用開始
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {/* Theme Modal */}
      {showThemeModal ? <ThemeModal onClose={() => setShowThemeModal(false)} /> : null}
    </>
  );
}
