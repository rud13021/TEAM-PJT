<script setup>
import { computed, ref } from 'vue'
import { useFavoritesStore } from '../../stores/favorites'
import { shareToKakaoTalk } from '../../services/kakaoShare'

const props = defineProps({
	item: {
		type: Object,
		default: null,
	},
	contextLabel: {
		type: String,
		default: '현재 선택 항목',
	},
})

const favoritesStore = useFavoritesStore()
const statusMessage = ref('')
const isSaving = ref(false)

const isFavorite = computed(() => favoritesStore.isFavorite(props.item?.key))

async function handleShare() {
	if (!props.item) {
		return
	}

	statusMessage.value = ''
	try {
		await shareToKakaoTalk(props.item)
		statusMessage.value = '카카오톡 공유 창을 열었습니다.'
	} catch (error) {
		console.error('Failed to share to KakaoTalk:', error)
		statusMessage.value = '카카오톡 공유에 실패했습니다.'
	}
}

function handleToggleFavorite() {
	if (!props.item) {
		return
	}

	isSaving.value = true
	try {
		const saved = favoritesStore.toggleFavorite(props.item)
		statusMessage.value = saved ? '즐겨찾기에 저장했습니다.' : '즐겨찾기에서 삭제했습니다.'
	} finally {
		isSaving.value = false
	}
}
</script>

<template>
	<div v-if="item" class="share-favorite-bar">
		<div class="share-favorite-bar__summary">
			<p class="share-favorite-bar__eyebrow">{{ contextLabel }}</p>
			<strong>{{ item.title }}</strong>
			<span>{{ item.description || item.summary || '선택된 정보가 여기에 표시됩니다.' }}</span>
		</div>
		<div class="share-favorite-bar__actions">
			<button type="button" class="action-button action-button--share" @click="handleShare">
				<span class="action-button__icon action-button__icon--kakao" aria-hidden="true">
					<svg viewBox="0 0 24 24"><path d="M12 4c-4.97 0-9 3.13-9 7 0 2.46 1.63 4.63 4.09 5.89-.17.64-.64 2.37-.74 2.77-.12.5.18.55.5.35.25-.16 3.01-2.02 4.17-2.8.32.03.65.05.98.05 4.97 0 9-3.13 9-7s-4.03-7-9-7Z"/></svg>
				</span>
				<span>카카오톡 공유</span>
			</button>
			<button type="button" class="action-button action-button--favorite" :class="isFavorite ? 'action-button--active' : ''" :disabled="isSaving" @click="handleToggleFavorite">
				<span class="action-button__icon action-button__icon--heart" aria-hidden="true">
					<svg viewBox="0 0 24 24"><path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.27 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.04 6.04 0 0 1 16.5 3 5.5 5.5 0 0 1 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35Z"/></svg>
				</span>
				<span>{{ isFavorite ? '즐겨찾기 해제' : '즐겨찾기 저장' }}</span>
			</button>
		</div>
		<p v-if="statusMessage" class="share-favorite-bar__message">{{ statusMessage }}</p>
	</div>
</template>

<style scoped>
.share-favorite-bar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	margin-top: 18px;
	padding: 16px 18px;
	border-radius: 18px;
	border: 1px solid #dbe4f0;
	background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
	box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.share-favorite-bar__summary {
	min-width: 0;
	flex: 1;
	display: grid;
	gap: 4px;
}

.share-favorite-bar__eyebrow {
	margin: 0;
	font-size: 0.78rem;
	font-weight: 800;
	letter-spacing: 0.14em;
	text-transform: uppercase;
	color: #4f46e5;
}

.share-favorite-bar__summary strong {
	font-size: 1rem;
	color: #0f172a;
	line-height: 1.35;
}

.share-favorite-bar__summary span,
.share-favorite-bar__message {
	font-size: 0.9rem;
	line-height: 1.5;
	color: #64748b;
	margin: 0;
}

.share-favorite-bar__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}

.action-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 11px 14px;
	border-radius: 999px;
	border: 1px solid transparent;
	font-size: 0.9rem;
	font-weight: 700;
	cursor: pointer;
	transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.action-button svg {
	width: 16px;
	height: 16px;
	fill: currentColor;
}

.action-button__icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	flex-shrink: 0;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.35);
	box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
}

.action-button__icon--kakao {
	background: rgba(255, 255, 255, 0.4);
	color: #3c1e1e;
}

.action-button__icon--heart {
	background: rgba(255, 255, 255, 0.72);
	color: #64748b;
}

.action-button--active .action-button__icon--heart {
	background: rgba(99, 102, 241, 0.14);
	color: #4338ca;
}

.action-button:hover,
.action-button:focus-visible {
	transform: translateY(-2px);
	outline: none;
	box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.action-button--share {
	background: #fee500;
	color: #3c1e1e;
	border-color: #f0d400;
}

.action-button--favorite {
	background: #fff;
	color: #334155;
	border-color: #cbd5e1;
}

.action-button--favorite.action-button--active {
	background: #eef2ff;
	color: #4338ca;
	border-color: #c7d2fe;
}

.action-button:disabled {
	opacity: 0.65;
	cursor: wait;
	transform: none;
	box-shadow: none;
}

@media (max-width: 720px) {
	.share-favorite-bar {
		align-items: stretch;
	}

	.share-favorite-bar__actions {
		width: 100%;
	}

	.action-button {
		flex: 1;
	}
}
</style>