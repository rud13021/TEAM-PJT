<template>
  <article class="place-card">
    <div class="place-card__body">
      <p class="place-card__type">{{ place.type }}</p>
      <h3 class="place-card__name">{{ place.name }}</h3>
      <p class="place-card__meta">{{ place.area }} · {{ place.distance }} away</p>

      <ul class="place-card__tags">
        <li v-for="tag in place.tags" :key="tag">{{ tag }}</li>
      </ul>
    </div>

    <div class="place-card__rating">
      <span class="place-card__rating-label">Rating</span>
      <strong class="place-card__rating-value">{{ place.rating }}</strong>
    </div>
  </article>
</template>

<script setup>
defineProps({
  place: {
    type: Object,
    required: true,
  },
})
</script>

<style scoped>
.place-card {
  padding: 22px;
  border-radius: 24px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: space-between;
  gap: 18px;
  box-shadow: var(--shadow);
}

.place-card__body {
  min-width: 0;
  flex: 1 1 auto;
}

.place-card__type {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.place-card__name {
  margin: 0;
  color: var(--text-h);
  font-size: 1.18rem;
  line-height: 1.35;
}

.place-card__meta {
  margin: 10px 0 0;
  color: var(--text);
  font-size: 0.95rem;
}

.place-card__tags {
  list-style: none;
  padding: 0;
  margin: 14px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.place-card__tags li {
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--code-bg);
  color: var(--text-h);
  font-size: 0.88rem;
}

.place-card__rating {
  min-width: 92px;
  padding-left: 18px;
  border-left: 1px solid var(--border);
  display: grid;
  align-content: center;
  justify-items: end;
  gap: 6px;
}

.place-card__rating-label {
  color: var(--text);
  font-size: 0.9rem;
}

.place-card__rating-value {
  color: var(--text-h);
  font-size: 1.5rem;
}

@media (max-width: 640px) {
  .place-card {
    flex-direction: column;
  }

  .place-card__rating {
    min-width: 0;
    padding-left: 0;
    border-left: 0;
    justify-items: start;
  }
}
</style>