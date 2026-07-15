<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useBoard from '@/composables/useBoard.js'

const route = useRoute()
const router = useRouter()
const { getPost, deletePost, toggleLike, isLikedByUser, addComment, incrementView, updateComment, deleteComment, verifyPassword } = useBoard()
const post = ref(null)
const userLiked = ref(false)

function loadPost(id) {
  const p = getPost(id)
  if (!p) {
    post.value = null
    userLiked.value = false
    return
  }
  incrementView(id)
  post.value = getPost(id)
  userLiked.value = isLikedByUser(id)
}

loadPost(route.params.id)
watch(() => route.params.id, (id) => {
  loadPost(id)
})

function handleToggleLike() {
  const res = toggleLike(route.params.id)
  if (res.success) {
    userLiked.value = res.liked
    post.value = getPost(route.params.id)
  }
}

function onEdit() {
  const pwd = prompt('수정 비밀번호를 입력하세요:')
  if (pwd === null) return
  const postObj = getPost(route.params.id)
  if (!postObj) return alert('게시글을 찾을 수 없습니다.')
  if (!verifyPassword(postObj, pwd)) return alert('비밀번호가 일치하지 않습니다.')
  router.push({ name: 'board-write', query: { id: route.params.id } })
}

function onDelete() {
  const pwd = prompt('삭제 비밀번호를 입력하세요:')
  if (pwd === null) return
  const res = deletePost(route.params.id, pwd)
  if (!res.success) return alert(res.message)
  alert('삭제되었습니다.')
  router.push({ name: 'board' })
}

const commentAuthor = ref('')
const commentText = ref('')
const editCommentId = ref(null)
const editCommentText = ref('')
const editCommentAuthor = ref('')

async function submitComment() {
  const res = addComment(route.params.id, { author: commentAuthor.value, text: commentText.value })
  if (!res.success) return alert(res.message)
  commentAuthor.value = ''
  commentText.value = ''
  post.value = getPost(route.params.id)
}

function startEditComment(comment) {
  editCommentId.value = comment.id
  editCommentText.value = comment.text
  editCommentAuthor.value = comment.author
}

async function saveEditComment() {
  if (!editCommentId.value) return
  const res = updateComment(route.params.id, editCommentId.value, { author: editCommentAuthor.value, text: editCommentText.value })
  if (!res.success) return alert(res.message)
  editCommentId.value = null
  editCommentText.value = ''
  editCommentAuthor.value = ''
  post.value = getPost(route.params.id)
}

function cancelEditComment() {
  editCommentId.value = null
  editCommentText.value = ''
  editCommentAuthor.value = ''
}

async function removeComment(commentId) {
  if (!confirm('댓글을 삭제하시겠습니까?')) return
  const res = deleteComment(route.params.id, commentId)
  if (!res.success) return alert(res.message)
  post.value = getPost(route.params.id)
}
</script>

<template>
  <main class="detail-page">
    <section class="detail-shell">
      <RouterLink class="back-link" :to="{ name: 'board' }">← 목록으로 돌아가기</RouterLink>

      <div v-if="post">
        <h1 class="detail-title">{{ post.title }}</h1>
        <div class="meta">{{ new Date(post.createdAt).toLocaleString() }} <span class="likes-detail">👍 {{ post.likes || 0 }}</span></div>
        <p class="content large">{{ post.content }}</p>
      </div>
      <div v-else>
        <p>게시글을 찾을 수 없습니다.</p>
      </div>

      <div class="action-row">
        <button class="like-btn" @click="handleToggleLike">{{ userLiked ? '♥ 추천됨' : '♡ 추천하기' }}</button>
        <button class="like-btn" @click="onEdit">수정</button>
        <button class="like-btn" @click="onDelete">삭제</button>
      </div>

      <div class="comment-section">
        <h2>댓글 ({{ (post.comments || []).length }})</h2>

        <div v-for="(comment, index) in post.comments || []" :key="comment.id || index" class="comment-item">
          <div class="comment-row">
            <strong class="comment-author-display">{{ comment.author }}</strong>
            <div class="comment-controls">
              <button @click.stop="startEditComment(comment)">수정</button>
              <button @click.stop="removeComment(comment.id)">삭제</button>
            </div>
          </div>

          <div v-if="editCommentId === comment.id" class="comment-edit">
            <input v-model="editCommentAuthor" />
            <textarea v-model="editCommentText"></textarea>
            <div class="edit-actions">
              <button @click="saveEditComment">저장</button>
              <button @click="cancelEditComment">취소</button>
            </div>
          </div>

          <p v-else class="comment-text-display">{{ comment.text }}</p>
        </div>

        <div class="comment-form">
          <input v-model="commentAuthor" placeholder="닉네임 (선택)" class="comment-author" />
          <textarea v-model="commentText" placeholder="댓글을 입력하세요" class="comment-text"></textarea>
          <button @click="submitComment" class="comment-submit">댓글 등록</button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.detail-page {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 24px 72px;
  box-sizing: border-box;
}

.detail-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
  border-radius: 24px;
  background: rgba(255,255,255,0.98);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.back-link {
  display: inline-block;
  padding: 8px 12px;
  background: var(--code-bg);
  border-radius: 999px;
  color: var(--accent);
  font-weight: 700;
}

.detail-shell h1 {
  margin: 0 0 6px 0;
  font-size: 1.4rem;
  color: var(--text-h);
  line-height: 1.2;
}

.meta {
  margin: 0 0 12px 0;
  color: var(--accent);
  font-weight: 700;
}

.content.large { font-size:1rem; min-height:160px; white-space:pre-wrap; word-break:break-word }
.content { margin: 0; color: var(--text); line-height: 1.8; word-break:break-word }

/* prevent title/content overflow in compact containers */
.detail-title { overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp:2; -webkit-box-orient: vertical }

.action-row { display:flex; gap:12px; justify-content:flex-start }
.like-btn { padding: 10px 14px; border-radius: 999px; border: 1px solid var(--border); background: #fff; font-weight:700; color:var(--text) }

.comment-section { display:flex; flex-direction:column; gap:12px; margin-top:6px }
.comment-section h2 { margin:0 0 8px 0; font-size:1rem; color:var(--text-h) }

.comment-item { padding:12px 14px; border-radius:14px; background:var(--card-bg, #f8fafc); display:flex; flex-direction:column; gap:8px }
.comment-row { display:flex; justify-content:space-between; align-items:center }
.comment-controls button { margin-left:8px }
.comment-text-display { margin:0; color:var(--text); max-height:120px; overflow:auto }

.comment-edit input, .comment-edit textarea { width:100%; margin-bottom:8px }
.edit-actions { display:flex; gap:8px }

.comment-form { display:flex; gap:10px; align-items:flex-start }
.comment-form .comment-author { width:140px; padding:12px 8px; height:54px; box-sizing:border-box; border-radius:10px; border:1px solid var(--border); background:var(--code-bg) }
.comment-form .comment-text { flex:1; min-height:54px; padding:8px; border-radius:10px; border:1px solid var(--border); background:#fff; overflow:auto }
.comment-form .comment-submit { padding:10px 14px; border-radius:999px; background:var(--accent); color:#fff; border:none; align-self:center }

@media (max-width:900px) {
  .comment-form { flex-direction:column; align-items:stretch }
  .comment-form .comment-author { width:100% }
}
</style>
