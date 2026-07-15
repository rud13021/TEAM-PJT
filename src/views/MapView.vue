<template>
  <main class="page">
    <section class="page__hero">
      <div>
        <p class="page__eyebrow">KAKAO MAP</p>
        <h1>카카오 지도로 출발지와 중간 위치를 확인하세요.</h1>
        <p class="page__description">
          입력한 출발지를 기준으로 지도 위에 마커를 띄우고, 서울 중심부를 기준으로 한 번에 확인할 수 있습니다.
        </p>
      </div>
      <RouterLink :to="{ name: 'home' }" class="page__link">홈으로 돌아가기</RouterLink>
    </section>

    <section class="map-card">
      <div v-if="statusMessage" class="map-card__status">{{ statusMessage }}</div>
      <div ref="mapContainer" class="kakao-map"></div>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useMapStore } from '../stores/map'
import { loadKakaoMapSdk } from '../services/kakaoMap'

const mapStore = useMapStore()
const mapContainer = ref(null)
let mapInstance = null

const startLocations = computed(() =>
  mapStore.startLocations.filter((location) => location.name?.trim()),
)

const statusMessage = ref('지도 로딩 중...')

const createMarkerSvg = (color, variant = 'circle') => {
  const shapes = {
    circle: `<circle cx="18" cy="18" r="13" fill="${color}" stroke="#fff" stroke-width="3" />`,
    pin: `<path d="M18 2c-5.2 0-9.4 4.2-9.4 9.4 0 5.8 7.3 13.4 8.3 14.4l1.1 1.1 1.1-1.1c1-1 8.3-8.6 8.3-14.4C27.4 6.2 23.2 2 18 2Z" fill="${color}" stroke="#fff" stroke-width="3" />`,
    star: `<path d="M18 3.5 21.3 12 30 12l-7.1 5.2 2.7 8.8-8.6-6.2-8.6 6.2 2.7-8.8L12 12h8.7L18 3.5Z" fill="${color}" stroke="#fff" stroke-width="3" />`,
  }

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36">${shapes[variant] || shapes.circle}</svg>`)}`
}

const createMarkerLabel = (kakao, map, position, text) => {
  const label = document.createElement('div')
  label.style.cssText = 'padding: 5px 8px; border-radius: 999px; background: rgba(255,255,255,0.96); border: 1px solid #e2e8f0; font-size: 12px; color: #0f172a; white-space: nowrap; box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);'
  label.textContent = text

  return new kakao.maps.CustomOverlay({
    position,
    content: label,
    xAnchor: 0.5,
    yAnchor: 1.4,
  })
}

const addMarker = (kakao, map, position, color, label, variant = 'circle', size = 36, isPrimary = false) => {
  const marker = new kakao.maps.Marker({
    position,
    image: new kakao.maps.MarkerImage(createMarkerSvg(color, variant), new kakao.maps.Size(size, size), { offset: new kakao.maps.Point(size / 2, size / 2) }),
    zIndex: isPrimary ? 20 : 10,
  })
  marker.setMap(map)

  if (label) {
    const overlay = createMarkerLabel(kakao, map, position, label)
    overlay.setMap(map)
  }

  return marker
}

const initMap = async () => {
  if (!mapContainer.value) return

  try {
    const kakao = await loadKakaoMapSdk()
    if (!mapContainer.value) return

    if (mapInstance) {
      mapInstance.remove()
    }

    const validLocations = startLocations.value.filter(
      (location) => Number.isFinite(location.lat) && Number.isFinite(location.lng),
    )

    const center = validLocations.length
      ? {
          lat: validLocations.reduce((sum, location) => sum + location.lat, 0) / validLocations.length,
          lng: validLocations.reduce((sum, location) => sum + location.lng, 0) / validLocations.length,
        }
      : { lat: 37.5665, lng: 126.978 }

    mapInstance = new kakao.maps.Map(mapContainer.value, {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: 6,
    })

    const bounds = new kakao.maps.LatLngBounds()
    const centerPosition = new kakao.maps.LatLng(center.lat, center.lng)

    addMarker(kakao, mapInstance, centerPosition, '#4f46e5', '최적 장소', 'pin', 40, true)
    bounds.extend(centerPosition)

    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
    const variants = ['circle', 'pin', 'star']
    validLocations.forEach((location, index) => {
      const markerPosition = new kakao.maps.LatLng(location.lat, location.lng)
      addMarker(kakao, mapInstance, markerPosition, colors[index % colors.length], location.name, variants[index % variants.length], 36)
      bounds.extend(markerPosition)
    })

    if (validLocations.length > 1) {
      mapInstance.setBounds(bounds)
    } else {
      mapInstance.setCenter(centerPosition)
    }

    statusMessage.value = ''
  } catch (error) {
    console.error('🔥 실제 에러:', error)

    statusMessage.value = '카카오 지도 로딩에 실패했습니다. 카카오 앱 키를 설정해 주세요.'
    if (mapContainer.value) {
      mapContainer.value.innerHTML = '<div class="map-empty">카카오 지도 로딩에 실패했습니다. 카카오 앱 키를 설정해 주세요.</div>'
    }
  }
}

onMounted(() => {
  nextTick(() => initMap())
})

watch(startLocations, () => {
  nextTick(() => initMap())
}, { deep: true })
</script>

<style scoped>
.page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 48px 24px 72px;
}

.page__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.page__eyebrow {
  margin: 0 0 8px;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: var(--accent);
}

.page__hero h1 {
  margin: 0 0 8px;
  font-size: 1.6rem;
  color: var(--text-h);
}

.page__description {
  margin: 0;
  color: var(--text);
  line-height: 1.7;
}

.page__link {
  display: inline-block;
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
}

.map-card {
  padding: 18px;
  border-radius: 24px;
  border: 1px solid var(--border);
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.map-card__status {
  margin-bottom: 12px;
  color: var(--text);
  font-size: 0.95rem;
}

.kakao-map {
  width: 100%;
  height: 520px;
  border-radius: 18px;
  overflow: hidden;
  background: #f8fafc;
}

.map-empty {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--text);
  font-weight: 600;
  background: #f8fafc;
}
</style>
