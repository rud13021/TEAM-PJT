<script setup>
const posts = [
	{
		id: 1,
		title: '을지로4가역에서 저녁 약속하기 좋은 곳',
		meta: '맛집공유 · 12분 전 · 익명',
		content: '대중교통 환승이 편하고, 한강까지 가기 쉬워서 모임 장소로 좋더라고요.',
	},
	{
		id: 2,
		title: '성수동 팝업 스팟 같이 가실 분',
		meta: '사진후기 · 1시간 전 · 익명',
		content: '주말에 가면 분위기 좋은 곳이 많아서 데이트 코스로 추천합니다.',
	},
]
</script>

<template>
	<main class="board-page">
		<section class="board-shell">
			<div class="board-header">
				<div>
					<p class="board-eyebrow">후기 커뮤니티</p>
					<h1>다른 사람들의 후기와 추천을 확인해보세요</h1>
				</div>
				<RouterLink class="write-btn" :to="{ name: 'board-write' }">글쓰기</RouterLink>
			</div>

			<div class="post-list">
				<RouterLink v-for="post in posts" :key="post.id" class="post-card" :to="{ name: 'board-detail', params: { id: post.id } }">
					<p class="post-meta">{{ post.meta }}</p>
					<h2>{{ post.title }}</h2>
					<p class="post-content">{{ post.content }}</p>
				</RouterLink>
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
