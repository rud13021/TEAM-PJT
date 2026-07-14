import { computed, ref } from 'vue'
import { calculateMidpoint, createNormalizedMidpoint, normalizeCoordinates, validateCoordinates } from '../utils/middlePoint'

const MOCK_MAP_PLACES = [
	{
		id: 1,
		name: 'Myeongdong Shopping Street',
		type: 'Shopping',
		category: 'Shopping',
		area: 'Jung-gu',
		lat: 37.5636,
		lng: 126.9828,
		legendTone: 'primary',
	},
	{
		id: 2,
		name: 'Deoksugung Palace',
		type: 'Attraction',
		category: 'Attractions',
		area: 'Jung-gu',
		lat: 37.5658,
		lng: 126.9751,
		legendTone: 'highlight',
	},
	{
		id: 3,
		name: 'Seoul City Hall',
		type: 'Transit',
		category: 'Transit',
		area: 'Jung-gu',
		lat: 37.5663,
		lng: 126.9779,
		legendTone: 'neutral',
	},
	{
		id: 4,
		name: 'Gwanghwamun Square',
		type: 'Attraction',
		category: 'Attractions',
		area: 'Jongno-gu',
		lat: 37.5756,
		lng: 126.9769,
		legendTone: 'primary',
	},
]

const DEFAULT_ROUTE = {
	start: { lat: 37.5665, lng: 126.978 },
	end: { lat: 37.575, lng: 126.985 },
}

function clonePlace(place) {
	return {
		...place,
	}
}

function normalizeTone(tone) {
	return ['highlight', 'primary', 'neutral'].includes(tone) ? tone : 'neutral'
}

function distanceBetween(pointA, pointB) {
	const normalizedA = normalizeCoordinates(pointA)
	const normalizedB = normalizeCoordinates(pointB)

	if (!normalizedA || !normalizedB) {
		return Number.POSITIVE_INFINITY
	}

	return Math.hypot(normalizedA.lat - normalizedB.lat, normalizedA.lng - normalizedB.lng)
}

export function prepareMarkerData(places = loadMockMapPlaces(), selectedPlaceId = null) {
	return places
		.map((place, index) => {
			const location = normalizeCoordinates(place)

			return {
				id: place.id ?? index + 1,
				name: place.name || `Place ${index + 1}`,
				type: place.type || place.category || 'Place',
				area: place.area || '',
				location,
				lat: location?.lat ?? null,
				lng: location?.lng ?? null,
				isSelected: selectedPlaceId !== null && selectedPlaceId === (place.id ?? index + 1),
				legendTone: normalizeTone(place.legendTone),
				distanceFromCenter: Number.isFinite(place.distanceFromCenter) ? place.distanceFromCenter : null,
			}
		})
		.filter((marker) => validateCoordinates(marker.location))
}

export function prepareLegendData(markers = []) {
	const selectedCount = markers.filter((marker) => marker.isSelected).length
	const markerCount = markers.length

	return [
		{ label: 'Selected route', tone: 'highlight', count: selectedCount },
		{ label: 'Recommended place', tone: 'primary', count: markerCount },
		{ label: 'Transit point', tone: 'neutral', count: markers.filter((marker) => marker.type === 'Transit').length },
	]
}

export function selectPlace(place, currentSelection = null) {
	const location = normalizeCoordinates(place)

	if (!location) {
		return {
			selectedPlace: null,
			centerPoint: null,
			isValid: false,
		}
	}

	return {
		selectedPlace: {
			...clonePlace(place),
			location,
		},
		centerPoint: location,
		isValid: true,
		previousSelection: currentSelection,
	}
}

export function loadMockMapPlaces() {
	return MOCK_MAP_PLACES.map(clonePlace)
}

export function useMap() {
	const mapPlaces = ref(loadMockMapPlaces())
	const selectedPlaceId = ref(null)
	const selectedPlace = ref(null)
	const currentCenterPoint = ref(createNormalizedMidpoint(DEFAULT_ROUTE.start, DEFAULT_ROUTE.end).midpoint)

	const markerData = computed(() => prepareMarkerData(mapPlaces.value, selectedPlaceId.value))
	const legendData = computed(() => prepareLegendData(markerData.value))

	function choosePlace(place) {
		const result = selectPlace(place, selectedPlace.value)

		if (!result.isValid) {
			return result
		}

		selectedPlace.value = result.selectedPlace
		selectedPlaceId.value = result.selectedPlace.id ?? null
		currentCenterPoint.value = result.centerPoint

		return result
	}

	function resetSelection() {
		selectedPlace.value = null
		selectedPlaceId.value = null
		currentCenterPoint.value = createNormalizedMidpoint(DEFAULT_ROUTE.start, DEFAULT_ROUTE.end).midpoint
	}

	function setMapPlaces(places) {
		mapPlaces.value = Array.isArray(places) ? places.map(clonePlace) : []
		selectedPlaceId.value = null
		selectedPlace.value = null
	}

	function getRouteCenter(startPoint, endPoint) {
		return calculateMidpoint(startPoint, endPoint)
	}

	function getMapCenterFromRoute(startPoint, endPoint) {
		return createNormalizedMidpoint(startPoint, endPoint).midpoint
	}

	function rankPlacesByDistanceFrom(point) {
		const centerPoint = normalizeCoordinates(point)

		if (!centerPoint) {
			return []
		}

		return prepareMarkerData(mapPlaces.value, selectedPlaceId.value)
			.map((marker) => ({
				...marker,
				distanceFromCenter: distanceBetween(marker.location, centerPoint),
			}))
			.sort((left, right) => left.distanceFromCenter - right.distanceFromCenter)
	}

	return {
		mapPlaces,
		markerData,
		legendData,
		selectedPlace,
		currentCenterPoint,
		loadMockMapPlaces,
		prepareMarkerData,
		prepareLegendData,
		selectPlace: choosePlace,
		resetSelection,
		setMapPlaces,
		getRouteCenter,
		getMapCenterFromRoute,
		rankPlacesByDistanceFrom,
	}
}
