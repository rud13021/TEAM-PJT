<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMapStore } from '../stores/map'
import { useRecommendStore } from '../stores/recommend'
import { loadKakaoMapSdk } from '../services/kakaoMap'
import ShareFavoriteBar from '../components/common/ShareFavoriteBar.vue'
import {
	buildRoutesToDestination,
	getRecommendCategoryOptions,
	loadNearbyCategorySpots,
} from '../services/recommendEngine'

const mapStore = useMapStore()
const recommendStore = useRecommendStore()
const route = useRoute()
const router = useRouter()

const mapContainer = ref(null)
const statusMessage = ref('지도 로딩 중...')
const routePreview = ref([])
const categoryOptions = getRecommendCategoryOptions().filter((item) => item.id !== 'courses')

const startLocations = computed(() =>
	mapStore.startLocations.filter((location) => location.name?.trim() && Number.isFinite(location.lat) && Number.isFinite(location.lng)),
)

const recommendations = computed(() => recommendStore.recommendations)
const selectedRecommendation = computed(() => recommendStore.selectedRecommendation)
const activeRecommendation = computed(() => selectedRecommendation.value || recommendations.value[0] || null)
const selectedCategories = computed(() => recommendStore.selectedCategoryIds)
const nearbySpots = computed(() => recommendStore.nearbySpots)
const isMapTab = computed(() => route.name === 'map')
const allowedCategoryIds = categoryOptions.map((item) => item.id)

let mapInstance = null
let markers = []
let overlays = []
let polylines = []
let mapRenderTimer = null

const shareFavoriteItem = computed(() => {
	if (!selectedRecommendation.value) {
		return null
	}

	const recommendation = selectedRecommendation.value
	const recommendationId = encodeURIComponent(String(recommendation.id))
	const shareUrl = typeof window !== 'undefined'
		? `${window.location.origin}/map?rid=${recommendationId}`
		: ''
	const nearbySpotTitles = nearbySpots.value.slice(0, 4).map((spot) => spot.title).filter(Boolean)

	return {
		key: `destination:${recommendation.id}`,
		kind: 'destination',
		title: `${recommendation.rank}순위 ${recommendation.name}`,
		description: `총 이동 ${recommendation.totalTravelTime}분 · 도착 편차 ${recommendation.arrivalGap}분`,
		summary: [recommendation.category, recommendation.district].filter(Boolean).join(' · '),
		shareUrl,
		buttonText: '추천 지도 열기',
		routeName: 'map',
		badge: '추천 거점',
		meta: {
			recommendation: {
				id: recommendation.id,
				name: recommendation.name,
			},
			nearbySpots: nearbySpotTitles,
			travel: {
				totalTravelTime: recommendation.totalTravelTime,
				arrivalGap: recommendation.arrivalGap,
			},
		},
	}
})

function restoreRecommendationFromQuery() {
	const routeRecommendationId = String(route.query.rid || '').trim()
	if (!routeRecommendationId || !recommendations.value.length) {
		return
	}

	const matched = recommendations.value.find((item) => String(item.id) === routeRecommendationId)
	if (matched && selectedRecommendation.value?.id !== matched.id) {
		recommendStore.setSelectedRecommendation(matched.id)
	}
}

function clearMapObjects() {
	markers.forEach((marker) => marker.setMap(null))
	overlays.forEach((overlay) => overlay.setMap(null))
	polylines.forEach((line) => line.setMap(null))
	markers = []
	overlays = []
	polylines = []
}

function createMarkerSvg(color, variant = 'circle') {
	const shapes = {
		circle: `<circle cx="16" cy="16" r="12" fill="${color}" stroke="#fff" stroke-width="3" />`,
		pin: `<path d="M16 2c-5 0-9 4-9 9 0 6 9 14 9 14s9-8 9-14c0-5-4-9-9-9Z" fill="${color}" stroke="#fff" stroke-width="3" />`,
		star: `<path d="M16 3.4 19.4 12 29 12l-7.6 5.6 2.9 9.1-8.3-6.1-8.3 6.1 2.9-9.1L3 12h9.6L16 3.4Z" fill="${color}" stroke="#fff" stroke-width="3" />`,
	}

	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">${shapes[variant] || shapes.circle}</svg>`)}`
}

