import React, { useState } from 'react';
import { Globe, Users, Plus, RefreshCw, KeyRound, Search, ArrowRight, Play, Sparkles, CheckCircle2, Shield, Lock } from 'lucide-react';
import { GameRoom, UserStats } from '../types';
import { MascotAvatar } from './MascotAvatar';
import { sounds } from '../lib/soundEffects';

interface GameRoomsViewProps {
  publicRooms: GameRoom[];
  userStats: UserStats;
  onRefreshRooms: () => void;
  isRefreshing: boolean;
  onCreateRoom: (title: string, maxPlayers: number, isPublic: boolean) => void;
  onJoinRoom: (roomId: string) => void;
}

export const GameRoomsView: React.FC<GameRoomsViewProps> = ({
  publicRooms,
  userStats,
  onRefreshRooms,
  isRefreshing,
  onCreateRoom,
  onJoinRoom,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWaitingOnly, setFilterWaitingOnly] = useState(false);

  // Direct code input state
  const [directCode, setDirectCode] = useState('');

  // Create room form state
  const [roomTitle, setRoomTitle] = useState(`${userStats.nickname}님의 방`);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [isPublic, setIsPublic] = useState(true);

  // Filtered rooms
  const filteredRooms = publicRooms.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.includes(searchQuery) ||
      r.hostName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterWaitingOnly ? r.status === 'WAITING' : true;
    return matchesSearch && matchesFilter;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomTitle.trim()) return;
    sounds.playPop();
    onCreateRoom(roomTitle.trim(), maxPlayers, isPublic);
  };

  const handleDirectJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = directCode.trim();
    if (!code) return;
    sounds.playPop();
    onJoinRoom(code);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Top Banner & Quick Join Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-3.5" />
              실시간 자동 갱신
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Supabase Realtime + SSE 듀얼 동기화</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1e2022]">
            끝말잇기 대기실 & 방 목록
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            개설된 공개 방에 바로 입장하거나, 우측에서 새로운 방을 만들어 친구를 초대해보세요.
          </p>
        </div>

        {/* Direct Code Join Form */}
        <form
          onSubmit={handleDirectJoinSubmit}
          className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 shrink-0"
        >
          <div className="flex items-center gap-1.5 pl-2 text-slate-400">
            <KeyRound className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">방 코드:</span>
          </div>
          <input
            type="text"
            maxLength={6}
            value={directCode}
            onChange={(e) => setDirectCode(e.target.value.trim().toUpperCase())}
            placeholder="6자리 코드"
            className="w-28 px-2.5 py-2 text-center text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={directCode.length < 4}
            className="px-4 py-2 bg-[#1e2022] hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            입장
          </button>
        </form>
      </div>

      {/* Main 2-Column Grid: Left (Public Rooms List) + Right (Create Room) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Public Rooms List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Controls Bar: Search + Filter + Refresh */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="방 이름, 방장 닉네임, 방 번호 검색..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            {/* Filter Chips & Refresh Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setFilterWaitingOnly(!filterWaitingOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterWaitingOnly
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                대기 중만 보기
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  onRefreshRooms();
                }}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                title="방 목록 즉시 새로고침"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
                <span className="hidden sm:inline">새로고침</span>
              </button>
            </div>
          </div>

          {/* Rooms List */}
          <div className="space-y-3">
            {filteredRooms.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-1">
                  <MascotAvatar color="yellow" size="md" expression="smile" />
                </div>
                <h3 className="font-extrabold text-base text-[#1e2022]">
                  {searchQuery ? '검색된 방이 없습니다.' : '현재 개설된 공개 방이 없습니다.'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  {searchQuery
                    ? '다른 검색어를 입력하시거나 필터를 해제해보세요.'
                    : '우측의 [새 방 만들기]에서 첫 번째 방을 개설하고 친구들을 초대해보세요!'}
                </p>
              </div>
            ) : (
              filteredRooms.map((r) => {
                const currentCount = r.currentPlayers?.length || 1;
                const isFull = currentCount >= r.maxPlayers;
                const isPlaying = r.status === 'PLAYING';

                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-purple-300 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      {/* Host Avatar preview */}
                      <div className="shrink-0">
                        <MascotAvatar
                          color={r.currentPlayers?.[0]?.avatarColor || 'white'}
                          size="sm"
                          expression="happy"
                        />
                      </div>

                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-black text-base text-[#1e2022] group-hover:text-purple-700 transition-colors truncate">
                            {r.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-bold text-[10px]">
                            #{r.id}
                          </span>
                          {isPlaying ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 font-bold text-[10px] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              게임 중
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              대기 중
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                          <span>방장: <strong className="text-slate-700">{r.hostName}</strong></span>
                          <span>•</span>
                          <span>
                            인원: <strong className="text-purple-700 font-bold">{currentCount}</strong> / {r.maxPlayers}명
                          </span>
                          <span>•</span>
                          <span>5초 룰</span>
                        </div>
                      </div>
                    </div>

                    {/* Join Button */}
                    <div className="w-full sm:w-auto flex items-center justify-end">
                      <button
                        disabled={isFull || isPlaying}
                        onClick={() => {
                          sounds.playPop();
                          onJoinRoom(r.id);
                        }}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                          isFull
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : isPlaying
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white active:scale-95 cursor-pointer'
                        }`}
                      >
                        <span>{isFull ? '만원' : isPlaying ? '진행 중' : '입장하기'}</span>
                        {!isFull && !isPlaying && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Create Room Card */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-purple-200/80 shadow-md p-6 flex flex-col gap-5 sticky top-20">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Plus className="w-4 h-4 font-black" />
                </div>
                <h2 className="font-black text-lg text-[#1e2022]">새 방 만들기</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[10px]">
                호스트 생성
              </span>
            </div>

            {/* Create Form */}
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              {/* Room Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  방 제목
                </label>
                <input
                  type="text"
                  maxLength={24}
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  placeholder="방 제목을 입력하세요"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
                  required
                />
              </div>

              {/* Max Players */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>최대 인원 설정</span>
                  <span className="text-purple-700 font-black">{maxPlayers}명</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 6, 8].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setMaxPlayers(count)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        maxPlayers === count
                          ? 'bg-[#1e2022] text-white shadow-xs scale-102 ring-2 ring-purple-400'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {count}명
                    </button>
                  ))}
                </div>
              </div>

              {/* Rule Summary */}
              <div className="bg-purple-50/60 rounded-xl p-3 border border-purple-100 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-purple-900">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>공식 게임 규칙 적용</span>
                </div>
                <ul className="text-[11px] text-slate-600 font-medium space-y-1 list-disc list-inside">
                  <li>타임어택 룰: <strong>15.0초 시작 → 턴마다 -0.2초 (최저 5.0초)</strong></li>
                  <li>국립국어원 표준국어대사전 실시간 검증</li>
                  <li>두음법칙 공식 허용 (리→이, 녀→여, 류→유 등)</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-black text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>방 만들기 및 대기실 입장</span>
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center font-medium">
              방 개설 후 친구에게 6자리 코드나 링크를 공유해 함께 즐겨보세요!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
