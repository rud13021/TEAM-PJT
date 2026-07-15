// src/services/recommend.js

import api from '@/services/api'

export async function getRecommendations(
  query,
  {
    lat = null,
    lon = null,
    radiusMeters = 2000,
    topK = 5,
  } = {}
) {
  const response = await api.post('/recommend', {
    query,
    lat,
    lon,
    radiusMeters,
    topK,
  })

  return response.data?.results ?? []
}

export default getRecommendations