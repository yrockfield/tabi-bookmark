'use client';

import React, { useState } from 'react';
import { ItineraryItem, TransportType, ItineraryCategory } from '@/types';
import { Plus, MapPin, Car, Train, Plane, Navigation, Bus, Clock, Utensils, Hotel, Sparkles, Edit2, Trash2, Globe } from 'lucide-react';

interface TimelineViewProps {
  items: ItineraryItem[];
  startDate: string;
  endDate: string;
  onSaveItems: (items: ItineraryItem[]) => void;
  isEditor: boolean;
}

export function TimelineView({ items, startDate, endDate, onSaveItems, isEditor }: TimelineViewProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);

  // Calculate day count
  const start = new Date(startDate || Date.now());
  const end = new Date(endDate || Date.now());
  const dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

  const daysList = Array.from({ length: dayCount }, (_, idx) => {
    const d = new Date(start);
    d.setDate(d.getDate() + idx);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}(${['日', '月', '火', '水', '木', '金', '土'][d.getDay()]})`;
    return { index: idx, dateStr };
  });

  const dayItems = items
    .filter((item) => item.dayIndex === selectedDay)
    .sort((a, b) => {
      const isHotelA = a.category === 'hotel';
      const isHotelB = b.category === 'hotel';
      if (isHotelA && !isHotelB) return -1;
      if (!isHotelA && isHotelB) return 1;
      return (a.time || '').localeCompare(b.time || '');
    });

  // Form states
  const [formTime, setFormTime] = useState('10:00');
  const [formTitle, setFormTitle] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCategory, setFormCategory] = useState<ItineraryCategory>('spot');
  const [formTransport, setFormTransport] = useState<TransportType>('car');
  const [formNotes, setFormNotes] = useState('');
  const [formMapsUrl, setFormMapsUrl] = useState('');

  const openModal = (item?: ItineraryItem) => {
    if (item) {
      setEditingItem(item);
      setFormTime(item.time || '');
      setFormTitle(item.title);
      setFormLocation(item.location || '');
      setFormCategory(item.category);
      setFormTransport(item.transportType || 'car');
      setFormNotes(item.notes || '');
      setFormMapsUrl(item.googleMapsUrl || '');
    } else {
      setEditingItem(null);
      setFormTime('12:00');
      setFormTitle('');
      setFormLocation('');
      setFormCategory('spot');
      setFormTransport('car');
      setFormNotes('');
      setFormMapsUrl('');
    }
    setShowAddModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) return;

    let mapsUrl = formMapsUrl;
    if (!mapsUrl && formLocation) {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formLocation)}`;
    }

    if (editingItem) {
      const updated = items.map((i) =>
        i.id === editingItem.id
          ? {
              ...i,
              time: formTime,
              title: formTitle,
              location: formLocation,
              category: formCategory,
              transportType: formCategory === 'transport' ? formTransport : undefined,
              notes: formNotes,
              googleMapsUrl: mapsUrl,
            }
          : i
      );
      onSaveItems(updated);
    } else {
      const newItem: ItineraryItem = {
        id: `item-${Date.now()}`,
        dayIndex: selectedDay,
        time: formTime,
        title: formTitle,
        location: formLocation,
        category: formCategory,
        transportType: formCategory === 'transport' ? formTransport : undefined,
        notes: formNotes,
        googleMapsUrl: mapsUrl,
      };
      onSaveItems([...items, newItem]);
    }
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    onSaveItems(items.filter((i) => i.id !== id));
  };

  const getTransportIcon = (type?: TransportType) => {
    switch (type) {
      case 'car':
        return <Car className="w-4 h-4 text-emerald-400" />;
      case 'train':
        return <Train className="w-4 h-4 text-blue-400" />;
      case 'flight':
        return <Plane className="w-4 h-4 text-indigo-400" />;
      case 'bus':
        return <Bus className="w-4 h-4 text-amber-400" />;
      default:
        return <Navigation className="w-4 h-4 text-slate-300" />;
    }
  };

  const getCategoryBadge = (cat: ItineraryCategory, transport?: TransportType) => {
    switch (cat) {
      case 'food':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Utensils className="w-3 h-3" /> グルメ
          </span>
        );
      case 'hotel':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Hotel className="w-3 h-3" /> 宿・ホテル
          </span>
        );
      case 'transport':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {getTransportIcon(transport)} 移動
          </span>
        );
      case 'spot':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Sparkles className="w-3 h-3" /> スポット
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">
            メモ
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 tab-content">
      {/* Day Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
        {daysList.map((day) => (
          <button
            key={day.index}
            onClick={() => setSelectedDay(day.index)}
            className={`flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition shadow-xs ${
              selectedDay === day.index
                ? 'btn-theme-gradient scale-102 shadow-md'
                : 'glass-card text-theme-secondary hover:text-theme-primary'
            }`}
          >
            <div>Day {day.index + 1}</div>
            <div className="text-[10px] opacity-90 font-normal">{day.dateStr}</div>
          </button>
        ))}
      </div>

      {/* Schedule Items Timeline */}
      <div className="space-y-3">
        {dayItems.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center space-y-2">
            <Clock className="w-8 h-8 text-theme-accent mx-auto" />
            <p className="text-xs text-theme-secondary font-medium">Day {selectedDay + 1} の予定はまだ登録されていません</p>
            {isEditor ? (
              <button
                onClick={() => openModal()}
                className="mt-2 px-4 py-2 btn-theme-gradient text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> 最初の予定を追加
              </button>
            ) : null}
          </div>
        ) : (
          dayItems.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-2xl p-4 transition-all duration-200 hover:shadow-md border"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  {item.time ? (
                    <span className="text-xs font-black text-theme-accent bg-theme-accent px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" /> {item.time}
                    </span>
                  ) : null}
                  {getCategoryBadge(item.category, item.transportType)}
                </div>

                {isEditor ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(item)}
                      className="p-1.5 text-theme-muted hover:text-theme-primary rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-theme-muted hover:text-red-400 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>

              <h4 className="font-bold text-sm text-theme-primary mb-1">{item.title}</h4>

              {item.location || item.googleMapsUrl ? (
                <div className="flex items-center justify-between text-xs text-theme-secondary mt-2 sub-box p-2 rounded-xl">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-theme-accent flex-shrink-0" />
                    <span className="truncate">{item.location || item.googleMapsUrl}</span>
                  </div>
                  {item.googleMapsUrl ? (
                    <a
                      href={item.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 flex-shrink-0 text-[11px] font-bold text-theme-accent bg-theme-accent px-2 py-0.5 rounded-lg border border-white/20 shadow-2xs inline-flex items-center gap-1"
                    >
                      {item.googleMapsUrl.includes('google.com/maps') || item.googleMapsUrl.includes('maps.google') || item.googleMapsUrl.includes('goo.gl') ? (
                        <>
                          <Navigation className="w-3 h-3" /> MAP
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3" /> URL
                        </>
                      )}
                    </a>
                  ) : null}
                </div>
              ) : null}

              {item.notes ? (
                <p className="text-xs text-theme-secondary mt-2 sub-box p-2 rounded-xl whitespace-pre-wrap">
                  {item.notes}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>

      {/* FAB Add Button */}
      {isEditor ? (
        <button
          onClick={() => openModal()}
          className="w-full py-3 btn-theme-gradient text-white rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition transform active:scale-98"
        >
          <Plus className="w-4 h-4" /> 予定を追加する (Day {selectedDay + 1})
        </button>
      ) : null}

      {/* Add/Edit Modal */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-white/20">
            <h3 className="font-bold text-base text-theme-primary">
              {editingItem ? '予定の編集' : `予定の追加 (Day ${selectedDay + 1})`}
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-theme-secondary block mb-1">
                    時間 {formCategory === 'hotel' ? <span className="text-theme-muted font-normal">(任意)</span> : '*'}
                  </label>
                  <input
                    type="time"
                    required={formCategory !== 'hotel'}
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 text-theme-primary border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-theme-secondary block mb-1">カテゴリー</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ItineraryCategory)}
                    className="w-full px-3 py-2 bg-white/10 text-theme-primary border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="spot">✨ スポット</option>
                    <option value="food">🍽️ グルメ</option>
                    <option value="transport">🚗 移動</option>
                    <option value="hotel">🏨 宿・ホテル</option>
                    <option value="other">📌 その他</option>
                  </select>
                </div>
              </div>

              {formCategory === 'hotel' ? (
                <p className="text-[11px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1.5 rounded-xl">
                  💡 宿・ホテルは時間指定なしで登録でき、その日の最上部に表示されます
                </p>
              ) : null}

              {formCategory === 'transport' ? (
                <div>
                  <label className="text-xs font-semibold text-theme-secondary block mb-1">移動手段</label>
                  <select
                    value={formTransport}
                    onChange={(e) => setFormTransport(e.target.value as TransportType)}
                    className="w-full px-3 py-2 bg-white/10 text-theme-primary border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="car">🚗 自家用車 / レンタカー</option>
                    <option value="train">🚅 電車・新幹線</option>
                    <option value="flight">✈️ 飛行機</option>
                    <option value="bus">🚌 バス</option>
                    <option value="walk">🚶 徒歩</option>
                  </select>
                </div>
              ) : null}

              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">タイトル *</label>
                <input
                  type="text"
                  required
                  placeholder="例: 美ら海水族館の見学"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">場所 / 住所</label>
                <input
                  type="text"
                  placeholder="例: 沖縄県国頭郡本部町石川424"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">URL (Google Map / 公式サイト等)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formMapsUrl}
                  onChange={(e) => setFormMapsUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">メモ</label>
                <textarea
                  rows={2}
                  placeholder="チケット事前予約済み、駐車場料金 500円 など"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
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
