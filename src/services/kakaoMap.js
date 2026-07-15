const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_JS_KEY || import.meta.env.VITE_KAKAO_MAP_KEY || ''

let kakaoSdkPromise = null
let postcodeScriptPromise = null

export function loadKakaoMapSdk() {
  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao)
  }

  if (!KAKAO_APP_KEY) {
    return Promise.reject(new Error('카카오 앱 키가 설정되지 않았습니다.'))
  }

  if (!kakaoSdkPromise) {
    kakaoSdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false&libraries=services`
      script.async = true
      script.onload = () => {
        if (window.kakao?.maps) {
          window.kakao.maps.load(() => resolve(window.kakao))
        } else {
          reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.'))
        }
      }
      script.onerror = () => reject(new Error('카카오 지도 SDK 로딩에 실패했습니다.'))
      document.head.appendChild(script)
    })
  }

  return kakaoSdkPromise
}

export function loadPostcodeScript() {
  if (window.daum?.Postcode) {
    return Promise.resolve(window.daum.Postcode)
  }

  if (!postcodeScriptPromise) {
    postcodeScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
      script.async = true
      script.onload = () => resolve(window.daum?.Postcode)
      script.onerror = () => reject(new Error('주소 검색 스크립트를 불러오지 못했습니다.'))
      document.head.appendChild(script)
    })
  }

  return postcodeScriptPromise
}

export async function openKakaoAddressSearch() {
  const kakao = await loadKakaoMapSdk()
  const Postcode = await loadPostcodeScript()

  if (!Postcode) {
    return {
      dismissed: true,
      status: 'POSTCODE_UNAVAILABLE',
      debugMessage: '주소 검색 스크립트를 로드하지 못했습니다.',
    }
  }

  return new Promise((resolve) => {
    let settled = false
    let selected = false

    const safeResolve = (payload) => {
      if (settled) return
      settled = true
      resolve(payload)
    }

    const postcode = new Postcode({
      oncomplete: (data) => {
        // Mark selection immediately so onclose cannot win the race.
        selected = true

        const fullAddress = data.roadAddress || data.jibunAddress || data.address || ''
        const addressLabel = [data.roadAddress, data.buildingName ? `(${data.buildingName})` : ''].filter(Boolean).join(' ')

        if (!fullAddress) {
          safeResolve({
            dismissed: false,
            status: 'EMPTY_ADDRESS',
            debugMessage: '선택된 주소 문자열이 비어 있습니다.',
            fullAddress: '',
            roadAddress: data.roadAddress || '',
            jibunAddress: data.jibunAddress || '',
            buildingName: data.buildingName || '',
            zonecode: data.zonecode || '',
            addressType: data.userSelectedType || '',
            lat: null,
            lng: null,
          })
          return
        }

        const geocoder = new kakao.maps.services.Geocoder()
        try {
          geocoder.addressSearch(fullAddress, (result, status) => {
            const isOk = status === kakao.maps.services.Status.OK

            safeResolve({
              dismissed: false,
              status: isOk ? 'OK' : `GEOCODER_${status || 'FAILED'}`,
              debugMessage: isOk ? '' : '주소는 선택되었지만 좌표 변환에 실패했습니다.',
              fullAddress: addressLabel || fullAddress,
              roadAddress: data.roadAddress || '',
              jibunAddress: data.jibunAddress || '',
              buildingName: data.buildingName || '',
              zonecode: data.zonecode || '',
              addressType: data.userSelectedType || '',
              lat: isOk ? Number(result?.[0]?.y) : null,
              lng: isOk ? Number(result?.[0]?.x) : null,
            })
          })
        } catch (error) {
          console.error('Kakao geocoder failed:', error)
          safeResolve({
            dismissed: false,
            status: 'GEOCODER_EXCEPTION',
            debugMessage: '좌표 변환 중 예외가 발생했습니다.',
            fullAddress: addressLabel || fullAddress,
            roadAddress: data.roadAddress || '',
            jibunAddress: data.jibunAddress || '',
            buildingName: data.buildingName || '',
            zonecode: data.zonecode || '',
            addressType: data.userSelectedType || '',
            lat: null,
            lng: null,
          })
        }
      },
      onclose: () => {
        if (selected) {
          return
        }

        safeResolve({ dismissed: true, status: 'CLOSED' })
      },
      width: '100%',
      height: '100%',
    })

    postcode.open()
  })
}

export async function searchKakaoAddress(query) {
  if (!query?.trim()) {
    return []
  }

  const kakao = await loadKakaoMapSdk()
  return new Promise((resolve) => {
    const geocoder = new kakao.maps.services.Geocoder()
    geocoder.addressSearch(query, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        resolve(
          result.slice(0, 5).map((item) => ({
            address_name: item.address?.address_name || item.address_name,
            road_address: item.road_address || null,
            place_name: item.place_name || item.address?.address_name || item.address_name,
            x: item.x,
            y: item.y,
          })),
        )
      } else {
        resolve([])
      }
    })
  })
}

export async function searchKakaoPlaces(query) {
  if (!query?.trim()) {
    return []
  }

  const kakao = await loadKakaoMapSdk()
  return new Promise((resolve) => {
    const places = new kakao.maps.services.Places()
    places.keywordSearch(query, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        resolve(
          result.slice(0, 3).map((item) => ({
            placeName: item.place_name,
            addressName: item.address_name || item.road_address_name || '',
            roadAddressName: item.road_address_name || '',
            x: item.x,
            y: item.y,
          })),
        )
      } else {
        resolve([])
      }
    })
  })
}
