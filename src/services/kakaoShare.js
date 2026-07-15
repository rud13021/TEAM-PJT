const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY || import.meta.env.VITE_KAKAO_MAP_KEY || ''

let kakaoSharePromise = null

function getShareImageUrl() {
	if (typeof window === 'undefined') {
		return ''
	}

	return new URL('/images/kakao-share-card.svg', window.location.origin).toString()
}

function initKakao(Kakao) {
	if (!Kakao || typeof Kakao.isInitialized !== 'function') {
		return Kakao
	}

	if (!Kakao.isInitialized() && KAKAO_JS_KEY) {
		Kakao.init(KAKAO_JS_KEY)
	}

	return Kakao
}

function trimText(text, maxLength = 220) {
	const normalized = String(text || '').trim()
	if (!normalized) {
		return ''
	}

	if (normalized.length <= maxLength) {
		return normalized
	}

	return `${normalized.slice(0, maxLength - 1)}...`
}

function toListText(value, maxItems = 4) {
	if (!Array.isArray(value) || !value.length) {
		return ''
	}

	return value
		.map((item) => (typeof item === 'string' ? item : item?.title || item?.name || ''))
		.filter(Boolean)
		.slice(0, maxItems)
		.join(', ')
}

function buildShareDescription(payload, shareUrl) {
	const lines = []
	const baseDescription = payload.description || payload.summary || '서울에서 바로 확인할 수 있는 추천 정보입니다.'
	lines.push(baseDescription)

	const nearbySpots = toListText(payload.meta?.nearbySpots)
	if (nearbySpots) {
		lines.push(`추천 스팟: ${nearbySpots}`)
	}

	const coursePoints = toListText(payload.meta?.coursePoints)
	if (coursePoints) {
		lines.push(`코스 구성: ${coursePoints}`)
	}

	if (shareUrl) {
		lines.push(`링크: ${shareUrl}`)
	}

	return trimText(lines.join('\n'))
}

export function loadKakaoShareSdk() {
	if (typeof window !== 'undefined' && window.Kakao?.Share) {
		return Promise.resolve(initKakao(window.Kakao))
	}

	if (!KAKAO_JS_KEY) {
		return Promise.reject(new Error('카카오 JS 키가 설정되지 않았습니다.'))
	}

	if (!kakaoSharePromise) {
		kakaoSharePromise = new Promise((resolve, reject) => {
			const script = document.createElement('script')
			script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js'
			script.async = true
			script.onload = () => {
				if (window.Kakao) {
					resolve(initKakao(window.Kakao))
				} else {
					reject(new Error('카카오 공유 SDK를 불러오지 못했습니다.'))
				}
			}
			script.onerror = () => reject(new Error('카카오 공유 SDK 로딩에 실패했습니다.'))
			document.head.appendChild(script)
		})
	}

	return kakaoSharePromise
}

export async function shareToKakaoTalk(payload = {}) {
	const Kakao = await loadKakaoShareSdk()
	const shareUrl = payload.shareUrl || (typeof window !== 'undefined' ? window.location.href : '')
	const title = String(payload.title || 'LocalHub 추천').trim()
	const description = buildShareDescription(payload, shareUrl)
	const imageUrl = payload.imageUrl || getShareImageUrl()
	const buttonText = String(payload.buttonText || '자세히 보기').trim()

	const template = {
		objectType: 'feed',
		content: {
			title,
			description,
			imageUrl,
			link: {
				webUrl: shareUrl,
				mobileWebUrl: shareUrl,
			},
		},
		buttons: [
			{
				title: buttonText,
				link: {
					webUrl: shareUrl,
					mobileWebUrl: shareUrl,
				},
			},
			{
				title: '링크 열기',
				link: {
					webUrl: shareUrl,
					mobileWebUrl: shareUrl,
				},
			},
		],
	}

	if (Kakao.Share?.sendDefault) {
		Kakao.Share.sendDefault(template)
		return true
	}

	if (Kakao.Link?.sendDefault) {
		Kakao.Link.sendDefault(template)
		return true
	}

	throw new Error('카카오 공유 기능을 사용할 수 없습니다.')
}