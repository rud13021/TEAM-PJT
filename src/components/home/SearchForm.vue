<template>
  <form class="search-form" action="#" aria-label="Search travel destinations" @submit.prevent="handleSubmit">
    <label class="search-form__field">
      <span class="search-form__label">Search destination</span>
      <input
        class="search-form__input"
        type="text"
        placeholder="Search for places, hotels, restaurants..."
        aria-label="Search destination"
        :value="destination"
        @input="handleInput"
      />
    </label>

    <button class="search-form__button" type="submit">Search</button>
  </form>
</template>

<script setup>
defineProps({
  destination: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:destination', 'search'])

function handleInput(event) {
  emit('update:destination', event.target.value)
}

function handleSubmit() {
  emit('search')
}
</script>

<style scoped>
.search-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
  width: 100%;
  max-width: 720px;
}

.search-form__field {
  display: grid;
  gap: 8px;
}

.search-form__label {
  color: var(--text);
  font-size: 0.92rem;
  font-weight: 600;
}

.search-form__input {
  width: 100%;
  min-height: 56px;
  padding: 0 18px;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.96);
  color: var(--text-h);
  font: inherit;
  box-sizing: border-box;
}

.search-form__input::placeholder {
  color: #a19bab;
}

.search-form__button {
  min-height: 56px;
  padding: 0 24px;
  border-radius: 18px;
  border: 1px solid var(--accent-border);
  background: var(--accent);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: default;
}

@media (max-width: 640px) {
  .search-form {
    grid-template-columns: 1fr;
  }

  .search-form__button {
    width: 100%;
  }
}
</style>