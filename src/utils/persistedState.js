const STORAGE_PREFIX = 'localhub'

function canUseStorage() {
	return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function loadPersistedState(key) {
	if (!canUseStorage()) {
		return null
	}

	try {
		const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:${key}`)
		return raw ? JSON.parse(raw) : null
	} catch (error) {
		console.error(`Failed to load persisted state for ${key}:`, error)
		return null
	}
}

export function savePersistedState(key, value) {
	if (!canUseStorage()) {
		return
	}

	try {
		window.localStorage.setItem(`${STORAGE_PREFIX}:${key}`, JSON.stringify(value))
	} catch (error) {
		console.error(`Failed to save persisted state for ${key}:`, error)
	}
}

export function setupPersistedStores(pinia) {
	if (!pinia) {
		return
	}

	const storeKeys = {
		map: 'map-store',
		recommend: 'recommend-store',
		favorites: 'favorites-store',
	}

	pinia.use(({ store }) => {
		const storageKey = storeKeys[store.$id]
		if (!storageKey || !canUseStorage()) {
			return
		}

		const savedState = loadPersistedState(storageKey)
		if (savedState && typeof savedState === 'object') {
			store.$patch(savedState)
		}

		store.$subscribe((_, state) => {
			savePersistedState(storageKey, state)
		}, { detached: true })
	})
}