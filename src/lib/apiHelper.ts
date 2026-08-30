import { GameRoom } from '../types';

/**
 * Safely resolves relative API URLs to absolute URLs in browser, iframe, and preview environments.
 */
export function buildApiUrl(path: string): string {
  if (!path) return '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  try {
    if (
      typeof window !== 'undefined' &&
      window.location &&
      window.location.origin &&
      window.location.origin !== 'null' &&
      !window.location.origin.startsWith('blob:') &&
      !window.location.origin.startsWith('about:')
    ) {
      return `${window.location.origin}${cleanPath}`;
    }
  } catch {
    // fallback
  }
  return cleanPath;
}

export const DEFAULT_SEED_ROOMS: GameRoom[] = [
  {
    id: 'KOREA1',
    title: '🟢 [초보/모두 환영] 끝말잇기 한판!',
    hostId: 'bot_host_1',
    hostName: '초보도우미',
    status: 'WAITING',
    currentPlayers: [
      {
        id: 'bot_host_1',
        nickname: '초보도우미',
        avatarColor: 'mint',
        isHost: true,
        isReady: true,
        isAlive: true,
        score: 0,
        wordsUsed: [],
        level: 3,
      },
    ],
    maxPlayers: 8,
    isPublic: true,
    turnDuration: 15.0,
    totalRounds: 3,
    roundTime: 90,
    round: 1,
    currentTurnIndex: 0,
    usedWords: [],
    wordChain: [],
    createdAt: Date.now(),
  },
  {
    id: 'SPEED9',
    title: '⚡ [스피드전] 5초 타임어택 대전',
    hostId: 'bot_host_2',
    hostName: '스피드킹',
    status: 'WAITING',
    currentPlayers: [
      {
        id: 'bot_host_2',
        nickname: '스피드킹',
        avatarColor: 'yellow',
        isHost: true,
        isReady: true,
        isAlive: true,
        score: 0,
        wordsUsed: [],
        level: 5,
      },
    ],
    maxPlayers: 8,
    isPublic: true,
    turnDuration: 15.0,
    totalRounds: 3,
    roundTime: 90,
    round: 1,
    currentTurnIndex: 0,
    usedWords: [],
    wordChain: [],
    createdAt: Date.now(),
  },
];
