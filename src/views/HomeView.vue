<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'
import { useMapStore } from '../stores/map'
import { useRecommendStore } from '../stores/recommend'
import { openKakaoAddressSearch } from '../services/kakaoMap'
import { buildTopMeetingRecommendations, loadMeetupCandidates } from '../services/recommendEngine'
import { searchNaverBlogs } from '../services/naverBlog'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import koLocale from '@fullcalendar/core/locales/ko'

const mapStore = useMapStore()
const recommendStore = useRecommendStore()
const router = useRouter()

const startLocations = computed({
	get: () => mapStore.startLocations,
	set: (value) => mapStore.setStartLocations(value),
})

const topRecommendations = computed(() => recommendStore.recommendations)
const calcResult = computed(() => recommendStore.selectedRecommendation)
const bestRecommendation = computed(() => topRecommendations.value[0] || null)

const isCalculating = ref(false)
const calcError = ref('')
const festivalItems = ref([])
const festivalVisibleRange = ref({ start: '', end: '' })
const hoveredFestivalId = ref('')
const blogQuery = ref('서울여행')
const blogResults = ref([])
const blogLoading = ref(false)
const blogError = ref('')

const parseFestivalDate = (value) => {
	const text = String(value || '')
	if (text.length !== 8) {
		return ''
	}

	return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`
}

const getFestivalStartDate = (festival) => parseFestivalDate(festival.eventstartdate || festival.createdtime || festival.modifiedtime)

const getFestivalEndDate = (festival) => parseFestivalDate(festival.eventenddate || festival.eventstartdate || festival.createdtime || festival.modifiedtime)

const buildFestivalSearchUrl = (festival) => {
	const query = encodeURIComponent(festival.title || '서울 축제')
	return `https://search.naver.com/search.naver?query=${query}`
}

const normalizeFestival = (festival, index) => ({
	...festival,
	id: festival.contentid || `${festival.title}-${index}`,
	startDate: getFestivalStartDate(festival),
	endDate: getFestivalEndDate(festival),
	naverSearchUrl: buildFestivalSearchUrl(festival),
})

const isFestivalVisibleInRange = (festival, range) => {
	if (!festival.startDate || !festival.endDate || !range.start || !range.end) {
		return false
	}

	return festival.startDate < range.end && festival.endDate >= range.start
}

const visibleFestivalItems = computed(() => {
	return festivalItems.value
		.filter((festival) => isFestivalVisibleInRange(festival, festivalVisibleRange.value))
		.sort((left, right) => left.startDate.localeCompare(right.startDate) || left.title.localeCompare(right.title))
})

const festivalCalendarOptions = computed(() => ({
	plugins: [dayGridPlugin, interactionPlugin],
	initialView: 'dayGridMonth',
	locale: koLocale,
	headerToolbar: {
		left: 'prev,next today',
		center: 'title',
		right: '',
	},
	height: 'auto',
	fixedWeekCount: false,
	dayMaxEvents: 2,
	events: festivalItems.value.map((festival, index) => ({
		id: festival.id,
		title: festival.title,
		start: festival.startDate || toFestivalCalendarDate(festival, index),
		end: festival.endDate || festival.startDate || toFestivalCalendarDate(festival, index),
		backgroundColor: index % 3 === 0 ? '#4f46e5' : index % 3 === 1 ? '#10b981' : '#f59e0b',
		borderColor: 'transparent',
		textColor: '#fff',
	})),
	eventContent: (eventInfo) => ({
		html: `<span class="festival-event-badge" aria-hidden="true"></span><span class="festival-event-label">${eventInfo.event.title}</span>`,
	}),
	eventMouseEnter: (eventInfo) => {
		hoveredFestivalId.value = eventInfo.event.id
	},
	eventMouseLeave: () => {
		hoveredFestivalId.value = ''
	},
	datesSet: (dateInfo) => {
		festivalVisibleRange.value = {
			start: dateInfo.startStr,
			end: dateInfo.endStr,
		}
	},
	buttonText: {
		today: '오늘',
	},
}))

