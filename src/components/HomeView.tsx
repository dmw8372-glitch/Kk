import React from 'react';
import { Users, Globe, ArrowRight, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';
import { UserStats } from '../types';
import { MascotAvatar } from './MascotAvatar';
import { sounds } from '../lib/soundEffects';

interface HomeViewProps {
  userStats: UserStats;
  onCreateRoom: () => void;
  onOpenPublicRooms: () => void;
  onOpenQuickJoin: () => void;
  onSelectTab: (tab: string) => void;
  onViewWordDetail?: (word: string) => void;
  onOpenNotices: () => void;
  onOpenRules: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  userStats,
  onCreateRoom,
  onOpenPublicRooms,
  onSelectTab,
  onOpenNotices,
  onOpenRules,
}) => {
  const notices = [
    { title: '끝잇기 공식 서비스 오픈 안내', date: '08.28' },
    { title: '두음법칙 판정 시스템 업데이트 (v1.0.1)', date: '08.28' },
    { title: '국립국어원 표준 사전 단어 검증 기준 안내', date: '08.27' },
    { title: '실시간 2~8인 멀티플레이 최적화 완료', date: '08.25' },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left & Center Main Content Area (2 cols on XL) */}
      <div className="xl:col-span-2 flex flex-col gap-6">
        {/* Cosmic Hero Banner (Image 1 style) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c0d14] via-[#15162b] to-[#2b1055] text-white p-7 sm:p-9 shadow-lg border border-purple-900/30">
          {/* Subtle stars/lights effect */}
          <div className="absolute top-4 left-1/4 w-1 h-1 bg-white rounded-full opacity-60 animate-ping" />
          <div className="absolute top-12 right-1/3 w-1.5 h-1.5 bg-purple-300 rounded-full opacity-40" />
          <div className="absolute bottom-6 left-12 w-1 h-1 bg-indigo-300 rounded-full opacity-70" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-md">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2 flex items-center gap-2">
                끝잇기
              </h1>
              <p className="text-purple-200 text-sm sm:text-base font-medium mb-6">
                친구들과 함께 즐기는 끝말잇기
              </p>

              {/* 3 Badges */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/30 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-purple-200" />
                  </div>
                  <div>
                    <div className="font-bold text-white leading-tight">2~8명</div>
                    <div className="text-[10px] text-purple-200">여러 명이 함께</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/30 flex items-center justify-center">
                    <span className="text-xs">⏱️</span>
                  </div>
                  <div>
                    <div className="font-bold text-white leading-tight">5초 제한</div>
                    <div className="text-[10px] text-indigo-200">시간 안에 단어 입력</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold">
                  <div className="w-6 h-6 rounded-lg bg-pink-500/30 flex items-center justify-center">
                    <span className="text-xs">🔗</span>
                  </div>
                  <div>
                    <div className="font-bold text-white leading-tight">두음법칙 적용</div>
                    <div className="text-[10px] text-pink-200">리→이, 녀→여 등 허용</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glowing Mascot on the right */}
            <div className="flex items-center justify-center relative md:pr-4">
              <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-125 pointer-events-none" />
              <MascotAvatar color="white" size="xl" expression="happy" />
            </div>
          </div>
        </div>

        {/* Action Cards (게임 시작하기) */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="font-extrabold text-lg text-[#1e2022]">게임 시작하기</h2>
            <button
              onClick={onOpenRules}
              className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>공식 규칙 확인</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: 친구와 함께 (방 만들기) */}
            <div className="bg-white rounded-2xl border border-purple-100 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform" />
              <div className="relative z-10 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-xl text-[#1e2022] mb-1">
                  친구와 함께
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  방을 만들고 친구를 초대해서<br />
                  2~8명이 함께 플레이해요!
                </p>
              </div>

              <button
                onClick={() => {
                  sounds.playPop();
                  onSelectTab('GAME');
                }}
                className="relative z-10 w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold text-sm flex items-center justify-between shadow-xs transition-transform active:scale-[0.98] cursor-pointer"
              >
                <span>방 만들기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 2: 공개 방 참가 (공개 방 목록) */}
            <div className="bg-white rounded-2xl border border-blue-100 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform" />
              <div className="relative z-10 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-xl text-[#1e2022] mb-1">
                  공개 방 참가
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  다른 플레이어들이 만든 공개 방에<br />
                  참가해서 함께 플레이해요!
                </p>
              </div>

              <button
                onClick={() => {
                  sounds.playPop();
                  onSelectTab('GAME');
                }}
                className="relative z-10 w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm flex items-center justify-between shadow-xs transition-transform active:scale-[0.98] cursor-pointer"
              >
                <span>공개 방 목록</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 내 기록 요약 (Image 1 style) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-base text-[#1e2022]">내 기록 요약</h3>
            <button
              onClick={() => onSelectTab('MY')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <span>상세보기</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50/80 rounded-xl p-3.5 text-center border border-slate-100">
              <div className="text-[11px] font-medium text-slate-500 mb-1">총 게임 수</div>
              <div className="font-extrabold text-xl text-[#1e2022]">{userStats.totalGames}</div>
              <div className="text-[10px] text-slate-400">게임</div>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-3.5 text-center border border-slate-100">
              <div className="text-[11px] font-medium text-slate-500 mb-1">승리</div>
              <div className="font-extrabold text-xl text-purple-700">{userStats.wins}</div>
              <div className="text-[10px] text-slate-400">회</div>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-3.5 text-center border border-slate-100">
              <div className="text-[11px] font-medium text-slate-500 mb-1">승률</div>
              <div className="font-extrabold text-xl text-[#1e2022]">{userStats.winRate}%</div>
              <div className="text-[10px] text-slate-400">-</div>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-3.5 text-center border border-slate-100">
              <div className="text-[11px] font-medium text-slate-500 mb-1">최고 순위</div>
              <div className="font-extrabold text-xl text-amber-600">{userStats.highestRank}</div>
              <div className="text-[10px] text-slate-400">위</div>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-3.5 text-center border border-slate-100 col-span-2 sm:col-span-1">
              <div className="text-[11px] font-medium text-slate-500 mb-1">연승</div>
              <div className="font-extrabold text-xl text-emerald-600">{userStats.currentStreak}</div>
              <div className="text-[10px] text-slate-400">회</div>
            </div>
          </div>
        </div>

        {/* Bottom Tip Bar */}
        <div className="bg-white rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
            <span className="text-amber-600">💡 TIP</span>
            <span>단어 사전에서 다양한 단어와 두음법칙 연결을 검색해보세요!</span>
          </div>
          <button
            onClick={() => onSelectTab('DICT')}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>단어 사전 바로가기</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Right Column Widgets (Image 1 style) */}
      <div className="flex flex-col gap-6">
        {/* Notice Widget (공지사항) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-base text-[#1e2022]">공지사항</h3>
            <button
              onClick={onOpenNotices}
              className="text-xs font-semibold text-slate-400 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer"
            >
              <span>더보기</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            {notices.map((n, i) => (
              <button
                key={i}
                onClick={onOpenNotices}
                className="py-2.5 text-left flex items-center justify-between gap-2 group cursor-pointer"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  <span className="text-xs font-medium text-slate-700 group-hover:text-purple-600 truncate transition-colors">
                    {n.title}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">{n.date}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
