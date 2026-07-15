import { defineStore } from 'pinia'

export const useRecommendStore = defineStore('recommend', {
	state: () => ({
		recommendations: [],
		selectedRecommendationId: null,
		selectedCategoryIds: ['places', 'culture', 'shopping'],
		nearbySpots: [],
		lastUpdatedAt: null,
	}),
	getters: {
		selectedRecommendation(state) {
			return state.recommendations.find((item) => item.id === state.selectedRecommendationId) || null
		},
		hasRecommendations(state) {
			return state.recommendations.length > 0
		},
	},
	actions: {
		setRecommendations(items) {
			this.recommendations = Array.isArray(items) ? items : []
			this.selectedRecommendationId = this.recommendations[0]?.id ?? null
			this.lastUpdatedAt = Date.now()
		},
		setSelectedRecommendation(id) {
			this.selectedRecommendationId = id
		},
		setSelectedCategories(categoryIds) {
			this.selectedCategoryIds = Array.isArray(categoryIds) ? [...categoryIds] : []
		},
		setNearbySpots(items) {
			this.nearbySpots = Array.isArray(items) ? items : []
		},
		clearRecommendations() {
			this.recommendations = []
			this.selectedRecommendationId = null
			this.nearbySpots = []
			this.lastUpdatedAt = Date.now()
		},
	},
})