const ctaCards = [
	{ title: '1. 다차원 정밀 계산', text: '대중교통 환승 시간과 이동 거리의 균형을 반영해 최적 약속 지점을 산출합니다.' },
	{ title: '2. AI 관광 비서 지원', text: '선정된 지역에 맞춰 코스, 맛집, 축제를 한 번에 추천해 드립니다.' },
	{ title: '3. 로컬 집단 지성 커뮤니티', text: '익명 후기와 실사용 팁을 통해 현지 정보까지 더 빠르게 확인할 수 있습니다.' },
]

const addStartLocation = () => {
	if (startLocations.value.length < 5) {
		mapStore.addLocation({ name: '' })
	}
}

const removeStartLocation = (index) => {
	mapStore.removeLocation(index)
}

const openAddressSearch = async (index) => {
	try {
		const selectedAddress = await openKakaoAddressSearch()
		if (!selectedAddress || selectedAddress.dismissed) return

		const name = selectedAddress.buildingName || selectedAddress.roadAddress || selectedAddress.jibunAddress || '선택된 주소'
		const address = selectedAddress.fullAddress || selectedAddress.roadAddress || selectedAddress.jibunAddress || ''

		mapStore.updateLocation(index, {
			name,
			address,
			lat: selectedAddress.lat ?? null,
			lng: selectedAddress.lng ?? null,
		})

		if (!Number.isFinite(selectedAddress.lat) || !Number.isFinite(selectedAddress.lng)) {
			calcError.value = `주소는 반영되었지만 좌표 변환에 실패했습니다. (${selectedAddress.status || 'UNKNOWN'})`
			console.warn('Address selected without coordinates:', selectedAddress)
		} else {
			if (calcError.value.includes('좌표 변환')) {
				calcError.value = ''
			}
			console.debug('Address selected:', selectedAddress)
		}
	} catch (error) {
		console.error('Address search failed:', error)
		calcError.value = '주소 검색 중 오류가 발생했습니다. 팝업 차단 또는 카카오 키 설정을 확인해 주세요.'
	}
}

const calculateMiddlePoint = async () => {
	const validStarts = startLocations.value.filter(
		(item) => item.name?.trim() && Number.isFinite(item.lat) && Number.isFinite(item.lng),
	)

	if (validStarts.length < 2) {
		recommendStore.clearRecommendations()
		calcError.value = '출발지는 최소 2개 이상, 주소 검색으로 좌표까지 선택해야 계산할 수 있습니다.'
		return
	}

	isCalculating.value = true
	calcError.value = ''

	try {
		const candidates = await loadMeetupCandidates()
		const recommendations = await buildTopMeetingRecommendations(validStarts, candidates, {
			topN: 3,
		})

		if (!recommendations.length) {
			recommendStore.clearRecommendations()
			calcError.value = '공통 후보를 찾지 못했습니다. 출발지를 다시 선택해 주세요.'
			return
		}

		recommendStore.setRecommendations(recommendations)
	} catch (error) {
		console.error('Failed to calculate recommendations:', error)
		recommendStore.clearRecommendations()
		calcError.value = '중간 지점 계산 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
	} finally {
		isCalculating.value = false
	}
}

const selectRecommendation = (recommendationId) => {
	recommendStore.setSelectedRecommendation(recommendationId)
}

const toFestivalCalendarDate = (festival, index = 0) => {
	const timestamp = String(festival.createdtime || festival.modifiedtime || '')
	if (timestamp.length >= 8) {
		return `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}`
	}

	const date = new Date()
	date.setDate(date.getDate() + index)
	return date.toISOString().slice(0, 10)
}

const normalizeBlogItem = (item) => ({
	title: item.title,
	description: item.description,
	bloggername: item.bloggername,
	link: item.link,
	bloggerlink: item.bloggerlink,
	postdate: item.postdate,
})

