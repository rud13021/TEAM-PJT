const DATASET_FILES = {
	places: '/data/서울_관광지.json',
	restaurants: '/data/서울_레포츠.json',
	festivals: '/data/서울_축제공연행사.json',
	hotels: '/data/서울_숙박.json',
	shopping: '/data/서울_쇼핑.json',
}

async function loadDataset(filePath) {
	try {
		const response = await fetch(filePath)
		if (!response.ok) throw new Error(`HTTP ${response.status}`)

		const data = await response.json()
		if (Array.isArray(data)) return data
		if (Array.isArray(data?.items)) return data.items
		if (Array.isArray(data?.data)) return data.data
		return []
	} catch (error) {
		console.error(`Failed to load dataset from ${filePath}:`, error)
		return []
	}
}

export async function loadPlaces() {
	return loadDataset(DATASET_FILES.places)
}

export async function loadRestaurants() {
	return loadDataset(DATASET_FILES.restaurants)
}

export async function loadFestivals() {
	return loadDataset(DATASET_FILES.festivals)
}

export async function loadHotels() {
	return loadDataset(DATASET_FILES.hotels)
}

export async function loadShopping() {
	return loadDataset(DATASET_FILES.shopping)
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
