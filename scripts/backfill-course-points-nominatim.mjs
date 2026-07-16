import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const INPUT = path.join(rootDir, 'public', 'data', '서울_여행코스.json')
const OUTPUT = path.join(rootDir, 'public', 'data', '서울_여행코스.json')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function needsFill(point) {
  return point.mapx == null || point.mapy == null || point.addr1 == null || point.addr2 == null
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[~·]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildQueries(courseTitle, point) {
  const title = normalizeText(point.title)
  const addr1 = normalizeText(point.addr1)
  const addr2 = normalizeText(point.addr2)
  const course = normalizeText(courseTitle)

  const queries = [
    [title, addr2, '서울'].filter(Boolean).join(' '),
    [title, course, '서울'].filter(Boolean).join(' '),
    [title, '서울'].filter(Boolean).join(' '),
    [addr1, title].filter(Boolean).join(' '),
    [title, '대한민국'].filter(Boolean).join(' '),
  ]

  return [...new Set(queries.filter(Boolean))]
}

async function geocode(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '3')
  url.searchParams.set('countrycodes', 'kr')
  url.searchParams.set('accept-language', 'ko')
  url.searchParams.set('q', query)

  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: {
      'User-Agent': 'TeamPJT-Backfill/1.0 (local script)',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const rows = await response.json()
  if (!Array.isArray(rows) || rows.length === 0) return null
  return rows[0]
}

async function geocodeWithRetry(query, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const result = await geocode(query)
      if (result) return result
    } catch {
      // retry
    }

    if (attempt < maxRetries) {
      await sleep(900)
    }
  }

  return null
}

function toAddr1(displayName, fallback) {
  const text = String(displayName || '').trim()
  if (!text) return fallback
  const parts = text.split(',').map(s => s.trim()).filter(Boolean)
  return parts.slice(0, 3).join(', ') || fallback
}

async function main() {
  const raw = await readFile(INPUT, 'utf8')
  const data = JSON.parse(raw)

  let totalNeed = 0
  let filled = 0
  let unresolved = 0

  for (const course of data.items || []) {
    for (const point of course.coursePoints || []) {
      if (!needsFill(point)) continue
      totalNeed += 1

      const queries = buildQueries(course.title, point)
      let best = null

      for (const query of queries) {
        best = await geocodeWithRetry(query)

        await sleep(1100)

        if (best) break
      }

      if (!best) {
        unresolved += 1
        console.log(`[MISS] ${point.contentId || '-'} | ${point.title || '-'} (${filled + unresolved}/${totalNeed})`)
        continue
      }

      if (point.mapx == null) point.mapx = String(best.lon)
      if (point.mapy == null) point.mapy = String(best.lat)
      if (point.addr1 == null) point.addr1 = toAddr1(best.display_name, null)
      if (point.addr2 == null) point.addr2 = normalizeText(point.title) || null
      filled += 1
      console.log(`[OK] ${point.contentId || '-'} | ${point.title || '-'} (${filled + unresolved}/${totalNeed})`)
    }
  }

  await writeFile(OUTPUT, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

  console.log(JSON.stringify({ totalNeed, filled, unresolved }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