function addLabelOverlay(kakao, map, position, text, yAnchor = 1.3) {
	const node = document.createElement('div')
	node.style.cssText = 'padding: 4px 8px; border-radius: 999px; background: rgba(255,255,255,0.96); border: 1px solid #e2e8f0; font-size: 11px; color: #0f172a; white-space: nowrap; box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);'
	node.textContent = text

	const overlay = new kakao.maps.CustomOverlay({
		position,
		content: node,
		xAnchor: 0.5,
		yAnchor,
	})
	overlay.setMap(map)
	overlays.push(overlay)
}

function addMarker(kakao, map, point, color, label, variant = 'circle', size = 32) {
	const position = new kakao.maps.LatLng(point.lat, point.lng)
	const marker = new kakao.maps.Marker({
		position,
		image: new kakao.maps.MarkerImage(createMarkerSvg(color, variant), new kakao.maps.Size(size, size), {
			offset: new kakao.maps.Point(size / 2, size / 2),
		}),
	})
	marker.setMap(map)
	markers.push(marker)

	if (label) {
		addLabelOverlay(kakao, map, position, label)
	}

	return marker
}

function drawRouteLine(kakao, map, route, color) {
	if (!route?.path?.length) {
		return
	}

	const path = route.path
		.filter((point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng))
		.map((point) => new kakao.maps.LatLng(point.lat, point.lng))

	if (path.length < 2) {
		return
	}

	const polyline = new kakao.maps.Polyline({
		map,
		path,
		strokeWeight: 5,
		strokeColor: color,
		strokeOpacity: 0.92,
		strokeStyle: 'solid',
	})
	polylines.push(polyline)

	const middle = path[Math.floor(path.length / 2)]
	addLabelOverlay(kakao, map, middle, `${route.durationMinutes}분`, 2.2)
}

async function ensureRoutesForSelected() {
	if (!activeRecommendation.value) {
		routePreview.value = []
		return
	}

	if (Array.isArray(activeRecommendation.value.routes) && activeRecommendation.value.routes.length) {
		routePreview.value = activeRecommendation.value.routes
		return
	}

	routePreview.value = await buildRoutesToDestination(startLocations.value, activeRecommendation.value)
}

async function refreshNearbySpots() {
	const visibleCategoryIds = selectedCategories.value.filter((id) => allowedCategoryIds.includes(id))

	if (!activeRecommendation.value || !visibleCategoryIds.length) {
		recommendStore.setNearbySpots([])
		return
	}

	const spots = await loadNearbyCategorySpots(
		visibleCategoryIds,
		activeRecommendation.value,
		3,
		30,
	)
	recommendStore.setNearbySpots(spots)
}

function selectRecommendation(recommendationId) {
	recommendStore.setSelectedRecommendation(recommendationId)
}

async function openRecommendTab(recommendationId) {
	recommendStore.setSelectedRecommendation(recommendationId)
	await router.push({ name: 'recommend' })
}

function toggleCategory(categoryId) {
	const copied = [...selectedCategories.value]
	const index = copied.indexOf(categoryId)
	if (index >= 0) {
		copied.splice(index, 1)
	} else {
		copied.push(categoryId)
	}
	recommendStore.setSelectedCategories(copied)
}

function openNaverSearch(url) {
	window.open(url, '_blank', 'noopener,noreferrer')
}

function queueMapRender(delay = 0) {
	if (mapRenderTimer) {
		clearTimeout(mapRenderTimer)
	}

	mapRenderTimer = setTimeout(async () => {
		await nextTick()
		await initRecommendMap()
	}, delay)
}