const formatBlogDate = (value) => {
	if (!value || value.length !== 8) {
		return ''
	}
	return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`
}

const loadBlogResults = async (query = blogQuery.value) => {
	const normalizedQuery = String(query || '').trim() || '서울여행'
	blogQuery.value = normalizedQuery
	blogLoading.value = true
	blogError.value = ''

	try {
		const results = await searchNaverBlogs(normalizedQuery, 6)
		blogResults.value = results.map(normalizeBlogItem)
		if (!blogResults.value.length) {
			blogError.value = '검색 결과가 없습니다.'
		}
	} catch (error) {
		console.error('Blog search failed:', error)
		blogResults.value = []
		blogError.value = '네이버 블로그 검색에 실패했습니다.'
	} finally {
		blogLoading.value = false
	}
}

const submitBlogSearch = async () => {
	await loadBlogResults(blogQuery.value)
}

const openRecommendationMap = async (recommendationId) => {
	recommendStore.setSelectedRecommendation(recommendationId)
	await router.push({ name: 'recommend' })
}

const loadFestivals = async () => {
	const response = await fetch('/data/서울_축제공연행사.json')
	const data = await response.json()
	festivalItems.value = (data.items || []).map(normalizeFestival)
	if (!festivalVisibleRange.value.start) {
		festivalVisibleRange.value = {
			start: new Date().toISOString().slice(0, 10),
			end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10),
		}
	}
}

watch(
	calcResult,
	async (value) => {
		if (!value?.name) {
			return
		}

		await loadBlogResults(`${value.name} 여행`)
	},
	{ immediate: true },
)

watch(blogQuery, (value) => {
	if (!value?.trim()) {
		blogQuery.value = '서울여행'
	}
})

const openKakaoCalendar = (festival) => {
	const query = encodeURIComponent(`${festival.title || '서울 축제'} ${festival.addr1 || ''}`)
	window.open(`https://calendar.kakao.com/?q=${query}`, '_blank', 'noopener,noreferrer')
}

const openFestivalNaverSearch = (festival) => {
	window.location.href = festival.naverSearchUrl || buildFestivalSearchUrl(festival)
}

const formatFestivalPeriod = (festival) => {
	if (!festival.startDate) {
		return festival.addr1 || '서울 지역 축제'
	}

	if (festival.startDate === festival.endDate) {
		return festival.startDate
	}

	return `${festival.startDate} ~ ${festival.endDate}`
}

const getFestivalItemClass = (festival) => ({
	'festival-item--active': hoveredFestivalId.value === festival.id,
})

onMounted(async () => {
	await loadFestivals()
	if (!blogResults.value.length) {
		await loadBlogResults('서울여행')
	}
})
</script>

