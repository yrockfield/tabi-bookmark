'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/Header';
import { TripIndexItem } from '@/types';
import { Plus, Calendar, MapPin, ChevronRight, Compass, Sparkles, Luggage } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { data: session, status } = useSession();
  const [trips, setTrips] = useState<TripIndexItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for creating new trip
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [coverEmoji, setCoverEmoji] = useState('🌴');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emojiOptions = ['🌴', '✈️', '♨️', '🏔️', '🏯', '🎢', '🏖️', '🗼', '🚗', '🚅'];

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/trips');
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips || []);
      }
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTrips();
    } else {
      setIsLoading(false);
    }
  }, [status]);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          destination,
          startDate,
          endDate,
          coverImage: coverEmoji,
          description,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setTitle('');
        setDestination('');
        setStartDate('');
        setEndDate('');
        fetchTrips();
      } else {
        alert('しおりの作成に失敗しました');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Hero Banner */}
        <div className="glass-card rounded-3xl p-5 border shadow-md relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl p-2 bg-white/10 rounded-2xl border border-white/10">✨</span>
            <div>
              <h1 className="font-extrabold text-lg text-theme-primary tracking-tight">
                スマホでつくる、旅のしおり。
              </h1>
              <p className="text-xs text-theme-secondary">みんなで手軽に共有できる「タビブ -TabiBookmark-」</p>
            </div>
          </div>
        </div>

        {/* Trips Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-extrabold text-sm text-theme-primary flex items-center gap-1.5">
              <Luggage className="w-4 h-4 text-theme-accent" /> マイ旅のしおり一覧
            </h2>
            {session ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-xs font-bold text-theme-accent bg-theme-accent px-2.5 py-1 rounded-xl border border-white/10 flex items-center gap-1 hover:opacity-80"
              >
                <Plus className="w-3.5 h-3.5" /> 作成
              </button>
            ) : null}
          </div>

          {!session ? (
            <div className="glass-card rounded-3xl p-6 text-center space-y-3">
              <Compass className="w-10 h-10 text-theme-accent mx-auto animate-pulse" />
              <div>
                <h3 className="font-bold text-sm text-theme-primary">Googleアカウントでログイン</h3>
                <p className="text-xs text-theme-secondary mt-1 max-w-xs mx-auto">
                  ログインすると、みんなの「旅のしおり」を表示・作成できます。
                </p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="glass-card rounded-3xl p-4 h-24 animate-pulse" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center space-y-3 border">
              <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs font-semibold text-theme-secondary">まだ「旅のしおり」が登録されていません</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 btn-theme-gradient text-white rounded-2xl text-xs font-bold shadow-md inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> 最初のしおりを作成する
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <Link key={trip.id} href={`/trips/${trip.id}`} className="block">
                  <div className="glass-card rounded-3xl p-4 transition-all duration-200 hover:shadow-lg border flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 text-2xl flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition border border-white/10">
                        {trip.coverImage || '🌴'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-theme-primary truncate group-hover:text-theme-accent transition">
                          {trip.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-theme-secondary mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-theme-accent" /> {trip.destination}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-400" /> {trip.startDate}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-theme-muted group-hover:text-theme-primary group-hover:translate-x-0.5 transition flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Trip Modal */}
      {showCreateModal ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-white/20">
            <h3 className="font-bold text-base text-theme-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-theme-accent" /> 新しい旅のしおりを作成
            </h3>
            <form onSubmit={handleCreateTrip} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">アイキャッチ絵文字</label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {emojiOptions.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setCoverEmoji(emoji)}
                      className={`text-xl p-2 rounded-xl transition ${
                        coverEmoji === emoji ? 'bg-white/20 border border-white/40 scale-110' : 'bg-white/5'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">旅行のタイトル *</label>
                <input
                  type="text"
                  required
                  placeholder="例: 沖縄家族旅行2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">目的地</label>
                <input
                  type="text"
                  placeholder="例: 沖縄本島・恩納村"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-theme-secondary block mb-1">開始日 *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white/10 text-theme-primary border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-theme-secondary block mb-1">終了日 *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white/10 text-theme-primary border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-theme-muted hover:text-theme-primary"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 btn-theme-gradient text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {isSubmitting ? '作成中...' : 'しおりを作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
