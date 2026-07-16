<template>
  <div class="board-list">
    <h2>게시판 목록</h2>
    <ul>
      <li v-for="item in items" :key="item.id" class="post-card" @click="$emit('view', item.id)">
        <div class="post-top">
          <div class="post-top-left">
            <h3 class="post-title">{{ item.title.length > 60 ? item.title.slice(0,60) + '...' : item.title }}</h3>
            <div class="post-category" :class="getCategoryClass(item.category)">
              <CategoryIcon :name="item.category || '자유'" class="cat-icon" />
              {{ item.category || '자유' }}
            </div>
          </div>
          <div class="post-top-right">
            <div class="post-meta">{{ new Date(item.createdAt).toLocaleDateString() }}</div>
          </div>
        </div>
        <p class="post-content">{{ item.content }}</p>
        
        <div class="post-footer">
          <div class="counts">
            <span class="views">👁️ {{ item.views || 0 }}</span>
            <span class="likes">👍 {{ item.likes || 0 }}</span>
            <span class="comments">💬 {{ (item.comments || []).length }}</span>
          </div>
        </div>
      </li>
    </ul>
    <p v-if="items.length === 0">등록된 게시글이 없습니다.</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CategoryIcon from '@/components/icons/CategoryIcon.vue'
import useBoard from '@/composables/useBoard.js'

const props = defineProps({ category: { type: String, default: '' } })

function getCategoryClass(cat) {
  if (!cat) return 'cat-free'
  switch (cat) {
    case '관광지': return 'cat-tour'
    case '문화시설': return 'cat-culture'
    case '레포츠': return 'cat-sports'
    case '쇼핑': return 'cat-shopping'
    case '숙박': return 'cat-stay'
    case '축제공연행사': return 'cat-festival'
    case '자유': return 'cat-free'
    default: return 'cat-free'
  }
}

const components = { CategoryIcon }
const emits = defineEmits(['view', 'create', 'deleted'])

const { getAllPosts, deletePost } = useBoard()

const items = computed(() => {
  const all = getAllPosts()
  if (!props.category) return all
  return all.filter(p => (p.category || '') === props.category)
})

function onDelete(id) {
  const pwd = prompt('삭제 비밀번호를 입력하세요:')
  if (pwd === null) return
  const res = deletePost(id, pwd)
  if (!res.success) alert(res.message)
  else {
    alert('삭제되었습니다.')
    emits('deleted')
  }
}
</script>

<style scoped>

.board-list { padding: 0 }
.board-list h2 { margin: 0 0 16px; color: var(--text-h); font-size: 1.15rem }

.board-list ul { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; align-items: stretch }

.post-card {
  padding: 22px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.98);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  overflow: hidden;
  height: 100%;
  min-height: 220px;
}

.post-top { display:flex; justify-content:space-between; align-items:flex-start; gap:12px }
.post-top-left { display:flex; flex-direction:column; gap:6px; align-items:flex-start }
.post-top-right { display:flex; align-items:flex-start }
.post-title { margin:0; color:var(--text-h); font-size:1.05rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; text-overflow:ellipsis; word-break:break-word }
.post-meta { color:var(--accent); font-size:0.85rem; font-weight:700 }

.post-category { margin-top:4px; display:inline-block; padding:6px 10px; border-radius:999px; font-size:0.8rem; color:#fff; font-weight:700 }
.post-category.cat-tour { background:#0ea5a4 }
.post-category.cat-culture { background:#7c3aed }
.post-category.cat-sports { background:#ef4444 }
.post-category.cat-shopping { background:#f59e0b }
.post-category.cat-stay { background:#10b981 }
.post-category.cat-festival { background:#06b6d4 }
.post-category.cat-free { background:#6b7280 }
.post-category .cat-icon { margin-right:4px; display:inline-flex; vertical-align:middle }

.post-content { margin:0; color:var(--text); line-height:1.6; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; text-overflow:ellipsis; white-space:normal; word-break:break-word; max-height: calc(1.6em * 2); }




.post-footer { display:flex; justify-content:flex-end; align-items:center; margin-top:auto }
.post-footer .counts { color:var(--text); display:flex; gap:14px; font-weight:700; align-items:center }

.post-card:hover { cursor: pointer; transform: translateY(-6px); box-shadow: 0 26px 50px rgba(15,23,42,0.12) }

@media (max-width:900px) {
  .board-list ul { grid-template-columns: repeat(1, 1fr); gap: 16px }
  .post-card { padding:18px }
}

@media (min-width:1200px) {
  .board-list ul { gap: 28px }
  .post-card { padding:24px }
}
</style>
