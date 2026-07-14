<script setup>
import { computed } from 'vue'

import SearchForm from '../components/home/SearchForm.vue'
import QuickStation from '../components/home/QuickStation.vue'
import CategorySelector from '../components/home/CategorySelector.vue'
import { useSearch } from '../composables/useSearch'

const quickStations = [
	{ label: 'Seoul Station', description: 'Central rail hub' },
	{ label: 'City Hall', description: 'Downtown access' },
	{ label: 'Gangnam', description: 'Busy commercial area' },
	{ label: 'Hongdae', description: 'Youth and culture' },
]

const categories = [
	'Attractions',
	'Restaurants',
	'Hotels',
	'Shopping',
	'Festivals',
]

const {
	destinationInput,
	setDestinationInput,
	submitSearch,
} = useSearch()

const searchDestination = computed({
	get: () => destinationInput.value,
	set: (value) => setDestinationInput(value),
})

function handleSearch() {
	submitSearch()
}
</script>

<template>
	<main class="home-page">
		<section class="home-hero">
			<div class="home-hero__content">
				<p class="home-hero__eyebrow">Travel companion</p>
				<h1 class="home-hero__title">
					Plan your next city trip with one simple search.
				</h1>
				<p class="home-hero__description">
					Browse destinations, compare places, and start from the most relevant transit point.
				</p>

				<SearchForm v-model:destination="searchDestination" @search="handleSearch" />
			</div>

			<aside class="home-hero__panel" aria-label="Quick summary">
				<div class="home-hero__card home-hero__card--accent">
					<span class="home-hero__card-label">Today</span>
					<strong class="home-hero__card-value">Static preview</strong>
					<span class="home-hero__card-note">Dynamic data will connect later.</span>
				</div>
				<div class="home-hero__card">
					<span class="home-hero__card-label">Nearby picks</span>
					<strong class="home-hero__card-value">Ready for migration</strong>
					<span class="home-hero__card-note">Home page only, no business logic.</span>
				</div>
			</aside>
		</section>

		<section class="home-section home-section--stations" aria-labelledby="quick-station-title">
			<div class="home-section__header">
				<h2 id="quick-station-title">Quick Stations</h2>
				<p>Choose a starting point for the travel search.</p>
			</div>

			<div class="home-section__grid">
				<QuickStation
					v-for="station in quickStations"
					:key="station.label"
					:label="station.label"
					:description="station.description"
				/>
			</div>
		</section>

		<section class="home-section home-section--categories" aria-labelledby="category-title">
			<div class="home-section__header">
				<h2 id="category-title">Category Selector</h2>
				<p>Select a category to narrow future results.</p>
			</div>

			<CategorySelector :categories="categories" />
		</section>
	</main>
</template>

<style scoped>
.home-page {
	width: 100%;
	max-width: 1126px;
	margin: 0 auto;
	padding: 32px;
	box-sizing: border-box;
}

.home-hero {
	display: grid;
	grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
	gap: 24px;
	align-items: stretch;
	padding: 32px;
	border: 1px solid var(--border);
	border-radius: 28px;
	background:
		radial-gradient(circle at top left, rgba(170, 59, 255, 0.12), transparent 32%),
		linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.92));
	box-shadow: var(--shadow);
}

.home-hero__content {
	display: flex;
	flex-direction: column;
	gap: 18px;
	justify-content: center;
}

.home-hero__eyebrow {
	margin: 0;
	color: var(--accent);
	font-size: 0.92rem;
	font-weight: 700;
	letter-spacing: 0.18em;
	text-transform: uppercase;
}

.home-hero__title {
	margin: 0;
	color: var(--text-h);
	font-size: clamp(2.2rem, 4vw, 4rem);
	line-height: 1.05;
	letter-spacing: -0.04em;
	max-width: 12ch;
}

.home-hero__description {
	margin: 0;
	max-width: 52ch;
	font-size: 1.02rem;
	line-height: 1.7;
}

.home-hero__panel {
	display: grid;
	gap: 16px;
	align-content: center;
}

.home-hero__card {
	padding: 20px;
	border-radius: 22px;
	border: 1px solid var(--border);
	background: rgba(255, 255, 255, 0.82);
	min-height: 128px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

.home-hero__card--accent {
	border-color: var(--accent-border);
	background: var(--accent-bg);
}

.home-hero__card-label {
	color: var(--text);
	font-size: 0.9rem;
}

.home-hero__card-value {
	color: var(--text-h);
	font-size: 1.15rem;
}

.home-hero__card-note {
	color: var(--text);
	font-size: 0.92rem;
}

.home-section {
	margin-top: 28px;
	padding: 28px 0 0;
}

.home-section__header {
	display: flex;
	align-items: end;
	justify-content: space-between;
	gap: 18px;
	margin-bottom: 18px;
}

.home-section__header h2 {
	margin: 0;
	color: var(--text-h);
	font-size: 1.45rem;
}

.home-section__header p {
	margin: 0;
	color: var(--text);
}

.home-section__grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 16px;
}

@media (max-width: 1024px) {
	.home-page {
		padding: 20px;
	}

	.home-hero {
		grid-template-columns: 1fr;
		padding: 24px;
	}

	.home-section__header {
		align-items: start;
		flex-direction: column;
	}

	.home-section__grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

@media (max-width: 640px) {
	.home-page {
		padding: 16px;
	}

	.home-hero {
		padding: 20px;
		border-radius: 22px;
	}

	.home-section__grid {
		grid-template-columns: 1fr;
	}
}
</style>
