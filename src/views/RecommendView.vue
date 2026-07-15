<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useMapStore } from '../stores/map'
import { loadKakaoMapSdk, searchKakaoPlaces } from '../services/kakaoMap'

const mapStore = useMapStore()
const startLocations = computed(() => mapStore.startLocations.filter((location) => location.name?.trim()))
const categories = [
	{ id: 'places', name: '명소탐방', emoji: '🏞️' },
	{ id: 'restaurants', name: '맛집거리', emoji: '🍲' },
	{ id: 'hotels', name: '숙박지', emoji: '🏨' },
	{ id: 'festivals', name: '축제광장', emoji: '🎈' },
	{ id: 'shopping', name: '쇼핑몰', emoji: '🛍️' },
]
const selectedCategories = ref(['places', 'restaurants', 'festivals'])
const places = [
	{ title: '낙산공원 성곽길 저녁 산책', meta: '서울 종로구 · 4.8', tag: '명소탐방' },
	{ title: '혜화 대학로 숯불갈비', meta: '서울 종로구 · 4.7', tag: '맛집거리' },
	{ title: 'DDP 야간 포토존', meta: '서울 중구 · 4.9', tag: '명소탐방' },
]
const mapContainer = ref(null)
let mapInstance = null

const toggleCategory = (catId) => {
	const index = selectedCategories.value.indexOf(catId)
	if (index > -1) {
		selectedCategories.value.splice(index, 1)
	} else {
		selectedCategories.value.push(catId)
	}
}

const createMarkerSvg = (color, variant = 'circle') => {
	const shapes = {
		circle: `<circle cx="16" cy="16" r="13" fill="${color}" stroke="#fff" stroke-width="3" />`,
		pin: `<path d="M16 2c-5 0-9 4-9 9 0 6 9 14 9 14s9-8 9-14c0-5-4-9-9-9Z" fill="${color}" stroke="#fff" stroke-width="3" />`,
		star: `<path d="M16 3.4 19.4 12 29 12l-7.6 5.6 2.9 9.1-8.3-6.1-8.3 6.1 2.9-9.1L3 12h9.6L16 3.4Z" fill="${color}" stroke="#fff" stroke-width="3" />`,
	}

	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">${shapes[variant] || shapes.circle}</svg>`)}`
}

const createMarkerLabel = (kakao, map, position, text) => {
	const label = document.createElement('div')
	label.style.cssText = 'padding: 4px 8px; border-radius: 999px; background: rgba(255,255,255,0.96); border: 1px solid #e2e8f0; font-size: 11px; color: #0f172a; white-space: nowrap; box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);'
	label.textContent = text

	const overlay = new kakao.maps.CustomOverlay({
		position,
		content: label,
		xAnchor: 0.5,
		yAnchor: 1.3,
	})
	overlay.setMap(map)
	return overlay
}

