import express from 'express'
import {
  getPlaces,
  getRestaurants,
  getFestivals,
  getHotels,
  getShopping,
} from '../controllers/dataController.js'

const router = express.Router()

router.get('/places', getPlaces)
router.get('/restaurants', getRestaurants)
router.get('/festivals', getFestivals)
router.get('/hotels', getHotels)
router.get('/shopping', getShopping)

export default router

router.get('/places', (req, res, next) => {
  console.log('GET /api/places');
  next();
}, getPlaces);