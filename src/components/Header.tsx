import React, { useState, useEffect } from 'react';
import { Home, HelpCircle, Bell, Settings } from 'lucide-react';
import { UserStats } from '../types';
import { sounds } from '../lib/soundEffects';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userStats: UserStats;
  onOpenNotices: () => void;
  onOpenRules: () => void;
  onOpenLegalDoc?: (type: 'terms' | 'privacy' | 'stdict_license') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  userStats,
  onOpenNotices,
  onOpenRules,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Left: Original Black & White Donut Logo from IMG_0962.jpeg */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playPop();
              onSelectTab('HOME');
            }}
            className="flex items-center gap-2.5 sm:gap-3 text-left cursor-pointer focus:outline-none group"
            title="끝잇기 홈으로"
          >
            {/* Black Donut Ring Icon (IMG_0962) */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-[5px] sm:border-[6px] border-black flex items-center justify-center group-hover:scale-105 transition-transform" />
            
            {/* Bold Black "끝잇기" Typography */}
            <span className="font-black text-xl sm:text-2xl text-black tracking-tight font-sans">
              끝잇기
            </span>
          </button>
        </div>

        {/* Right: Clean Black & White / Monotone Buttons (홈, 공지, 규칙, 설정) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Home Button (Shown when not on HOME screen) */}
          {currentTab !== 'HOME' && (
            <button
              onClick={() => {
                sounds.playPop();
                onSelectTab('HOME');
              }}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-black bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="메인 홈으로 이동"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
              <span className="hidden sm:inline">홈</span>
            </button>
          )}

          {/* Notice Button (Black & White) */}
          <button
            onClick={() => {
              sounds.playPop();
              onOpenNotices();
            }}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-black bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            title="공지사항"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
            <span className="hidden sm:inline">공지</span>
          </button>

          {/* Rules/Tutorial Button (Black & White) */}
          <button
            onClick={() => {
              sounds.playPop();
              onOpenRules();
            }}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-black bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            title="게임 규칙"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
            <span className="hidden sm:inline">규칙</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => {
              sounds.playPop();
              onSelectTab('SETTINGS');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              currentTab === 'SETTINGS'
                ? 'bg-black text-white border-black shadow-xs'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-black'
            }`}
            title="설정"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">설정</span>
          </button>
        </div>
      </div>
    </header>
  );
};
