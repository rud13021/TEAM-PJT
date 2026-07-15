// src/services/localSearch.js
import { loadAllDatasets } from '@/services/jsonLoader'
import { haversineDistance } from '@/utils/distance'

const SEARCH_FIELDS = {
  name: 10,
  title: 10,
  placeName: 10,
  addr: 6,
  addr1: 6,
  overview: 3,
  description: 3,
  info: 3,
  contentType: 2,
  region: 2,
}

function textScore(item, query, keywords) {
  if (!query) return 0

  let score = 0

  for (const [field, weight] of Object.entries(SEARCH_FIELDS)) {
    if (!item[field]) continue

    const text = String(item[field]).toLowerCase()

    if (text.includes(query)) {
      score += weight * 2
    }

    for (const keyword of keywords) {
      if (keyword && text.includes(keyword)) {
        score += weight
      }
    }
  }

  return score
}

function normalizeCoord(obj) {
  const lat = obj?.mapy ?? obj?.y ?? obj?.lat ?? obj?.latitude ?? obj?.위도
  const lon = obj?.mapx ?? obj?.x ?? obj?.lng ?? obj?.lon ?? obj?.longitude ?? obj?.경도

  const nlat = Number(lat)
  const nlon = Number(lon)

  if (Number.isFinite(nlat) && Number.isFinite(nlon)) {
    return { lat: nlat, lon: nlon }
  }

  return null
}

export async function localSearch(
  query,
  {
    topK = 5,
    center = null,
    radiusMeters = 2000,
  } = {}
) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase()

  if (!normalizedQuery) return []

  const keywords = normalizedQuery.split(/\s+/)

  const datasets = await loadAllDatasets()

  const flat = Object.entries(datasets).flatMap(([dataset, items]) =>
    (items ?? []).map(item => ({
      ...item,
      __dataset: dataset,
    }))
  )

  const scored = flat.map(item => {
    const score = textScore(item, normalizedQuery, keywords)

    const coord = normalizeCoord(item)

    let dist = Infinity

    if (center && coord) {
      dist = haversineDistance(
        center.lat,
        center.lon,
        coord.lat,
        coord.lon
      )
    }

    return {
      item,
      score,
      dist,
    }
  })

  const filtered = scored.filter(
    s =>
      s.score > 0 &&
      (!center || s.dist <= radiusMeters)
  )

  filtered.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }

    return a.dist - b.dist
  })

  return filtered.slice(0, topK).map(s => ({
    ...s.item,
    __score: s.score,
    __dist: s.dist,
  }))
}

export default localSearch