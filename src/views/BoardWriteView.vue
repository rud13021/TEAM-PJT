<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const title = ref('')
const content = ref('')
const author = ref('')

function submitPost() {
	if (!title.value.trim() || !content.value.trim() || !author.value.trim()) return
	router.push({ name: 'board' })
}
</script>

<template>
	<main class="board-write-page">
		<section class="board-write-shell">
			<p class="board-eyebrow">게시글 작성</p>
			<h1>익명으로 후기와 추천을 남겨보세요</h1>

			<div class="form-group">
				<label>제목</label>
				<input v-model="title" type="text" placeholder="예: 성수동 팝업 후기" />
			</div>

			<div class="form-group">
				<label>내용</label>
				<textarea v-model="content" rows="7" placeholder="후기나 추천 이유를 적어주세요"></textarea>
			</div>

			<div class="form-group">
				<label>작성자</label>
				<input v-model="author" type="text" placeholder="닉네임" />
			</div>

			<div class="actions">
				<RouterLink class="secondary-btn" :to="{ name: 'board' }">목록으로</RouterLink>
				<button class="primary-btn" @click="submitPost">등록하기</button>
			</div>
		</section>
	</main>
</template>

<style scoped>
.board-write-page {
	width: 100%;
	max-width: 900px;
	margin: 0 auto;
	padding: 24px 24px 72px;
	box-sizing: border-box;
}

.board-write-shell {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 24px;
	border-radius: 24px;
	background: #fff;
	border: 1px solid #e2e8f0;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.05);
}

.board-eyebrow {
	margin: 0;
	font-size: 0.78rem;
	font-weight: 800;
	letter-spacing: 0.2em;
	text-transform: uppercase;
	color: #4f46e5;
}

.board-write-shell h1 {
	margin: 0;
	font-size: 1.25rem;
	color: #0f172a;
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.form-group label {
	font-weight: 700;
	color: #334155;
}

.form-group input,
.form-group textarea {
	padding: 12px 14px;
	border-radius: 14px;
	border: 1px solid #dbe3ee;
	background: #f8fafc;
}

.actions {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	margin-top: 4px;
}

.secondary-btn,
.primary-btn {
	padding: 10px 14px;
	border-radius: 999px;
	font-weight: 700;
	border: none;
}

.secondary-btn {
	background: #e2e8f0;
	color: #334155;
}

.primary-btn {
	background: #4f46e5;
	color: #fff;
}
</style>
