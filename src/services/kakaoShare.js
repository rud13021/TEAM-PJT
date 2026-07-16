const KAKAO_JS_KEY =
	import.meta.env.VITE_KAKAO_JS_KEY ||
	import.meta.env.VITE_KAKAO_MAP_KEY ||
	''


let kakaoSharePromise = null



function initKakao(Kakao) {

	if (!Kakao || typeof Kakao.isInitialized !== 'function') {
		return Kakao
	}


	if (!Kakao.isInitialized() && KAKAO_JS_KEY) {
		Kakao.init(KAKAO_JS_KEY)
	}


	return Kakao
}



function trimText(text, maxLength = 700) {

	const normalized = String(text || '').trim()


	if (!normalized) {
		return ''
	}


	if (normalized.length <= maxLength) {
		return normalized
	}


	return `${normalized.slice(0, maxLength - 3)}...`
}




/**
 * 카카오 공유 메시지 생성
 */
function buildShareDescription(payload) {


	const title =
		payload.title || '추천 장소'


	const description =
		payload.description ||
		payload.summary ||
		'LocalHub에서 추천하는 여행 정보입니다.'



	return trimText(
`📍 ${title}


${description}


✨ LocalHub에서 찾아본 추천 장소입니다.
친구와 함께 여행 계획을 세워보세요!`
	)

}





export function loadKakaoShareSdk() {


	if (
		typeof window !== 'undefined' &&
		window.Kakao?.Share
	) {

		return Promise.resolve(
			initKakao(window.Kakao)
		)

	}



	if (!KAKAO_JS_KEY) {

		return Promise.reject(
			new Error('카카오 JS 키가 설정되지 않았습니다.')
		)

	}




	if (!kakaoSharePromise) {


		kakaoSharePromise =
			new Promise((resolve,reject)=>{


				const script =
					document.createElement('script')


				script.src =
					'https://developers.kakao.com/sdk/js/kakao.min.js'


				script.async = true



				script.onload = ()=>{


					if(window.Kakao) {


						resolve(
							initKakao(window.Kakao)
						)


					} else {


						reject(
							new Error('카카오 SDK 로딩 실패')
						)

					}

				}




				script.onerror = ()=>{

					reject(
						new Error('카카오 SDK 오류')
					)

				}



				document.head.appendChild(script)

			})

	}



	return kakaoSharePromise

}







export async function shareToKakaoTalk(payload={}) {


	const Kakao =
		await loadKakaoShareSdk()



	const title =
		payload.title || 'LocalHub 추천'



	const description =
		buildShareDescription(payload)




	const template = {


		objectType:'feed',



		content:{


			title,


			description,



			imageUrl:
				payload.imageUrl ||
				'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png',



			link:{


				webUrl:
					'https://localhub.netlify.app',


				mobileWebUrl:
					'https://localhub.netlify.app'

			}

		},





		buttons:[


			{

				title:'LocalHub 보기',


				link:{


					webUrl:
						'https://localhub.netlify.app',


					mobileWebUrl:
						'https://localhub.netlify.app'

				}

			}

		]

	}




	if(Kakao.Share?.sendDefault) {


		Kakao.Share.sendDefault(template)

		return true

	}





	if(Kakao.Link?.sendDefault) {


		Kakao.Link.sendDefault(template)

		return true

	}




	throw new Error(
		'카카오 공유 기능 사용 불가'
	)

}