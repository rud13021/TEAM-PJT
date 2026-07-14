<template>
  <div class="category-selector" role="group" aria-label="Category selector">
    <button
      v-for="category in categories"
      :key="category"
      class="category-selector__item"
      type="button"
    >
      {{ category }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
})
</script>

<style scoped>
.category-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.category-selector__item {
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-h);
  font: inherit;
  font-weight: 600;
  cursor: default;
}
</style>