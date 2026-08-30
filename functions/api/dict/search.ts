// Cloudflare Pages Function: /api/dict/search
// 국립국어원 표준국어대사전 및 우리말샘 실시간 단어 검색 Edge API

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
  const word = cleanDictWord(rawQuery);
  const apiKey = context.env.STDICT_API_KEY || '4AF7F0CC6C8C1EA6D482DA8D117613F4';

  if (!word) {
    return new Response(JSON.stringify({ found: false, items: [], total: 0 }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    let apiItems: any[] = [];
    const seenIds = new Set<string>();

    // 1. 국립국어원 표준국어대사전 Open API - exact 및 start 검색 병합
    try {
      const exactUrl = `https://stdict.korean.go.kr/api/search.do?key=${encodeURIComponent(
        apiKey
      )}&q=${encodeURIComponent(word)}&req_type=json&advanced=y&method=exact&type1=word&num=30`;

      const exactRes = await fetch(exactUrl);
      if (exactRes.ok) {
        const data: any = await exactRes.json();
        if (Array.isArray(data?.channel?.item)) {
          apiItems.push(...data.channel.item);
        } else if (data?.channel?.item && typeof data.channel.item === 'object') {
          apiItems.push(data.channel.item);
        }
      }

      const startUrl = `https://stdict.korean.go.kr/api/search.do?key=${encodeURIComponent(
        apiKey
      )}&q=${encodeURIComponent(word)}&req_type=json&advanced=y&method=start&type1=word&num=30`;

      const startRes = await fetch(startUrl);
      if (startRes.ok) {
        const startData: any = await startRes.json();
        const startItems = Array.isArray(startData?.channel?.item)
          ? startData.channel.item
          : startData?.channel?.item && typeof startData.channel.item === 'object'
          ? [startData.channel.item]
          : [];

        for (const item of startItems) {
          const code = item.target_code || item.word;
          if (!apiItems.some((ex) => (ex.target_code || ex.word) === code)) {
            apiItems.push(item);
          }
        }
      }
    } catch (e) {
      console.warn('STDict fetch error in Cloudflare Pages function:', e);
    }

    // 2. 우리말샘 fallback
    if (apiItems.length === 0) {
      try {
        const opendictUrl = `https://opendict.korean.go.kr/api/search?key=${encodeURIComponent(
          apiKey
        )}&q=${encodeURIComponent(word)}&req_type=json&advanced=y&method=exact&type1=word&num=30`;

        const openRes = await fetch(opendictUrl);
        if (openRes.ok) {
          const openData: any = await openRes.json();
          if (Array.isArray(openData?.channel?.item)) {
            apiItems.push(...openData.channel.item);
          } else if (openData?.channel?.item && typeof openData.channel.item === 'object') {
            apiItems.push(openData.channel.item);
          }
        }
      } catch (openErr) {
        // ignore
      }
    }

    // 3. 결과 파싱 및 가공
    if (apiItems.length > 0) {
      const formattedItems = apiItems
        .map((it: any, index: number) => {
          const cleanWord = cleanDictWord(it.word || word);
          if (!cleanWord) return null;

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
            id: `${cleanWord}-${supNo || index}-${it.target_code || index}`,
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

      const uniqueItems: any[] = [];
      for (const item of formattedItems) {
        const uniqueKey = item.targetCode
          ? `tc_${item.targetCode}`
          : `${item.word}_${item.supNo}_${item.meaning.slice(0, 15)}`;
        if (!seenIds.has(uniqueKey)) {
          seenIds.add(uniqueKey);
          uniqueItems.push(item);
        }
      }

      uniqueItems.sort((a, b) => {
        if (a.word === word && b.word !== word) return -1;
        if (b.word === word && a.word !== word) return 1;
        if (a.word.startsWith(word) && !b.word.startsWith(word)) return -1;
        if (b.word.startsWith(word) && !a.word.startsWith(word)) return 1;
        return a.word.length - b.word.length;
      });

      if (uniqueItems.length > 0) {
        return new Response(
          JSON.stringify({
            found: true,
            items: uniqueItems,
            total: uniqueItems.length,
            source: 'STDICT',
            attribution: '국립국어원 표준국어대사전 (CCL 2.0 KR)',
          }),
          {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }
    }

    // 4. Wiktionary fallback
    try {
      const wikiUrl = `https://ko.wiktionary.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(
        word
      )}&format=json&origin=*`;

      const wikiRes = await fetch(wikiUrl);
      if (wikiRes.ok) {
        const wikiData: any = await wikiRes.json();
        const pages = wikiData?.query?.pages || {};
        const pageKey = Object.keys(pages)[0];

        if (pageKey && pageKey !== '-1') {
          const page = pages[pageKey];
          const rawExtract = String(page.extract || '').trim();
          const cleanDef = rawExtract.replace(/\n+/g, ' ').slice(0, 300);

          return new Response(
            JSON.stringify({
              found: true,
              items: [
                {
                  id: `wiki-${word}`,
                  word,
                  pos: '명사',
                  meaning: cleanDef || `${word}: 한국어 사전에 등재된 단어입니다.`,
                  definitions: [cleanDef || `${word}: 한국어 사전에 등재된 단어입니다.`],
                  length: word.length,
                  firstChar: word[0],
                  lastChar: word[word.length - 1],
                  origin: '한국어 표제어',
                  source: 'WIKTIONARY',
                },
              ],
              total: 1,
              source: 'WIKTIONARY',
              attribution: '위키낱말사전 (CC-BY-SA 4.0)',
            }),
            {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            }
          );
        }
      }
    } catch {
      // ignore
    }

    return new Response(
      JSON.stringify({
        found: false,
        items: [],
        total: 0,
        message: '사전에 등재되지 않은 단어입니다.',
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        found: false,
        items: [],
        error: String(err?.message || err),
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}
