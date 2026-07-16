<template>
  <div class="app-wrapper">
    <Header />
    <main class="content-wrapper">
      <RouterView />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Header from './components/common/Header.vue'
import Footer from './components/common/Footer.vue'
</script>

<style>
/* 기본 여백 초기화 (필요시) */
body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
}

.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* 화면 전체 높이를 최소로 확보 */
}

.content-wrapper {
  flex: 1; /* 핵심: 콘텐츠 영역이 남은 공간을 모두 차지하여 푸터를 하단으로 밀어냄 */
  width: 100%;
}
</style>
   