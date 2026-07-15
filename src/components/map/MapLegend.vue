<template>
  <div class="map-legend">
    <div v-for="item in items" :key="item.label" class="map-legend__item">
      <span class="map-legend__swatch" :class="`map-legend__swatch--${item.tone}`"></span>
      <span class="map-legend__label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<style scoped>
.map-legend {
  display: grid;
  gap: 12px;
}

.map-legend__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid var(--border);
}

.map-legend__swatch {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: var(--text);
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.04);
}

.map-legend__swatch--highlight {
  background: var(--accent);
}

.map-legend__swatch--primary {
  background: #0f766e;
}

.map-legend__swatch--neutral {
  background: #6b7280;
}

.map-legend__label {
  color: var(--text-h);
  font-size: 0.95rem;
  font-weight: 600;
}
</style>