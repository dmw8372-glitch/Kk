import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageCircle, AlertCircle, CheckCircle2, XCircle, BookOpen, Volume2, VolumeX, ShieldAlert, Sparkles, LogOut } from 'lucide-react';
import { GameRoom, Player, ChatMessage, WordChainItem } from '../types';
import { MascotAvatar } from './MascotAvatar';
import { validateWordRules, getValidStartingChars } from '../lib/hangulRules';
import { checkWordInDictionary, DICTIONARY_DATABASE } from '../lib/dictionaryData';
import { sounds } from '../lib/soundEffects';

interface GameViewProps {
  room: GameRoom;
  currentPlayerId: string;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSubmitWord: (word: string, isDueum: boolean, matchedChar: string, definition?: string, pos?: string) => void;
  onPlayerTimeout: (playerId: string) => void;
  onLeaveRoom: () => void;
}

export const GameView: React.FC<GameViewProps> = ({
  room,
  currentPlayerId,
  chatMessages,
  onSendMessage,
  onSubmitWord,
  onPlayerTimeout,
  onLeaveRoom,
}) => {
  const [inputText, setInputText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Dynamic Turn Duration: Starts at 15.0s, reduces by 0.2s per word in chain, min 5.0s
  const currentChainLength = room.wordChain ? room.wordChain.length : 0;
  const maxTurnDuration = Math.max(5.0, Number((15.0 - currentChainLength * 0.2).toFixed(1)));

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<number>(maxTurnDuration);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Active player identification
  const activePlayer = room.currentPlayers[room.currentTurnIndex];
  const isMyTurn = activePlayer?.id === currentPlayerId && activePlayer?.isAlive;

  // Auto focus input on my turn
  useEffect(() => {
    if (isMyTurn) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isMyTurn, room.currentTurnIndex]);

  // Automated bot turn logic (Host executes for bot players)
  useEffect(() => {
    if (!activePlayer || !activePlayer.id.startsWith('bot_') || !activePlayer.isAlive) {
      return;
    }
    // Only host triggers bot turn to avoid duplicate submissions
    if (room.hostId !== currentPlayerId) {
      return;
    }

    const botDelay = Math.max(1000, Math.min(maxTurnDuration * 0.45 * 1000, 2800));
    const botTimer = setTimeout(() => {
      const lastChar = room.lastWord
        ? room.lastWord[room.lastWord.length - 1]
        : room.starterChar || null;
      const validChars = lastChar ? getValidStartingChars(lastChar) : [];

      let candidate: any = null;
      if (!lastChar) {
        const starters = DICTIONARY_DATABASE.filter((w) => w.word.length >= 2);
        candidate = starters[Math.floor(Math.random() * starters.length)];
      } else {
        const available = DICTIONARY_DATABASE.filter(
          (w) =>
            w.word.length >= 2 &&
            validChars.includes(w.word[0]) &&
            !room.usedWords.includes(w.word)
        );
        if (available.length > 0) {
          candidate = available[Math.floor(Math.random() * available.length)];
        } else {
          // If no dictionary match found in static database, generate a valid Hangul word
          const endings = ['박', '수', '도', '기', '과', '원', '문', '리', '화', '산', '물'];
          const randEnd = endings[Math.floor(Math.random() * endings.length)];
          candidate = {
            word: `${validChars[0]}${randEnd}`,
            meaning: '국립국어원 표준어',
            pos: '명사',
          };
        }
      }

      if (candidate) {
        const ruleRes = validateWordRules(candidate.word, room.lastWord, room.usedWords);
        if (ruleRes.valid) {
          sounds.playCorrect();
          onSubmitWord(
            candidate.word,
            ruleRes.isDueum ?? false,
            ruleRes.matchedChar ?? candidate.word[0],
            candidate.meaning,
            candidate.pos
          );
        }
      }
    }, botDelay);

    return () => clearTimeout(botTimer);
  }, [room.currentTurnIndex, activePlayer?.id, room.hostId, currentPlayerId, maxTurnDuration]);

  // Turn Countdown Timer (Dynamic 15.0s -> 5.0s with 0.2s decrement per turn)
  useEffect(() => {
    setTimeLeft(maxTurnDuration);
    setValidationError(null);

    if (timerRef.current) clearInterval(timerRef.current);

    const startTime = Date.now();
    const durationMs = maxTurnDuration * 1000;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (durationMs - elapsed) / 1000);
      setTimeLeft(remaining);

      // Play tick sound when urgent (<= 2.5s or <= 30% time)
      if (remaining <= Math.min(2.5, maxTurnDuration * 0.3) && remaining > 0) {
        sounds.playTick(true);
      }

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (activePlayer && activePlayer.isAlive && (isMyTurn || room.hostId === currentPlayerId)) {
          sounds.playWrong();
          onPlayerTimeout(activePlayer.id);
        }
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [room.currentTurnIndex, activePlayer?.id, currentChainLength, maxTurnDuration]);

  // Handle word submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMyTurn || isSubmitting) return;

    const trimmed = inputText.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setValidationError(null);

    // 1. Rule & Hangul & Dueum validation
    const ruleRes = validateWordRules(trimmed, room.lastWord, room.usedWords);
    if (!ruleRes.valid) {
      sounds.playWrong();
      setValidationError(ruleRes.reason || '규칙에 맞지 않는 단어입니다.');
      setIsSubmitting(false);
      return;
    }

    // 2. Dictionary existence check
    const dictRes = await checkWordInDictionary(trimmed);
    if (!dictRes.isValid) {
      sounds.playWrong();
      setValidationError('사전에 등재되지 않은 단어입니다.');
      setIsSubmitting(false);
      return;
    }

    // Success!
    sounds.playCorrect();
    onSubmitWord(
      trimmed,
      ruleRes.isDueum ?? false,
      ruleRes.matchedChar ?? trimmed[0],
      dictRes.wordInfo?.meaning,
      dictRes.wordInfo?.pos
    );

    setInputText('');
    setIsSubmitting(false);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  // Calculate valid starting characters for display
  const lastChar = room.lastWord
    ? room.lastWord[room.lastWord.length - 1]
    : room.starterChar || null;
  const validChars = lastChar ? getValidStartingChars(lastChar) : [];
  const hasDueum = validChars.length > 1;

  // Find current alive leader with highest score
  const maxScore = Math.max(...room.currentPlayers.map((p) => p.score));
  const leaderPlayerId =
    maxScore > 0 ? room.currentPlayers.find((p) => p.score === maxScore && p.isAlive)?.id : null;

  // Format 6-digit electronic score display (cyan for positive, red for negative with leading dimmed zeros)
  const renderLcdScore = (score: number) => {
    const isNegative = score < 0;
    const absScore = Math.abs(score);
    const totalDigits = 6;
    const scoreStr = absScore.toString();
    const leadingZerosCount = Math.max(
      0,
      (isNegative ? totalDigits - 1 : totalDigits) - scoreStr.length
    );
    const leadingZeros = '0'.repeat(leadingZerosCount);

    return (
      <div
        className={`inline-flex items-center justify-center font-mono font-black text-xs sm:text-sm px-2 py-0.5 rounded-lg border tracking-widest ${
          isNegative
            ? 'bg-[#150a0a] border-rose-900/60 shadow-inner'
            : 'bg-[#0a1515] border-cyan-900/60 shadow-inner'
        }`}
      >
        {isNegative && <span className="text-rose-500 font-bold mr-0.5">-</span>}
        <span className={isNegative ? 'text-rose-950 font-bold' : 'text-cyan-950 font-bold'}>
          {leadingZeros}
        </span>
        <span className={isNegative ? 'text-rose-400 font-black' : 'text-cyan-300 font-black'}>
          {scoreStr}
        </span>
      </div>
    );
  };

  // Last word item definition for sidebar
  const lastWordItem = room.wordChain[room.wordChain.length - 1];

  // In-game sound state
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  const toggleSound = () => {
    const next = !isSoundMuted;
    setIsSoundMuted(next);
    sounds.setMuted(next);
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-5 max-w-6xl mx-auto w-full">
      {/* Top In-Game Bar (Replaces global header during active gameplay for full focus) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs px-3 sm:px-5 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
            <span className="font-mono font-black text-base sm:text-lg text-[#1e2022]">
              {room.id}
            </span>
          </div>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="font-extrabold text-xs sm:text-sm text-slate-800 truncate max-w-[110px] sm:max-w-[200px]">
            {room.title}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-black text-[11px] sm:text-xs">
            {room.round}/{room.totalRounds || 3}R
          </span>
        </div>

        {/* Center: Round History Boxes (e.g. [수] [벌] [?]) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 mr-1 hidden sm:inline">제시어:</span>
          {(room.roundHistoryWords || [room.starterChar || '수', '?', '?']).map((char, idx) => (
            <div
              key={idx}
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                idx + 1 === room.round
                  ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-500 shadow-xs scale-105'
                  : char !== '?'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-white text-slate-400 border border-slate-200'
              }`}
            >
              {char}
            </div>
          ))}
        </div>

        {/* Right action controls: Sound, Chat, Leave Room */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Alive players count */}
          <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-600 bg-slate-100 px-2 sm:px-2.5 py-1.5 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              생존 {room.currentPlayers.filter((p) => p.isAlive).length}/{room.currentPlayers.length}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title={isSoundMuted ? '음소거 해제' : '음소거'}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Live Chat Toggle */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors relative cursor-pointer"
            title="채팅창"
          >
            <MessageCircle className="w-4 h-4" />
            {chatMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {/* Exit Game / Leave Room */}
          <button
            onClick={() => {
              if (window.confirm('게임을 나가시겠습니까? 진행 중인 점수는 저장되지 않을 수 있습니다.')) {
                onLeaveRoom();
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
            title="방 나가기"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">나가기</span>
          </button>
        </div>
      </div>

      {/* Main Arena Layout: Center Stage + History Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Left 3 cols: Main Game Stage */}
        <div className="lg:col-span-3 flex flex-col gap-3 sm:gap-5">
          {/* Word Board (Center Box) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#2a1b10] via-[#1c120a] to-[#120b06] border-4 border-[#8c6b3e] shadow-2xl p-4 sm:p-8 flex flex-col items-center justify-center min-h-[170px] sm:min-h-[220px]">
            {/* Corner Decorative Rivets */}
            <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#e2b76b] border border-[#523e1b] shadow-inner" />
            <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#e2b76b] border border-[#523e1b] shadow-inner" />
            <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#e2b76b] border border-[#523e1b] shadow-inner" />
            <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#e2b76b] border border-[#523e1b] shadow-inner" />

            {/* Word Chain Trace (Previous Words) */}
            <div className="flex items-center gap-1.5 mb-1.5 overflow-x-auto max-w-full pb-1">
              {room.wordChain.slice(-4).map((item, idx) => (
                <div key={item.id} className="flex items-center gap-1 shrink-0">
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/10 text-amber-200/90 text-[11px] sm:text-xs font-bold border border-white/10">
                    {item.word}
                  </span>
                  {idx < Math.min(room.wordChain.length - 1, 3) && (
                    <span className="text-amber-400 text-xs font-black">→</span>
                  )}
                </div>
              ))}
            </div>

            {/* Big Current Required Character Display (e.g. 「래」 or 「회」) */}
            <div className="my-1 sm:my-2 flex flex-col items-center">
              <motion.div
                key={lastChar || 'START'}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl sm:text-7xl font-black text-amber-400 tracking-tight drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]"
              >
                {lastChar ? lastChar : '첫 단어'}
              </motion.div>

              {/* Dueum Badges */}
              {hasDueum && (
                <motion.div
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mt-1 sm:mt-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-[11px] sm:text-xs shadow-md flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
                  <span>두음법칙: 「{validChars.join('」 / 「')}」 가능</span>
                </motion.div>
              )}
            </div>

            {/* Dynamic Countdown Progress Bar */}
            <div className="w-full max-w-md mt-2 sm:mt-4">
              <div className="flex justify-between items-center text-[11px] sm:text-xs font-extrabold mb-1">
                <span className={`flex items-center gap-1 transition-colors ${timeLeft <= Math.min(2.5, maxTurnDuration * 0.3) ? 'text-rose-400 animate-pulse' : 'text-amber-200'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  남은 시간 <span className="text-[9px] sm:text-[10px] text-amber-300/80 font-normal">({maxTurnDuration.toFixed(1)}s)</span>
                </span>
                <span className={`font-mono text-xs sm:text-sm font-black ${timeLeft <= Math.min(2.5, maxTurnDuration * 0.3) ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
                  {timeLeft.toFixed(1)}s
                </span>
              </div>
              <div className="w-full h-2.5 sm:h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-amber-900/50">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    timeLeft <= Math.min(2.5, maxTurnDuration * 0.3)
                      ? 'bg-gradient-to-r from-rose-600 to-red-500 shadow-lg shadow-rose-500/50'
                      : 'bg-gradient-to-r from-amber-400 to-yellow-300 shadow-md shadow-amber-400/30'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, (timeLeft / maxTurnDuration) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Player Pedestals Stage (Mobile-optimized tight grouping with sleeping & score drop animations) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs p-2.5 sm:p-5 w-full overflow-hidden">
            <div className="flex items-end justify-center gap-1.5 sm:gap-3 flex-wrap sm:flex-nowrap w-full">
              {room.currentPlayers.map((player) => {
                const isActive = player.id === activePlayer?.id;
                const isMe = player.id === currentPlayerId;
                const isSleeping = !player.isAlive;

                return (
                  <div
                    key={player.id}
                    className="flex flex-col items-center relative w-[80px] sm:w-auto sm:flex-1 sm:max-w-[130px]"
                  >
                    {/* Floating Dropping Penalty Score Banner on Elimination */}
                    <AnimatePresence>
                      {!player.isAlive && (
                        <motion.div
                          initial={{ y: -24, opacity: 0, scale: 1.4 }}
                          animate={{
                            y: [0, 6, 4],
                            opacity: [1, 1, 0.95],
                            rotate: [0, -8, 8, -4, 0],
                          }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white font-black text-[9px] sm:text-[10px] shadow-lg flex items-center gap-0.5 whitespace-nowrap ring-2 ring-white"
                        >
                          <span>-100pt</span>
                          <span>💤</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Speech Bubble / Latest Word */}
                    {player.wordsUsed.length > 0 && player.isAlive && (
                      <div className="mb-1.5 px-2 py-0.5 rounded-xl bg-[#1e2022] text-white text-[10px] sm:text-[11px] font-bold shadow-md max-w-full truncate text-center relative animate-in fade-in zoom-in-90 duration-150">
                        {player.wordsUsed[player.wordsUsed.length - 1]}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#1e2022] rotate-45" />
                      </div>
                    )}

                    {/* Pedestal Top Spotlight on Active Player */}
                    {isActive && player.isAlive && (
                      <motion.div
                        layoutId="activePedestal"
                        className="absolute -top-2 w-12 sm:w-16 h-2.5 sm:h-3 bg-gradient-to-r from-amber-300 to-yellow-400 rounded-full blur-xs shadow-lg"
                      />
                    )}

                    {/* Mascot Avatar with Sleeping state */}
                    <div className="relative mb-1.5 sm:mb-2">
                      <MascotAvatar
                        color={player.avatarColor}
                        size="sm"
                        isHost={player.isHost}
                        isAlive={player.isAlive}
                        isActiveTurn={isActive}
                        expression={player.isAlive ? (isActive ? 'happy' : 'smile') : 'sleeping'}
                      />
                    </div>

                    {/* Pedestal Stand (Podium with LCD score & status) */}
                    <div
                      className={`w-full rounded-xl sm:rounded-2xl p-1 sm:p-2 text-center transition-all relative ${
                        isActive && player.isAlive
                          ? 'bg-gradient-to-b from-indigo-50 to-purple-100 border-2 border-purple-400 shadow-md ring-2 ring-purple-300/50'
                          : !player.isAlive
                          ? 'bg-slate-100/90 border border-slate-200 opacity-75'
                          : 'bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {/* Leader Badge */}
                      {player.id === leaderPlayerId && player.isAlive && (
                        <div className="absolute -top-2 right-1 px-1 py-0.2 rounded-full bg-amber-500 text-amber-950 font-black text-[8px] sm:text-[9px] shadow-xs flex items-center gap-0.5 border border-amber-300">
                          <span>👑</span>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-0.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            player.isAlive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span className="font-extrabold text-[10px] sm:text-xs text-[#1e2022] truncate max-w-[55px] sm:max-w-[75px]">
                          {player.nickname}
                        </span>
                        {isMe && (
                          <span className="text-[8px] font-black text-purple-700 bg-purple-100 px-0.5 rounded">
                            나
                          </span>
                        )}
                      </div>

                      {/* 6-digit LCD Score Badge */}
                      <div className="my-0.5 flex justify-center scale-85 sm:scale-100 origin-center">
                        {renderLcdScore(player.score)}
                      </div>

                      {/* Sleeping / Elimination status */}
                      {!player.isAlive && (
                        <div className="text-[8px] sm:text-[9px] font-bold text-indigo-600 truncate mt-0.5 flex items-center justify-center gap-0.5">
                          <span>Zzz 잠자는 중</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Typing Input Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-3 sm:p-4 flex flex-col gap-2">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  disabled={!isMyTurn}
                  placeholder={
                    isMyTurn
                      ? lastChar
                        ? `「${validChars.join('」/「')}」로 시작하는 단어 입력`
                        : '첫 단어를 입력하세요 (2글자 이상)'
                      : `${activePlayer?.nickname || '상대방'} 차례입니다...`
                  }
                  className={`w-full px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-xl border text-sm sm:text-base font-bold transition-all focus:outline-none ${
                    isMyTurn
                      ? 'bg-white border-purple-400 focus:ring-4 focus:ring-purple-200/60 shadow-inner'
                      : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={!isMyTurn || isSubmitting || !inputText.trim()}
                className={`px-5 sm:px-8 py-3 sm:py-3.5 rounded-xl font-black text-sm sm:text-base transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 ${
                  isMyTurn && inputText.trim()
                    ? 'bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white shadow-md active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>전송</span>
              </button>
            </form>

            {/* Validation Feedback Banner */}
            {validationError && (
              <motion.div
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{validationError}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right 1 col: Word Definition & Live Chat */}
        <div className={`flex flex-col gap-3 sm:gap-4 ${chatOpen ? 'block' : 'hidden lg:flex'}`}>
          {/* Latest Word Dictionary Card (Image 3 right widget) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 mb-3">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-[#1e2022]">방금 나온 단어</h3>
            </div>

            {lastWordItem ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xl text-purple-800">
                    {lastWordItem.word}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px]">
                    {lastWordItem.pos || '명사'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {lastWordItem.definition || '표준국어대사전 및 우리말샘 등재 어휘.'}
                </p>

                <div className="text-[11px] text-slate-400 font-semibold flex justify-between pt-1">
                  <span>입력: {lastWordItem.playerName}</span>
                  {lastWordItem.isDueum && (
                    <span className="text-purple-600 font-bold">두음법칙 적용</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">
                첫 번째 단어를 입력하면<br />사전 정보가 표시됩니다.
              </div>
            )}
          </div>

          {/* In-Game Live Chat Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col flex-1 min-h-[260px]">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 mb-2">
              <MessageCircle className="w-4 h-4 text-slate-600" />
              <h4 className="font-bold text-xs text-[#1e2022]">실시간 채팅</h4>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1 max-h-[220px]">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.senderId === currentPlayerId ? 'items-end' : 'items-start'
                  }`}
                >
                  <span className="text-[9px] text-slate-400 font-semibold">
                    {msg.senderName}
                  </span>
                  <div
                    className={`px-2.5 py-1 rounded-lg max-w-[90%] text-xs break-words ${
                      msg.senderId === currentPlayerId
                        ? 'bg-[#1e2022] text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="pt-2 border-t border-slate-100 flex gap-1.5 mt-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="채팅..."
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="p-1.5 bg-[#1e2022] text-white rounded-lg hover:bg-black transition-colors"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
