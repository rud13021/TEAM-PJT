<template>
  <main class="page">
    <h1>커뮤니티 페이지</h1>
    <p>게시글 목록과 작성/상세 페이지로 이동할 수 있습니다.</p>
    <div class="page__actions">
      <RouterLink :to="{ name: 'board-write' }" class="page__link">게시글 작성</RouterLink>
      <RouterLink :to="{ name: 'board-detail', params: { id: 'sample-1' } }" class="page__link">게시글 상세보기</RouterLink>
    </div>
  </main>
</template>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 24px 72px;
}

.page__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.page__link {
  display: inline-block;
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
}
</style>
