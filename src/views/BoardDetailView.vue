<template>
  <main class="page">
    <h1>게시글 상세 페이지</h1>
    <p>선택한 게시글의 내용을 확인하는 상세 화면입니다.</p>
    <RouterLink :to="{ name: 'board' }" class="page__link">목록으로 돌아가기</RouterLink>
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
