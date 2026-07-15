const KAKAO_MOBILITY_REST_KEY = import.meta.env.VITE_KAKAO_MOBILITY_REST_KEY || ''

const CATEGORY_DATASETS = {
	places: { label: '관광지', path: '/data/서울_관광지.json' },
	culture: { label: '문화시설', path: '/data/서울_문화시설.json' },
	sports: { label: '레포츠', path: '/data/서울_레포츠.json' },
	shopping: { label: '쇼핑', path: '/data/서울_쇼핑.json' },
	hotels: { label: '숙박', path: '/data/서울_숙박.json' },
	courses: { label: '여행코스', path: '/data/서울_여행코스.json' },
	festivals: { label: '축제공연행사', path: '/data/서울_축제공연행사.json' },
}

function isFiniteNumber(value) {
	return typeof value === 'number' && Number.isFinite(value)
}

function normalizePoint(point) {
	if (!point || typeof point !== 'object') {
		return null
	}

	const lat = Number(point.lat ?? point.latitude ?? point.mapy)
	const lng = Number(point.lng ?? point.lon ?? point.longitude ?? point.mapx)

	if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
		return null
	}

	return { lat, lng }
}

function haversineDistanceKm(a, b) {
	const start = normalizePoint(a)
	const end = normalizePoint(b)
	if (!start || !end) {
		return Number.POSITIVE_INFINITY
	}

	const toRad = (value) => (value * Math.PI) / 180
	const earthRadiusKm = 6371
	const deltaLat = toRad(end.lat - start.lat)
	const deltaLng = toRad(end.lng - start.lng)
	const latitudeA = toRad(start.lat)
	const latitudeB = toRad(end.lat)

	const x =
		Math.sin(deltaLat / 2) ** 2 +
		Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(deltaLng / 2) ** 2
	const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))

	return earthRadiusKm * y
}

function createEstimateRoute(origin, destination, originName = '') {
	const distanceKm = haversineDistanceKm(origin, destination)
	const durationMinutes = Math.max(8, Math.round((distanceKm / 24) * 60 + 7))

	return {
		originName,
		origin: normalizePoint(origin),
		destination: normalizePoint(destination),
		distanceKm,
		durationMinutes,
		path: [normalizePoint(origin), normalizePoint(destination)].filter(Boolean),
		source: 'estimate',
	}
}

function extractPathFromDirections(route) {
	const points = []
	const sections = route?.sections || []

	sections.forEach((section) => {
		;(section.roads || []).forEach((road) => {
			const vertices = road.vertexes || []
			for (let i = 0; i < vertices.length - 1; i += 2) {
				const lng = Number(vertices[i])
				const lat = Number(vertices[i + 1])
				if (isFiniteNumber(lat) && isFiniteNumber(lng)) {
					points.push({ lat, lng })
				}
			}
		})
	})

	return points
}

async function fetchKakaoRoute(origin, destination, originName = '') {
	if (!KAKAO_MOBILITY_REST_KEY) {
		return null
	}

	const normalizedOrigin = normalizePoint(origin)
	const normalizedDestination = normalizePoint(destination)
	if (!normalizedOrigin || !normalizedDestination) {
		return null
	}

	const params = new URLSearchParams({
		origin: `${normalizedOrigin.lng},${normalizedOrigin.lat}`,
		destination: `${normalizedDestination.lng},${normalizedDestination.lat}`,
		priority: 'RECOMMEND',
		car_fuel: 'GASOLINE',
		car_hipass: 'false',
	})

	const response = await fetch(`https://apis-navi.kakaomobility.com/v1/directions?${params.toString()}`, {
		method: 'GET',
		headers: {
			Authorization: `KakaoAK ${KAKAO_MOBILITY_REST_KEY}`,
		},
	})

	if (!response.ok) {
		throw new Error(`Kakao mobility request failed: ${response.status}`)
	}

	const data = await response.json()
	const route = data?.routes?.[0]
	const summary = route?.summary
	if (!route || !summary) {
		return null
	}

	const distanceKm = Number(summary.distance || 0) / 1000
	const durationMinutes = Math.round(Number(summary.duration || 0) / 60)

	return {
		originName,
		origin: normalizedOrigin,
		destination: normalizedDestination,
		distanceKm,
		durationMinutes,
		path: extractPathFromDirections(route),
		source: 'kakao',
	}
}

