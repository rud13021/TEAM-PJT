import axios from 'axios'
import { readFileSync } from 'node:fs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC_DATA_DIR = path.join(ROOT_DIR, 'public', 'data')
const MEETUP_FILE = path.join(PUBLIC_DATA_DIR, 'seoul_meetup_spots.json')
const OUTPUT_FILE = path.join(PUBLIC_DATA_DIR, 'naver_blog_index.json')

const CATEGORY_OPTIONS = [
	{ id: 'places', label: '관광지' },
	{ id: 'culture', label: '문화시설' },
	{ id: 'sports', label: '레포츠' },
	{ id: 'shopping', label: '쇼핑' },
	{ id: 'hotels', label: '숙박' },
	{ id: 'festivals', label: '축제공연행사' },
]

const DISPLAY = Number(process.env.BLOG_INDEX_DISPLAY || 6)
const REQUEST_DELAY_MS = Number(process.env.BLOG_INDEX_DELAY_MS || 180)
const MAX_RETRIES = Number(process.env.BLOG_INDEX_MAX_RETRIES || 4)
const REQUEST_TIMEOUT_MS = Number(process.env.BLOG_INDEX_TIMEOUT_MS || 6000)
const LIVE_FETCH = process.env.BLOG_INDEX_LIVE_FETCH === '1'

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function loadEnvFile(filePath) {
	try {
		const raw = readFileSync(filePath, 'utf8')
		raw.split(/\r?\n/).forEach((line) => {
			const trimmed = line.trim()
			if (!trimmed || trimmed.startsWith('#')) {
				return
			}

			const separatorIndex = trimmed.indexOf('=')
			if (separatorIndex < 0) {
				return
			}

			const key = trimmed.slice(0, separatorIndex).trim()
			const value = trimmed.slice(separatorIndex + 1).trim().replace(/^"|"$/g, '')
			if (key && !process.env[key]) {
				process.env[key] = value
			}
		})
	} catch {
		// Ignore missing .env and use current environment.
	}
}

loadEnvFile(path.resolve(ROOT_DIR, '.env'))

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || ''
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || ''

function normalizeText(value = '') {
	return String(value).replace(/\s+/g, ' ').trim()
}

function normalizeForMatch(value = '') {
	return normalizeText(value)
		.toLowerCase()
		.replace(/[\s\u3000]+/g, '')
		.replace(/[·,./()[\]{}<>!?!\-_~]/g, '')
		.trim()
}

function stripHtml(value = '') {
	return String(value).replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
}

async function readMeetupSpots() {
	const raw = await readFile(MEETUP_FILE, 'utf8')
	const spots = JSON.parse(raw)
	return Array.isArray(spots) ? spots : []
}

async function readExistingIndex() {
	try {
		await stat(OUTPUT_FILE)
		const raw = await readFile(OUTPUT_FILE, 'utf8')
		const parsed = JSON.parse(raw)
		return Array.isArray(parsed?.entries) ? parsed.entries : []
	} catch {
		return []
	}
}

function buildQuery(place, categoryLabel) {
	return `${normalizeText(place)} ${normalizeText(categoryLabel)}`.trim()
}

function buildKeywords(spot, categoryLabel) {
	return [
		spot.name,
		spot.district,
		spot.feature,
		spot.description,
		categoryLabel,
	].map((value) => normalizeText(value)).filter(Boolean)
}

async function fetchNaverBlogs(query, display = DISPLAY) {
	if (!LIVE_FETCH || !NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
		return []
	}

	let lastError = null
	for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
		try {
			const response = await axios.get('https://openapi.naver.com/v1/search/blog.json', {
				timeout: REQUEST_TIMEOUT_MS,
				params: {
					query,
					display,
					start: 1,
					sort: 'date',
				},
				headers: {
					'X-Naver-Client-Id': NAVER_CLIENT_ID,
					'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
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
		} catch (error) {
			lastError = error
			const status = error.response?.status
			if (status === 429 || status >= 500 || error.code === 'ECONNABORTED') {
				await sleep(Math.min(2000, 250 * (attempt + 1)))
				continue
			}

			return []
		}
	}

	console.warn(`Giving up on ${query}:`, lastError?.message || lastError)
	return []
}

async function main() {
	const spots = await readMeetupSpots()
	const existingEntries = await readExistingIndex()
	const exactCache = new Map()
	const categoryFallbackCache = new Map()

	for (const entry of existingEntries) {
		const exactKeys = [entry.searchLabel, entry.query].map((value) => normalizeForMatch(value)).filter(Boolean)
		for (const key of exactKeys) {
			exactCache.set(key, Array.isArray(entry.items) ? entry.items : [])
		}

		if (entry.categoryId && !categoryFallbackCache.has(entry.categoryId) && Array.isArray(entry.items) && entry.items.length > 0) {
			categoryFallbackCache.set(entry.categoryId, entry.items)
		}
	}

	const entries = []
	const categories = CATEGORY_OPTIONS.map(({ id, label }) => ({ id, label }))

	for (const [spotIndex, spot] of spots.entries()) {
		for (const category of CATEGORY_OPTIONS) {
			const query = buildQuery(spot.name, category.label)
			const searchLabel = query
			const keywords = buildKeywords(spot, category.label)
			const exactKey = normalizeForMatch(searchLabel)
			const items = exactCache.get(exactKey)
				|| categoryFallbackCache.get(category.id)
				|| (LIVE_FETCH ? await fetchNaverBlogs(query, DISPLAY) : [])
				|| []

			entries.push({
				categoryId: category.id,
				categoryLabel: category.label,
				sourceId: 'meetup-spots',
				sourceLabel: 'seoul_meetup_spots',
				sourceIndex: spotIndex,
				placeName: spot.name || '',
				district: spot.district || '',
				query,
				searchLabel,
				keywords,
				items,
			})

			if (REQUEST_DELAY_MS > 0 && LIVE_FETCH) {
				await sleep(REQUEST_DELAY_MS)
			}
		}
	}

	const output = {
		generatedAt: new Date().toISOString(),
		display: DISPLAY,
		categories,
		entries,
	}

	await mkdir(PUBLIC_DATA_DIR, { recursive: true })
	await writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
	console.log(`Wrote ${entries.length} entries to ${path.relative(ROOT_DIR, OUTPUT_FILE)}`)
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})