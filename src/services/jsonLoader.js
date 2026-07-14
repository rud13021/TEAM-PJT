const DATASET_PATHS = {
	places: '/data/places.json',
	restaurants: '/data/restaurants.json',
	festivals: '/data/festivals.json',
	hotels: '/data/hotels.json',
	shopping: '/data/shopping.json',
}

async function loadJsonFile(filePath) {
	try {
		const response = await fetch(filePath)

		if (!response.ok) {
			return []
		}

		const text = await response.text()

		if (!text.trim()) {
			return []
		}

		const data = JSON.parse(text)
		return Array.isArray(data) ? data : []
	} catch {
		return []
	}
}

export async function loadPlaces() {
	return loadJsonFile(DATASET_PATHS.places)
}

export async function loadRestaurants() {
	return loadJsonFile(DATASET_PATHS.restaurants)
}

export async function loadFestivals() {
	return loadJsonFile(DATASET_PATHS.festivals)
}

export async function loadHotels() {
	return loadJsonFile(DATASET_PATHS.hotels)
}

export async function loadShopping() {
	return loadJsonFile(DATASET_PATHS.shopping)
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
