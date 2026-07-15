// src/composables/useChat.js
import { reactive, ref } from 'vue'
import { createChatDirect } from '@/services/openai'
import { answerFromLocalData } from '@/services/localQA'

function makeId() { return Math.random().toString(36).slice(2,9) }

export function useChat() {
  const messages = ref([]) // { id, role, content }
  const streaming = ref(false)
  const error = ref(null)
  let abortController = null

  function pushUser(text) {
    const m = reactive({ id: makeId(), role: 'user', content: text })
    messages.value.push(m)
    return m
  }

  function pushAssistantPlaceholder() {
    const m = reactive({ id: makeId(), role: 'assistant', content: '' })
    messages.value.push(m)
    return m
  }

  async function sendMessage(text, { qaMode = true, center = null } = {}) {
    if (!text) return
    console.log('[useChat] sendMessage called:', text, 'qaMode=', qaMode)
    error.value = null
    pushUser(text)

    if (qaMode) {
      // Use direct response mode for stability in QA flow.
      const assistantMsg = pushAssistantPlaceholder()
      streaming.value = true
      abortController = new AbortController()

      try {
          const answer = await answerFromLocalData(text, {
            topK: 5,
            center,
            stream: false,
            signal: abortController.signal,
          })
          assistantMsg.content = (answer || '').trim() || '응답을 생성하지 못했습니다. 다시 시도해 주세요.'
          streaming.value = false
          abortController = null
      } catch (e) {
        if (e.name !== 'AbortError') {
          error.value = e?.message || String(e)
          if (!assistantMsg.content.trim()) {
            assistantMsg.content = '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
          }
        }
        streaming.value = false
        abortController = null
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