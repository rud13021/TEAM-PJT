<template>
  <button class="quick-station" type="button">
    <span class="quick-station__label">{{ label }}</span>
    <span class="quick-station__description">{{ description }}</span>
  </button>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
.quick-station {
  width: 100%;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  display: grid;
  gap: 6px;
  text-align: left;
  cursor: default;
}

.quick-station__label {
  color: var(--text-h);
  font-size: 1rem;
  font-weight: 700;
}

.quick-station__description {
  color: var(--text);
  font-size: 0.92rem;
  line-height: 1.5;
}
</style>