import axios from 'axios'
import { config } from '../config/index.js'

function stripHtml(value = '') {
	return String(value).replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
}

export async function searchNaverBlogs(query, display = 6, start = 1) {
	const trimmedQuery = String(query || '').trim()
	if (!trimmedQuery) {
		return []
	}

	if (!config.naverClientId || !config.naverClientSecret) {
		const error = new Error('Naver API credentials are not configured')
		error.statusCode = 500
		throw error
	}

	const response = await axios.get('https://openapi.naver.com/v1/search/blog.json', {
		params: {
			query: trimmedQuery,
			display,
			start,
			sort: 'date',
		},
		headers: {
			'X-Naver-Client-Id': config.naverClientId,
			'X-Naver-Client-Secret': config.naverClientSecret,
		},
	})

	const items = Array.isArray(response.data?.items) ? response.data.items : []

	return items.map((item) => ({
		title: stripHtml(item.title),
		description: stripHtml(item.description),
		bloggername: stripHtml(item.bloggername),
		bloggerlink: item.bloggerlink || '',
		link: item.link || '',
		postdate: item.postdate || '',
	}))
}