<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BoardList from '@/components/board/BoardList.vue'

const router = useRouter()
const selectedCategory = ref('')

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
				<div class="list-controls">
					<select v-model="selectedCategory" class="category-select">
						<option value="">전체 카테고리</option>
						<option value="자유">자유</option>
						<option value="관광지">관광지</option>
						<option value="문화시설">문화시설</option>
						<option value="레포츠">레포츠</option>
						<option value="쇼핑">쇼핑</option>
						<option value="숙박">숙박</option>
						<option value="축제공연행사">축제공연행사</option>
					</select>
				</div>
				<BoardList :category="selectedCategory" @view="onView" @create="onCreate" @deleted="() => {}" />
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

.list-controls { display:flex; justify-content:flex-end; margin-bottom:8px }
.category-select { padding:8px 10px; border-radius:8px; border:1px solid var(--border); background:var(--code-bg) }

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
