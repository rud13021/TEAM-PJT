<template>
  <div class="board-form">
    <h2>{{ mode === 'edit' ? '글 수정' : '새 글 작성' }}</h2>
    <form @submit.prevent="onSubmit">
      <div>
        <label>제목</label>
        <input v-model="title" />
      </div>
      <div>
        <label>내용</label>
        <textarea v-model="content"></textarea>
      </div>
      <div>
        <label>비밀번호 (수정/삭제용)</label>
        <input v-model="password" type="password" />
      </div>
      <div>
        <label>태그 (쉼표로 구분)</label>
        <input v-model="tagsInput" placeholder="예: 맛집,데이트,한강" />
      </div>
      <div class="buttons">
        <button type="submit">{{ mode === 'edit' ? '저장' : '등록' }}</button>
        <button type="button" @click="$emit('cancel')">취소</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import useBoard from '@/composables/useBoard.js'

const props = defineProps({ mode: { type: String, default: 'create' }, postId: { type: String, default: null } })
const emits = defineEmits(['created', 'updated', 'cancel'])

const { getPost, createPost, updatePost } = useBoard()

const title = ref('')
const content = ref('')
const password = ref('')
const tagsInput = ref('')

watch(() => props.postId, (id) => {
  if (props.mode === 'edit' && id) {
    const p = getPost(id)
    if (p) {
      title.value = p.title
      content.value = p.content
      password.value = ''
      tagsInput.value = (p.tags || []).join(',')
    }
  }
}, { immediate: true })

async function onSubmit() {
  const tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
  if (props.mode === 'create') {
    const res = createPost({ title: title.value, content: content.value, password: password.value, tags })
    if (!res.success) return alert(res.message)
    alert('등록되었습니다.')
    emits('created', res.post)
  } else {
    const res = updatePost(props.postId, { title: title.value, content: content.value, tags }, password.value)
    if (!res.success) return alert(res.message)
    alert('수정되었습니다.')
    emits('updated', res.post)
  }
}
</script>

<style scoped>
.board-form { padding: 20px; border-radius:16px; background: rgba(255,255,255,0.98); border:1px solid var(--border); box-shadow:var(--shadow) }
.board-form h2 { margin:0 0 12px 0; color:var(--text-h) }
.board-form label { display:block; margin-top:0.6rem; font-weight:700; color:var(--text) }
.board-form input[type="text"], .board-form input[type="password"], .board-form textarea { width:100%; padding:12px; border-radius:10px; border:1px solid var(--border); background:var(--code-bg); box-sizing:border-box }
.board-form textarea { min-height:140px; background:#fff }
.buttons { margin-top:16px; display:flex; gap:10px; justify-content:flex-end }
.buttons button { padding:10px 14px; border-radius:999px; border:none }
.buttons button[type="submit"] { background:var(--accent); color:#fff }
.buttons button[type="button"] { background:var(--code-bg); color:var(--text) }
</style>