const initRecommendMap = async () => {
	if (!mapContainer.value) return

	try {
		const kakao = await loadKakaoMapSdk()
		if (!mapContainer.value) return

		if (mapInstance) {
			mapInstance.remove()
		}

		const validLocations = startLocations.value.filter((location) => Number.isFinite(location.lat) && Number.isFinite(location.lng))
		const center = validLocations.length
			? {
					lat: validLocations.reduce((sum, location) => sum + location.lat, 0) / validLocations.length,
					lng: validLocations.reduce((sum, location) => sum + location.lng, 0) / validLocations.length,
				}
			: { lat: 37.5665, lng: 126.9979 }

		mapInstance = new kakao.maps.Map(mapContainer.value, {
			center: new kakao.maps.LatLng(center.lat, center.lng),
			level: 6,
		})

		const bounds = new kakao.maps.LatLngBounds()
		const centerPosition = new kakao.maps.LatLng(center.lat, center.lng)
		const centerMarker = new kakao.maps.Marker({
			position: centerPosition,
			image: new kakao.maps.MarkerImage(createMarkerSvg('#4f46e5', 'pin'), new kakao.maps.Size(32, 32), { offset: new kakao.maps.Point(16, 16) }),
		})
		centerMarker.setMap(mapInstance)
		createMarkerLabel(kakao, mapInstance, centerPosition, '추천 거점')
		bounds.extend(centerPosition)

		const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
		validLocations.forEach((location, index) => {
			const markerPosition = new kakao.maps.LatLng(location.lat, location.lng)
			const marker = new kakao.maps.Marker({
				position: markerPosition,
				image: new kakao.maps.MarkerImage(createMarkerSvg(colors[index % colors.length], 'circle'), new kakao.maps.Size(32, 32), { offset: new kakao.maps.Point(16, 16) }),
			})
			marker.setMap(mapInstance)
			createMarkerLabel(kakao, mapInstance, markerPosition, location.name)
			bounds.extend(markerPosition)
		})

		await Promise.all(
			places.map(async (place) => {
				const results = await searchKakaoPlaces(place.title)
				if (!results.length) return
				const spot = results[0]
				const markerPosition = new kakao.maps.LatLng(Number(spot.y), Number(spot.x))
				const marker = new kakao.maps.Marker({
					position: markerPosition,
					image: new kakao.maps.MarkerImage(createMarkerSvg('#8b5cf6', 'star'), new kakao.maps.Size(34, 34), { offset: new kakao.maps.Point(17, 17) }),
				})
				marker.setMap(mapInstance)
				createMarkerLabel(kakao, mapInstance, markerPosition, place.title)
				bounds.extend(markerPosition)

				const infoWindow = new kakao.maps.InfoWindow({
					content: `<div style="padding:8px 10px;font-size:12px;line-height:1.4;max-width:180px;">${place.title}<br /><span style="color:#64748b;">${spot.addressName || spot.roadAddressName || ''}</span></div>`,
				})
				kakao.maps.event.addListener(marker, 'click', () => infoWindow.open(mapInstance, marker))
			}),
		)

		if (validLocations.length > 1) {
			mapInstance.setBounds(bounds)
		} else {
			mapInstance.setCenter(centerPosition)
		}
	} catch (error) {
		console.error('🔥 실제 에러:', error)
		if (mapContainer.value) {
			mapContainer.value.innerHTML = '<div class="map-empty">카카오 지도 로딩에 실패했습니다. 카카오 앱 키를 설정해 주세요.</div>'
		}
	}
}

onMounted(() => {
	nextTick(() => initRecommendMap())
})

watch(startLocations, () => {
	nextTick(() => initRecommendMap())
}, { deep: true })
</script>

<template>
	<main class="recommend-demo">
		<section class="recommend-shell">
			<aside class="control-panel">
				<div class="panel-card panel-card--title">
					<p class="panel-eyebrow">거점 분석 & 지도</p>
					<h1>출발지와 선호 카테고리를 바탕으로 가장 무난한 거점을 찾습니다.</h1>
				</div>

				<div class="panel-card">
					<h2>나의 출발 포인트</h2>
					<div class="chip-list">
						<span v-for="item in startLocations" :key="item.name + item.address" class="chip">{{ item.name }}</span>
					</div>
				</div>

				<div class="panel-card">
					<h2>지도 상 시각화 대상</h2>
					<div class="chip-list">
						<button
							v-for="item in categories"
							:key="item.id"
							type="button"
							class="chip chip--accent"
							:class="selectedCategories.includes(item.id) ? 'chip--active' : ''"
							@click="toggleCategory(item.id)"
						>
							{{ item.emoji }} {{ item.name }}
						</button>
					</div>
				</div>

				<div class="panel-card panel-card--grow">
					<h2>추천 스팟 목록</h2>
					<div class="place-list">
						<div v-for="place in places" :key="place.title" class="place-card">
							<span class="place-card__tag">{{ place.tag }}</span>
							<strong>{{ place.title }}</strong>
							<p>{{ place.meta }}</p>
						</div>
					</div>
				</div>
			</aside>

			<section class="map-panel">
				<div class="map-overlay">
					<p>추천 거점</p>
					<h2>을지로4가역</h2>
					<span>대중교통 접근성과 식사·관광 동선 모두 우수</span>
				</div>
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
	flex-direction: column;
	gap: 4px;
	padding: 12px 14px;
	border-radius: 16px;
	background: #f8fafc;
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
	font-size: 0.9rem;
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
