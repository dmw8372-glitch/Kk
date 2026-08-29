import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Sparkles, ExternalLink, Loader2, BookOpen, Scale, X, ArrowRight } from 'lucide-react';
import { DictionaryWord } from '../types';
import { fetchDictionarySearchResults, exploreDictionaryWords } from '../lib/dictionaryData';
import { getValidStartingChars } from '../lib/hangulRules';
import { sounds } from '../lib/soundEffects';

interface DictionaryViewProps {
  initialSearch?: string;
}

export const DictionaryView: React.FC<DictionaryViewProps> = ({ initialSearch = '' }) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [submittedQuery, setSubmittedQuery] = useState(initialSearch);
  
  // Real API word list (Search results or Explore list)
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [explorePage, setExplorePage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedWord, setSelectedWord] = useState<DictionaryWord | null>(null);

  // References for request versioning and aborting in-flight requests (Race Condition Prevention)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestRequestIdRef = useRef<number>(0);
  const currentQueryRef = useRef<string>(initialSearch);

  // Execute Search Function (With strict race-condition guards & cancellation)
  const executeSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    currentQueryRef.current = trimmed;
    setSubmittedQuery(trimmed);

    // Cancel any previous in-flight HTTP request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestId = ++latestRequestIdRef.current;
    setIsSearching(true);

    try {
      if (!trimmed) {
        // If query is empty, reset to explore page 1
        setExplorePage(1);
        setHasMore(true);
        const res = await exploreDictionaryWords(1, '', controller.signal);
        if (requestId === latestRequestIdRef.current && res.words.length > 0) {
          setWords(res.words);
          setSelectedWord(res.words[0]);
          setHasMore(res.hasMore);
        }
        return;
      }

      // 1. Direct call to STDict API search endpoint
      const res = await fetchDictionarySearchResults(trimmed, controller.signal);
      
      // If a newer search was initiated while waiting, ignore this response
      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      if (res.found && res.items.length > 0) {
        // Sort items so exact matches come first
        const sorted = [...res.items].sort((a, b) => {
          if (a.word === trimmed && b.word !== trimmed) return -1;
          if (b.word === trimmed && a.word !== trimmed) return 1;
          return 0;
        });

        setWords(sorted);
        setSelectedWord(sorted[0]);
        setHasMore(false);
      } else {
        // 2. If exact match not found, try start/explore prefix match
        const exploreRes = await exploreDictionaryWords(1, trimmed, controller.signal);
        if (requestId !== latestRequestIdRef.current) return;

        if (exploreRes.words.length > 0) {
          setWords(exploreRes.words);
          setSelectedWord(exploreRes.words[0]);
          setHasMore(exploreRes.hasMore);
        } else {
          setWords([]);
          setSelectedWord(null);
          setHasMore(false);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && requestId === latestRequestIdRef.current) {
        console.error('STDict API search error:', err);
        setWords([]);
      }
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsSearching(false);
      }
    }
  }, []);

  // 1. Initial Load: Load genuine words from STDict API Explore endpoint
  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
      executeSearch(initialSearch);
    } else {
      executeSearch('');
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [initialSearch, executeSearch]);

  // 2. Debounced search on typing
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed === currentQueryRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(trimmed);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, executeSearch]);

  // 3. Form Submit (Immediate search on Enter or button click)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playPop();
    executeSearch(searchQuery.trim());
  };

  // 4. Infinite Scroll: Load more words from API when scrolled near bottom (only in explore mode)
  const loadMoreWords = useCallback(async () => {
    if (isLoadingMore || !hasMore || searchQuery.trim().length > 0) return;

    setIsLoadingMore(true);
    try {
      const nextPage = explorePage + 1;
      const res = await exploreDictionaryWords(nextPage, '');

      if (res.words.length > 0) {
        setWords((prev) => {
          const map = new Map<string, DictionaryWord>();
          for (const w of prev) {
            const key = w.id || `${w.word}-${w.supNo || ''}-${w.meaning.slice(0, 10)}`;
            map.set(key, w);
          }
          for (const w of res.words) {
            const key = w.id || `${w.word}-${w.supNo || ''}-${w.meaning.slice(0, 10)}`;
            if (!map.has(key)) {
              map.set(key, w);
            }
          }
          return Array.from(map.values());
        });
        setExplorePage(nextPage);
        setHasMore(res.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more words on scroll:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, explorePage, searchQuery]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 80) {
      loadMoreWords();
    }
  };

  const handleSelectWord = (item: DictionaryWord) => {
    setSelectedWord(item);
    sounds.playPop();
  };

  const handleClear = () => {
    setSearchQuery('');
    executeSearch('');
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Main Container: Search & List (Left 2 Cols) + Detailed View (Right 1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Unified Search & Homonym/Word List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col gap-3">
            {/* Search Input Form (Instant Enter Key + Button + Debounced Real-time Query) */}
            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="국립국어원 표준국어대사전 단어 검색 (예: 가희, 배, 밤, 눈, 나무...)"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-semibold"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title="검색어 지우기"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-95 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>검색</span>
              </button>
            </form>

            {/* Status Line: Real-time API Feedback & Word Count */}
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-slate-800">
                  {submittedQuery ? `"${submittedQuery}" 검색 결과` : '전체 단어 목록'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[11px]">
                  {words.length}개 항목
                </span>
                {submittedQuery && words.length > 1 && (
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    (동음이의어가 각각 별도 항목으로 표시됩니다)
                  </span>
                )}
              </div>

              {isSearching && (
                <div className="flex items-center gap-1.5 text-purple-600 font-bold text-xs animate-pulse shrink-0">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>국립국어원 API 실시간 조회 중...</span>
                </div>
              )}
            </div>
          </div>

          {/* Word List with All Homonyms & Senses */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[580px] overflow-y-auto"
          >
            {words.length > 0 ? (
              <>
                {words.map((item, idx) => {
                  const isSelected =
                    selectedWord &&
                    selectedWord.word === item.word &&
                    (selectedWord.supNo === item.supNo ||
                      selectedWord.meaning === item.meaning ||
                      selectedWord.id === item.id);

                  const dueums = getValidStartingChars(item.lastChar);
                  const displaySupNo = item.supNo ? ` ${item.supNo}` : '';

                  return (
                    <button
                      key={item.id || `${item.word}-${item.supNo || ''}-${idx}`}
                      onClick={() => handleSelectWord(item)}
                      className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-purple-50/90 border-purple-400 shadow-xs ring-2 ring-purple-300'
                          : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div>
                        {/* Word Title + SupNo (동음이의어 어깨번호) + Pos */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-base text-[#1e2022]">
                              {item.word}
                              {displaySupNo && (
                                <sup className="text-purple-600 font-bold text-xs ml-0.5">
                                  {displaySupNo}
                                </sup>
                              )}
                            </span>
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                              {item.pos}
                            </span>
                            {item.origin && item.origin !== '표준어' && (
                              <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 text-[10px] font-bold rounded border border-purple-100">
                                {item.origin}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                            {item.senses && item.senses.length > 1
                              ? `뜻풀이 ${item.senses.length}개`
                              : '표준어'}
                          </span>
                        </div>

                        {/* Primary Definition */}
                        <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                          {item.meaning}
                        </p>
                      </div>

                      {/* Footer Info: Length, Last Char & Dueum */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                        <span>
                          {item.length}글자 · 끝 「<strong>{item.lastChar}</strong>」
                        </span>
                        {dueums.length > 1 ? (
                          <span className="text-purple-600 font-bold">
                            두음 연결: {dueums.join(', ')}
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-0.5">
                            상세보기 <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Infinite Scroll Indicator (when not actively searching a specific term) */}
                {!submittedQuery && (
                  <div className="col-span-full py-3 flex items-center justify-center text-xs text-slate-400 font-semibold gap-2">
                    {isLoadingMore ? (
                      <div className="flex items-center gap-1.5 text-purple-600">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>국립국어원 표준 단어를 계속 불러오는 중...</span>
                      </div>
                    ) : hasMore ? (
                      <span className="text-[11px] text-slate-400">
                        ↓ 아래로 스크롤하면 새로운 단어가 계속 추가됩니다
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        모든 단어를 불러왔습니다.
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="col-span-full py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <BookOpen className="w-10 h-10 text-slate-300" />
                <span className="text-xs font-semibold text-slate-600">
                  {isSearching
                    ? '국립국어원 표준국어대사전에서 단어를 검색하고 있습니다...'
                    : `"${submittedQuery || searchQuery}"에 해당하는 표준 단어가 없습니다.`}
                </span>
                {!isSearching && (
                  <p className="text-[11px] text-slate-400">
                    오타가 없는지 확인하거나 다른 표준어를 입력해보세요.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Selected Word Multi-definition & Homonym Deep Inspector */}
        <div className="flex flex-col gap-4">
          {selectedWord ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col gap-5 sticky top-20">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400">국립국어원 표준 정보</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold text-xs">
                    {selectedWord.pos}
                  </span>
                  {selectedWord.origin && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                      {selectedWord.origin}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-black text-3xl text-purple-900 tracking-tight flex items-center gap-1.5">
                    <span>{selectedWord.word}</span>
                    {selectedWord.supNo && (
                      <sup className="text-purple-600 font-extrabold text-base">
                        {selectedWord.supNo}
                      </sup>
                    )}
                  </h3>
                  <a
                    href={`https://stdict.korean.go.kr/search/searchResult.do?pageSize=10&searchKeyword=${encodeURIComponent(
                      selectedWord.word
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 hover:underline"
                  >
                    <span>사전 원문</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Multiple Definitions / Senses (한 단어의 여러 가지 뜻 전체 나열) */}
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                    <span>뜻풀이 ({selectedWord.senses?.length || (selectedWord.definitions?.length ?? 1)}개)</span>
                    {selectedWord.senses && selectedWord.senses.length > 1 && (
                      <span className="text-[10px] text-purple-600 font-bold">다의어</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                    {selectedWord.senses && selectedWord.senses.length > 0 ? (
                      selectedWord.senses.map((s, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-purple-700">
                            <span>{s.senseNo ? `${s.senseNo}번째 뜻` : `${idx + 1}.`}</span>
                            {s.pos && <span className="text-slate-400 font-semibold">[{s.pos}]</span>}
                          </div>
                          <p className="text-slate-800 font-medium leading-relaxed">{s.definition}</p>
                        </div>
                      ))
                    ) : selectedWord.definitions && selectedWord.definitions.length > 0 ? (
                      selectedWord.definitions.map((def, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed"
                        >
                          <p className="text-slate-800 font-medium">{def}</p>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed">
                        {selectedWord.meaning}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Table */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold mb-0.5">글자 수</div>
                  <div className="font-bold text-[#1e2022]">{selectedWord.length}글자</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold mb-0.5">어휘 어원</div>
                  <div className="font-bold text-[#1e2022]">{selectedWord.origin || '표준어'}</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold mb-0.5">첫 글자</div>
                  <div className="font-bold text-purple-700">「{selectedWord.firstChar}」</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-semibold mb-0.5">끝 글자</div>
                  <div className="font-bold text-indigo-700">「{selectedWord.lastChar}」</div>
                </div>
              </div>

              {/* Dueum Rule Information */}
              {(() => {
                const dueums = getValidStartingChars(selectedWord.lastChar);
                return (
                  <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100">
                    <div className="text-[11px] font-bold text-purple-900 mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span>다음 차례 연결 가능 첫 글자</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {dueums.map((char) => (
                        <span
                          key={char}
                          className="px-2 py-0.5 bg-white text-purple-800 font-black text-xs rounded-md shadow-2xs border border-purple-200"
                        >
                          「{char}」
                        </span>
                      ))}
                      {dueums.length > 1 && (
                        <span className="text-[10px] text-purple-700 font-semibold">
                          (두음법칙 적용)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                제공: <strong>국립국어원 표준국어대사전 Open API</strong>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 text-center text-slate-400 text-xs">
              단어를 선택하면 다중 뜻풀이와 사전 정보가 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {/* License & Source Notice */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 text-xs text-slate-500 flex-wrap">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-600 shrink-0" />
            <span>국립국어원 표준국어대사전 실시간 Open API 연동 (공공누리 제2유형)</span>
          </div>
          <a
            href="https://stdict.korean.go.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:underline text-[11px] flex items-center gap-0.5"
          >
            <span>표준국어대사전 웹사이트 바로가기</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
