"use client";

import { useState } from "react";
import { Camera, X } from "lucide-react";

// Preset avatar icons - curated emoji set
const PRESET_AVATARS = [
  "😀", "😎", "🤓", "🥳", "😺",
  "🐶", "🐱", "🐼", "🦊", "🐸",
  "🌟", "⚡", "🔥", "💎", "🎯",
  "🎨", "🎮", "🎵", "📚", "💻",
  "🚀", "🌈", "🍀", "🌸", "🎪",
];

interface AvatarPickerProps {
  currentAvatar: string;
  displayName: string;
  uploading: boolean;
  onSelectEmoji: (emoji: string) => void;
  onUploadPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AvatarPicker({
  currentAvatar,
  displayName,
  uploading,
  onSelectEmoji,
  onUploadPhoto,
}: AvatarPickerProps): React.ReactElement {
  const [showPicker, setShowPicker] = useState(false);

  const isEmoji = currentAvatar && !currentAvatar.startsWith("http");

  return (
    <div className="relative">
      {/* Current Avatar */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="relative group cursor-pointer"
        type="button"
      >
        {currentAvatar ? (
          isEmoji ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-50 border-2 border-yellow-200 text-3xl">
              {currentAvatar}
            </div>
          ) : (
            <img src={currentAvatar} alt="" className="h-14 w-14 rounded-full object-cover" />
          )
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 text-white text-2xl font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        {/* Camera overlay */}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Camera className="w-5 h-5 text-white" />
          )}
        </div>
      </button>

      {/* Picker Dropdown */}
      {showPicker && (
        <div className="absolute top-16 left-0 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 w-72">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">アイコンを選択</span>
            <button
              onClick={() => setShowPicker(false)}
              className="p-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Emoji Grid */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {PRESET_AVATARS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onSelectEmoji(emoji);
                  setShowPicker(false);
                }}
                className={`h-11 w-11 flex items-center justify-center rounded-xl text-xl hover:bg-yellow-50 hover:scale-110 transition-all border ${
                  currentAvatar === emoji
                    ? "border-yellow-400 bg-yellow-50 shadow-sm"
                    : "border-transparent"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 my-3" />

          {/* Photo Upload */}
          <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
              <Camera className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">写真をアップロード</p>
              <p className="text-[10px] text-slate-400">2MB以下の画像</p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                onUploadPhoto(e);
                setShowPicker(false);
              }}
              disabled={uploading}
            />
          </label>
        </div>
      )}
    </div>
  );
}
