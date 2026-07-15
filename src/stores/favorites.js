import { defineStore } from 'pinia'

function normalizeFavoriteItem(item) {
	if (!item || typeof item !== 'object' || !item.key) {
		return null
	}

	return {
		key: String(item.key),
		kind: item.kind || 'destination',
		title: item.title || '즐겨찾기 항목',
		description: item.description || '',
		summary: item.summary || '',
		shareUrl: item.shareUrl || '',
		buttonText: item.buttonText || '자세히 보기',
		routeName: item.routeName || '',
		badge: item.badge || '',
		meta: item.meta || {},
		savedAt: item.savedAt || Date.now(),
	}
}

export const useFavoritesStore = defineStore('favorites', {
	state: () => ({
		items: [],
	}),
	getters: {
		count(state) {
			return state.items.length
		},
		hasItems(state) {
			return state.items.length > 0
		},
		isFavorite(state) {
			return (key) => state.items.some((item) => item.key === key)
		},
	},
	actions: {
		addFavorite(item) {
			const normalized = normalizeFavoriteItem(item)
			if (!normalized) {
				return false
			}

			if (this.items.some((entry) => entry.key === normalized.key)) {
				return false
			}

			this.items = [normalized, ...this.items]
			return true
		},
		removeFavorite(key) {
			this.items = this.items.filter((item) => item.key !== key)
		},
		toggleFavorite(item) {
			const normalized = normalizeFavoriteItem(item)
			if (!normalized) {
				return false
			}

			const exists = this.items.some((entry) => entry.key === normalized.key)
			if (exists) {
				this.removeFavorite(normalized.key)
				return false
			}

			this.addFavorite(normalized)
			return true
		},
		clearFavorites() {
			this.items = []
		},
	},
})