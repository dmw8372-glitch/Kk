import React from 'react';
import { Settings } from 'lucide-react';
import { UserStats } from '../types';
import { sounds } from '../lib/soundEffects';

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
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <button
          onClick={() => {
            sounds.playPop();
            onSelectTab('HOME');
          }}
          className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full bg-[#1e2022] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <span className="font-black text-sm tracking-tighter">●</span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-[#1e2022] leading-tight">
              끝잇기
            </span>
          </div>
        </button>

        {/* Right: Only the Settings Button as requested */}
        <button
          onClick={() => {
            sounds.playPop();
            onSelectTab('SETTINGS');
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
            currentTab === 'SETTINGS'
              ? 'bg-[#1e2022] text-white border-[#1e2022] shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
          title="설정"
        >
          <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span>설정</span>
        </button>
      </div>
    </header>
  );
};


