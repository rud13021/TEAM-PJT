import api from './api'

export async function searchNaverBlogs(query, display = 6) {
	const trimmedQuery = String(query || '').trim()
	if (!trimmedQuery) {
		return []
	}

	try {
		const response = await api.get('/naver/blog', {
			params: {
				query: trimmedQuery,
				display,
			},
		})

		return Array.isArray(response.data?.items) ? response.data.items : []
	} catch (error) {
		console.error('Failed to load Naver blog search results:', error)
		return []
	}
}
