'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { BottomNav, TabType } from '@/components/BottomNav';
import { TimelineView } from '@/components/TimelineView';
import { PackingView } from '@/components/PackingView';
import { ExpenseView } from '@/components/ExpenseView';
import { MemoriesView } from '@/components/MemoriesView';
import { MemberManageModal } from '@/components/MemberManageModal';
import { TripData } from '@/types';
import { PermissionResult } from '@/lib/auth';
import { MapPin, Calendar, Users, Sparkles } from 'lucide-react';
import { useSession as useNextSession } from 'next-auth/react';

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { data: session } = useNextSession();

  const [trip, setTrip] = useState<TripData | null>(null);
  const [permission, setPermission] = useState<PermissionResult>({
    isMember: false,
    isOwner: false,
    canExpense: false,
    role: 'none',
  });
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [isLoading, setIsLoading] = useState(true);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const fetchTrip = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`);
      if (res.ok) {
        const data = await res.json();
        setTrip(data.trip);
        setPermission(data.userPermission);
      } else if (res.status === 403) {
        alert('この「旅のしおり」の閲覧・編集権限がありません');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    }
  }, [tripId, fetchTrip]);

  const handleUpdateTripData = async (updatedFields: Partial<TripData>) => {
    if (!trip) return;
    const newTrip = { ...trip, ...updatedFields };
    setTrip(newTrip);

    try {
      await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
    } catch (err) {
      console.error('Failed to update trip:', err);
    }
  };

  // Calculate countdown
  const getCountdownText = () => {
    if (!trip?.metadata.startDate) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(trip.metadata.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(trip.metadata.endDate || trip.metadata.startDate);
    end.setHours(23, 59, 59, 999);

    if (today >= start && today <= end) {
      return '🎉 旅行中！最高の思い出をつくろう✨';
    } else if (today < start) {
      const diffDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 3600 * 24));
      return `出発まで あと ${diffDays} 日！`;
    } else {
      return '✨ 楽しかった旅行の思い出';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header showBack />
        <main className="max-w-md mx-auto p-4 space-y-4">
          <div className="glass-card rounded-3xl h-40 animate-pulse bg-white/5" />
        </main>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen">
        <Header showBack />
        <main className="max-w-md mx-auto p-8 text-center text-xs text-theme-secondary">
          「旅のしおり」が見つからないか、アクセス権限がありません。
        </main>
      </div>
    );
  }

  const isEditor = permission.isOwner || permission.role === 'editor';

  return (
    <div className="min-h-screen">
      <Header showBack onOpenMembers={() => setShowMemberModal(true)} />

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Trip Hero Header Card */}
        <div className="glass-card rounded-3xl p-5 border shadow-md relative overflow-hidden">
          {/* Countdown Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 btn-theme-gradient text-white rounded-full text-xs font-bold shadow-xs mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{getCountdownText()}</span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-extrabold text-xl text-theme-primary tracking-tight mb-1">
                {trip.metadata.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-theme-secondary">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-theme-accent" /> {trip.metadata.destination}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" /> {trip.metadata.startDate} 〜 {trip.metadata.endDate}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-2xl flex items-center justify-center flex-shrink-0 shadow-2xs border border-white/10">
              {trip.metadata.coverImage || '🌴'}
            </div>
          </div>

          {/* Members Avatars Bar */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
            <div
              onClick={() => setShowMemberModal(true)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="flex -space-x-2">
                {trip.members.map((m, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded-full btn-theme-gradient border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
                    title={m.name || m.email}
                  >
                    {(m.name || m.email)[0].toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="text-[11px] font-semibold text-theme-secondary group-hover:text-theme-primary flex items-center gap-0.5">
                <Users className="w-3 h-3 text-theme-accent" /> {trip.members.length}名共有
              </span>
            </div>

            {permission.isOwner ? (
              <span className="text-[10px] font-extrabold bg-theme-accent text-theme-primary px-2 py-0.5 rounded-full border border-white/10">
                管理者 (Owner)
              </span>
            ) : null}
          </div>
        </div>

        {/* Tab Content Views */}
        {activeTab === 'timeline' && (
          <TimelineView
            items={trip.itineraries || []}
            startDate={trip.metadata.startDate}
            endDate={trip.metadata.endDate}
            onSaveItems={(itineraries) => handleUpdateTripData({ itineraries })}
            isEditor={isEditor}
          />
        )}

        {activeTab === 'packing' && (
          <PackingView
            items={trip.packingList || []}
            onSaveItems={(packingList) => handleUpdateTripData({ packingList })}
            isEditor={isEditor}
          />
        )}

        {activeTab === 'expense' && (
          <ExpenseView
            items={trip.expenses || []}
            members={trip.members || []}
            onSaveItems={(expenses) => handleUpdateTripData({ expenses })}
            canExpense={permission.canExpense}
            onOpenMembers={() => setShowMemberModal(true)}
          />
        )}

        {activeTab === 'memories' && (
          <MemoriesView
            items={trip.memories || []}
            tripId={tripId}
            onSaveItems={(memories) => handleUpdateTripData({ memories })}
            isEditor={isEditor}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        canExpense={permission.canExpense}
      />

      {/* Member Management Modal */}
      {showMemberModal ? (
        <MemberManageModal
          tripId={tripId}
          members={trip.members || []}
          ownerEmail={trip.metadata.ownerEmail}
          isOwner={permission.isOwner}
          onClose={() => setShowMemberModal(false)}
          onRefreshTrip={fetchTrip}
        />
      ) : null}
    </div>
  );
}
