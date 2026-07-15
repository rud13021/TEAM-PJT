<script setup>
import { computed, ref } from 'vue'

const chatMessages = ref([
	{ role: 'bot', text: '안녕하세요! 서울에서 약속 장소를 정할 때, 어떤 분위기를 원하시나요?' },
])
const chatInput = ref('')
const suggestedPrompts = [
	'가장 평등한 거점으로 계산해줘',
	'을지로3가역 근처 소셜 모임 추천',
	'용산 근처 30대 데이트 맛집 코스',
	'성수동 이색 팝업 위주 당일 동선',
]

const isEmpty = computed(() => chatInput.value.trim() === '')

function sendMessage() {
	const text = chatInput.value.trim()
	if (!text) return

	chatMessages.value.push({ role: 'user', text })
	chatInput.value = ''

	setTimeout(() => {
		chatMessages.value.push({
			role: 'bot',
			text: '추천 기준에 맞춰 약속 거점을 정리해드릴게요. 지금은 서울 중심부의 접근성과 식사·문화시설 균형을 기준으로 을지로4가역을 우선적으로 제안합니다.',
		})
	}, 650)
}

function triggerPrompt(prompt) {
	chatInput.value = prompt
	sendMessage()
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
				<span class="chat-badge">실시간 응답형</span>
			</div>

			<div class="chat-window">
				<div v-for="(message, index) in chatMessages" :key="index" :class="['chat-bubble', message.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--bot']">
					{{ message.text }}
				</div>
			</div>

			<div class="prompt-row">
				<button v-for="prompt in suggestedPrompts" :key="prompt" class="prompt-chip" @click="triggerPrompt(prompt)">
					{{ prompt }}
				</button>
			</div>

			<div class="chat-input-row">
				<input v-model="chatInput" type="text" placeholder="질문을 입력해 주세요" @keyup.enter="sendMessage" />
				<button :disabled="isEmpty" @click="sendMessage">전송</button>
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
}

.chat-bubble {
	max-width: 80%;
	padding: 12px 14px;
	border-radius: 16px;
	line-height: 1.6;
	font-size: 0.95rem;
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
