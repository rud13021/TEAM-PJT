import { getHealthStatus } from '../services/healthService.js'

export function getHealth(req, res, next) {
  try {
    const payload = getHealthStatus()
    res.json(payload)
  } catch (error) {
    next(error)
  }
}
