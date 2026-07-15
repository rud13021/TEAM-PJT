<script setup>
import { useRouter } from 'vue-router'
import BoardList from '@/components/board/BoardList.vue'

const router = useRouter()

function onView(id) {
	router.push({ name: 'board-detail', params: { id } })
}

function onCreate() {
	router.push({ name: 'board-write' })
}
</script>

<template>
	<main class="board-page">
		<section class="board-shell">
			<div class="board-header">
				<div>
					<p class="board-eyebrow">후기 커뮤니티</p>
					<h1>다른 사람들의 후기와 추천을 확인해보세요</h1>
				</div>
				<button class="write-btn" @click="onCreate">글쓰기</button>
			</div>

			<div class="post-list">
				<BoardList @view="onView" @create="onCreate" @deleted="() => {}" />
			</div>
		</section>
	</main>
</template>

<style scoped>
.board-page {
	width: 100%;
	max-width: 1100px;
	margin: 0 auto;
	padding: 24px 24px 72px;
	box-sizing: border-box;
}

.board-shell {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 24px;
	border-radius: 28px;
	background: #fff;
	border: 1px solid #e2e8f0;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.05);
}

.board-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
}

.board-eyebrow {
	margin: 0 0 6px;
	font-size: 0.78rem;
	font-weight: 800;
	letter-spacing: 0.2em;
	text-transform: uppercase;
	color: #4f46e5;
}

.board-header h1 {
	margin: 0;
	font-size: 1.3rem;
	color: #0f172a;
}

.write-btn {
	padding: 10px 14px;
	border-radius: 999px;
	background: #4f46e5;
	color: #fff;
	font-weight: 700;
}

.post-list {
	display: grid;
	gap: 12px;
}

.post-card {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 16px 18px;
	border-radius: 18px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	color: inherit;
}

.post-meta {
	margin: 0;
	font-size: 0.8rem;
	color: #4f46e5;
	font-weight: 700;
}

.post-card h2 {
	margin: 0;
	font-size: 1rem;
	color: #0f172a;
}

.post-content {
	margin: 0;
	color: #64748b;
	line-height: 1.6;
}

@media (max-width: 768px) {
	.board-header {
		flex-direction: column;
		align-items: flex-start;
	}
}
</style>
