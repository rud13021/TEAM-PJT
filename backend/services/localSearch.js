// backend/services/localSearch.js
import { getPlacesData, getRestaurantsData, getFestivalsData, getHotelsData, getShoppingData } from './dataService.js'
import { haversineDistance } from './distance.js'

function textScore(item, query, fields = ['name','title','overview','description','addr']){
  const q = String(query||'').toLowerCase()
  if (!q) return 0
  let score = 0
  for (const f of fields){
    if (!item[f]) continue
    const t = String(item[f]).toLowerCase()
    if (t.includes(q)) score += 5
    const parts = q.split(/\s+/)
    for (const p of parts) if (p && t.includes(p)) score += 1
  }
  return score
}

function normalizeCoord(obj){
  const lat = obj?.mapy || obj?.y || obj?.lat || obj?.latitude || obj?.위도
  const lon = obj?.mapx || obj?.x || obj?.lng || obj?.lon || obj?.longitude || obj?.경도
  const nlat = Number(lat)
  const nlon = Number(lon)
  if (Number.isFinite(nlat) && Number.isFinite(nlon)) return { lat: nlat, lon: nlon }
  return null
}

export async function localSearchAll(query, { topK = 5, center = null, radiusMeters = 2000 } = {}){
  const [places, restaurants, festivals, hotels, shopping] = await Promise.all([
    getPlacesData(), getRestaurantsData(), getFestivalsData(), getHotelsData(), getShoppingData()
  ])
  const datasets = { places, restaurants, festivals, hotels, shopping }
  const flat = []
  for (const key of Object.keys(datasets)){
    for (const it of (datasets[key]||[])) flat.push({ ...it, __dataset: key })
  }

  const scored = flat.map(it => {
    const score = textScore(it, query)
    const coord = normalizeCoord(it)
    let dist = Infinity
    if (center && coord) dist = haversineDistance(center.lat, center.lon, coord.lat, coord.lon)
    return { it, score, dist }
  })

  let results = []
  if (center) {
    // prefer items within radius sorted by distance, then score
    const within = scored.filter(s => s.dist <= radiusMeters)
    if (within.length > 0) {
      within.sort((a,b) => {
        if (a.dist !== b.dist) return a.dist - b.dist
        return b.score - a.score
      })
      results = within.slice(0, topK)
    } else {
      // fallback: nearest items regardless of score
      const withCoord = scored.filter(s => Number.isFinite(s.dist))
      if (withCoord.length > 0) {
        withCoord.sort((a,b) => a.dist - b.dist)
        results = withCoord.slice(0, topK)
      } else {
        // final fallback: no coords at all — return topK by text score
        const byScore = scored.sort((a,b) => b.score - a.score)
        results = byScore.slice(0, topK)
      }
    }
  } else {
    // no center: prefer by text score, fallback to highest scores even if zero
    const byScore = scored.sort((a,b) => b.score - a.score || ((a.dist===Infinity?Number.MAX_VALUE:a.dist) - (b.dist===Infinity?Number.MAX_VALUE:b.dist)))
    results = byScore.slice(0, topK)
  }

  return results.map(s => ({ ...s.it, __score: s.score, __dist: s.dist }))
}

export default localSearchAll
