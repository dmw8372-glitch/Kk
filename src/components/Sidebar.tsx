import React from 'react';
import { Home, Gamepad2, BookOpen, Trophy, Clock, ShieldCheck, Settings } from 'lucide-react';
import { UserStats } from '../types';
import { MascotAvatar } from './MascotAvatar';
import { sounds } from '../lib/soundEffects';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userStats: UserStats;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userStats,
}) => {
  const menuItems = [
    { id: 'HOME', label: '홈', icon: Home },
    { id: 'GAME', label: '게임', icon: Gamepad2 },
    { id: 'DICT', label: '단어 사전', icon: BookOpen },
    { id: 'RANK', label: '랭킹', icon: Trophy },
    { id: 'MY', label: '내 기록', icon: Clock },
    { id: 'ACHIEVE', label: '업적', icon: ShieldCheck },
    { id: 'SETTINGS', label: '설정', icon: Settings },
  ];

  const expTarget = userStats.level * 100;
  const expProgress = Math.min(100, Math.round((userStats.exp / expTarget) * 100));

  return (
    <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
      {/* User Profile Card (Image 1 style) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col items-center">
        {/* Mascot Avatar Preview */}
        <div className="mb-3">
          <MascotAvatar
            color={userStats.avatarColor}
            size="lg"
            expression="happy"
          />
        </div>

        {/* Name & Level */}
        <h3 className="font-extrabold text-lg text-[#1e2022] tracking-tight">
          {userStats.nickname}
        </h3>
        <span className="text-xs font-semibold text-slate-500 mb-3">
          Lv. {userStats.level}
        </span>

        {/* EXP Bar */}
        <div className="w-full mb-4">
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 mb-1">
            <span>{userStats.exp} / {expTarget}</span>
            <span>{expProgress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${expProgress}%` }}
            />
          </div>
          <div className="text-[10px] text-center text-slate-400 mt-1 font-medium">
            다음 레벨까지 {Math.max(0, expTarget - userStats.exp)} EXP
          </div>
        </div>

        {/* Game Record Summary */}
        <div className="w-full border-t border-slate-100 pt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold px-1">
            <span className="text-slate-500">승리 횟수</span>
            <span className="text-purple-700 font-extrabold">{userStats.wins}회</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold px-1">
            <span className="text-slate-500">승률</span>
            <span className="text-indigo-700 font-extrabold">{userStats.winRate}%</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold px-1">
            <span className="text-slate-500">최고 연승</span>
            <span className="text-emerald-600 font-extrabold">{userStats.maxStreak}연승</span>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-2 flex flex-col gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                sounds.playPop();
                onSelectTab(item.id);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                active
                  ? 'bg-[#1e2022] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
