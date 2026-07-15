import {
  getPlacesData,
  getRestaurantsData,
  getFestivalsData,
  getHotelsData,
  getShoppingData,
} from '../services/dataService.js'

export async function getPlaces(req, res, next) {
  try {
    const data = await getPlacesData()
    res.json(data)
  } catch (error) {
    next(error)
  }
}

export async function getRestaurants(req, res, next) {
  try {
    const data = await getRestaurantsData()
    res.json(data)
  } catch (error) {
    next(error)
  }
}

export async function getFestivals(req, res, next) {
  try {
    const data = await getFestivalsData()
    res.json(data)
  } catch (error) {
    next(error)
  }
}

export async function getHotels(req, res, next) {
  try {
    const data = await getHotelsData()
    res.json(data)
  } catch (error) {
    next(error)
  }
}

export async function getShopping(req, res, next) {
  try {
    const data = await getShoppingData()
    res.json(data)
  } catch (error) {
    next(error)
  }
}
