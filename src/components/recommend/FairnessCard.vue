<template>
  <article class="card fairness-card">
    <p class="card__eyebrow">{{ title }}</p>
    <h3 class="card__title">{{ summary }}</h3>

    <ul class="fairness-card__list">
      <li v-for="item in items" :key="item.label" class="fairness-card__item">
        <span class="fairness-card__label">{{ item.label }}</span>
        <strong class="fairness-card__value">{{ item.value }}</strong>
      </li>
    </ul>
  </article>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  items: {
    type: Array,
    default: () => [],
  },
})
</script>

<style scoped>
.card {
  padding: 22px;
  border-radius: 24px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
}

.card__eyebrow {
  margin: 0 0 10px;
  color: var(--accent);
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card__title {
  margin: 0;
  color: var(--text-h);
  font-size: 1.05rem;
  line-height: 1.5;
}

.fairness-card__list {
  list-style: none;
  padding: 0;
  margin: 18px 0 0;
  display: grid;
  gap: 12px;
}

.fairness-card__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
}

.fairness-card__label {
  color: var(--text);
  font-size: 0.94rem;
}

.fairness-card__value {
  color: var(--text-h);
  font-size: 0.98rem;
}
</style>