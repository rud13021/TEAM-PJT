<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useMapStore } from '../stores/map'
import { useRecommendStore } from '../stores/recommend'
import { openKakaoAddressSearch } from '../services/kakaoMap'
import { buildTopMeetingRecommendations, loadMeetupCandidates } from '../services/recommendEngine'
import Chart from 'chart.js/auto'

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
const chartCanvas = ref(null)
let chartInstance = null
const chartSeries = ref([])
const festivalItems = ref([])

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
	const selectedAddress = await openKakaoAddressSearch()
	if (!selectedAddress || selectedAddress.dismissed) return

	mapStore.updateLocation(index, {
		name: selectedAddress.buildingName || selectedAddress.roadAddress || selectedAddress.jibunAddress || '선택된 주소',
		address: selectedAddress.fullAddress || selectedAddress.roadAddress || selectedAddress.jibunAddress || '',
		lat: selectedAddress.lat ?? null,
		lng: selectedAddress.lng ?? null,
	})
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
			maxTravelMinutes: 45,
			topN: 3,
		})

		if (!recommendations.length) {
			recommendStore.clearRecommendations()
			calcError.value = '45분 이내로 도착 가능한 공통 후보를 찾지 못했습니다. 출발지를 다시 선택해 주세요.'
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

const openRecommendationMap = async (recommendationId) => {
	recommendStore.setSelectedRecommendation(recommendationId)
	await router.push({ name: 'recommend' })
}

const renderChart = () => {
	if (!chartCanvas.value) return
	if (chartInstance) {
		chartInstance.destroy()
	}

	chartInstance = new Chart(chartCanvas.value, {
		type: 'bar',
		data: {
			labels: chartSeries.value.map((item) => item.label),
			datasets: [
				{
					label: '총 데이터 수',
					data: chartSeries.value.map((item) => item.count),
					backgroundColor: ['#4f46e5', '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6'],
					borderRadius: 8,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { display: false },
			},
			scales: {
				y: {
					beginAtZero: true,
					grid: { color: '#f1f5f9' },
					ticks: { color: '#64748b' },
				},
				x: {
					grid: { display: false },
					ticks: { color: '#64748b' },
				},
			},
		},
	})
}

const loadDashboardData = async () => {
	const files = [
		{ label: '관광지', path: '/data/서울_관광지.json' },
		{ label: '문화시설', path: '/data/서울_문화시설.json' },
		{ label: '레포츠', path: '/data/서울_레포츠.json' },
		{ label: '쇼핑', path: '/data/서울_쇼핑.json' },
		{ label: '숙박', path: '/data/서울_숙박.json' },
		{ label: '여행코스', path: '/data/서울_여행코스.json' },
		{ label: '축제공연행사', path: '/data/서울_축제공연행사.json' },
	]

	const results = await Promise.all(
		files.map(async (file) => {
			const response = await fetch(file.path)
			const data = await response.json()
			return {
				label: file.label,
				count: Number(data.total ?? data.items?.length ?? 0),
			}
		}),
	)

	chartSeries.value = results
	nextTick(() => renderChart())
}

const loadFestivals = async () => {
	const response = await fetch('/data/서울_축제공연행사.json')
	const data = await response.json()
	festivalItems.value = (data.items || []).slice(0, 6)
}

const openKakaoCalendar = (festival) => {
	const query = encodeURIComponent(`${festival.title || '서울 축제'} ${festival.addr1 || ''}`)
	window.open(`https://calendar.kakao.com/?q=${query}`, '_blank', 'noopener,noreferrer')
}

onMounted(async () => {
	await loadDashboardData()
	await loadFestivals()
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
			<div class="dashboard-card dashboard-card--wide">
				<div class="dashboard-card__header">
					<h2>📊 서울 주요 거점 관광 지표</h2>
					<p>지역별 공공 데이터 카테고리 밀도 분석을 한눈에 확인하세요.</p>
				</div>
				<div class="chart-area">
					<canvas ref="chartCanvas"></canvas>
				</div>
			</div>

			<div class="dashboard-card">
				<div class="dashboard-card__header">
					<h2>🗓️ 축제 캘린더</h2>
					<p>서울 주요 이벤트 및 전시 일정.</p>
				</div>
				<div class="festival-list">
					<div v-for="festival in festivalItems" :key="festival.contentid" class="festival-item">
						<div>
							<strong>{{ festival.title }}</strong>
							<span>{{ festival.addr1 || '서울 지역 축제' }}</span>
						</div>
						<button type="button" class="search-button" @click="openKakaoCalendar(festival)">카카오톡 캘린더</button>
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
