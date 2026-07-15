import { searchNaverBlogs } from '../services/naverService.js'

export async function getNaverBlogs(req, res, next) {
	try {
		const query = req.query.query || '서울여행'
		const display = Number(req.query.display || 6)
		const items = await searchNaverBlogs(query, display)
		res.json({ query, display, items })
	} catch (error) {
		next(error)
	}
}