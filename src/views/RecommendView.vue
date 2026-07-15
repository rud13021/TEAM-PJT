<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useMapStore } from '../stores/map'
import { useRecommendStore } from '../stores/recommend'
import { loadKakaoMapSdk } from '../services/kakaoMap'
import {
	buildRoutesToDestination,
	getRecommendCategoryOptions,
	loadNearbyCategorySpots,
} from '../services/recommendEngine'

const mapStore = useMapStore()
const recommendStore = useRecommendStore()

const mapContainer = ref(null)
const statusMessage = ref('지도 로딩 중...')
const routePreview = ref([])
const categoryOptions = getRecommendCategoryOptions()

const startLocations = computed(() =>
	mapStore.startLocations.filter((location) => location.name?.trim() && Number.isFinite(location.lat) && Number.isFinite(location.lng)),
)

const recommendations = computed(() => recommendStore.recommendations)
const selectedRecommendation = computed(() => recommendStore.selectedRecommendation)
const selectedCategories = computed(() => recommendStore.selectedCategoryIds)
const nearbySpots = computed(() => recommendStore.nearbySpots)

let mapInstance = null
let markers = []
let overlays = []
let polylines = []

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
	if (!selectedRecommendation.value) {
		routePreview.value = []
		return
	}

	if (Array.isArray(selectedRecommendation.value.routes) && selectedRecommendation.value.routes.length) {
		routePreview.value = selectedRecommendation.value.routes
		return
	}

	routePreview.value = await buildRoutesToDestination(startLocations.value, selectedRecommendation.value)
}

async function refreshNearbySpots() {
	if (!selectedRecommendation.value || !selectedCategories.value.length) {
		recommendStore.setNearbySpots([])
		return
	}

	const spots = await loadNearbyCategorySpots(
		selectedCategories.value,
		selectedRecommendation.value,
		3,
		30,
	)
	recommendStore.setNearbySpots(spots)
}

