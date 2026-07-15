<template>
  <div class="kakao-map" aria-label="Static map placeholder">
    <div class="kakao-map__grid"></div>

    <div
      v-for="marker in markerData"
      :key="marker.id"
      class="kakao-map__pin"
      :class="[
        `kakao-map__pin--${marker.legendTone}`,
        { 'kakao-map__pin--selected': marker.isSelected },
      ]"
      :style="getMarkerStyle(marker)"
      :aria-label="marker.name"
      :title="marker.name"
    ></div>

    <div class="kakao-map__center-label">
      <span class="kakao-map__center-title">Placeholder map</span>
      <span class="kakao-map__center-value">{{ centerLabel }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  markerData: {
    type: Array,
    default: () => [],
  },
  centerPoint: {
    type: Object,
    default: null,
  },
})

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function toPercent(value, min, max) {
  if (!Number.isFinite(value)) {
    return 50
  }

  if (max === min) {
    return 50
  }

  return clamp(((value - min) / (max - min)) * 100, 8, 92)
}

function getMarkerStyle(marker) {
  const left = toPercent(marker.lng, 126.9705, 126.9915)
  const top = toPercent(marker.lat, 37.548, 37.579)

  return {
    left: `${left}%`,
    top: `${100 - top}%`,
  }
}

const centerLabel = computed(() => {
  if (!props.centerPoint || !Number.isFinite(props.centerPoint.lat) || !Number.isFinite(props.centerPoint.lng)) {
    return 'No center selected'
  }

  return `${props.centerPoint.lat.toFixed(4)}, ${props.centerPoint.lng.toFixed(4)}`
})
</script>

<style scoped>
.kakao-map {
  position: relative;
  width: 100%;
  min-height: 420px;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid var(--border);
  background:
    radial-gradient(circle at 20% 30%, rgba(170, 59, 255, 0.18), transparent 20%),
    radial-gradient(circle at 80% 75%, rgba(170, 59, 255, 0.08), transparent 22%),
    linear-gradient(135deg, #f8f5ff 0%, #f6f3ef 100%);
}

.kakao-map__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px);
  background-size: 56px 56px;
  opacity: 0.65;
}

.kakao-map__pin {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.88);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  transform: translate(-50%, -50%);
}

.kakao-map__pin--highlight {
  background: var(--accent);
}

.kakao-map__pin--primary {
  background: #0f766e;
}

.kakao-map__pin--neutral {
  background: #6b7280;
}

.kakao-map__pin--selected {
  box-shadow: 0 0 0 6px rgba(170, 59, 255, 0.18), 0 10px 22px rgba(0, 0, 0, 0.16);
}

.kakao-map__center-label {
  position: absolute;
  left: 20px;
  bottom: 20px;
  display: grid;
  gap: 2px;
  padding: 10px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-h);
  border: 1px solid var(--border);
}

.kakao-map__center-title {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text);
}

.kakao-map__center-value {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-h);
}
</style>