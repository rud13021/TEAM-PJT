// src/services/localQA.js

import localSearch from '@/services/localSearch'
import { streamChat, createChatDirect } from '@/services/openai'

function formatContext(items) {
  if (!items?.length) return ''

  return items
    .map((it, index) => {
      const name = it.name ?? it.title ?? it.placeName ?? '이름 없음'
      const addr = it.addr ?? it.addr1 ?? ''
      const desc = (
        it.overview ??
        it.description ??
        it.info ??
        ''
      )
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300)

      const dist =
        Number.isFinite(it.__dist) && it.__dist !== Infinity
          ? `${Math.round(it.__dist)}m`
          : ''

      return `${index + 1}. [${it.__dataset}] ${name} ${dist}
주소: ${addr}
설명: ${desc}`
    })
    .join('\n\n')
}

export async function answerFromLocalData(
  query,
  {
    topK = 5,
    center = null,
    radiusMeters = 2000,
    stream = true,
    onData,
    onDone,
    onError,
    signal,
  } = {}
) {
  try {
    const items = await localSearch(query, {
      topK,
      center,
      radiusMeters,
    })

    const context = formatContext(items)

    const systemPrompt = `
당신은 서울 관광 및 약속 장소 추천 AI입니다.

규칙
1. 반드시 아래의 검색 결과만 사용하세요.
2. 검색 결과에 없는 내용은 절대 생성하지 마세요.
3. 외부 지식을 사용하지 마세요.
4. 검색 결과가 없으면 "데이터에 해당 정보가 없습니다."라고 답하세요.
5. 답변 마지막에는 반드시 [출처]를 표시하세요.
`.trim()

    const userPrompt = `
질문
${query}

검색 결과
${context || '검색 결과 없음'}
`.trim()

    if (import.meta.env.DEV) {
      console.log('[localQA] query:', query)
      console.log('[localQA] matched items:', items)
    }

    if (stream) {
      await streamChat(
        {
          message: userPrompt,
          history: [
            {
              role: 'system',
              content: systemPrompt,
            },
          ],
        },
        {
          onData,
          onDone,
          onError,
          signal,
        }
      )
      return
    }

    const res = await createChatDirect(userPrompt, [
      {
        role: 'system',
        content: systemPrompt,
      },
    ])

    return res?.choices?.[0]?.message?.content ?? ''
  } catch (err) {
    console.error('[localQA]', err)
    onError?.(err)
    throw err
  }
}

export default answerFromLocalData