'use client';

import React, { useState } from 'react';
import { MemoryItem } from '@/types';
import { Plus, Camera, FileText, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';

interface MemoriesViewProps {
  items: MemoryItem[];
  tripId: string;
  onSaveItems: (items: MemoryItem[]) => void;
  isEditor: boolean;
}

export function MemoriesView({ items, tripId, onSaveItems, isEditor }: MemoriesViewProps) {
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const [photoTitle, setPhotoTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle || !noteContent) return;

    const newMemory: MemoryItem = {
      id: `mem-${Date.now()}`,
      title: noteTitle,
      type: 'note',
      content: noteContent,
      author: '自分',
      createdAt: new Date().toLocaleDateString('ja-JP'),
    };

    onSaveItems([newMemory, ...items]);
    setNoteTitle('');
    setNoteContent('');
    setShowAddNoteModal(false);
  };

  const handleUploadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await fetch(`/api/trips/${tripId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: photoTitle || selectedFile.name,
            base64Data,
            filename: selectedFile.name,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          onSaveItems([data.memory, ...items]);
          setShowUploadModal(false);
          setPhotoTitle('');
          setSelectedFile(null);
        } else {
          alert('画像のアップロードに失敗しました');
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  const handleDeleteMemory = (id: string) => {
    onSaveItems(items.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-4 tab-content">
      {/* Action Bar */}
      {isEditor ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="py-3 btn-theme-gradient text-white rounded-2xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition transform active:scale-98"
          >
            <Camera className="w-4 h-4" /> 写真を投稿する
          </button>
          <button
            onClick={() => setShowAddNoteModal(true)}
            className="py-3 glass-card text-theme-primary rounded-2xl font-bold text-xs shadow-2xs hover:bg-white/10 flex items-center justify-center gap-1.5 transition border"
          >
            <FileText className="w-4 h-4 text-theme-accent" /> メモを追加する
          </button>
        </div>
      ) : null}

      {/* Grid of Photos and Notes */}
      {items.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center space-y-2">
          <ImageIcon className="w-8 h-8 text-theme-accent mx-auto" />
          <p className="text-xs text-theme-secondary font-medium">思い出の写真やメモはまだありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="glass-card rounded-2xl overflow-hidden border shadow-sm">
              {item.type === 'photo' ? (
                <div>
                  <img
                    src={item.content}
                    alt={item.title}
                    className="w-full h-48 object-cover bg-slate-900"
                  />
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-theme-primary">{item.title}</h4>
                      <span className="text-[10px] text-theme-muted">
                        {item.author} ・ {item.createdAt}
                      </span>
                    </div>
                    {isEditor ? (
                      <button
                        onClick={() => handleDeleteMemory(item.id)}
                        className="text-theme-muted hover:text-red-400 p-1 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-theme-accent flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> {item.title}
                    </span>
                    {isEditor ? (
                      <button
                        onClick={() => handleDeleteMemory(item.id)}
                        className="text-theme-muted hover:text-red-400 p-1 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <p className="text-xs text-theme-secondary whitespace-pre-wrap leading-relaxed sub-box p-2.5 rounded-xl">
                    {item.content}
                  </p>
                  <div className="text-[10px] text-theme-muted mt-2 text-right">
                    {item.author} ・ {item.createdAt}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Note Modal */}
      {showAddNoteModal ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-white/20">
            <h3 className="font-bold text-base text-theme-primary">メモの追加</h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">タイトル *</label>
                <input
                  type="text"
                  required
                  placeholder="例: おすすめお土産メモ、宿の連絡先"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">メモ内容 *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="行きたいスポットや注意事項など自由に入力してください"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
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

      {/* Photo Upload Modal */}
      {showUploadModal ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-white/20">
            <h3 className="font-bold text-base text-theme-primary">写真のアップロード (S3保存)</h3>
            <form onSubmit={handleUploadPhoto} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">タイトル / キャプション</label>
                <input
                  type="text"
                  placeholder="例: 沖縄の夕日"
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 text-theme-primary placeholder:text-theme-muted border border-white/20 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-theme-secondary block mb-1">画像ファイルを選択</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-theme-secondary file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-theme-primary hover:file:bg-white/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="px-4 py-2 text-xs font-semibold text-theme-muted hover:text-theme-primary"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 btn-theme-gradient text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {isUploading ? 'アップロード中...' : 'アップロード'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
