<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFavoritesStore } from '../stores/favorites'
import { useRecommendStore } from '../stores/recommend'
import { shareToKakaoTalk } from '../services/kakaoShare'

const favoritesStore = useFavoritesStore()
const recommendStore = useRecommendStore()
const router = useRouter()

const favorites = computed(() => favoritesStore.items)

function formatDate(value) {
	if (!value) {
		return ''
	}

	return new Date(value).toLocaleString('ko-KR', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	})
}

function restoreRecommendation(item) {
	if (!item?.meta?.recommendation) {
		return
	}

	recommendStore.setSelectedRecommendation(item.meta.recommendation.id)
}

async function openFavorite(item) {
	restoreRecommendation(item)

	if (item.routeName) {
		await router.push({ name: item.routeName })
		return
	}

	if (item.kind === 'course') {
		await router.push({ name: 'recommend' })
	}
}

async function shareFavorite(item) {
	try {
		await shareToKakaoTalk(item)
	} catch (error) {
		console.error('Failed to share favorite:', error)
	}
}

function removeFavorite(item) {
	favoritesStore.removeFavorite(item.key)
}
</script>

<template>
	<main class="favorites-page">
		<section class="favorites-hero">
			<div>
				<p class="favorites-hero__eyebrow">Favorites</p>
				<h1>저장한 목적지와 여행 코스를 한곳에서 확인하세요.</h1>
				
			</div>
			<RouterLink :to="{ name: 'home' }" class="favorites-hero__link">홈으로 돌아가기</RouterLink>
		</section>

		<section v-if="favorites.length" class="favorites-grid">
			<article v-for="item in favorites" :key="item.key" class="favorite-card">
				<div class="favorite-card__header">
					<div>
						<span class="favorite-card__badge">{{ item.kind === 'course' ? '추천 여행코스' : '추천 장소' }}</span>
						<h2>{{ item.title }}</h2>
					</div>
					<small>{{ formatDate(item.savedAt) }}</small>
				</div>
				<p class="favorite-card__summary">{{ item.description || item.summary || '저장된 정보가 없습니다.' }}</p>
				<p v-if="item.summary" class="favorite-card__meta">{{ item.summary }}</p>
				<div class="favorite-card__actions">
					<button type="button" class="favorite-action favorite-action--primary" @click="openFavorite(item)">열기</button>
					<button type="button" class="favorite-action" @click="shareFavorite(item)">공유</button>
					<button type="button" class="favorite-action favorite-action--danger" @click="removeFavorite(item)">삭제</button>
				</div>
			</article>
		</section>

		<section v-else class="favorites-empty">
			<h2>아직 저장된 즐겨찾기가 없습니다.</h2>
			<p>Map 또는 Recommend 화면에서 카카오톡 공유 옆 즐겨찾기 버튼을 눌러 추가해 보세요.</p>
		</section>
	</main>
</template>

<style scoped>
.favorites-page {
	width: 100%;
	max-width: 1200px;
	margin: 0 auto;
	padding: 32px 24px 72px;
	box-sizing: border-box;
}

.favorites-hero {
	display: flex;
	justify-content: space-between;
	gap: 16px;
	align-items: flex-start;
	margin-bottom: 24px;
}

.favorites-hero__eyebrow {
	margin: 0 0 8px;
	font-size: 0.8rem;
	font-weight: 800;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: var(--accent);
}

.favorites-hero h1 {
	margin: 0 0 8px;
	font-size: 1.6rem;
	color: var(--text-h);
}

.favorites-hero p {
	margin: 0;
	color: var(--text);
	line-height: 1.7;
}

.favorites-hero__link {
	display: inline-block;
	color: var(--accent);
	font-weight: 600;
	text-decoration: none;
}

.favorites-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 18px;
}

.favorite-card,
.favorites-empty {
	padding: 20px;
	border-radius: 22px;
	border: 1px solid var(--border);
	background: #fff;
	box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.favorite-card {
	display: grid;
	gap: 12px;
}

.favorite-card__header {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	align-items: flex-start;
}

.favorite-card__badge {
	display: inline-flex;
	margin-bottom: 8px;
	padding: 5px 10px;
	border-radius: 999px;
	background: rgba(79, 70, 229, 0.12);
	color: #4338ca;
	font-size: 0.8rem;
	font-weight: 700;
}

.favorite-card h2 {
	margin: 0;
	font-size: 1.1rem;
	color: var(--text-h);
}

.favorite-card__summary,
.favorite-card__meta,
.favorites-empty p {
	margin: 0;
	color: var(--text);
	line-height: 1.6;
}

.favorite-card__meta {
	font-size: 0.92rem;
	color: #64748b;
}

.favorite-card__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}

.favorite-action {
	padding: 10px 14px;
	border-radius: 999px;
	border: 1px solid var(--border);
	background: #fff;
	color: var(--text-h);
	font-weight: 700;
	cursor: pointer;
}

.favorite-action--primary {
	background: var(--accent-bg);
	border-color: var(--accent-border);
	color: var(--accent);
}

.favorite-action--danger {
	background: #fff1f2;
	border-color: #fecdd3;
	color: #be123c;
}

.favorites-empty {
	display: grid;
	gap: 8px;
	place-items: start;
	min-height: 220px;
	align-content: center;
}

@media (max-width: 720px) {
	.favorites-hero {
		flex-direction: column;
	}
}
</style>