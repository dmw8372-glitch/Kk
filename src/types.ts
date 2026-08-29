export type GameState = 'WAITING' | 'PLAYING' | 'FINISHED';

export interface Player {
  id: string;
  nickname: string;
  avatarColor: string;
  avatarAccessory?: string;
  level: number;
  isHost: boolean;
  isReady: boolean;
  isAlive: boolean;
  score: number;
  wordsUsed: string[];
  eliminatedReason?: string;
  turnOrder?: number;
  isBot?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor?: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface GameRoom {
  id: string; // Room Code e.g. "630157" or "A8F3K2"
  title: string;
  hostId: string;
  hostName: string;
  isPublic: boolean;
  maxPlayers: number;
  currentPlayers: Player[];
  status: GameState;
  currentTurnIndex: number;
  turnDuration: number; // 5 seconds
  wordChain: WordChainItem[];
  usedWords: string[];
  lastWord?: string;
  currentRequiredChars?: string[]; // e.g. ['리', '이'] for 두음법칙
  round: number;
  winner?: Player;
  createdAt: number;
  startTime?: number;
}

export interface WordChainItem {
  id: string;
  word: string;
  playerId: string;
  playerName: string;
  playerColor?: string;
  isDueum: boolean;
  matchedChar: string;
  definition?: string;
  pos?: string;
  timestamp: number;
}

export interface WordSense {
  senseNo?: number | string;
  definition: string;
  pos?: string;
  origin?: string;
  type?: string;
  link?: string;
}

export interface DictionaryWord {
  id?: string;
  word: string;
  supNo?: string | number; // 동음이의어 구분 번호 (예: 배¹, 배²)
  pos: string; // 품사: 명사, 의존명사, 대명사 등
  meaning: string;
  definitions?: string[]; // 다중 뜻풀이 목록
  senses?: WordSense[]; // 상세 뜻풀이 목록
  length: number;
  firstChar: string;
  lastChar: string;
  isRare?: boolean;
  isAttack?: boolean; // 한방 단어
  origin?: string; // 고유어, 한자어, 외래어
  targetCode?: number | string;
  link?: string;
  source?: 'STDICT' | 'WIKTIONARY' | 'LEXICON';
}

export interface UserStats {
  id?: string;
  nickname: string;
  avatarColor: string;
  level: number;
  exp: number;
  totalGames: number;
  wins: number;
  winRate: number;
  highestRank: number | string;
  currentStreak: number;
  maxStreak: number;
  wordsHistory: { word: string; count: number; lastUsed: number }[];
}

export interface PublicRoomSummary {
  id: string;
  title: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  status: GameState;
  isPublic: boolean;
}
