// Cloudflare Pages Function: /api/dict/explore
// 국립국어원 표준국어대사전 실시간 단어 탐색 Edge API

interface Env {
  STDICT_API_KEY?: string;
}

function cleanDictWord(rawWord: string): string {
  if (!rawWord) return '';
  return String(rawWord)
    .replace(/[0-9\-^_ㆍ~^ \t]/g, '')
    .trim();
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const url = new URL(context.request.url);
  const rawQuery = url.searchParams.get('q') || '';
  const query = cleanDictWord(rawQuery);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const num = Math.min(30, Math.max(10, parseInt(url.searchParams.get('num') || '20', 10)));
  const apiKey = context.env.STDICT_API_KEY || '4AF7F0CC6C8C1EA6D482DA8D117613F4';

  const defaultStarterChars = [
    '가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하',
    '수', '물', '벌', '박', '봄', '별', '달', '산', '해', '구', '눈', '꽃', '나무', '바람', '구름',
  ];
  const searchWord = query || defaultStarterChars[(page - 1) % defaultStarterChars.length];

  try {
    const searchMethod = query ? 'include' : 'start';
    const exploreUrl = `https://stdict.korean.go.kr/api/search.do?key=${encodeURIComponent(
      apiKey
    )}&q=${encodeURIComponent(
      searchWord
    )}&req_type=json&advanced=y&method=${searchMethod}&type1=word&start=${page}&num=${num}`;

    const exploreRes = await fetch(exploreUrl);
    if (exploreRes.ok) {
      const data: any = await exploreRes.json();
      let apiItems: any[] = [];

      if (Array.isArray(data?.channel?.item)) {
        apiItems = data.channel.item;
      } else if (data?.channel?.item && typeof data.channel.item === 'object') {
        apiItems = [data.channel.item];
      }

      if (apiItems.length > 0) {
        const formattedWords = apiItems
          .map((it: any, idx: number) => {
            const cleanWord = cleanDictWord(it.word || '');
            if (!cleanWord || /[^가-힣]/.test(cleanWord)) return null;

            const supNo = it.sup_no ? String(it.sup_no) : '';
            const itPos = it.pos || '명사';
            let itOrigin = it.origin || '';

            const itemSenses: any[] = [];
            if (Array.isArray(it.sense)) {
              it.sense.forEach((s: any, sIdx: number) => {
                const def = String(s.definition || '').trim();
                if (def) {
                  if (!itOrigin && s.origin) itOrigin = s.origin;
                  itemSenses.push({
                    senseNo: s.sense_no || sIdx + 1,
                    definition: def,
                    pos: itPos,
                    origin: s.origin || itOrigin || '표준어',
                    type: s.type || '일반어',
                    link: s.link || 'https://stdict.korean.go.kr',
                  });
                }
              });
            } else if (it.sense && typeof it.sense === 'object') {
              const def = String(it.sense.definition || '').trim();
              if (def) {
                if (!itOrigin && it.sense.origin) itOrigin = it.sense.origin;
                itemSenses.push({
                  senseNo: it.sense.sense_no || 1,
                  definition: def,
                  pos: itPos,
                  origin: it.sense.origin || itOrigin || '표준어',
                  type: it.sense.type || '일반어',
                  link: it.sense.link || 'https://stdict.korean.go.kr',
                });
              }
            }

            const definitions = itemSenses.map((s, sIdx) => `${sIdx + 1}. ${s.definition}`);
            const primaryMeaning = itemSenses[0]?.definition || '국립국어원 표준국어대사전에 등재된 단어입니다.';

            return {
              id: `${cleanWord}-${supNo || idx}-${it.target_code || idx}`,
              word: cleanWord,
              supNo,
              pos: itPos,
              meaning: primaryMeaning,
              definitions: definitions.length > 0 ? definitions : [primaryMeaning],
              senses: itemSenses,
              length: cleanWord.length,
              firstChar: cleanWord[0],
              lastChar: cleanWord[cleanWord.length - 1],
              origin: itOrigin || '표준어',
              targetCode: it.target_code,
              source: 'STDICT',
            };
          })
          .filter(Boolean);

        return new Response(
          JSON.stringify({
            words: formattedWords,
            hasMore: formattedWords.length >= num,
            page,
          }),
          {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }
    }
  } catch (err) {
    console.warn('Explore function error:', err);
  }

  return new Response(
    JSON.stringify({
      words: [],
      hasMore: false,
      page,
    }),
    {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    }
  );
}
