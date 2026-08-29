import React from 'react';
import { Trophy, Medal, Award, Flame, Target, User } from 'lucide-react';
import { UserStats } from '../types';
import { MascotAvatar } from './MascotAvatar';

interface RankingViewProps {
  userStats: UserStats;
}

export const RankingView: React.FC<RankingViewProps> = ({ userStats }) => {
  const topRankers = [
    { rank: 1, name: '정민', score: 2840, wins: 142, total: 180, winRate: 78.8, maxStreak: 12, color: 'white' },
    { rank: 2, name: '철수', score: 2720, wins: 128, total: 175, winRate: 73.1, maxStreak: 9, color: 'yellow' },
    { rank: 3, name: '민수', score: 2650, wins: 119, total: 168, winRate: 70.8, maxStreak: 8, color: 'mint' },
    { rank: 4, name: '지훈', score: 2410, wins: 98, total: 150, winRate: 65.3, maxStreak: 7, color: 'purple' },
    { rank: 5, name: '준호', score: 2280, wins: 85, total: 140, winRate: 60.7, maxStreak: 6, color: 'blue' },
    { rank: 6, name: '현우', score: 2190, wins: 76, total: 135, winRate: 56.2, maxStreak: 5, color: 'pink' },
    { rank: 7, name: '서연', score: 2050, wins: 64, total: 120, winRate: 53.3, maxStreak: 4, color: 'orange' },
    { rank: 8, name: '예은', score: 1940, wins: 55, total: 110, winRate: 50.0, maxStreak: 4, color: 'yellow' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-xs">
              시즌 1
            </span>
            <h1 className="font-black text-2xl sm:text-3xl text-[#1e2022]">
              끝잇기 랭킹
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            승리하여 점수를 올리고 명예의 전당에 이름을 남겨보세요.
          </p>
        </div>

        {/* My current standing */}
        <div className="bg-purple-50 px-4 py-3 rounded-2xl border border-purple-100 flex items-center gap-3">
          <MascotAvatar color={userStats.avatarColor} size="sm" />
          <div>
            <div className="text-[10px] text-purple-700 font-bold">내 현재 순위</div>
            <div className="font-extrabold text-sm text-[#1e2022]">
              {userStats.nickname} ({userStats.highestRank === '-' ? '순위권 밖' : `${userStats.highestRank}위`})
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {topRankers.slice(0, 3).map((player, idx) => {
          const medals = [
            { badge: '🥇 1등', bg: 'from-amber-500/10 to-yellow-500/5', border: 'border-amber-300', text: 'text-amber-700' },
            { badge: '🥈 2등', bg: 'from-slate-400/10 to-slate-200/5', border: 'border-slate-300', text: 'text-slate-700' },
            { badge: '🥉 3등', bg: 'from-amber-700/10 to-orange-500/5', border: 'border-amber-600/30', text: 'text-amber-800' },
          ];
          const m = medals[idx];

          return (
            <div
              key={player.name}
              className={`bg-gradient-to-b ${m.bg} bg-white rounded-2xl border ${m.border} p-5 flex flex-col items-center text-center shadow-xs`}
            >
              <span className={`px-2.5 py-0.5 rounded-full bg-white/80 font-black text-xs ${m.text} shadow-2xs mb-3`}>
                {m.badge}
              </span>

              <MascotAvatar color={player.color} size="lg" isHost={idx === 0} />

              <h3 className="font-extrabold text-lg text-[#1e2022] mt-2">
                {player.name}
              </h3>
              <div className="font-mono font-black text-xl text-purple-700 mb-3">
                {player.score.toLocaleString()}점
              </div>

              <div className="w-full grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
                <div className="bg-white/80 p-1.5 rounded-lg">
                  <div className="text-[10px] text-slate-400 font-semibold">승률</div>
                  <div className="font-bold text-slate-700">{player.winRate}%</div>
                </div>
                <div className="bg-white/80 p-1.5 rounded-lg">
                  <div className="text-[10px] text-slate-400 font-semibold">최고 연승</div>
                  <div className="font-bold text-emerald-600">{player.maxStreak}연승</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 font-extrabold text-sm text-[#1e2022] flex items-center justify-between">
          <span>전체 랭킹 목록</span>
          <span className="text-xs text-slate-400 font-normal">실시간 집계</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">순위</th>
                <th className="px-6 py-3">플레이어</th>
                <th className="px-6 py-3">랭킹 점수</th>
                <th className="px-6 py-3">승리 / 총 게임</th>
                <th className="px-6 py-3">승률</th>
                <th className="px-6 py-3">최고 연승</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {topRankers.map((item) => (
                <tr key={item.name} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-sm">
                    {item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : `${item.rank}위`}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <MascotAvatar color={item.color} size="sm" />
                      <span className="font-extrabold text-slate-900">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 font-mono font-black text-purple-700 text-sm">
                    {item.score.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5">
                    {item.wins}승 / {item.total}게임
                  </td>
                  <td className="px-6 py-3.5 font-bold text-slate-800">
                    {item.winRate}%
                  </td>
                  <td className="px-6 py-3.5 font-bold text-emerald-600">
                    {item.maxStreak}연승
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
