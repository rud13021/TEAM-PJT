<script setup>
import { ref, computed } from 'vue'
import { useChat } from '@/composables/useChat'

const { messages, sendMessage, streaming, error } = useChat()

const chatInput = ref('')

const suggestedPrompts = [
  '을지로3가역 근처 소셜 모임 추천',
  '성수동 이색 팝업 위주 당일 동선',
  '서울역 근처 쇼핑할 곳 알려줘'
]

const isEmpty = computed(() => chatInput.value.trim() === '')

function onSend() {
  const text = chatInput.value.trim()

  if (!text || streaming.value) return

  sendMessage(text, { qaMode: true })

  chatInput.value = ''
}

function triggerPrompt(prompt) {
  chatInput.value = prompt
  onSend()
}
</script>

<template>
  <main class="chat-page">
    <section class="chat-shell">
      <div class="chat-header">
        <div>
          <p class="chat-eyebrow">AI 플래너 챗봇</p>
          <h1>약속 장소와 동선을 자연스럽게 설계합니다</h1>
        </div>

        <span class="chat-badge">
          {{ streaming ? '응답 생성 중...' : '실시간 응답형' }}
        </span>
      </div>

      <div class="chat-window">
        <div v-if="error" class="chat-error">
          {{ error }}
        </div>

        <div
          v-for="(message, index) in messages"
          :key="message.id ?? index"
          :class="[
            'chat-bubble',
            message.role === 'user'
              ? 'chat-bubble--user'
              : 'chat-bubble--bot',
          ]"
        >
          {{ message.content }}
        </div>
      </div>

      <div class="prompt-row">
        <button
          v-for="prompt in suggestedPrompts"
          :key="prompt"
          class="prompt-chip"
          :disabled="streaming"
          @click="triggerPrompt(prompt)"
        >
          {{ prompt }}
        </button>
      </div>

      <div class="chat-input-row">
        <input
          v-model="chatInput"
          type="text"
          placeholder="질문을 입력해 주세요."
          :disabled="streaming"
          @keyup.enter="onSend"
        />

        <button
          :disabled="isEmpty || streaming"
          @click="onSend"
        >
          {{ streaming ? '응답 중...' : '전송' }}
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.chat-page {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 24px 72px;
  box-sizing: border-box;
}

.chat-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 28px;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.05);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.chat-eyebrow {
  margin: 0 0 6px;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #4f46e5;
}

.chat-header h1 {
  margin: 0;
  font-size: 1.3rem;
  color: #0f172a;
}

.chat-badge {
  padding: 8px 12px;
  background: #eef2ff;
  color: #4338ca;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
}

.chat-window {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border-radius: 20px;
  background: #f8fafc;
  min-height: 360px;
  max-height: 600px;
  overflow-y: auto;
}

.chat-bubble {
  max-width: 80%;
  padding: 12px 14px;
  border-radius: 16px;
  line-height: 1.6;
  font-size: 0.95rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.chat-error {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #fecaca;
  background: #fff1f2;
  color: #9f1239;
  font-size: 0.9rem;
}

.chat-bubble--bot {
  background: #fff;
  color: #334155;
  border: 1px solid #e2e8f0;
}

.chat-bubble--user {
  margin-left: auto;
  background: #4f46e5;
  color: #fff;
}

.prompt-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prompt-chip {
  padding: 8px 12px;
  border: 1px solid #dbe3ee;
  background: #fff;
  border-radius: 999px;
  color: #334155;
  cursor: pointer;
  transition: 0.2s;
}

.prompt-chip:hover:not(:disabled) {
  background: #eef2ff;
}

.prompt-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-input-row {
  display: flex;
  gap: 10px;
}

.chat-input-row input {
  flex: 1;
  padding: 12px 14px;
  border-radius: 999px;
  border: 1px solid #dbe3ee;
  background: #f8fafc;
}

.chat-input-row button {
  padding: 0 16px;
  border: none;
  border-radius: 999px;
  background: #4f46e5;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.chat-input-row button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .chat-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .chat-input-row {
    flex-direction: column;
  }
}
</style>