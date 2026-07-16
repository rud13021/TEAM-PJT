<template>
  <span class="category-icon" aria-hidden="true">
    <svg v-if="name === '관광지'" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15 8H9L12 2Z" fill="currentColor"/>
      <circle cx="12" cy="15" r="4" fill="currentColor" />
    </svg>

    <svg v-else-if="name === '문화시설'" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="4" fill="currentColor" />
      <rect x="6" y="10" width="2" height="8" fill="currentColor" />
      <rect x="10" y="10" width="2" height="8" fill="currentColor" />
      <rect x="14" y="10" width="2" height="8" fill="currentColor" />
    </svg>

    <svg v-else-if="name === '레포츠'" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="12" r="3" fill="currentColor" />
      <path d="M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>

    <svg v-else-if="name === '쇼핑'" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2L3 6v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6z" fill="currentColor"/>
      <path d="M8 6a4 4 0 0 1 8 0" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </svg>

    <svg v-else-if="name === '숙박'" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="7" width="18" height="10" fill="currentColor" />
      <rect x="7" y="11" width="3" height="3" fill="white" />
    </svg>

    <svg v-else-if="name === '축제공연행사'" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M6 6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="12" cy="9" r="1" fill="currentColor" />
    </svg>

    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="6" fill="currentColor" />
    </svg>
  </span>
</template>

<script setup>
const props = defineProps({ name: { type: String, default: '' } })
const name = props.name
</script>

<style scoped>
.category-icon { display:inline-flex; width:16px; height:16px; vertical-align:middle }
.category-icon svg { width:100%; height:100%; display:block }
</style>
