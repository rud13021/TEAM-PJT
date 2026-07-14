const DEFAULT_COORDINATE_KEYS = {
	latitude: ['lat', 'latitude'],
	longitude: ['lng', 'lon', 'longitude'],
}

function isFiniteNumber(value) {
	return typeof value === 'number' && Number.isFinite(value)
}

function readCoordinateValue(source, keys) {
	for (const key of keys) {
		if (source?.[key] !== undefined) {
			return Number(source[key])
		}
	}

	return Number.NaN
}

export function normalizeCoordinates(location) {
	if (!location || typeof location !== 'object') {
		return null
	}

	const latitude = readCoordinateValue(location, DEFAULT_COORDINATE_KEYS.latitude)
	const longitude = readCoordinateValue(location, DEFAULT_COORDINATE_KEYS.longitude)

	if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) {
		return null
	}

	return {
		lat: latitude,
		lng: longitude,
	}
}

export function validateCoordinates(location) {
	return normalizeCoordinates(location) !== null
}

export function calculateMidpoint(startLocation, endLocation) {
	const start = normalizeCoordinates(startLocation)
	const end = normalizeCoordinates(endLocation)

	if (!start || !end) {
		return null
	}

	return {
		lat: (start.lat + end.lat) / 2,
		lng: (start.lng + end.lng) / 2,
	}
}

export function createNormalizedMidpoint(startLocation, endLocation) {
	const start = normalizeCoordinates(startLocation)
	const end = normalizeCoordinates(endLocation)

	if (!start || !end) {
		return {
			isValid: false,
			start: null,
			end: null,
			midpoint: null,
		}
	}

	return {
		isValid: true,
		start,
		end,
		midpoint: calculateMidpoint(start, end),
	}
}
