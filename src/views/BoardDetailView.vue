<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const liked = ref(false)

const post = computed(() => ({
	id: route.params.id,
	title: '을지로4가역에서 저녁 약속하기 좋은 곳',
	meta: '맛집공유 · 익명',
	content: '대중교통 환승이 편하고, 한강까지 가기 쉬워서 모임 장소로 좋더라고요. 특히 저녁에는 조명이 예뻐서 사진도 잘 나옵니다.',
}))

const comments = ref([
	{ author: '민지', text: '저도 거기 자주 가요. 분위기 좋더라고요.' },
	{ author: '해준', text: '저녁에 가면 사람이 많아서 자리 잡는 게 조금 힘들어요.' },
])

function toggleLike() {
	liked.value = !liked.value
}
</script>

<template>
	<main class="detail-page">
		<section class="detail-shell">
			<RouterLink class="back-link" :to="{ name: 'board' }">← 목록으로 돌아가기</RouterLink>
			<h1>{{ post.title }}</h1>
			<p class="meta">{{ post.meta }}</p>
			<p class="content">{{ post.content }}</p>

			<div class="action-row">
				<button class="like-btn" @click="toggleLike">{{ liked ? '♥ 추천됨' : '♡ 추천하기' }}</button>
			</div>

			<div class="comment-section">
				<h2>댓글</h2>
				<div v-for="(comment, index) in comments" :key="index" class="comment-item">
					<strong>{{ comment.author }}</strong>
					<p>{{ comment.text }}</p>
				</div>
			</div>
		</section>
	</main>
</template>

<style scoped>
.detail-page {
	width: 100%;
	max-width: 900px;
	margin: 0 auto;
	padding: 24px 24px 72px;
	box-sizing: border-box;
}

.detail-shell {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 24px;
	border-radius: 24px;
	background: #fff;
	border: 1px solid #e2e8f0;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.05);
}

.back-link {
	color: #4f46e5;
	font-weight: 700;
}

.detail-shell h1 {
	margin: 0;
	font-size: 1.25rem;
	color: #0f172a;
}

.meta {
	margin: 0;
	color: #4f46e5;
	font-weight: 700;
}

.content {
	margin: 0;
	color: #475569;
	line-height: 1.8;
}

.action-row {
	display: flex;
	justify-content: flex-start;
}

.like-btn {
	padding: 10px 14px;
	border-radius: 999px;
	border: 1px solid #dbe3ee;
	background: #fff;
	font-weight: 700;
	color: #334155;
}

.comment-section {
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-top: 6px;
}

.comment-section h2 {
	margin: 0;
	font-size: 1rem;
	color: #0f172a;
}

.comment-item {
	padding: 12px 14px;
	border-radius: 14px;
	background: #f8fafc;
}

.comment-item strong {
	display: block;
	margin-bottom: 4px;
	color: #0f172a;
}

.comment-item p {
	margin: 0;
	color: #64748b;
}
</style>
