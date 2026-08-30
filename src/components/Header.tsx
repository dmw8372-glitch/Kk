import React, { useState, useEffect } from 'react';
import { Bell, HelpCircle, Volume2, VolumeX, User, ChevronDown, Sparkles, Check, RefreshCw, Music, Settings } from 'lucide-react';
import { UserStats } from '../types';
import { sounds, SoundSettings } from '../lib/soundEffects';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userStats: UserStats;
  onUpdateUserStats: (updated: Partial<UserStats>) => void;
  onOpenRules: () => void;
  onOpenNotices: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  userStats,
  onUpdateUserStats,
  onOpenRules,
  onOpenNotices,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editNickname, setEditNickname] = useState(userStats.nickname);
  const [selectedColor, setSelectedColor] = useState(userStats.avatarColor);
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(sounds.getSettings());

  useEffect(() => {
    const unsub = sounds.subscribe((st) => {
      setSoundSettings(st);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setEditNickname(userStats.nickname);
    setSelectedColor(userStats.avatarColor);
  }, [userStats.nickname, userStats.avatarColor]);

  const navItems = [
    { id: 'HOME', label: '홈' },
    { id: 'GAME', label: '게임' },
    { id: 'DICT', label: '단어 사전' },
    { id: 'MY', label: '내 기록' },
    { id: 'SETTINGS', label: '설정' },
  ];

  const handleToggleMute = () => {
    const next = sounds.toggleMute();
    if (!next) sounds.playPop();
  };

  const handleToggleBgm = () => {
    const next = sounds.toggleBGM();
    if (next) sounds.playPop();
  };

  const handleSaveProfile = () => {
    const trimmed = editNickname.trim();
    if (trimmed) {
      onUpdateUserStats({
        nickname: trimmed,
        avatarColor: selectedColor,
      });
      sounds.playCorrect();
      setIsProfileOpen(false);
    }
  };

  const colors = [
    { id: 'white', label: '화이트', bg: 'bg-slate-100 border-slate-300' },
    { id: 'yellow', label: '옐로우', bg: 'bg-amber-300 border-amber-400' },
    { id: 'mint', label: '민트', bg: 'bg-emerald-300 border-emerald-400' },
    { id: 'pink', label: '핑크', bg: 'bg-pink-300 border-pink-400' },
    { id: 'purple', label: '퍼플', bg: 'bg-purple-300 border-purple-400' },
    { id: 'orange', label: '오렌지', bg: 'bg-orange-300 border-orange-400' },
    { id: 'blue', label: '블루', bg: 'bg-blue-300 border-blue-400' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => onSelectTab('HOME')}
            className="flex items-center gap-2.5 group cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[#1e2022] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <span className="font-black text-sm tracking-tighter">●</span>
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#1e2022]">
              끝잇기
            </span>
          </button>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sounds.playPop();
                    onSelectTab(item.id);
                  }}
                  className={`relative px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                    active ? 'text-[#1e2022]' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item.label}
                  {active && (
                    <div className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-[#1e2022] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* BGM Music Toggle */}
          <button
            onClick={handleToggleBgm}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              soundSettings.isBgmEnabled && !soundSettings.isMuted
                ? 'text-purple-600 hover:bg-purple-50'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title={soundSettings.isBgmEnabled ? '배경음악(BGM) 끄기' : '배경음악(BGM) 켜기'}
          >
            <Music className={`w-5 h-5 ${soundSettings.isBgmEnabled && !soundSettings.isMuted ? 'text-purple-600' : 'text-slate-400'}`} />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-2 text-slate-500 hover:text-[#1e2022] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title={soundSettings.isMuted ? '효과음 켜기' : '효과음 끄기'}
          >
            {soundSettings.isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotices}
            className="relative p-2 text-slate-500 hover:text-[#1e2022] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="공지사항"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-600 ring-2 ring-white" />
          </button>

          {/* Settings Tab Shortcut Button */}
          <button
            onClick={() => {
              sounds.playPop();
              onSelectTab('SETTINGS');
            }}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              currentTab === 'SETTINGS'
                ? 'text-purple-600 bg-purple-50'
                : 'text-slate-500 hover:text-[#1e2022] hover:bg-slate-100'
            }`}
            title="환경 및 프로필 설정"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Game Rules Modal Button */}
          <button
            onClick={onOpenRules}
            className="p-2 text-slate-500 hover:text-[#1e2022] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="공식 게임 규칙"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* User Profile Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-semibold text-[#1e2022] cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-[#1e2022] text-white flex items-center justify-center text-xs">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="max-w-[80px] sm:max-w-[120px] truncate">{userStats.nickname}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Profile Popover Modal */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-sm text-[#1e2022]">내 프로필 간편 설정</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Lv.{userStats.level}</span>
                </div>

                {/* Nickname Input */}
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    닉네임
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                    placeholder="닉네임 입력 (최대 12자)"
                  />
                </div>

                {/* Color Selection */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    캐릭터 색상
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {colors.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColor(c.id)}
                        className={`w-7 h-7 rounded-full border-2 ${c.bg} flex items-center justify-center transition-transform cursor-pointer ${
                          selectedColor === c.id ? 'scale-110 ring-2 ring-purple-600' : 'hover:scale-105'
                        }`}
                        title={c.label}
                      >
                        {selectedColor === c.id && <Check className="w-3.5 h-3.5 text-slate-800" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button & Full Settings Link */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const randomNum = Math.floor(1000 + Math.random() * 9000);
                        setEditNickname(`손님${randomNum}`);
                      }}
                      className="p-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 text-xs cursor-pointer"
                      title="랜덤 닉네임"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 py-2 bg-[#1e2022] hover:bg-black text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      저장하기
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onSelectTab('SETTINGS');
                    }}
                    className="w-full py-1.5 text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    상세 환경/음향 설정으로 이동
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