<template>
	<main class="home-demo">
		<section class="hero-banner">
			<div class="hero-banner__content">
				<p class="hero-banner__eyebrow">MEETPOINT SEOUL</p>
				<h1>서울에서 만날 때, 누구도 억울하지 않은 중간 장소를 추천합니다.</h1>
				<p>
					각자의 출발 위치를 입력하면 교통 편의와 가중치가 반영된 정확한 중심지를 계산해 주변 관광지, 축제, 맛집 코스까지 한눈에 제안합니다.
				</p>

				<div class="hero-input-card">
					<div class="hero-input-card__header">
						<span>출발지 등록 (최대 5곳)</span>
						<button type="button" @click="addStartLocation">+ 주소 추가</button>
					</div>

					<div class="input-list">
						<div v-for="(location, index) in startLocations" :key="index" class="input-row">
							<span class="input-row__index">{{ index + 1 }}</span>
							<div class="input-group">
								<input v-model="location.name" type="text" placeholder="도로명/건물명/지번을 검색해 입력하세요" />
								<span v-if="location.address" class="selected-address" :title="location.address">{{ location.address }}</span>
								<button type="button" class="search-button" @click="openAddressSearch(index)">주소 검색</button>
							</div>
							<button type="button" class="icon-button" @click="removeStartLocation(index)">✕</button>
						</div>
					</div>

					<div class="hero-input-card__footer">
						<button type="button" class="calculate-button" :disabled="isCalculating" @click="calculateMiddlePoint">
							{{ isCalculating ? '계산 중...' : '중간 지점 계산하기' }}
						</button>
						<p v-if="calcError" class="calc-error">{{ calcError }}</p>
					</div>
				</div>
			</div>

			<div class="hero-side-card">
				<div class="hero-side-card__accent">
					<span>오늘의 추천 거점</span>
					<strong>{{ bestRecommendation?.name || '중간 지점 계산 대기' }}</strong>
					<small>{{ bestRecommendation?.feature || '출발지 2곳 이상을 주소 검색으로 선택하면 TOP 3 거점을 계산합니다.' }}</small>
				</div>
				<div class="hero-side-card__plain">
					<span>추천 포인트</span>
					<strong>동선 기반 최적화</strong>
					<small>모임 인원·이동 시간·카테고리 가중치를 반영해 거점을 조정합니다.</small>
				</div>
			</div>
		</section>

		<section v-if="topRecommendations.length" class="result-section">
			<div class="result-banner">
				<div>
					<p class="result-banner__eyebrow">연산 매칭 결과</p>
					<h2>가장 완벽한 만남 광장은 <span>‘{{ calcResult?.name }}’</span> 입니다!</h2>
				</div>
				<RouterLink class="btn btn--primary" :to="{ name: 'recommend' }">상세 지도 및 근처 코스 보기</RouterLink>
			</div>

			<div class="highlight-grid">
				<div
					v-for="item in topRecommendations"
					:key="item.id"
					class="highlight-card recommendation-card"
					:class="item.id === calcResult?.id ? 'recommendation-card--active' : ''"
				>
					<div class="recommendation-card__header">
						<h3>{{ item.rank }}순위 · {{ item.name }}</h3>
						<span>{{ item.category }} · {{ item.district }}</span>
					</div>
					<p class="recommendation-card__summary">
						총 이동 {{ item.totalTravelTime }}분 · 도착 편차 {{ item.arrivalGap }}분 · 중심거리 {{ item.midpointDistanceKm.toFixed(2) }}km
					</p>
					<div v-for="(route, routeIndex) in item.routes" :key="`${item.id}-${routeIndex}`" class="mini-list">
						<p>{{ route.originName }} → {{ item.name }}</p>
						<span>예상 소요 {{ route.durationMinutes }}분</span>
					</div>
					<div class="recommendation-card__actions">
						<button type="button" class="search-button" @click="selectRecommendation(item.id)">선택</button>
						<button type="button" class="search-button" @click="openRecommendationMap(item.id)">지도 경로 보기</button>
					</div>
				</div>
			</div>
		</section>

		<section class="dashboard-section">
			<div class="dashboard-card dashboard-card--wide blog-card">
				<div class="dashboard-card__header">
					<h2>📰 네이버 블로그 추천</h2>
					<p>기본값은 서울여행이며, 중간 지점 선택 시 목적지 + 여행으로 자동 갱신됩니다.</p>
				</div>

				<div class="blog-search-bar">
					<input v-model="blogQuery" type="text" class="blog-search-input" placeholder="서울여행 또는 원하는 지역 + 여행" @keyup.enter="submitBlogSearch" />
					<button type="button" class="calculate-button" @click="submitBlogSearch">검색</button>
				</div>

				<div class="blog-meta">
					<span>검색어</span>
					<strong>{{ blogQuery }}</strong>
				</div>

				<div v-if="blogError" class="blog-empty">{{ blogError }}</div>
				<div v-else-if="blogLoading" class="blog-empty">블로그 검색 중...</div>

				<div v-else class="blog-grid">
					<a v-for="item in blogResults" :key="item.link" class="blog-card-item" :href="item.link" target="_blank" rel="noopener noreferrer">
						<div class="blog-card-item__eyebrow">{{ item.bloggername || 'Naver Blog' }} · {{ formatBlogDate(item.postdate) }}</div>
						<h3 v-html="item.title"></h3>
						<p v-html="item.description"></p>
					</a>
				</div>
			</div>

			<div class="dashboard-card">
				<div class="dashboard-card__header">
					<h2>🗓️ 축제 캘린더</h2>
					<p>서울 축제공연행사 데이터를 캘린더와 리스트로 함께 확인하세요.</p>
				</div>
				<div class="festival-calendar-wrap">
					<FullCalendar :options="festivalCalendarOptions" />
				</div>
				<div class="festival-list">
					<div v-if="!visibleFestivalItems.length" class="festival-empty">현재 달에 표시할 축제가 없습니다.</div>
					<div
						v-for="festival in visibleFestivalItems"
						:key="festival.id"
						class="festival-item"
						:class="getFestivalItemClass(festival)"
					>
						<div>
							<button type="button" class="festival-name-button" @click="openFestivalNaverSearch(festival)">{{ festival.title }}</button>
							<span>{{ formatFestivalPeriod(festival) }}</span>
						</div>
						<div class="festival-item__meta">
							<small>{{ festival.eventplace || festival.addr1 || '서울 지역 축제' }}</small>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section class="cta-section">
			<div v-for="card in ctaCards" :key="card.title" class="cta-card">
				<h3>{{ card.title }}</h3>
				<p>{{ card.text }}</p>
			</div>
		</section>
	</main>
