<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRecommendStore } from '../stores/recommend'
import { loadKakaoMapSdk } from '../services/kakaoMap'
import ShareFavoriteBar from '../components/common/ShareFavoriteBar.vue'
import { buildNearestTravelCourseRecommendations } from '../services/recommendEngine'

const recommendStore = useRecommendStore()
const route = useRoute()

const mapContainer = ref(null)
const statusMessage = ref('추천 여행코스를 불러오는 중입니다...')
const travelCourses = ref([])
const isLoading = ref(false)
const currentCourseIndex = ref(0)
const recommendations = computed(() => recommendStore.recommendations)
const selectedRecommendation = computed(() => recommendStore.selectedRecommendation)
const activeRecommendation = computed(() => selectedRecommendation.value || recommendations.value[0] || null)
const currentCourse = computed(() => travelCourses.value[currentCourseIndex.value] || null)

const shareFavoriteItem = computed(() => {
	if (!activeRecommendation.value) {
		return null
	}

	const course = currentCourse.value
	const recommendationId = encodeURIComponent(String(activeRecommendation.value.id))
	const courseKey = encodeURIComponent(String(course?.contentid || course?.title || 'destination'))
	const shareUrl = typeof window !== 'undefined'
		? `${window.location.origin}/recommend?rid=${recommendationId}&course=${courseKey}`
		: ''

	if (!course) {
		return {
			key: `course:${activeRecommendation.value.id}:destination`,
			kind: 'course',
			title: `${activeRecommendation.value.name} 추천 여행코스`,
			description: `총 이동 ${activeRecommendation.value.totalTravelTime}분 · 도착 편차 ${activeRecommendation.value.arrivalGap}분`,
			summary: activeRecommendation.value.feature || activeRecommendation.value.category || '',
			shareUrl,
			buttonText: '코스 열기',
			routeName: 'recommend',
			badge: '추천 여행코스',
			meta: {
				recommendation: {
					id: activeRecommendation.value.id,
					name: activeRecommendation.value.name,
				},
			},
		}
	}

	return {
		key: `course:${activeRecommendation.value.id}:${course.contentid || course.title}`,
		kind: 'course',
		title: course.title || `${activeRecommendation.value.name} 추천 여행코스`,
		description: `목적지까지 ${course.travelDistanceKm?.toFixed?.(2) ?? '-'}km · 약 ${course.travelMinutes ?? '-'}분`,
		summary: (course.coursePoints || []).slice(0, 3).map((point) => point.title).join(' · '),
		shareUrl,
		buttonText: '코스 열기',
		routeName: 'recommend',
		badge: '추천 여행코스',
		meta: {
			recommendation: {
				id: activeRecommendation.value.id,
				name: activeRecommendation.value.name,
			},
			coursePoints: (course.coursePoints || []).slice(0, 5).map((point) => point.title).filter(Boolean),
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

function restoreCourseFromQuery() {
	const routeCourseKey = String(route.query.course || '').trim()
	if (!routeCourseKey || !travelCourses.value.length) {
		return
	}

	const foundIndex = travelCourses.value.findIndex((item) => String(item.contentid || item.title) === routeCourseKey)
	if (foundIndex >= 0 && foundIndex !== currentCourseIndex.value) {
		currentCourseIndex.value = foundIndex
	}
}

let mapInstance = null
let markers = []
let overlays = []
let polylines = []
let mapRenderTimer = null

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

	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">${shapes[variant] || shapes.circle}</svg>` )}`
}

function buildInfoWindowContent(course) {
	const wrapper = document.createElement('div')
	wrapper.style.cssText = 'max-width: 260px; padding: 12px 14px; border-radius: 14px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 12px 24px rgba(15, 23, 42, 0.14); color: #0f172a;'

	const title = document.createElement('strong')
	title.style.cssText = 'display:block; margin-bottom:6px; font-size:14px;'
	title.textContent = course.title || '추천 여행코스'

	const meta = document.createElement('div')
	meta.style.cssText = 'margin-bottom:6px; font-size:12px; color:#4338ca; font-weight:700;'
	meta.textContent = `목적지까지 ${course.travelDistanceKm?.toFixed?.(2) ?? '-'}km · 약 ${course.travelMinutes ?? '-'}분`

	const address = document.createElement('p')
	address.style.cssText = 'margin:0 0 6px; font-size:12px; color:#475569; line-height:1.45;'
	address.textContent = [course.addr1, course.addr2].filter(Boolean).join(' ') || '주소 정보 없음'

	const overview = document.createElement('p')
	overview.style.cssText = 'margin:0; font-size:12px; color:#334155; line-height:1.55;'
	overview.textContent = course.overview || course.description || '대표 코스 정보입니다.'

	wrapper.append(title, meta, address, overview)
	return wrapper
}

function addSequenceOverlay(kakao, map, position, sequence, color) {
	const node = document.createElement('div')
	node.style.cssText = `min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: ${color}; color: #fff; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 6px 14px rgba(15, 23, 42, 0.16);`
	node.textContent = String(sequence + 1)

	const overlay = new kakao.maps.CustomOverlay({
		position,
		content: node,
		xAnchor: 0.5,
		yAnchor: 2.1,
	})
	overlay.setMap(map)
	overlays.push(overlay)
}

function buildPointInfoWindowContent(point, courseTitle) {
	const wrapper = document.createElement('div')
	wrapper.style.cssText = 'max-width: 260px; padding: 12px 14px; border-radius: 14px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 12px 24px rgba(15, 23, 42, 0.14); color: #0f172a;'

	const title = document.createElement('strong')
	title.style.cssText = 'display:block; margin-bottom:6px; font-size:14px;'
	title.textContent = point.title || '코스 지점'

	const course = document.createElement('div')
	course.style.cssText = 'margin-bottom:6px; font-size:12px; color:#4338ca; font-weight:700;'
	course.textContent = courseTitle

	const address = document.createElement('p')
	address.style.cssText = 'margin:0 0 6px; font-size:12px; color:#475569; line-height:1.45;'
	address.textContent = point.address || [point.addr1, point.addr2].filter(Boolean).join(' ') || '주소 정보 없음'

	const overview = document.createElement('p')
	overview.style.cssText = 'margin:0; font-size:12px; color:#334155; line-height:1.55;'
	overview.textContent = point.overview || '상세 설명 없음'

	wrapper.append(title, course, address, overview)
	return wrapper
}

function addCourseMarker(kakao, map, course, color) {
	const position = new kakao.maps.LatLng(course.lat, course.lng)
	const marker = new kakao.maps.Marker({
		position,
		image: new kakao.maps.MarkerImage(createMarkerSvg(color, 'star'), new kakao.maps.Size(34, 34), {
			offset: new kakao.maps.Point(17, 17),
		}),
	})
	marker.setMap(map)
	markers.push(marker)

	const infoWindow = new kakao.maps.CustomOverlay({
		position,
		content: buildInfoWindowContent(course),
		xAnchor: 0.5,
		yAnchor: 1.55,
	})

	const openInfo = () => infoWindow.setMap(map)
	const closeInfo = () => infoWindow.setMap(null)

	kakao.maps.event.addListener(marker, 'mouseover', openInfo)
	kakao.maps.event.addListener(marker, 'mouseout', closeInfo)
	kakao.maps.event.addListener(marker, 'click', openInfo)

	overlays.push(infoWindow)
	return marker
}

function addCoursePointMarker(kakao, map, point, color, courseTitle, sequence) {
	const position = new kakao.maps.LatLng(
	Number(point.lat),
	Number(point.lng)
)
	const marker = new kakao.maps.Marker({
		position,
		image: new kakao.maps.MarkerImage(createMarkerSvg(color, 'circle'), new kakao.maps.Size(30, 30), {
			offset: new kakao.maps.Point(15, 15),
		}),
	})
	marker.setMap(map)
	markers.push(marker)

	addSequenceOverlay(kakao, map, position, sequence, color)

	const infoWindow = new kakao.maps.CustomOverlay({
		position,
		content: buildPointInfoWindowContent(point, courseTitle),
		xAnchor: 0.5,
		yAnchor: 1.55,
	})

	const openInfo = () => infoWindow.setMap(map)
	const closeInfo = () => infoWindow.setMap(null)

	kakao.maps.event.addListener(marker, 'mouseover', openInfo)
	kakao.maps.event.addListener(marker, 'mouseout', closeInfo)
	kakao.maps.event.addListener(marker, 'click', openInfo)

	overlays.push(infoWindow)
	return marker
}

function drawCoursePolyline(kakao, map, points, color) {
	const path = points
		.filter((point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng))
		.map(
			(point) =>
				new kakao.maps.LatLng(
					Number(point.lat),
					Number(point.lng)
				)
)

	if (path.length < 2) {
		return
	}

	const line = new kakao.maps.Polyline({
		map,
		path,
		strokeWeight: 5,
		strokeColor: color,
		strokeOpacity: 0.92,
		strokeStyle: 'solid',
	})

	polylines.push(line)
}

function getOrderedCoursePoints(course) {
	return (course?.coursePoints || [])
		.map((point, index) => ({
			...point,
			sequence: Number.isFinite(Number(point.sequence))
				? Number(point.sequence)
				: index,
		}))
		.filter(
			(point) =>
				Number.isFinite(Number(point.lat)) &&
				Number.isFinite(Number(point.lng))
		)
		.sort((a, b) => a.sequence - b.sequence)
}

async function loadTravelCourses() {
	if (!activeRecommendation.value) {
		travelCourses.value = []
		currentCourseIndex.value = 0
		statusMessage.value = 'Map 탭에서 목적지를 먼저 선택해 주세요.'
		return
	}

	isLoading.value = true
	statusMessage.value = '추천 여행코스를 계산하는 중입니다...'

	try {
		travelCourses.value = await buildNearestTravelCourseRecommendations(activeRecommendation.value, {
			topN: 2,
			shortlistSize: 8,
		})
		currentCourseIndex.value = 0
		statusMessage.value = travelCourses.value.length ? '' : '가까운 여행코스를 찾지 못했습니다.'
	} catch (error) {
		console.error('Failed to load travel course recommendations:', error)
		travelCourses.value = []
		currentCourseIndex.value = 0
		statusMessage.value = '추천 여행코스를 불러오지 못했습니다.'
	} finally {
		isLoading.value = false
	}
}

function showPreviousCourse() {
	if (!travelCourses.value.length) {
		return
	}
	currentCourseIndex.value = (currentCourseIndex.value - 1 + travelCourses.value.length) % travelCourses.value.length
}

function showNextCourse() {
	if (!travelCourses.value.length) {
		return
	}
	currentCourseIndex.value = (currentCourseIndex.value + 1) % travelCourses.value.length
}

function queueMapRender(delay = 0) {
	if (mapRenderTimer) {
		clearTimeout(mapRenderTimer)
	}

	mapRenderTimer = setTimeout(async () => {
		await nextTick()
		await initMap()
	}, delay)
}

async function initMap() {
	if (!mapContainer.value) {
		return
	}

	if (!activeRecommendation.value) {
		statusMessage.value = 'Map 탭에서 목적지를 먼저 선택해 주세요.'
		clearMapObjects()
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

		const destination = activeRecommendation.value

		if (!mapInstance) {
			mapInstance = new kakao.maps.Map(mapContainer.value, {
				center: new kakao.maps.LatLng(destination.lat, destination.lng),
				level: 6,
			})
		}

		mapInstance.relayout()
		clearMapObjects()

		const destinationPosition = new kakao.maps.LatLng(destination.lat, destination.lng)
		const destinationMarker = new kakao.maps.Marker({
			position: destinationPosition,
			image: new kakao.maps.MarkerImage(createMarkerSvg('#4f46e5', 'pin'), new kakao.maps.Size(36, 36), {
				offset: new kakao.maps.Point(18, 18),
			}),
		})
		destinationMarker.setMap(mapInstance)
		markers.push(destinationMarker)

		const course = currentCourse.value
		const courseColor = '#f97316'
		const visiblePoints = course?.visibleCoursePoints || []

		if (course && Number.isFinite(course?.lat) && Number.isFinite(course?.lng)) {
			addCourseMarker(kakao, mapInstance, course, courseColor)
		}

		if (course && visiblePoints.length) {
			drawCoursePolyline(kakao, mapInstance, visiblePoints, courseColor)

			visiblePoints.forEach((point, pointIndex) => {
				addCoursePointMarker(kakao, mapInstance, point, courseColor, course.title, pointIndex)
			})
		}

		setTimeout(() => {
			if (!mapInstance) {
				return
			}

			mapInstance.relayout()
			mapInstance.setCenter(destinationPosition)
			mapInstance.setLevel(6)
		}, 180)
		statusMessage.value = travelCourses.value.length ? '' : statusMessage.value
	} catch (error) {
		console.error('Travel course map failed:', error)
		statusMessage.value = '카카오 지도 로딩에 실패했습니다. 앱 키를 확인해 주세요.'
	}
}

async function refreshPage() {
	await loadTravelCourses()
	queueMapRender(240)
}

onMounted(async () => {
	restoreRecommendationFromQuery()
	await refreshPage()
	restoreCourseFromQuery()
})

onUnmounted(() => {
	if (mapRenderTimer) {
		clearTimeout(mapRenderTimer)
	}
	clearMapObjects()
	mapInstance = null
})

watch(selectedRecommendation, async () => {
	await refreshPage()
	restoreCourseFromQuery()
})

watch(currentCourseIndex, async () => {
	queueMapRender(180)
})

watch(recommendations, () => {
	restoreRecommendationFromQuery()
}, { deep: true })

watch(travelCourses, () => {
	restoreCourseFromQuery()
}, { deep: true })
</script>

<template>
	<main class="course-page">
		<section class="course-top-panels">
			<div class="panel-card panel-card--hero">
				<p class="panel-eyebrow">Recommend Course</p>
				<h1>선택 목적지 기준 최단 이동 여행코스를 빠르게 비교해보세요.</h1>
				<ul class="summary-list">
					<li>각 장소를 순서 마커와 연결선으로 동시에 표시합니다.</li>
					<li>코스별 소요시간과 이동거리를 카드에서 바로 확인합니다.</li>
				</ul>
			</div>

			<div class="panel-card panel-card--compact" v-if="activeRecommendation">
				<h2>선택한 목적지</h2>
				<strong class="destination-title">{{ activeRecommendation.rank }}순위 {{ activeRecommendation.name }}</strong>
				<p class="destination-meta">
					총 이동 {{ activeRecommendation.totalTravelTime }}분 · 도착 편차 {{ activeRecommendation.arrivalGap }}분
				</p>
			</div>
		</section>

		<section class="course-shell">
			<aside class="course-panel">
				<div v-if="isLoading" class="panel-card">
					<p class="empty-text">추천 여행코스를 불러오는 중입니다...</p>
				</div>

				<div v-if="currentCourse" class="panel-card course-card">
					<div class="course-carousel">
						<button type="button" class="course-carousel__button" @click="showPreviousCourse">이전 코스</button>
						<span class="course-carousel__status">{{ currentCourseIndex + 1 }} / {{ travelCourses.length }}</span>
						<button type="button" class="course-carousel__button" @click="showNextCourse">다음 코스</button>
					</div>
					<div class="course-card__header">
						<div>
							<p class="course-card__rank">추천 코스 {{ currentCourse.rank }}</p>
							<h2>{{ currentCourse.title }}</h2>
						</div>
						<span>{{ currentCourse.travelMinutes }}분</span>
					</div>
					<p class="course-card__meta">
						목적지까지 {{ currentCourse.travelDistanceKm.toFixed(2) }}km · 코스 구성 {{ currentCourse.coursePointCount || currentCourse.coursePoints.length }}곳
					</p>
					<div class="course-step-scroll" role="region" aria-label="추천 코스 구성 리스트">
						<ol class="course-step-list">
							<li v-for="point in currentCourse.coursePoints" :key="`${currentCourse.contentid}-${point.sequence}-${point.title}`" class="course-step-item">
								<span class="course-step-item__index">{{ Number(point.sequence) + 1 }}</span>
								<div>
									<strong>{{ point.title }}</strong>
									<p>{{ point.address || point.overview || '위치 정보 확인 중' }}</p>
								</div>
							</li>
						</ol>
					</div>
				</div>

				<div v-if="!isLoading && !travelCourses.length" class="panel-card">
					<p class="empty-text">{{ statusMessage || '추천 여행코스가 없습니다.' }}</p>
				</div>
			</aside>

			<section class="map-panel">
				<div class="map-stage">
					<div class="map-overlay" v-if="activeRecommendation">
						<p>Selected Destination</p>
						<h2>{{ activeRecommendation.name }}</h2>
						<span>{{ currentCourse ? `${currentCourse.title} 코스 지도` : '추천된 여행코스를 불러오는 중입니다.' }}</span>
					</div>
					<div v-if="statusMessage && !travelCourses.length" class="map-status">{{ statusMessage }}</div>
					<div ref="mapContainer" class="kakao-map"></div>
				</div>
				<ShareFavoriteBar class="map-actions" :item="shareFavoriteItem" context-label="현재 선택된 여행 코스" />
			</section>
		</section>
	</main>
</template>

<style scoped>
.course-page {
	width: 100%;
	max-width: 1200px;
	margin: 0 auto;
	padding: 24px 24px 72px;
	box-sizing: border-box;
}

.course-top-panels {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 300px;
	gap: 20px;
	margin-bottom: 20px;
	align-items: stretch;
}

.course-shell {
	display: grid;
	grid-template-columns: minmax(340px, 0.92fr) 1.25fr;
	gap: 20px;
	align-items: stretch;
	height:900px;
}

.course-panel {
	display:flex;
	flex-direction:column;
	height:100%;
	min-height:0;
}
.course-card {
	flex:1;
	display:flex;
	flex-direction:column;
	min-height:0;
}

.panel-card {
	padding: 20px;
	border-radius: 22px;
	background: #ffffff5b;
	border: 1px solid #e2e8f0;
	box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);

	display: flex;
	flex-direction: column;
}

.panel-card:hover {
	transform: translateY(-3px);
	border-color: #cbd5e1;
	box-shadow: 0 18px 32px rgba(15, 23, 42, 0.12);
}

.panel-card--compact {
	width: 100%;
	max-width: none;
	justify-self: stretch;
}

.panel-card--hero h1 {
	margin: 0 0 10px;
	font-size: 1.4rem;
	line-height: 1.45;
	color: #0f172a;
	font-family: var(--font-accent);
}

.summary-list {
	margin: 10px 0 0;
	padding-left: 18px;
	display: grid;
	gap: 6px;
	font-size: 0.9rem;
	line-height: 1.5;
	color: #64748b;
}

.panel-card--hero p:last-child,
.destination-meta,
.course-card__meta,
.course-step-item p,
.empty-text,
.map-overlay span {
	margin: 0;
	font-size: 0.92rem;
	line-height: 1.6;
	color: #64748b;
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

.destination-title {
	display: block;
	margin-bottom: 8px;
	font-size: 1.2rem;
	color: #0f172a;
	font-family: var(--font-accent);
}

.panel-card h2 {
	font-size: 1.14rem;
	font-family: var(--font-accent);
}

.course-card__header {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	align-items: flex-start;
	margin-bottom: 8px;
}

.course-card__header h2 {
	margin: 0;
	font-size: 1.14rem;
	color: #0f172a;
	line-height: 1.45;
	font-family: var(--font-accent);
}

.course-card__header span {
	flex-shrink: 0;
	padding: 6px 10px;
	border-radius: 999px;
	background: #eef2ff;
	color: #4338ca;
	font-size: 0.84rem;
	font-weight: 800;
}

.course-card__rank {
	margin: 0 0 6px;
	font-size: 0.78rem;
	font-weight: 800;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	color: #f97316;
}

.course-carousel {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	margin-bottom: 16px;
}

.course-carousel__button {
	border: 0;
	padding: 10px 14px;
	border-radius: 999px;
	background: #eef2ff;
	color: #4338ca;
	font-size: 0.84rem;
	font-weight: 800;
	cursor: pointer;
	transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.course-carousel__button:hover {
	transform: translateY(-1px);
	box-shadow: 0 9px 18px rgba(79, 70, 229, 0.22);
}

.course-carousel__status {
	font-size: 0.88rem;
	font-weight: 700;
	color: #475569;
}

.course-step-list {
	margin: 14px 0 0;
	padding: 0;
	list-style: none;
	display: grid;
	gap: 12px;
}

.course-step-scroll {
	flex: 1;
	overflow-y: auto;
	padding-right: 4px;
	scrollbar-width: thin;
	min-height: 0;
}

.course-step-scroll::-webkit-scrollbar {
	width: 6px;
}

.course-step-scroll::-webkit-scrollbar-thumb {
	background: #cbd5e1;
	border-radius: 999px;
}

.course-step-item {
	display: grid;
	grid-template-columns: 28px 1fr;
	gap: 12px;
	align-items: flex-start;
	padding-top: 12px;
	border-top: 1px solid #e2e8f0;
	transition: transform 0.2s ease;
}

.course-step-item:hover {
	transform: translateX(2px);
}

.course-step-item__index {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 999px;
	background: #0f172a;
	color: #fff;
	font-size: 0.82rem;
	font-weight: 800;
}

.course-step-item strong {
	display: block;
	margin-bottom: 4px;
	font-size: 1.02rem;
	color: #0f172a;
	font-family: var(--font-accent);
}

.map-panel {
	display: flex;
	flex-direction: column;
	gap: 14px;

	height: 100%;

	padding: 18px;
	border-radius: 22px;
	background: #ffffff5b;
	border: 1px solid #e2e8f0;
	box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);

	transition:
		transform 0.2s ease,
		box-shadow 0.2s ease,
		border-color 0.2s ease;
}

.map-panel:hover {
	transform: translateY(-3px);
	border-color: #cbd5e1;
	box-shadow: 0 18px 32px rgba(15, 23, 42, 0.12);

}

.map-stage {
	position: relative;
	flex: 1;
	min-height: 0;

	border-radius: 22px;
	overflow: hidden;
	background: linear-gradient(135deg, #e2e8f0 0%, #f8fafc 100%);
}

.kakao-map {
	width: 100%;
	height: 100%;
}

.map-overlay,
.map-status {
	position: absolute;
	z-index: 2;
	border: 1px solid #e2e8f0;
	background: rgba(255, 255, 255, 0.94);
	backdrop-filter: blur(10px);
	box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.map-overlay {
	left: 20px;
	top: 20px;
	padding: 16px 18px;
	border-radius: 18px;
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

.map-status {
	top: 20px;
	right: 20px;
	padding: 8px 10px;
	border-radius: 12px;
	font-size: 0.84rem;
	color: #334155;
}

.map-actions {
	margin-top: 0;
	flex: 0 0 auto;
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

@media (max-width: 1024px) {
	.course-top-panels,
	.course-shell {
		grid-template-columns: 1fr;
	}

	.map-stage {
		height: 420px;
	}
}
</style>