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
    return { dismissed: true }
  }

  return new Promise((resolve) => {
    const postcode = new Postcode({
      oncomplete: (data) => {
        const fullAddress = data.roadAddress || data.jibunAddress || data.address || ''
        const addressLabel = [data.roadAddress, data.buildingName ? `(${data.buildingName})` : ''].filter(Boolean).join(' ')

        const geocoder = new kakao.maps.services.Geocoder()
        geocoder.addressSearch(fullAddress, (result, status) => {
          resolve({
            dismissed: false,
            fullAddress: addressLabel || fullAddress,
            roadAddress: data.roadAddress || '',
            jibunAddress: data.jibunAddress || '',
            buildingName: data.buildingName || '',
            zonecode: data.zonecode || '',
            addressType: data.userSelectedType || '',
            lat: status === kakao.maps.services.Status.OK ? Number(result?.[0]?.y) : null,
            lng: status === kakao.maps.services.Status.OK ? Number(result?.[0]?.x) : null,
          })
        })
      },
      onclose: () => resolve({ dismissed: true }),
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
