<template>
  <main class="page">
    <h1>지도 페이지</h1>
    <p>여행지 위치와 이동 경로를 확인할 수 있는 지도 화면입니다.</p>
    <RouterLink :to="{ name: 'home' }" class="page__link">홈으로 돌아가기</RouterLink>
  </main>
</template>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 24px 72px;
}

.page__link {
  display: inline-block;
  margin-top: 16px;
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
}
</style>
