import { computed, ref } from 'vue'

const normalizeText = (value) => value.trim().replace(/\s+/g, ' ')

export function useSearch() {
	const departureInput = ref('')
	const destinationInput = ref('')
	const searchError = ref('')
	const lastSearchPayload = ref(null)

	const hasDeparture = computed(() => normalizeText(departureInput.value).length > 0)
	const hasDestination = computed(() => normalizeText(destinationInput.value).length > 0)
	const isSearchValid = computed(() => hasDeparture.value && hasDestination.value)

	function setDepartureInput(value) {
		departureInput.value = value
	}

	function setDestinationInput(value) {
		destinationInput.value = value
	}

	function resetSearchState() {
		departureInput.value = ''
		destinationInput.value = ''
		searchError.value = ''
		lastSearchPayload.value = null
	}

	function validateSearchForm() {
		const normalizedDeparture = normalizeText(departureInput.value)
		const normalizedDestination = normalizeText(destinationInput.value)

		if (!normalizedDeparture) {
			searchError.value = 'Please enter a departure.'
			return false
		}

		if (!normalizedDestination) {
			searchError.value = 'Please enter a destination.'
			return false
		}

		searchError.value = ''
		return true
	}

	function buildSearchPayload() {
		return {
			departure: normalizeText(departureInput.value),
			destination: normalizeText(destinationInput.value),
			query: normalizeText([departureInput.value, destinationInput.value].filter(Boolean).join(' ')),
		}
	}

	function submitSearch() {
		if (!validateSearchForm()) {
			return null
		}

		const payload = buildSearchPayload()
		lastSearchPayload.value = payload
		return payload
	}

	return {
		departureInput,
		destinationInput,
		searchError,
		lastSearchPayload,
		hasDeparture,
		hasDestination,
		isSearchValid,
		setDepartureInput,
		setDestinationInput,
		validateSearchForm,
		buildSearchPayload,
		submitSearch,
		resetSearchState,
	}
}
