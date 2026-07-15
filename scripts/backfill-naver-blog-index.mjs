import axios from 'axios'
import { readFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC_DATA_DIR = path.join(ROOT_DIR, 'public', 'data')
const OUTPUT_FILE = path.join(PUBLIC_DATA_DIR, 'naver_blog_index.json')

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
		// ignore missing env
	}
}

loadEnvFile(path.resolve(ROOT_DIR, '.env'))

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || ''
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || ''

const TARGETS = ['동묘앞역', '혜화역', '동대문역']

function stripHtml(value = '') {
	return String(value).replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
}

async function fetchBlogs(query, display = 6) {
	if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
		throw new Error('NAVER_CLIENT_ID / NAVER_CLIENT_SECRET are missing from .env')
	}

	const response = await axios.get('https://openapi.naver.com/v1/search/blog.json', {
		params: { query, display, start: 1, sort: 'date' },
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
}

async function main() {
	const raw = await readFile(OUTPUT_FILE, 'utf8')
	const index = JSON.parse(raw)
	index.entries = Array.isArray(index.entries) ? index.entries : []

	for (const place of TARGETS) {
		const searchLabel = `${place} 관광지`
		const exists = index.entries.some((entry) => entry.searchLabel === searchLabel || entry.query === place)
		if (exists) {
			continue
		}

		try {
			const items = await fetchBlogs(searchLabel, 6)
			index.entries.unshift({
				categoryId: 'places',
				categoryLabel: '관광지',
				sourceId: 'manual-backfill',
				sourceLabel: '수동 백필',
				sourceIndex: 0,
				query: place,
				searchLabel,
				keywords: [place, searchLabel],
				items,
			})
			console.log(`Backfilled ${place}`)
		} catch (error) {
			console.warn(`Failed to backfill ${place}:`, error.message || error)
		}
	}

	index.generatedAt = new Date().toISOString()
	await writeFile(OUTPUT_FILE, `${JSON.stringify(index, null, 2)}\n`, 'utf8')
	console.log('Backfill complete')
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})