<script setup>
import FairnessCard from '../components/recommend/FairnessCard.vue'
import AIBriefCard from '../components/recommend/AIBriefCard.vue'
import PlaceCard from '../components/recommend/PlaceCard.vue'
import KakaoMap from '../components/map/KakaoMap.vue'
import MapLegend from '../components/map/MapLegend.vue'

const fairnessItems = [
	{ label: 'Distance balance', value: 'Even' },
	{ label: 'Category mix', value: 'Broad' },
	{ label: 'Transit access', value: 'Strong' },
]

const aiBriefItems = [
	'Static recommendation preview',
	'No AI request is sent yet',
	'Mock destinations only',
]

const mapLegendItems = [
	{ label: 'Selected route', tone: 'highlight' },
	{ label: 'Recommended place', tone: 'primary' },
	{ label: 'Transit point', tone: 'neutral' },
]

const placeList = [
	{
		id: 1,
		name: 'Myeongdong Shopping Street',
		type: 'Shopping',
		area: 'Jung-gu',
		distance: '0.8 km',
		rating: '4.8',
		tags: ['Popular', 'Walkable'],
	},
	{
		id: 2,
		name: 'Deoksugung Palace',
		type: 'Attraction',
		area: 'Jung-gu',
		distance: '1.2 km',
		rating: '4.7',
		tags: ['Historic', 'Photo spot'],
	},
	{
		id: 3,
		name: 'Seoul City Hall',
		type: 'Transit',
		area: 'Jung-gu',
		distance: '0.4 km',
		rating: '4.6',
		tags: ['Central', 'Easy access'],
	},
	{
		id: 4,
		name: 'Gwanghwamun Square',
		type: 'Attraction',
		area: 'Jongno-gu',
		distance: '1.5 km',
		rating: '4.9',
		tags: ['Open space', 'Family friendly'],
	},
]
</script>

<template>
	<main class="recommend-page">
		<section class="recommend-page__hero">
			<div class="recommend-page__heading">
				<p class="recommend-page__eyebrow">Recommendation</p>
				<h1 class="recommend-page__title">Recommended places near your chosen station</h1>
				<p class="recommend-page__description">
					This page is still a static preview. The list, map, and guidance cards use placeholder
					values only until the migration continues.
				</p>
			</div>

			<div class="recommend-page__cards">
				<AIBriefCard
					title="AI brief"
					summary="Recommended results will be generated later. For now, this is a static UI shell."
					:items="aiBriefItems"
				/>

				<FairnessCard
					title="Fairness check"
					summary="A balanced mix of categories and transit access will be added in the next step."
					:items="fairnessItems"
				/>
			</div>
		</section>

		<section class="recommend-page__map-area">
			<div class="recommend-page__map-panel">
				<div class="recommend-page__section-heading">
					<h2>Map preview</h2>
					<p>Static placeholder only. No Kakao map is rendered yet.</p>
				</div>

				<KakaoMap />
			</div>

			<aside class="recommend-page__legend-panel">
				<div class="recommend-page__section-heading">
					<h2>Map legend</h2>
					<p>Symbols shown here are only visual markers for the migration phase.</p>
				</div>

				<MapLegend :items="mapLegendItems" />
			</aside>
		</section>

		<section class="recommend-page__list-area">
			<div class="recommend-page__section-heading">
				<h2>Recommended places</h2>
				<p>Mock data only. Filtering and searching are intentionally not implemented.</p>
			</div>

			<div class="recommend-page__list">
				<PlaceCard v-for="place in placeList" :key="place.id" :place="place" />
			</div>
		</section>
	</main>
</template>

<style scoped>
.recommend-page {
	width: 100%;
	max-width: 1126px;
	margin: 0 auto;
	padding: 32px;
	box-sizing: border-box;
}

.recommend-page__hero {
	display: grid;
	gap: 24px;
	padding: 32px;
	border: 1px solid var(--border);
	border-radius: 28px;
	background:
		radial-gradient(circle at top right, rgba(170, 59, 255, 0.1), transparent 28%),
		linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.92));
	box-shadow: var(--shadow);
}

.recommend-page__heading {
	display: grid;
	gap: 14px;
	max-width: 780px;
}

.recommend-page__eyebrow {
	margin: 0;
	color: var(--accent);
	font-size: 0.92rem;
	font-weight: 700;
	letter-spacing: 0.18em;
	text-transform: uppercase;
}

.recommend-page__title {
	margin: 0;
	color: var(--text-h);
	font-size: clamp(2rem, 3.6vw, 3.5rem);
	line-height: 1.05;
	letter-spacing: -0.04em;
}

.recommend-page__description {
	margin: 0;
	max-width: 60ch;
	color: var(--text);
	font-size: 1rem;
	line-height: 1.7;
}

.recommend-page__cards {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16px;
}

.recommend-page__map-area {
	margin-top: 28px;
	display: grid;
	grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.5fr);
	gap: 20px;
}

.recommend-page__map-panel,
.recommend-page__legend-panel {
	padding: 24px;
	border: 1px solid var(--border);
	border-radius: 24px;
	background: rgba(255, 255, 255, 0.96);
}

.recommend-page__section-heading {
	display: grid;
	gap: 8px;
	margin-bottom: 18px;
}

.recommend-page__section-heading h2 {
	margin: 0;
	color: var(--text-h);
	font-size: 1.35rem;
}

.recommend-page__section-heading p {
	margin: 0;
	color: var(--text);
}

.recommend-page__list-area {
	margin-top: 28px;
	padding: 28px 0 0;
}

.recommend-page__list {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16px;
}

@media (max-width: 1024px) {
	.recommend-page {
		padding: 20px;
	}

	.recommend-page__hero {
		padding: 24px;
	}

	.recommend-page__cards,
	.recommend-page__map-area,
	.recommend-page__list {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 640px) {
	.recommend-page {
		padding: 16px;
	}

	.recommend-page__hero {
		padding: 20px;
		border-radius: 22px;
	}

	.recommend-page__map-panel,
	.recommend-page__legend-panel {
		padding: 20px;
	}
}
</style>