async function getRouteBetween(origin, destination, originName = '') {
	const normalizedOrigin = normalizePoint(origin)
	const normalizedDestination = normalizePoint(destination)
	if (!normalizedOrigin || !normalizedDestination) {
		return null
	}

	try {
		const kakaoRoute = await fetchKakaoRoute(normalizedOrigin, normalizedDestination, originName)
		if (kakaoRoute) {
			return kakaoRoute
		}
	} catch (error) {
		console.warn('Kakao mobility route fallback to estimate:', error)
	}

	return createEstimateRoute(normalizedOrigin, normalizedDestination, originName)
}

function getCentroid(points) {
	const valid = points.map((point) => normalizePoint(point)).filter(Boolean)
	if (!valid.length) {
		return null
	}

	const total = valid.reduce(
		(acc, point) => {
			acc.lat += point.lat
			acc.lng += point.lng
			return acc
		},
		{ lat: 0, lng: 0 },
	)

	return {
		lat: total.lat / valid.length,
		lng: total.lng / valid.length,
	}
}

export async function loadMeetupCandidates() {
	try {
		const response = await fetch('/data/seoul_meetup_spots.json')
		if (!response.ok) {
			return []
		}
		const list = await response.json()
		return Array.isArray(list) ? list : []
	} catch (error) {
		console.error('Failed to load meetup candidates:', error)
		return []
	}
}

export async function buildTopMeetingRecommendations(startLocations, candidates = [], options = {}) {
	const { maxTravelMinutes = 45, topN = 3, candidateLimit = 25 } = options

	const validStarts = (Array.isArray(startLocations) ? startLocations : [])
		.map((location, index) => {
			const point = normalizePoint(location)
			if (!point) {
				return null
			}
			return {
				id: index + 1,
				name: location.name || `출발지 ${index + 1}`,
				...point,
			}
		})
		.filter(Boolean)

	if (validStarts.length < 2) {
		return []
	}

	const validCandidates = (Array.isArray(candidates) ? candidates : [])
		.map((candidate, index) => {
			const point = normalizePoint(candidate)
			if (!point) {
				return null
			}
			return {
				...candidate,
				id: candidate.id ?? `candidate-${index + 1}`,
				name: candidate.name || candidate.title || `후보 ${index + 1}`,
				...point,
			}
		})
		.filter(Boolean)

	if (!validCandidates.length) {
		return []
	}

	const centroid = getCentroid(validStarts)
	const prefiltered = validCandidates
		.map((candidate) => ({
			...candidate,
			centroidDistanceKm: centroid ? haversineDistanceKm(candidate, centroid) : 0,
		}))
		.sort((a, b) => a.centroidDistanceKm - b.centroidDistanceKm)
		.slice(0, Math.max(topN * 3, candidateLimit))

	const scored = []

	for (const candidate of prefiltered) {
		const routes = await Promise.all(
			validStarts.map((origin) => getRouteBetween(origin, candidate, origin.name)),
		)

		const validRoutes = routes.filter(Boolean)
		if (validRoutes.length !== validStarts.length) {
			continue
		}

		const durations = validRoutes.map((route) => route.durationMinutes)
		const slowest = Math.max(...durations)
		const fastest = Math.min(...durations)
		if (slowest >= maxTravelMinutes) {
			continue
		}

		const totalTravelTime = durations.reduce((acc, value) => acc + value, 0)
		const arrivalGap = slowest - fastest
		const score = totalTravelTime + 0.8 * arrivalGap

		scored.push({
			id: candidate.id,
			name: candidate.name,
			district: candidate.district || '',
			category: candidate.category || '핫플',
			description: candidate.description || candidate.feature || '',
			feature: candidate.feature || '',
			searchKeyword: candidate.searchKeyword || candidate.name,
			naverSearchUrl:
				candidate.naverSearchUrl ||
				`https://search.naver.com/search.naver?query=${encodeURIComponent(candidate.searchKeyword || candidate.name)}`,
			lat: candidate.lat,
			lng: candidate.lng,
			routes: validRoutes,
			durations,
			totalTravelTime,
			arrivalGap,
			midpointDistanceKm: centroid ? haversineDistanceKm(candidate, centroid) : 0,
			score,
		})
	}

	return scored
		.sort((a, b) => {
			return (
				a.score - b.score ||
				a.arrivalGap - b.arrivalGap ||
				a.totalTravelTime - b.totalTravelTime ||
				a.midpointDistanceKm - b.midpointDistanceKm
			)
		})
		.slice(0, topN)
		.map((item, index) => ({
			...item,
			rank: index + 1,
		}))
}

