import {
	calculateMidpoint,
	createNormalizedMidpoint,
	normalizeCoordinates,
	validateCoordinates,
} from '../utils/middlePoint'

export function useRecommend() {
	return {
		calculateMidpoint,
		createNormalizedMidpoint,
		normalizeCoordinates,
		validateCoordinates,
	}
}
