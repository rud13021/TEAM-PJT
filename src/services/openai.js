// src/services/openai.js

const OPENAI_BASE = 'https://api.openai.com/v1'
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-5-mini'
const TEMPERATURE_ENV = import.meta.env.VITE_OPENAI_TEMPERATURE

function buildRequestBody({ message, history = [], stream = false }) {
  const body = {
    model: MODEL,
    ...(stream && { stream: true }),
    messages: [
      ...history,
      {
        role: 'user',
        content: message,
      },
    ],
  }

  // gpt-5-mini currently accepts only default temperature behavior.
  if (TEMPERATURE_ENV != null && !String(MODEL).startsWith('gpt-5')) {
    const parsed = Number(TEMPERATURE_ENV)
    if (Number.isFinite(parsed)) {
      body.temperature = parsed
    }
  }

  return body
}

function getHeaders(stream = false) {
  if (!API_KEY) {
    throw new Error('VITE_OPENAI_API_KEY is not set.')
  }

  return {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    ...(stream && { Accept: 'text/event-stream' }),
  }
}

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

export async function createChatDirect(message, history = []) {
  // 주소 변경: OPENAI_BASE 대신 Netlify 함수 주소 사용
  const response = await fetch('/.netlify/functions/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }), // 키 정보를 뺍니다!
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error)
  }

  return await response.json()
}

export async function streamChat(
  { message, history = [] },
  {
    onData,
    onDone,
    onError,
    signal,
  } = {}
) {
  try {
    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: getHeaders(true),
      signal,
      body: JSON.stringify(buildRequestBody({ message, history, stream: true })),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error)
    }

    if (!response.body) {
      throw new Error('Streaming response body is empty.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const events = buffer.split(/\r?\n\r?\n/)
      buffer = events.pop() ?? ''

      for (const event of events) {
        const lines = event.split(/\r?\n/)

        for (const line of lines) {
          if (!line.startsWith('data:')) continue

          const payload = line.replace(/^data:\s*/, '').trim()

          if (!payload) continue

          if (payload === '[DONE]') {
            onDone?.()
            return
          }

          try {
            const json = JSON.parse(payload)

            const rawContent =
              json.choices?.[0]?.delta?.content ??
              json.choices?.[0]?.message?.content

            const content = extractTextContent(rawContent)

            if (content) {
              onData?.(content)
            }
          } catch {
            // Ignore malformed SSE chunks
          }
        }
      }
    }

    onDone?.()
  } catch (err) {
    onError?.(err)
    throw err
  }
}