async function loadDataset(path) {
	try {
		const response = await fetch(path)
		if (!response.ok) {
			return []
		}
		const data = await response.json()
		return Array.isArray(data?.items) ? data.items : []
	} catch (error) {
		console.error(`Failed to load ${path}:`, error)
		return []
	}
}

function toSpot(item, categoryId, categoryLabel) {
	const location = normalizePoint(item)
	if (!location) {
		return null
	}

	const title = item.title || item.name || '추천 스팟'
	const address = [item.addr1, item.addr2].filter(Boolean).join(' ')
	const keyword = `${title} ${address}`.trim()

	return {
		id: `${categoryId}-${item.contentid || title}-${location.lat}-${location.lng}`,
		categoryId,
		categoryLabel,
		title,
		address,
		lat: location.lat,
		lng: location.lng,
		tel: item.tel || '',
		image: item.firstimage || item.firstimage2 || '',
		naverSearchUrl: `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword || title)}`,
	}
}

export async function loadNearbyCategorySpots(categoryIds, centerPoint, radiusKm = 3, limit = 40) {
	const center = normalizePoint(centerPoint)
	if (!center) {
		return []
	}

	const uniqueIds = [...new Set(Array.isArray(categoryIds) ? categoryIds : [])]
	if (!uniqueIds.length) {
		return []
	}

	const datasetResults = await Promise.all(
		uniqueIds.map(async (categoryId) => {
			const dataset = CATEGORY_DATASETS[categoryId]
			if (!dataset) {
				return []
			}

			const items = await loadDataset(dataset.path)
			return items
				.map((item) => toSpot(item, categoryId, dataset.label))
				.filter(Boolean)
				.map((spot) => ({
					...spot,
					distanceKm: haversineDistanceKm(spot, center),
				}))
				.filter((spot) => spot.distanceKm <= radiusKm)
		})
	)

	return datasetResults
		.flat()
		.sort((a, b) => a.distanceKm - b.distanceKm)
		.slice(0, limit)
}

export async function buildRoutesToDestination(startLocations, destination) {
	const validStarts = (Array.isArray(startLocations) ? startLocations : [])
		.map((location, index) => {
			const point = normalizePoint(location)
			if (!point) {
				return null
			}
			return {
				id: index + 1,
				name: location.name || `출발지 ${index + 1}`,
				...point,
			}
		})
		.filter(Boolean)

	const target = normalizePoint(destination)
	if (!validStarts.length || !target) {
		return []
	}

	const routes = await Promise.all(validStarts.map((start) => getRouteBetween(start, target, start.name)))
	return routes.filter(Boolean)
}

export function getRecommendCategoryOptions() {
	return Object.entries(CATEGORY_DATASETS).map(([id, value]) => ({
		id,
		name: value.label,
	}))
}
