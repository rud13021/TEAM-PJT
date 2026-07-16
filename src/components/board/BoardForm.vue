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
          <label>카테고리</label>
          <select v-model="category">
            <option value="자유">자유</option>
            <option value="관광지">관광지</option>
            <option value="문화시설">문화시설</option>
            <option value="레포츠">레포츠</option>
            <option value="쇼핑">쇼핑</option>
            <option value="숙박">숙박</option>
            <option value="축제공연행사">축제공연행사</option>
          </select>
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
const category = ref('자유')

watch(() => props.postId, (id) => {
  if (props.mode === 'edit' && id) {
    const p = getPost(id)
    if (p) {
      title.value = p.title
      content.value = p.content
      password.value = ''
      category.value = p.category || '자유'
    }
  }
}, { immediate: true })

async function onSubmit() {
  if (props.mode === 'create') {
    const res = createPost({ title: title.value, content: content.value, password: password.value, category: category.value })
    if (!res.success) return alert(res.message)
    alert('등록되었습니다.')
    emits('created', res.post)
  } else {
    const res = updatePost(props.postId, { title: title.value, content: content.value, category: category.value }, password.value)
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
