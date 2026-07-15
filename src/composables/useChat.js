// src/composables/useChat.js
import { ref } from 'vue'
import { createChatDirect } from '@/services/openai'
import { answerFromLocalData } from '@/services/localQA'
import { getRecommendations } from '@/services/recommend'

function makeId() { return Math.random().toString(36).slice(2,9) }

export function useChat() {
  const messages = ref([]) // { id, role, content }
  const streaming = ref(false)
  const error = ref(null)
  let abortController = null

  function pushUser(text) {
    const m = { id: makeId(), role: 'user', content: text }
    messages.value.push(m)
    return m
  }

  function pushAssistantPlaceholder() {
    const m = { id: makeId(), role: 'assistant', content: '' }
    messages.value.push(m)
    return m
  }

  async function sendMessage(text, { qaMode = true, center = null } = {}) {
    if (!text) return
    console.log('[useChat] sendMessage called:', text, 'qaMode=', qaMode)
    error.value = null
    pushUser(text)

    if (qaMode) {
      // Directly stream from OpenAI using streamChat
      const assistantMsg = pushAssistantPlaceholder()
      streaming.value = true
      abortController = new AbortController()
      const onData = (chunk) => {
        assistantMsg.content += chunk
      }
      const onDone = () => {
        streaming.value = false
        abortController = null
      }
      const onError = (e) => {
        error.value = e?.message || String(e)
        streaming.value = false
        abortController = null
      }

      try {
          // First get server-side recommendations (nearest places) based on optional coordinates in the query
          // For simplicity, here we don't parse coords from text; you can pass center via options later.
          const recs = await getRecommendations(text, { topK: 5, lat: center?.lat, lon: center?.lon })
          console.log('[useChat] server recommendations:', recs)

          // Build prompt including server recommendations and stream via localQA
          const context = recs.map((it, i) => `${i+1}. [${it.__dataset}] ${it.name ?? it.title ?? ''} (${Math.round(it.__dist || 0)}m) - ${it.addr ?? ''}`).join('\n')
          const augmentedQuery = `${text}\n\n참고 데이터:\n${context}`
          await answerFromLocalData(augmentedQuery, {
            topK: 5,
            stream: true,
            onData,
            onDone,
            onError,
            signal: abortController.signal,
          })
      } catch (e) {
        if (e.name !== 'AbortError') onError(e)
      }
    } else {
      // 일반 채팅 (예: Direct OpenAI 호출)
      const assistantMsg = pushAssistantPlaceholder()
      try {
        const res = await createChatDirect(text, messages.value.map(m => ({ role: m.role, content: m.content })))
        const textResp = res?.choices?.[0]?.message?.content ?? res?.content ?? ''
        assistantMsg.content = textResp
      } catch (e) {
        error.value = e?.message || String(e)
      }
    }
  }

  function cancel() {
    if (abortController) {
      abortController.abort()
      abortController = null
      streaming.value = false
    }
  }

  return {
    messages,
    streaming,
    error,
    sendMessage,
    cancel,
  }
}