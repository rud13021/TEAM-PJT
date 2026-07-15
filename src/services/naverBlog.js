const BLOG_INDEX_PATH = '/data/naver_blog_index.json'

export const BLOG_CATEGORY_OPTIONS = [
	{ id: 'places', label: '관광지' },
	{ id: 'culture', label: '문화시설' },
	{ id: 'sports', label: '레포츠' },
	{ id: 'shopping', label: '쇼핑' },
	{ id: 'hotels', label: '숙박' },
	{ id: 'festivals', label: '축제공연행사' },
]

let blogIndexPromise = null

function normalizeText(value = '') {
	return String(value)
		.toLowerCase()
		.replace(/[\s\u3000]+/g, '')
		.replace(/[·,./()[\]{}<>!?\-_~]/g, '')
		.trim()
}

function stripHtml(value = '') {
	return String(value).replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
}

async function loadBlogIndex() {
	if (!blogIndexPromise) {
		blogIndexPromise = fetch(BLOG_INDEX_PATH)
			.then(async (response) => {
				if (!response.ok) {
					throw new Error(`Failed to load ${BLOG_INDEX_PATH}: ${response.status}`)
				}
				return response.json()
			})
			.catch((error) => {
				console.error('Failed to load local blog index:', error)
				return { entries: [], categories: BLOG_CATEGORY_OPTIONS }
			})
	}

	return blogIndexPromise
}

function scoreEntry(entry, normalizedQuery) {
	const terms = [entry.query, entry.searchLabel, ...(Array.isArray(entry.keywords) ? entry.keywords : [])]
		.map((term) => normalizeText(term))
		.filter(Boolean)

	if (!normalizedQuery) {
		return terms.length ? 1 : 0
	}

	if (terms.some((term) => term === normalizedQuery)) {
		return 100
	}

	if (terms.some((term) => term.includes(normalizedQuery) || normalizedQuery.includes(term))) {
		return 80
	}

	return 0
}

function getExactMatchScore(entry, normalizedQuery) {
	const exactTerms = [entry.searchLabel, entry.query]
		.map((term) => normalizeText(term))
		.filter(Boolean)

	if (exactTerms.includes(normalizedQuery)) {
		return 200
	}

	return 0
}

export async function searchNaverBlogs(query, display = 6, categoryId = 'all') {
	const normalizedQuery = normalizeText(query)
	if (!normalizedQuery) {
		return []
	}

	const index = await loadBlogIndex()
	const entries = Array.isArray(index?.entries) ? index.entries : []
	const filteredEntries = entries.filter((entry) => categoryId === 'all' || entry.categoryId === categoryId)
	const bestMatch = filteredEntries
		.map((entry) => ({ entry, score: Math.max(getExactMatchScore(entry, normalizedQuery), scoreEntry(entry, normalizedQuery)) }))
		.filter((item) => item.score > 0)
		.sort((left, right) => right.score - left.score || (left.entry.items?.length || 0) - (right.entry.items?.length || 0))
		[0]

	return Array.isArray(bestMatch?.entry?.items) ? bestMatch.entry.items.slice(0, display) : []
}

export async function loadBlogIndexCategories() {
	const index = await loadBlogIndex()
	return Array.isArray(index?.categories) && index.categories.length ? index.categories : BLOG_CATEGORY_OPTIONS
}
