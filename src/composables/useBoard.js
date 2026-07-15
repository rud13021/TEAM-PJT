import { ref } from 'vue'
import { stripTags } from '@/utils/sanitize.js'

const STORAGE_KEY = 'vue_local_board_posts'
const USER_LIKES_KEY = 'vue_local_board_user_likes'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch (e) {
    console.error('useBoard: failed to load from localStorage', e)
    return []
  }
}

function saveToStorage(posts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
  } catch (e) {
    console.error('useBoard: failed to save to localStorage', e)
  }
}

const posts = ref(loadFromStorage())

function refresh() {
  posts.value = loadFromStorage()
}

// 자동 동기화: 다른 탭/창에서 STORAGE_KEY가 변경되면 반영
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      posts.value = loadFromStorage()
    }
  })
}

function getAllPosts() {
  return posts.value.slice().sort((a, b) => b.createdAt - a.createdAt)
}

function getPost(id) {
  return posts.value.find((p) => p.id === id) || null
}

function generateId() {
  return Date.now().toString() + '-' + Math.floor(Math.random() * 10000)
}

function verifyPassword(post, password) {
  if (!post) return false
  return post.password === password
}

function createPost({ title, content, password, tags }) {
  // 입력 유효성 검사 및 정리 (HTML 태그 제거)
  const cleanTitle = stripTags(title)
  const cleanContent = stripTags(content)
  if (!cleanTitle) return { success: false, message: '제목을 입력하세요.' }
  if (!cleanContent) return { success: false, message: '내용을 입력하세요.' }

  const cleanTags = (tags || []).map((t) => stripTags(t)).filter(Boolean)

  const now = Date.now()
  const post = {
    id: generateId(),
    title: cleanTitle,
    content: cleanContent,
    password: password || '',
    createdAt: now,
    updatedAt: null,
    tags: cleanTags,
    likes: 0,
    comments: [],
    views: 0
  }
  posts.value.push(post)
  saveToStorage(posts.value)
  return { success: true, post }
}

function loadUserLikes() {
  try {
    const raw = localStorage.getItem(USER_LIKES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch (e) {
    return []
  }
}

function saveUserLikes(arr) {
  try {
    localStorage.setItem(USER_LIKES_KEY, JSON.stringify(arr))
  } catch (e) {
    // ignore
  }
}

function isLikedByUser(postId) {
  const likes = loadUserLikes()
  return likes.includes(postId)
}

function toggleLike(postId) {
  const idx = posts.value.findIndex((p) => p.id === postId)
  if (idx === -1) return { success: false, message: '게시글을 찾을 수 없습니다.' }
  const post = posts.value[idx]

  const likes = loadUserLikes()
  const liked = likes.includes(postId)
  if (liked) {
    post.likes = Math.max(0, (post.likes || 0) - 1)
    const newLikes = likes.filter((id) => id !== postId)
    saveUserLikes(newLikes)
  } else {
    post.likes = (post.likes || 0) + 1
    likes.push(postId)
    saveUserLikes(likes)
  }
  posts.value.splice(idx, 1, { ...post })
  saveToStorage(posts.value)
  return { success: true, likes: post.likes, liked: !liked }
}

function addComment(postId, { author, text }) {
  const idx = posts.value.findIndex((p) => p.id === postId)
  if (idx === -1) return { success: false, message: '게시글을 찾을 수 없습니다.' }
  const post = posts.value[idx]
  const cleanAuthor = stripTags(author) || '익명'
  const cleanText = stripTags(text)
  if (!cleanText) return { success: false, message: '댓글 내용을 입력하세요.' }
  const comment = { id: generateId(), author: cleanAuthor, text: cleanText, createdAt: Date.now() }
  post.comments = post.comments || []
  post.comments.push(comment)
  posts.value.splice(idx, 1, { ...post })
  saveToStorage(posts.value)
  return { success: true, comment }
}

function updateComment(postId, commentId, { author, text }) {
  const idx = posts.value.findIndex((p) => p.id === postId)
  if (idx === -1) return { success: false, message: '게시글을 찾을 수 없습니다.' }
  const post = posts.value[idx]
  const cidx = (post.comments || []).findIndex((c) => c.id === commentId)
  if (cidx === -1) return { success: false, message: '댓글을 찾을 수 없습니다.' }
  const cleanAuthor = stripTags(author) || '익명'
  const cleanText = stripTags(text)
  if (!cleanText) return { success: false, message: '댓글 내용을 입력하세요.' }
  post.comments[cidx] = { ...post.comments[cidx], author: cleanAuthor, text: cleanText, updatedAt: Date.now() }
  posts.value.splice(idx, 1, { ...post })
  saveToStorage(posts.value)
  return { success: true, comment: post.comments[cidx] }
}

function deleteComment(postId, commentId) {
  const idx = posts.value.findIndex((p) => p.id === postId)
  if (idx === -1) return { success: false, message: '게시글을 찾을 수 없습니다.' }
  const post = posts.value[idx]
  const cidx = (post.comments || []).findIndex((c) => c.id === commentId)
  if (cidx === -1) return { success: false, message: '댓글을 찾을 수 없습니다.' }
  post.comments.splice(cidx, 1)
  posts.value.splice(idx, 1, { ...post })
  saveToStorage(posts.value)
  return { success: true }
}

function incrementView(postId) {
  const idx = posts.value.findIndex((p) => p.id === postId)
  if (idx === -1) return { success: false, message: '게시글을 찾을 수 없습니다.' }
  const post = posts.value[idx]
  post.views = (post.views || 0) + 1
  posts.value.splice(idx, 1, { ...post })
  saveToStorage(posts.value)
  return { success: true, views: post.views }
}

function updatePost(id, { title, content, tags }, password) {
  const idx = posts.value.findIndex((p) => p.id === id)
  if (idx === -1) return { success: false, message: '게시글을 찾을 수 없습니다.' }
  const post = posts.value[idx]
  if (!verifyPassword(post, password)) return { success: false, message: '비밀번호가 일치하지 않습니다.' }
  const newTitleRaw = title != null ? title : post.title
  const newContentRaw = content != null ? content : post.content
  const newTitle = stripTags(newTitleRaw)
  const newContent = stripTags(newContentRaw)

  if (!newTitle) return { success: false, message: '제목을 입력하세요.' }
  if (!newContent) return { success: false, message: '내용을 입력하세요.' }

  const cleanTags = tags ? (Array.isArray(tags) ? tags.map((t) => stripTags(t)).filter(Boolean) : post.tags) : post.tags

  const updated = {
    ...post,
    title: newTitle,
    content: newContent,
    tags: cleanTags,
    updatedAt: Date.now()
  }
  posts.value.splice(idx, 1, updated)
  saveToStorage(posts.value)
  return { success: true, post: updated }
}

function deletePost(id, password) {
  const idx = posts.value.findIndex((p) => p.id === id)
  if (idx === -1) return { success: false, message: '게시글을 찾을 수 없습니다.' }
  const post = posts.value[idx]
  if (!verifyPassword(post, password)) return { success: false, message: '비밀번호가 일치하지 않습니다.' }

  posts.value.splice(idx, 1)
  saveToStorage(posts.value)
  return { success: true }
}

export default function useBoard() {
  return {
    posts,
    getAllPosts,
    getPost,
    createPost,
    updatePost,
    toggleLike,
    isLikedByUser,
    addComment,
    incrementView,
    updateComment,
    deleteComment,
    deletePost,
    verifyPassword,
    refresh
  }
}