</template>

<style scoped>
.home-demo {
	width: 100%;
	max-width: 1200px;
	margin: 0 auto;
	padding: 32px 24px 72px;
	box-sizing: border-box;
}

.hero-banner {
	display: grid;
	grid-template-columns: 1.3fr 0.7fr;
	gap: 20px;
	padding: 32px;
	border-radius: 28px;
	background: linear-gradient(135deg, #eef2ff 0%, #ffffff 55%, #f8fafc 100%);
	border: 1px solid #e2e8f0;
	box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
}

.hero-banner__content {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.hero-banner__content h1 {
	margin: 0;
	font-size: clamp(2rem, 3.1vw, 3.1rem);
	line-height: 1.18;
	color: #0f172a;
}

.hero-banner__content p {
	margin: 0;
	font-size: 1rem;
	line-height: 1.7;
	color: #475569;
	max-width: 60ch;
}

.hero-banner__eyebrow,
.result-banner__eyebrow {
	font-size: 0.8rem;
	font-weight: 800;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: #4f46e5;
}

.hero-input-card {
	margin-top: 8px;
	padding: 20px;
	border-radius: 22px;
	background: rgba(255, 255, 255, 0.95);
	border: 1px solid #e2e8f0;
	box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.hero-input-card__header,
.hero-input-card__footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
}

.hero-input-card__header span {
	font-size: 0.8rem;
	font-weight: 700;
	color: #334155;
}

.hero-input-card__header button,
.icon-button,
.search-button {
	border: none;
	background: none;
	cursor: pointer;
	color: #4f46e5;
	font-weight: 700;
}

.input-list {
	display: grid;
	gap: 10px;
	margin: 12px 0;
}

.input-row {
	display: flex;
	align-items: center;
	gap: 8px;
}

.input-group {
	display: flex;
	align-items: center;
	flex: 1;
	gap: 8px;
	min-width: 0;
}

.input-row__index {
	display: inline-flex;
	justify-content: center;
	align-items: center;
	width: 26px;
	height: 26px;
	border-radius: 999px;
	background: #eef2ff;
	color: #4338ca;
	font-size: 0.8rem;
	font-weight: 700;
	flex-shrink: 0;
}

.input-group input {
	flex: 1;
	padding: 10px 12px;
	border: 1px solid #dbe3ee;
	border-radius: 12px;
	background: #f8fafc;
	font-size: 0.9rem;
}

.selected-address {
	max-width: 290px;
	padding: 8px 10px;
	border-radius: 10px;
	background: #f1f5f9;
	border: 1px solid #dbe3ee;
	font-size: 0.8rem;
	color: #334155;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.search-button {
	padding: 8px 10px;
	background: #eef2ff;
	border-radius: 10px;
	white-space: nowrap;
}

.calculate-button,
.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 10px 16px;
	border-radius: 999px;
	font-weight: 700;
	font-size: 0.95rem;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.calculate-button {
	background: #4f46e5;
	color: #fff;
	border: none;
	cursor: pointer;
}

.calculate-button:disabled {
	opacity: 0.65;
	cursor: wait;
}

.calc-error {
	margin: 0;
	font-size: 0.84rem;
	color: #dc2626;
}

.btn:hover,
.calculate-button:hover,
.search-button:hover {
	transform: translateY(-1px);
}

.btn--primary {
	background: #4f46e5;
	color: #fff;
	box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2);
}

.hero-side-card {
	display: grid;
	gap: 12px;
}

.hero-side-card__accent,
.hero-side-card__plain {
	padding: 20px;
	border-radius: 20px;
	background: #fff;
	border: 1px solid #e2e8f0;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.hero-side-card__accent {
	background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
	color: #fff;
}

.hero-side-card span {
	font-size: 0.8rem;
	opacity: 0.85;
}

.hero-side-card strong {
	font-size: 1.15rem;
}

.hero-side-card small {
	line-height: 1.5;
	opacity: 0.9;
}

.result-section {
	display: flex;
	flex-direction: column;
	gap: 16px;
	margin-top: 20px;
}

.result-banner {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	padding: 24px 28px;
	background: #fff;
	border-radius: 24px;
	border: 1px solid #e2e8f0;
	box-shadow: 0 12px 24px rgba(15, 23, 42, 0.04);
}

.result-banner h2 {
	margin: 6px 0 0;
	font-size: 1.15rem;
	color: #0f172a;
}

.result-banner span {
	color: #4f46e5;
}

.highlight-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16px;
}

