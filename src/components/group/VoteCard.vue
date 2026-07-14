<template>
  <article class="vote-card">
    <div class="vote-card__copy">
      <p class="vote-card__eyebrow">Option</p>
      <h3 class="vote-card__title">{{ option.title }}</h3>
      <p class="vote-card__description">{{ option.description }}</p>
    </div>

    <div class="vote-card__meta">
      <strong class="vote-card__tally">{{ option.tally }}</strong>
      <span class="vote-card__note">{{ option.note }}</span>
      <button class="vote-card__button" type="button">Vote</button>
    </div>
  </article>
</template>

<script setup>
defineProps({
  option: {
    type: Object,
    required: true,
  },
})
</script>

<style scoped>
.vote-card {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 22px;
  border-radius: 24px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow);
}

.vote-card__copy {
  min-width: 0;
  flex: 1 1 auto;
  display: grid;
  gap: 10px;
}

.vote-card__eyebrow {
  margin: 0;
  color: var(--accent);
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.vote-card__title {
  margin: 0;
  color: var(--text-h);
  font-size: 1.18rem;
  line-height: 1.35;
}

.vote-card__description {
  margin: 0;
  color: var(--text);
  font-size: 0.95rem;
  line-height: 1.6;
}

.vote-card__meta {
  min-width: 110px;
  padding-left: 18px;
  border-left: 1px solid var(--border);
  display: grid;
  align-content: center;
  justify-items: end;
  gap: 8px;
}

.vote-card__tally {
  color: var(--text-h);
  font-size: 1.5rem;
}

.vote-card__note {
  color: var(--text);
  font-size: 0.92rem;
}

.vote-card__button {
  min-height: 42px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid var(--accent-border);
  background: var(--accent-bg);
  color: var(--accent);
  font: inherit;
  font-weight: 700;
  cursor: default;
}

@media (max-width: 640px) {
  .vote-card {
    flex-direction: column;
  }

  .vote-card__meta {
    min-width: 0;
    padding-left: 0;
    border-left: 0;
    justify-items: start;
  }
}
</style>