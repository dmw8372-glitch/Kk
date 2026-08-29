import React, { useEffect } from 'react';
import { Trophy, Award, Clock, Hash, Zap, RotateCcw, Home, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameRoom, Player } from '../types';
import { MascotAvatar } from './MascotAvatar';
import { sounds } from '../lib/soundEffects';

interface ResultModalProps {
  room: GameRoom;
  currentPlayerId: string;
  onReturnToLobby: () => void;
  onLeaveToHome: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  room,
  currentPlayerId,
  onReturnToLobby,
  onLeaveToHome,
}) => {
  // Sorted players by score / survival
  const sortedPlayers = [...room.currentPlayers].sort((a, b) => {
    if (a.isAlive && !b.isAlive) return -1;
    if (!a.isAlive && b.isAlive) return 1;
    return b.score - a.score;
  });

  const winner = sortedPlayers[0];
  const isWinner = winner?.id === currentPlayerId;
  const myPlayer = room.currentPlayers.find((p) => p.id === currentPlayerId);
  const myRank = sortedPlayers.findIndex((p) => p.id === currentPlayerId) + 1;

  useEffect(() => {
    sounds.playVictory();
    // Confetti effect
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 flex flex-col items-center animate-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-inner">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="font-black text-2xl sm:text-3xl text-[#1e2022] mb-1">
          🏆 GAME OVER
        </h2>
        <p className="text-xs text-slate-500 font-semibold mb-6">
          {winner ? `${winner.nickname}님이 최종 우승하셨습니다!` : '게임이 종료되었습니다.'}
        </p>

        {/* Winner Showcase Card */}
        {winner && (
          <div className="w-full bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-amber-300/60 p-4 flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <MascotAvatar
                color={winner.avatarColor}
                size="md"
                isHost={winner.isHost}
                expression="happy"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-amber-600 text-sm">🥇 1위 우승자</span>
                  {isWinner && (
                    <span className="px-1.5 py-0.2 bg-purple-600 text-white rounded text-[9px] font-extrabold">
                      나
                    </span>
                  )}
                </div>
                <div className="font-extrabold text-base text-slate-800">
                  {winner.nickname}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-bold">최종 점수</div>
              <div className="font-mono font-black text-lg text-purple-700">
                {winner.score}점
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="w-full bg-slate-50 rounded-2xl border border-slate-200/80 p-3 mb-5 max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
          {sortedPlayers.map((player, idx) => {
            const rank = idx + 1;
            const isMe = player.id === currentPlayerId;
            const medals = ['🥇', '🥈', '🥉'];

            return (
              <div
                key={player.id}
                className={`py-2 px-2 flex items-center justify-between font-bold ${
                  isMe ? 'bg-purple-50 text-purple-900 rounded-lg' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 text-center font-black text-sm">
                    {medals[idx] || `${rank}위`}
                  </span>
                  <span className="truncate max-w-[120px]">{player.nickname}</span>
                  {isMe && (
                    <span className="text-[9px] bg-purple-200 text-purple-800 px-1 py-0.5 rounded">
                      나
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-semibold text-[11px]">
                    단어 {player.wordsUsed.length}개
                  </span>
                  <span className="font-mono font-black">{player.score}점</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rewards / Match Summary */}
        <div className="w-full grid grid-cols-3 gap-2 mb-6">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
            <div className="text-[10px] text-slate-400 font-bold">내 최종 순위</div>
            <div className="font-black text-sm text-[#1e2022]">{myRank}위</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
            <div className="text-[10px] text-slate-400 font-bold">획득 경험치</div>
            <div className="font-black text-sm text-purple-700">+{isWinner ? 50 : 20} EXP</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
            <div className="text-[10px] text-slate-400 font-bold">내 사용 단어</div>
            <div className="font-black text-sm text-indigo-700">{myPlayer?.wordsUsed.length || 0}개</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center gap-3">
          <button
            onClick={onLeaveToHome}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>홈으로</span>
          </button>
          <button
            onClick={onReturnToLobby}
            className="flex-1 py-3 px-4 rounded-xl bg-[#1e2022] hover:bg-black font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>대기실로</span>
          </button>
        </div>
      </div>
    </div>
  );
};
