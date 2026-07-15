import api from './api'

const DATASET_ENDPOINTS = {
	places: '/places',
	restaurants: '/restaurants',
	festivals: '/festivals',
	hotels: '/hotels',
	shopping: '/shopping',
}

async function loadDataset(endpoint) {
	try {
		const response = await api.get(endpoint)
		const data = response?.data
		return Array.isArray(data) ? data : []
	} catch (error) {
		console.error(`Failed to load dataset from ${endpoint}:`, error)
		return []
	}
}

export async function loadPlaces() {
	return loadDataset(DATASET_ENDPOINTS.places)
}

export async function loadRestaurants() {
	return loadDataset(DATASET_ENDPOINTS.restaurants)
}

export async function loadFestivals() {
	return loadDataset(DATASET_ENDPOINTS.festivals)
}

export async function loadHotels() {
	return loadDataset(DATASET_ENDPOINTS.hotels)
}

export async function loadShopping() {
	return loadDataset(DATASET_ENDPOINTS.shopping)
}

export async function loadAllDatasets() {
	const [places, restaurants, festivals, hotels, shopping] = await Promise.all([
		loadPlaces(),
		loadRestaurants(),
		loadFestivals(),
		loadHotels(),
		loadShopping(),
	])

	return {
		places,
		restaurants,
		festivals,
		hotels,
		shopping,
	}
}
