// src/services/localQA.js

import localSearch from '@/services/localSearch'
import { streamChat, createChatDirect } from '@/services/openai'

function extractTextContent(content) {
  if (!content) return ''
  if (typeof content === 'string') return content

  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (typeof part === 'string') return part
        return part?.text ?? ''
      })
      .join('')
  }

  if (typeof content === 'object') {
    return content.text ?? ''
  }

  return ''
}

function extractTextFromChatResponse(res) {
  const fromMessage = extractTextContent(res?.choices?.[0]?.message?.content)
  if (fromMessage) return fromMessage

  const fromDelta = extractTextContent(res?.choices?.[0]?.delta?.content)
  if (fromDelta) return fromDelta

  const fromOutputText = extractTextContent(res?.output_text)
  if (fromOutputText) return fromOutputText

  const fromOutputItems = extractTextContent(
    res?.output?.flatMap(item => item?.content ?? [])
  )
  if (fromOutputItems) return fromOutputItems

  return ''
}

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

function buildSources(items, max = 5) {
  if (!items?.length) return '[출처] 검색 결과 없음'

  const lines = items.slice(0, max).map((it, index) => {
    const name = it.name ?? it.title ?? it.placeName ?? '이름 없음'
    const addr = it.addr ?? it.addr1 ?? '주소 정보 없음'
    return `${index + 1}. ${name} — ${addr}`
  })

  return `[출처]\n${lines.join('\n')}`
}

function cleanAnswer(raw, items) {
  const fallback = `데이터에 해당 정보가 없습니다.\n\n${buildSources(items)}`
  if (!raw || !String(raw).trim()) return fallback

  let text = String(raw)
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (items?.length) {
    text = text.replace(/\s*데이터에 해당 정보가 없습니다\.?\s*/g, '').trim()
  }

  // Remove any existing source block to prevent duplicated or mixed citations.
  text = text.replace(/\n*\[출처\][\s\S]*$/m, '').trim()

  return `${text || '데이터에 해당 정보가 없습니다.'}\n\n${buildSources(items)}`
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

  절대 규칙
  1. 반드시 아래 검색 결과만 사용합니다.
  2. 검색 결과에 없는 장소/정보는 만들지 않습니다.
  3. 검색 결과가 없으면 정확히 "데이터에 해당 정보가 없습니다."만 출력합니다.
  4. 검색 결과가 있으면 추천은 최대 3곳만 제시합니다.
  5. 답변은 짧고 깔끔하게 한국어로 작성합니다.

  출력 형식
  - 첫 줄: 한 줄 요약
  - 본문: 번호 목록(1~3)로 장소명, 추천 이유 1줄, 주소
  - 마지막: [출처] 섹션
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
    const answer = extractTextFromChatResponse(res)

    if (import.meta.env.DEV) {
      console.log('[localQA] openai response:', res)
      console.log('[localQA] extracted answer:', answer)
    }

    return cleanAnswer(answer, items)
  } catch (err) {
    console.error('[localQA]', err)
    onError?.(err)
    throw err
  }
}

export default answerFromLocalData