function selectRecommendation(recommendationId) {
	recommendStore.setSelectedRecommendation(recommendationId)
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

async function initRecommendMap() {
	if (!mapContainer.value) {
		return
	}

	if (!selectedRecommendation.value) {
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

		await ensureRoutesForSelected()

		if (mapInstance && mapContainer.value) {
			clearMapObjects()
			mapContainer.value.innerHTML = ''
			mapInstance = null
		}

		const centerPoint = selectedRecommendation.value
		mapInstance = new kakao.maps.Map(mapContainer.value, {
			center: new kakao.maps.LatLng(centerPoint.lat, centerPoint.lng),
			level: 6,
		})

		clearMapObjects()

		const bounds = new kakao.maps.LatLngBounds()
		const destinationPosition = new kakao.maps.LatLng(centerPoint.lat, centerPoint.lng)
		addMarker(kakao, mapInstance, centerPoint, '#4f46e5', `${selectedRecommendation.value.rank}순위 ${selectedRecommendation.value.name}`, 'pin', 36)
		bounds.extend(destinationPosition)

		const startColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
		startLocations.value.forEach((location, index) => {
			addMarker(kakao, mapInstance, location, startColors[index % startColors.length], `출발 ${index + 1}: ${location.name}`, 'circle', 30)
			bounds.extend(new kakao.maps.LatLng(location.lat, location.lng))
		})

		routePreview.value.forEach((route, index) => {
			drawRouteLine(kakao, mapInstance, route, startColors[index % startColors.length])
			if (Number.isFinite(route.origin?.lat) && Number.isFinite(route.origin?.lng)) {
				bounds.extend(new kakao.maps.LatLng(route.origin.lat, route.origin.lng))
			}
		})

		nearbySpots.value.forEach((spot) => {
			addMarker(kakao, mapInstance, spot, '#7c3aed', spot.title, 'star', 30)
			bounds.extend(new kakao.maps.LatLng(spot.lat, spot.lng))
		})

		mapInstance.setBounds(bounds)
		statusMessage.value = ''
	} catch (error) {
		console.error('Recommend map failed:', error)
		statusMessage.value = '카카오 지도 로딩에 실패했습니다. 카카오 앱 키를 확인해 주세요.'
		if (mapContainer.value) {
			mapContainer.value.innerHTML = '<div class="map-empty">카카오 지도 로딩에 실패했습니다. 카카오 앱 키를 확인해 주세요.</div>'
		}
	}
}

onMounted(async () => {
	await refreshNearbySpots()
	nextTick(() => initRecommendMap())
})

watch(selectedRecommendation, async () => {
	await refreshNearbySpots()
	nextTick(() => initRecommendMap())
})

watch(
	selectedCategories,
	async () => {
		await refreshNearbySpots()
		nextTick(() => initRecommendMap())
	},
	{ deep: true },
)
</script>

<template>
	<main class="recommend-demo">
		<section class="recommend-shell">
			<aside class="control-panel">
				<div class="panel-card panel-card--title">
					<p class="panel-eyebrow">거점 분석 & 지도</p>
					<h1>출발지별 이동시간과 편차를 함께 계산해 TOP 3 목적지를 추천합니다.</h1>
				</div>

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
							<strong>{{ item.rank }}순위 {{ item.name }}</strong>
							<span>{{ item.totalTravelTime }}분 · 편차 {{ item.arrivalGap }}분</span>
						</button>
					</div>
					<p v-else class="empty-text">메인 화면에서 중간 지점 계산을 먼저 진행해 주세요.</p>
				</div>

				<div class="panel-card">
					<h2>나의 출발 포인트</h2>
					<div class="chip-list">
						<span v-for="item in startLocations" :key="item.name + item.lat + item.lng" class="chip">{{ item.name }}</span>
					</div>
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
				<div class="map-overlay" v-if="selectedRecommendation">
					<p>추천 거점</p>
					<h2>{{ selectedRecommendation.name }}</h2>
					<span>총 이동 {{ selectedRecommendation.totalTravelTime }}분 · 도착 편차 {{ selectedRecommendation.arrivalGap }}분</span>
				</div>
				<div v-if="statusMessage" class="map-status">{{ statusMessage }}</div>
				<div ref="mapContainer" class="kakao-map"></div>
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
	background: #fff;
	border: 1px solid #e2e8f0;
	box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
}

.panel-card--grow {
	flex: 1;
}

.panel-card--title h1 {
	margin: 0;
	font-size: 1.25rem;
	line-height: 1.45;
	color: #0f172a;
}

.panel-card h2 {
	margin: 0 0 10px;
	font-size: 1rem;
	color: #0f172a;
}

.panel-eyebrow {
	margin: 0 0 8px;
	font-size: 0.8rem;
	font-weight: 800;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: #4f46e5;
}

.rank-list {
	display: grid;
	gap: 8px;
}

.rank-item {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 4px;
	padding: 10px 12px;
	border-radius: 14px;
	border: 1px solid #e2e8f0;
	background: #f8fafc;
	cursor: pointer;
}

.rank-item strong {
	font-size: 0.94rem;
	color: #0f172a;
}

.rank-item span {
	font-size: 0.82rem;
	color: #64748b;
}

.rank-item--active {
	border-color: #4f46e5;
	background: #eef2ff;
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
}

.place-card {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
	padding: 12px 14px;
	border-radius: 16px;
	background: #f8fafc;
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
}

.empty-text {
	margin: 4px 0 0;
	font-size: 0.88rem;
	color: #64748b;
}

.map-panel {
	position: relative;
	min-height: 560px;
	border-radius: 28px;
	overflow: hidden;
	border: 1px solid #e2e8f0;
	background: linear-gradient(135deg, #e2e8f0 0%, #f8fafc 100%);
	box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08);
}

.kakao-map {
	width: 100%;
	height: 100%;
	min-height: 560px;
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
	.recommend-shell {
		grid-template-columns: 1fr;
	}

	.map-panel,
	.kakao-map {
		min-height: 440px;
	}
}
</style>
