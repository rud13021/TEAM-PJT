import express from 'express'
import { localSearchAll } from '../services/localSearch.js'

const router = express.Router()

// POST /api/recommend { query, lat, lon, radiusMeters, topK }
router.post('/recommend', async (req, res, next) => {
  try {
    const { query, lat, lon, radiusMeters = 2000, topK = 5 } = req.body
    const center = (lat !== undefined && lon !== undefined) ? { lat: Number(lat), lon: Number(lon) } : null
    const results = await localSearchAll(query, { topK, center, radiusMeters })
    res.json({ results })
  } catch (err) {
    next(err)
  }
})

export default router