async function initRecommendMap() {
	if (!mapContainer.value) {
		return
	}

	if (!activeRecommendation.value) {
		statusMessage.value = '메인 페이지에서 중간 지점 계산 후 TOP 3를 선택해 주세요.'
		if (mapContainer.value) {
			mapContainer.value.innerHTML = '<div class="map-empty">메인 페이지에서 중간 지점 계산 후 TOP 3를 선택해 주세요.</div>'
		}
		return
	}

	try {
		const kakao = await loadKakaoMapSdk()
		if (!mapContainer.value) {
			return
		}

		if (!mapContainer.value.offsetWidth || !mapContainer.value.offsetHeight) {
			queueMapRender(180)
			return
		}

		await ensureRoutesForSelected()

		if (!mapInstance) {
			mapInstance = new kakao.maps.Map(mapContainer.value, {
				center: new kakao.maps.LatLng(activeRecommendation.value.lat, activeRecommendation.value.lng),
				level: 6,
			})
		}

		const centerPoint = activeRecommendation.value
		clearMapObjects()

		const destinationPosition = new kakao.maps.LatLng(centerPoint.lat, centerPoint.lng)
		mapInstance.relayout()
		addMarker(kakao, mapInstance, centerPoint, '#4f46e5', `${activeRecommendation.value.rank}순위 ${activeRecommendation.value.name}`, 'pin', 36)

		const startColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
		startLocations.value.forEach((location, index) => {
			addMarker(kakao, mapInstance, location, startColors[index % startColors.length], `출발 ${index + 1}: ${location.name}`, 'circle', 30)
		})

		routePreview.value.forEach((route, index) => {
			drawRouteLine(kakao, mapInstance, route, startColors[index % startColors.length])
		})

		nearbySpots.value.forEach((spot) => {
			addMarker(kakao, mapInstance, spot, '#7c3aed', spot.title, 'star', 30)
		})

		setTimeout(() => {
			if (!mapInstance) {
				return
			}

			mapInstance.relayout()
			mapInstance.setCenter(destinationPosition)
			mapInstance.setLevel(6)
		}, 180)
		statusMessage.value = ''
	} catch (error) {
		console.error('Recommend map failed:', error)
		statusMessage.value = '카카오 지도 로딩에 실패했습니다. 카카오 앱 키를 확인해 주세요.'
	}
}

onMounted(async () => {
	restoreRecommendationFromQuery()
	await refreshNearbySpots()
	queueMapRender(240)
})

watch(recommendations, () => {
	restoreRecommendationFromQuery()
}, { deep: true })

watch(selectedRecommendation, async () => {
	await refreshNearbySpots()
	queueMapRender(240)
})

watch(
	selectedCategories,
	async () => {
		await refreshNearbySpots()
		queueMapRender(240)
	},
	{ deep: true },
)
</script>

<template>
	<main class="recommend-demo">
		<section class="recommend-top-panels">
			<div class="panel-card panel-card--title">
				<p class="panel-eyebrow">거점 분석 & 지도</p>
				<h1>출발지 편차까지 반영한 목적지 TOP 3를 한눈에 확인하세요.</h1>
				<ul class="summary-list">
					<li>총 이동시간과 도착 편차를 함께 비교합니다.</li>
					<li>카테고리 선택 시 지도 스팟이 즉시 갱신됩니다.</li>
				</ul>
			</div>

			<div class="panel-card panel-card--compact">
				<h2>나의 출발 포인트</h2>
				<div class="chip-list">
					<span v-for="item in startLocations" :key="item.name + item.lat + item.lng" class="chip">{{ item.name }}</span>
				</div>
			</div>
		</section>

		<section class="recommend-shell">
			<aside class="control-panel">

				<div class="panel-card">
					<h2>중간 지점 TOP 3</h2>
					<div v-if="recommendations.length" class="rank-list">
						<button
							v-for="item in recommendations"
							:key="item.id"
							type="button"
							class="rank-item"
							:class="selectedRecommendation?.id === item.id ? 'rank-item--active' : ''"
							@click="selectRecommendation(item.id)"
						>
							<div class="rank-item__content">
								<strong>{{ item.rank }}순위 {{ item.name }}</strong>
								<span>{{ item.totalTravelTime }}분 · 편차 {{ item.arrivalGap }}분</span>
							</div>
							<button
								v-if="isMapTab"
								type="button"
								class="rank-item__link"
								@click.stop="openRecommendTab(item.id)"
							>
								추천 여행코스 보러가기 ->
							</button>
						</button>
					</div>
					<p v-else class="empty-text">메인 화면에서 중간 지점 계산을 먼저 진행해 주세요.</p>
				</div>

				<div class="panel-card">
					<h2>지도 상 시각화 대상</h2>
					<div class="chip-list">
						<button
							v-for="item in categoryOptions"
							:key="item.id"
							type="button"
							class="chip chip--accent"
							:class="selectedCategories.includes(item.id) ? 'chip--active' : ''"
							@click="toggleCategory(item.id)"
						>
							{{ item.name }}
						</button>
					</div>
				</div>

				<div class="panel-card panel-card--grow">
					<h2>추천 스팟 목록 (3km 이내)</h2>
					<div class="place-list">
						<div v-for="spot in nearbySpots" :key="spot.id" class="place-card">
							<div class="place-card__main">
								<span class="place-card__tag">{{ spot.categoryLabel }}</span>
								<strong>{{ spot.title }}</strong>
								<p>{{ spot.address || '서울 지역' }} · {{ spot.distanceKm.toFixed(2) }}km</p>
							</div>
							<button type="button" class="naver-button" @click="openNaverSearch(spot.naverSearchUrl)" title="네이버 검색">
								N
							</button>
						</div>
						<p v-if="!nearbySpots.length" class="empty-text">선택된 카테고리에서 3km 이내 스팟이 없습니다.</p>
					</div>
				</div>
			</aside>

			<section class="map-panel">
				<div class="map-stage">
					<div class="map-overlay" v-if="selectedRecommendation">
						<p>추천 거점</p>
						<h2>{{ selectedRecommendation.name }}</h2>
						<span>총 이동 {{ selectedRecommendation.totalTravelTime }}분 · 도착 편차 {{ selectedRecommendation.arrivalGap }}분</span>
					</div>
					<div v-if="statusMessage" class="map-status">{{ statusMessage }}</div>
					<div ref="mapContainer" class="kakao-map"></div>
				</div>
				<ShareFavoriteBar class="map-actions" :item="shareFavoriteItem" context-label="현재 선택된 추천 장소" />
			</section>
		</section>
	</main>
