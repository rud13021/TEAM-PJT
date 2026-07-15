<template>
  <main class="page">
    <h1>챗봇 페이지</h1>
    <p>여행 관련 질문을 주고받을 수 있는 챗봇 화면입니다.</p>
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