.highlight-card {
	padding: 20px;
	border-radius: 20px;
	background: #fff;
	border: 1px solid #e2e8f0;
	box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
}

.highlight-card h3 {
	margin: 0;
	font-size: 1.05rem;
	color: #0f172a;
}

.recommendation-card {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.recommendation-card--active {
	border-color: #4f46e5;
	box-shadow: 0 12px 22px rgba(79, 70, 229, 0.15);
}

.recommendation-card__header {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 8px;
}

.recommendation-card__header span {
	font-size: 0.8rem;
	color: #64748b;
}

.recommendation-card__summary {
	margin: 0;
	font-size: 0.9rem;
	color: #475569;
}

.mini-list {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.mini-list p {
	margin: 0;
	font-size: 0.95rem;
	font-weight: 700;
	color: #334155;
}

.mini-list span {
	font-size: 0.84rem;
	color: #64748b;
	line-height: 1.5;
}

.recommendation-card__actions {
	display: flex;
	gap: 8px;
}

.dashboard-section {
	display: grid;
	grid-template-columns: 1.25fr 0.75fr;
	gap: 18px;
	margin-top: 20px;
}

.dashboard-card {
	padding: 24px;
	border-radius: 24px;
	background: #fff;
	border: 1px solid #e2e8f0;
	box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
}

.dashboard-card__header {
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin-bottom: 16px;
}

.dashboard-card__header h2 {
	margin: 0;
	font-size: 1.15rem;
	color: #0f172a;
}

.dashboard-card__header p {
	margin: 0;
	color: #64748b;
}

.blog-search-bar {
	display: flex;
	gap: 10px;
	align-items: center;
	margin-bottom: 12px;
}

.blog-search-input {
	flex: 1;
	min-width: 0;
	min-height: 48px;
	padding: 0 14px;
	border-radius: 14px;
	border: 1px solid #dbe3ee;
	background: #f8fafc;
	font: inherit;
	color: #0f172a;
}

.blog-meta {
	display: flex;
	gap: 8px;
	align-items: center;
	margin-bottom: 14px;
	font-size: 0.88rem;
	color: #64748b;
}

.blog-meta strong {
	color: #0f172a;
}

.blog-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
}

.blog-card-item {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 16px;
	border-radius: 18px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	text-decoration: none;
	color: inherit;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.blog-card-item:hover {
	transform: translateY(-2px);
	box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.blog-card-item__eyebrow {
	font-size: 0.78rem;
	font-weight: 700;
	color: #4f46e5;
}

.blog-card-item h3 {
	margin: 0;
	font-size: 1rem;
	line-height: 1.45;
	color: #0f172a;
}

.blog-card-item p {
	margin: 0;
	font-size: 0.88rem;
	line-height: 1.6;
	color: #64748b;
}

.blog-empty {
	padding: 18px;
	border-radius: 16px;
	background: #f8fafc;
	color: #64748b;
	font-size: 0.92rem;
}

.festival-calendar-wrap {
	margin-bottom: 14px;
	padding: 12px;
	border-radius: 18px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
}

.festival-calendar-wrap :deep(.fc) {
	font-family: inherit;
	color: #0f172a;
}

.festival-calendar-wrap :deep(.fc .fc-toolbar-title) {
	font-size: 1rem;
	font-weight: 800;
	color: #0f172a;
}

.festival-calendar-wrap :deep(.fc .fc-button-primary) {
	background: #eef2ff;
	border-color: transparent;
	color: #4338ca;
	box-shadow: none;
}

.festival-calendar-wrap :deep(.fc .fc-button-primary:not(:disabled).fc-button-active),
.festival-calendar-wrap :deep(.fc .fc-button-primary:not(:disabled):active) {
	background: #4f46e5;
	color: #fff;
}

.festival-calendar-wrap :deep(.fc .fc-daygrid-day-number) {
	color: #334155;
	font-size: 0.82rem;
}

.festival-calendar-wrap :deep(.fc .fc-event) {
	border-radius: 10px;
	padding: 2px 6px;
	border: none;
}

.festival-calendar-wrap :deep(.festival-event-badge) {
	display: inline-block;
	width: 8px;
	height: 8px;
	margin-right: 6px;
	border-radius: 999px;
	background: currentColor;
	vertical-align: middle;
}

.festival-calendar-wrap :deep(.festival-event-label) {
	vertical-align: middle;
	font-size: 0.76rem;
	font-weight: 700;
}

.chart-area {
	position: relative;
	height: 240px;
}

.festival-item {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 10px;
	padding: 12px 14px;
	border-radius: 14px;
	background: #f8fafc;
	border: 1px solid transparent;
	transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.festival-item--active {
	border-color: #4f46e5;
	background: #eef2ff;
	transform: translateY(-1px);
}

.festival-name-button {
	padding: 0;
	border: 0;
	background: transparent;
	color: #0f172a;
	font: inherit;
	font-weight: 800;
	cursor: pointer;
	text-align: left;
}

.festival-item strong {
	display: block;
	margin-bottom: 4px;
	color: #0f172a;
}

.festival-item span {
	color: #64748b;
	font-size: 0.84rem;
}

.festival-item__meta {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	justify-content: center;
	min-width: 0;
	color: #64748b;
	font-size: 0.78rem;
}

.festival-empty {
	padding: 16px;
	border-radius: 14px;
	background: #f8fafc;
	color: #64748b;
	font-size: 0.9rem;
}

.cta-section {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16px;
	margin-top: 20px;
}

.cta-card {
	padding: 20px;
	border-radius: 20px;
	background: #fff;
	border: 1px solid #e2e8f0;
	box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
}

.cta-card h3 {
	margin: 0 0 8px;
	font-size: 1.05rem;
	color: #0f172a;
}

.cta-card p {
	margin: 0;
	color: #64748b;
	line-height: 1.6;
}

@media (max-width: 1024px) {
	.hero-banner,
	.dashboard-section,
	.cta-section,
	.highlight-grid {
		grid-template-columns: 1fr;
	}

	.result-banner,
	.hero-input-card__header,
	.hero-input-card__footer {
		flex-direction: column;
		align-items: flex-start;
	}

	.selected-address {
		max-width: 200px;
	}
}
</style>