</template>

<style scoped>
.recommend-demo {
	width: 100%;
	max-width: 1200px;
	margin: 0 auto;
	padding: 24px 24px 72px;
	box-sizing: border-box;
}

.recommend-top-panels {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 300px;
	gap: 20px;
	margin-bottom: 20px;
	align-items: stretch;
}

.recommend-shell {
	display: grid;
	grid-template-columns: minmax(320px, 0.95fr) 1.2fr;
	gap: 20px;
}

.control-panel {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.panel-card {
	padding: 20px;
	border-radius: 22px;
	background: #ffffff5b;
	border: 1px solid #e2e8f0;
	box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
	transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
	height: 100%;
	box-sizing: border-box;
}

.panel-card:hover {
	transform: translateY(-3px);
	border-color: #cbd5e1;
	box-shadow: 0 18px 32px rgba(15, 23, 42, 0.12);
}

.panel-card--grow {
	flex: 1;
}

.panel-card--compact {
	width: 100%;
	justify-self: stretch;
}

.panel-card--title h1 {
	margin: 0 0 10px;
	font-size: 1.4rem;
	line-height: 1.45;
	color: #0f172a;
	font-family: var(--font-accent);
}

.summary-list {
	margin: 12px 0 0;
	padding-left: 18px;
	display: grid;
	gap: 6px;
	font-size: 0.9rem;
	line-height: 1.5;
	color: #64748b;
}

.panel-card h2 {
	margin: 0 0 10px;
	font-size: 1.14rem;
	color: #0f172a;
	font-family: var(--font-accent);
}

.panel-eyebrow {
	margin: 0 0 8px;
	font-size: 0.9rem;
	font-weight: 800;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: #4f46e5;
	font-family: var(--font-accent);
}

.rank-list {
	display: grid;
	gap: 8px;
}

.rank-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 12px;
	border-radius: 14px;
	border: 1px solid #e2e8f0;
	background: #f8fafc;
	cursor: pointer;
	transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.rank-item:hover {
	transform: translateY(-2px);
	border-color: #cbd5e1;
	box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.rank-item__content {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 4px;
	min-width: 0;
}

.rank-item strong {
	font-size: 1.12rem;
	color: #701202;
	font-family: var(--font-accent);
	line-height: 1.3;
}

.rank-item span {
	font-size: 0.86rem;
	color: #64748b;
	width: 100%;
	padding-top: 6px;
	margin-top: 2px;
	border-top: 1px solid #edf2f7;
}

.rank-item--active {
	border-color: #4f46e5;
	background: #eef2ff;
}

.rank-item__link {
	flex-shrink: 0;
	border: 0;
	padding: 0;
	background: transparent;
	color: #4338ca;
	font-size: 0.82rem;
	font-weight: 700;
	cursor: pointer;
}

.rank-item__link:hover,
.rank-item__link:focus-visible {
	text-decoration: underline;
	outline: none;
}

.chip-list {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.chip {
	display: inline-flex;
	align-items: center;
	padding: 8px 12px;
	border-radius: 999px;
	background: #f8fafc;
	color: #334155;
	font-size: 0.9rem;
	border: 1px solid transparent;
	cursor: pointer;
	transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.chip:hover {
	transform: translateY(-1px);
	border-color: #cbd5e1;
	box-shadow: 0 8px 18px rgba(15, 23, 42, 0.1);
}

.chip--accent {
	background: #eef2ff;
	color: #4338ca;
}

.chip--active {
	background: #4f46e5;
	color: #fff;
}

.place-list {
	display: grid;
	gap: 10px;
	max-height: 360px;
	overflow-y: auto;
	padding-right: 4px;
}

.place-card {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
	padding: 12px 14px;
	border-radius: 16px;
	background: #f8fafc;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.place-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
}

.place-card__main {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.place-card__tag {
	font-size: 0.75rem;
	font-weight: 700;
	color: #4f46e5;
	font-family: var(--font-accent);
}

.place-card strong {
	color: #0f172a;
}

.place-card p {
	margin: 0;
	color: #64748b;
	font-size: 0.85rem;
}

.naver-button {
	width: 28px;
	height: 28px;
	border: 0;
	border-radius: 999px;
	background: #03c75a;
	color: #fff;
	font-weight: 900;
	cursor: pointer;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.naver-button:hover {
	transform: translateY(-1px) scale(1.04);
	box-shadow: 0 8px 18px rgba(3, 199, 90, 0.35);
}

.empty-text {
	margin: 4px 0 0;
	font-size: 0.88rem;
	color: #64748b;
}

.map-panel {
	display: flex;
	flex-direction: column;
	height: 100%;
	gap: 14px;
	padding: 18px;
	border-radius: 28px;
	border: 1px solid #e2e8f0;
	background: #ffffff5b;
	box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08);
}

.map-panel:hover {
	transform: translateY(-2px);
	box-shadow: 0 22px 38px rgba(15, 23, 42, 0.14);
}

.map-stage {
	position: relative;
	min-height: 500px;   /* 최소 높이만 유지 */
	flex:1;
	border-radius: 22px;
	overflow: hidden;
	background: linear-gradient(135deg, #e2e8f0 0%, #f8fafc 100%);
}

.kakao-map {
	width: 100%;
	height: 100%;
}

.map-empty {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: 24px;
	color: #334155;
	font-size: 0.95rem;
}

.map-status {
	position: absolute;
	top: 20px;
	right: 20px;
	z-index: 2;
	padding: 8px 10px;
	border-radius: 12px;
	font-size: 0.84rem;
	color: #334155;
	background: rgba(255, 255, 255, 0.9);
	border: 1px solid #e2e8f0;
}

.map-actions {
	margin-top: 0;
	flex: 0 0 auto;
	flex-shrink: 0;
}

.map-overlay {
	position: absolute;
	left: 20px;
	top: 20px;
	z-index: 2;
	padding: 16px 18px;
	border-radius: 18px;
	background: rgba(255, 255, 255, 0.95);
	border: 1px solid #e2e8f0;
	backdrop-filter: blur(10px);
}

.map-overlay p {
	margin: 0 0 4px;
	font-size: 0.75rem;
	font-weight: 800;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: #4f46e5;
	font-family: var(--font-accent);
}

.map-overlay h2 {
	margin: 0 0 4px;
	font-size: 1.2rem;
	color: #0f172a;
}

.map-overlay span {
	color: #64748b;
	font-size: 0.9rem;
}

@media (max-width: 1024px) {
	.recommend-top-panels,
	.recommend-shell {
		grid-template-columns: 1fr;
	}

	.map-stage {
		height: 420px;
	}

	.rank-item {
		align-items: flex-start;
		flex-direction: column;
	}

	.rank-item__link {
		align-self: flex-end;
	}
}
</style>
