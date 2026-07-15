// 간단한 입력 정리 유틸
export function stripTags(input) {
  if (input == null) return ''
  return String(input).replace(/<[^>]*>/g, '').trim()
}

export function escapeHtml(input) {
  if (input == null) return ''
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
