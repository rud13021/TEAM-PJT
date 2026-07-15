import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const DEFAULT_INPUT = path.join(rootDir, 'public', 'data', '서울_여행코스.json')
const DEFAULT_OUTPUT = path.join(rootDir, 'public', 'data', '서울_여행코스_구성포함.json')
const TOUR_BASE = 'https://apis.data.go.kr/B551011/KorService2'

function readArg(flag, fallback = '') {
  const index = process.argv.indexOf(flag)
  if (index === -1) return fallback
  return process.argv[index + 1] || fallback
}

function toArray(value) {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') return [value]
  return []
}

function pickNumber(...values) {
  for (const value of values) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function normalizeCoursePoint(item) {
  return {
    sequence: String(item.subnum || item.subcontentid || '').trim() || null,
    contentId: String(item.subcontentid || '').trim() || null,
    title: String(item.subname || '').trim() || null,
    overview: String(item.subdetailoverview || '').trim() || null,
    image: String(item.subdetailimg || '').trim() || null,
    mapx: String(item.submapx || item.mapx || '').trim() || null,
    mapy: String(item.submapy || item.mapy || '').trim() || null,
  }
}

async function requestTourApi(endpoint, params) {
  const query = new URLSearchParams(params)
  const url = `${TOUR_BASE}/${endpoint}?${query.toString()}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`${endpoint} failed: ${response.status}`)
  }

  const data = await response.json()
  const body = data?.response?.body
  const items = toArray(body?.items?.item)
  return items
}

async function fetchCoursePoints(serviceKey, contentId) {
  const items = await requestTourApi('detailInfo2', {
    serviceKey,
    MobileOS: 'ETC',
    MobileApp: 'TeamPjt',
    _type: 'json',
    contentTypeId: '25',
    contentId: String(contentId),
    numOfRows: '100',
    pageNo: '1',
  })

  return items.map(normalizeCoursePoint)
}

async function fetchPointLocation(serviceKey, contentId) {
  const items = await requestTourApi('detailCommon2', {
    serviceKey,
    MobileOS: 'ETC',
    MobileApp: 'TeamPjt',
    _type: 'json',
    contentId: String(contentId),
    defaultYN: 'Y',
    addrinfoYN: 'Y',
    mapinfoYN: 'Y',
    overviewYN: 'N',
  })

  const first = items[0] || {}
  return {
    mapx: String(first.mapx || '').trim() || null,
    mapy: String(first.mapy || '').trim() || null,
    addr1: String(first.addr1 || '').trim() || null,
    addr2: String(first.addr2 || '').trim() || null,
  }
}

async function main() {
  const serviceKey =
    readArg('--serviceKey') ||
    process.env.TOURAPI_SERVICE_KEY ||
    process.env.VITE_TOURAPI_SERVICE_KEY ||
    ''

  if (!serviceKey) {
    throw new Error('TourAPI service key is required. Use --serviceKey or TOURAPI_SERVICE_KEY env.')
  }

  const inputPath = path.resolve(readArg('--input', DEFAULT_INPUT))
  const outputPath = path.resolve(readArg('--output', DEFAULT_OUTPUT))
  const includePointDetails = (readArg('--withPointDetails', 'true') || 'true').toLowerCase() !== 'false'

  const raw = await readFile(inputPath, 'utf8')
  const parsed = JSON.parse(raw)
  const items = toArray(parsed.items)

  const locationCache = new Map()
  const enrichedItems = []

  for (let i = 0; i < items.length; i += 1) {
    const course = items[i]
    const courseId = course.contentid

    if (!courseId) {
      enrichedItems.push({ ...course, coursePoints: [] })
      continue
    }

    let points = []
    try {
      points = await fetchCoursePoints(serviceKey, courseId)
    } catch (error) {
      console.warn(`[warn] detailInfo2 failed for contentId=${courseId}: ${error.message}`)
    }

    if (includePointDetails) {
      for (const point of points) {
        if (!point.contentId) continue

        if (!locationCache.has(point.contentId)) {
          try {
            const loc = await fetchPointLocation(serviceKey, point.contentId)
            locationCache.set(point.contentId, loc)
          } catch (error) {
            console.warn(`[warn] detailCommon2 failed for subcontentid=${point.contentId}: ${error.message}`)
            locationCache.set(point.contentId, null)
          }
        }

        const loc = locationCache.get(point.contentId)
        if (loc) {
          point.mapx = point.mapx || loc.mapx
          point.mapy = point.mapy || loc.mapy
          point.addr1 = loc.addr1
          point.addr2 = loc.addr2
        }
      }
    }

    points.sort((a, b) => {
      const n1 = pickNumber(a.sequence)
      const n2 = pickNumber(b.sequence)
      if (n1 == null && n2 == null) return 0
      if (n1 == null) return 1
      if (n2 == null) return -1
      return n1 - n2
    })

    enrichedItems.push({
      ...course,
      coursePoints: points,
      coursePointCount: points.length,
    })

    console.log(`[${i + 1}/${items.length}] ${course.title || courseId}: ${points.length} points`)
  }

  const output = {
    ...parsed,
    generatedAt: new Date().toISOString(),
    source: 'tourapi-detailInfo2(+detailCommon2)',
    items: enrichedItems,
  }

  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
  console.log(`\nDone: ${outputPath}`)
}

main().catch((error) => {
  console.error('[error]', error.message)
  process.exitCode = 1
})
