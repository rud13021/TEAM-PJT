// src/services/openai.js

const OPENAI_BASE = 'https://api.openai.com/v1'
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'
const TEMPERATURE = Number(import.meta.env.VITE_OPENAI_TEMPERATURE ?? 0.7)

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

export async function createChatDirect(message, history = []) {
  const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: MODEL,
      temperature: TEMPERATURE,
      messages: [
        ...history,
        {
          role: 'user',
          content: message,
        },
      ],
    }),
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
    const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: getHeaders(true),
      signal,
      body: JSON.stringify({
        model: MODEL,
        temperature: TEMPERATURE,
        stream: true,
        messages: [
          ...history,
          {
            role: 'user',
            content: message,
          },
        ],
      }),
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

            const content =
              json.choices?.[0]?.delta?.content ??
              json.choices?.[0]?.message?.content

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