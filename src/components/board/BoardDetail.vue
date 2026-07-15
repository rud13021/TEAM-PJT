<template>
  <div v-if="post" class="board-detail">
    <h2>{{ post.title }}</h2>
    <div class="meta">작성일: {{ new Date(post.createdAt).toLocaleString() }}</div>
    <div class="content">{{ post.content }}</div>
    <div class="controls">
      <button @click="$emit('back')">목록</button>
      <button @click="$emit('edit', post.id)">수정</button>
      <button @click="onDelete">삭제</button>
    </div>
  </div>
  <p v-else>게시글을 찾을 수 없습니다.</p>
</template>

<script setup>
import { toRef } from 'vue'
import useBoard from '@/composables/useBoard.js'

const props = defineProps({ id: { type: String, required: true } })
const emits = defineEmits(['back', 'edit', 'deleted'])

const { getPost, deletePost } = useBoard()
const post = toRef({ value: null }, 'value')

// 간단 조회
const found = getPost(props.id)
if (found) post.value = found

function onDelete() {
  const pwd = prompt('삭제 비밀번호를 입력하세요:')
  if (pwd === null) return
  const res = deletePost(props.id, pwd)
  if (!res.success) alert(res.message)
  else {
    alert('삭제되었습니다.')
    emits('deleted')
  }
}
</script>

<style scoped>
.board-detail { padding: 1rem }
.content { white-space: pre-wrap; margin: 1rem 0 }
.controls button { margin-right: 0.5rem }
</style>
