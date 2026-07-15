<script setup>
import { RouterLink } from 'vue-router'

const highlights = [
	{ title: '명소탐방', text: '산책·사진 명소 중심으로 구성된 추천 코스', badge: '추천도 높음' },
	{ title: '맛집거리', text: '연인·친구 모임에 적합한 식사 동선', badge: '인기 급상승' },
	{ title: '축제광장', text: '야간 이벤트와 행사가 몰린 거점', badge: '실시간 반영' },
]

const stats = [
	{ label: '추천 거점 수', value: '12개' },
	{ label: '평균 이동 시간', value: '18분' },
	{ label: '실제 만족도', value: '94%' },
]

const festivalDays = [
	{ day: '14', event: '서울 장미 축제' },
	{ day: '16', event: '경복궁 야간개장' },
	{ day: '19', event: '성북동 먹거리 축제' },
]
</script>

<template>
	<main class="home-page">
		<section class="hero-section">
			<div class="hero-copy">
				<p class="hero-eyebrow">MEETPOINT SEOUL</p>
				<h1>중간 지점 약속 장소를 더 똑똑하게 추천해요</h1>
				<p>
					출발지·카테고리·이동 편의를 반영해 서울에서 가장 자연스러운 약속 장소를 제안합니다.
				</p>
				<div class="hero-actions">
					<RouterLink class="btn btn-primary" :to="{ name: 'recommend' }">추천 결과 보기</RouterLink>
					<RouterLink class="btn btn-secondary" :to="{ name: 'chat' }">AI 플래너 챗봇</RouterLink>
				</div>
			</div>

			<div class="hero-panel">
				<div class="hero-card hero-card--primary">
					<span>오늘의 추천 거점</span>
					<strong>을지로 3가</strong>
					<small>대중교통 환승과 식사·문화시설이 모두 균형적으로 몰려 있습니다.</small>
				</div>
				<div class="hero-card">
					<span>추천 포인트</span>
					<strong>3명 동선 기준</strong>
					<small>모임 인원 수에 따라 최적 거점을 자동으로 조정합니다.</small>
				</div>
			</div>
		</section>

		<section class="highlights-grid">
			<div v-for="item in highlights" :key="item.title" class="highlight-card">
				<p class="highlight-card__badge">{{ item.badge }}</p>
				<h3>{{ item.title }}</h3>
				<p>{{ item.text }}</p>
			</div>
		</section>

		<section class="dashboard-grid">
			<div class="dashboard-card dashboard-card--wide">
				<div class="dashboard-card__header">
					<h2>실시간 추천 대시보드</h2>
					<p>동선, 거점 밀도, 인기도를 한눈에 확인해보세요.</p>
				</div>
				<div class="stats-list">
					<div v-for="stat in stats" :key="stat.label" class="stat-item">
						<span>{{ stat.label }}</span>
						<strong>{{ stat.value }}</strong>
					</div>
				</div>
			</div>

			<div class="dashboard-card">
				<div class="dashboard-card__header">
					<h2>이번 주 축제</h2>
					<p>서울의 실시간 행사 일정입니다.</p>
				</div>
				<div class="festival-list">
					<div v-for="item in festivalDays" :key="item.day" class="festival-item">
						<span class="festival-item__day">{{ item.day }}</span>
						<span class="festival-item__event">{{ item.event }}</span>
					</div>
				</div>
			</div>
		</section>
	</main>
</template>

<style scoped>
.home-page {
	width: 100%;
	max-width: 1200px;
	margin: 0 auto;
	padding: 32px 24px 72px;
	box-sizing: border-box;
}

.hero-section {
	display: grid;
	grid-template-columns: 1.35fr 0.8fr;
	gap: 20px;
	padding: 32px;
	border-radius: 28px;
	background: linear-gradient(135deg, #eef2ff 0%, #ffffff 55%, #f8fafc 100%);
	border: 1px solid #e2e8f0;
	box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
}

.hero-copy {
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 16px;
}

.hero-copy h1 {
	margin: 0;
	font-size: clamp(2rem, 3.3vw, 3.2rem);
	line-height: 1.1;
	color: #0f172a;
}

.hero-copy p {
	margin: 0;
	font-size: 1rem;
	line-height: 1.7;
	color: #475569;
	max-width: 58ch;
}

.hero-eyebrow {
	font-size: 0.8rem;
	font-weight: 800;
	letter-spacing: 0.2em;
	text-transform: uppercase;
	color: #4f46e5;
}

.hero-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-top: 8px;
}

.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 11px 16px;
	border-radius: 999px;
	font-weight: 700;
	font-size: 0.95rem;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn:hover {
	transform: translateY(-1px);
}

.btn-primary {
	background: #4f46e5;
	color: #fff;
	box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2);
}

.btn-secondary {
	background: #fff;
	color: #0f172a;
	border: 1px solid #dbe3ee;
}

.hero-panel {
	display: grid;
	gap: 12px;
}

.hero-card {
	padding: 20px;
	border-radius: 22px;
	background: rgba(255, 255, 255, 0.94);
	border: 1px solid #e2e8f0;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.hero-card--primary {
	background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
	color: #fff;
}

.hero-card span {
	font-size: 0.8rem;
	opacity: 0.85;
}

.hero-card strong {
	font-size: 1.2rem;
}

.hero-card small {
	line-height: 1.5;
	opacity: 0.9;
}

.highlights-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16px;
	margin-top: 20px;
}

.highlight-card {
	padding: 20px;
	border-radius: 20px;
	background: #fff;
	border: 1px solid #e2e8f0;
	box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
}

.highlight-card__badge {
	margin: 0 0 8px;
	font-size: 0.75rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #4f46e5;
}

.highlight-card h3 {
	margin: 0 0 8px;
	font-size: 1.1rem;
	color: #0f172a;
}

.highlight-card p {
	margin: 0;
	color: #64748b;
	line-height: 1.6;
}

.dashboard-grid {
	display: grid;
	grid-template-columns: 1.4fr 0.8fr;
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
	font-size: 1.2rem;
	color: #0f172a;
}

.dashboard-card__header p {
	margin: 0;
	color: #64748b;
}

.stats-list {
	display: grid;
	gap: 12px;
}

.stat-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 14px;
	border-radius: 14px;
	background: #f8fafc;
	color: #334155;
}

.stat-item strong {
	color: #111827;
}

.festival-list {
	display: grid;
	gap: 10px;
}

.festival-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 14px;
	border-radius: 14px;
	background: #f8fafc;
}

.festival-item__day {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 999px;
	background: #4f46e5;
	color: #fff;
	font-weight: 700;
	flex-shrink: 0;
}

.festival-item__event {
	color: #334155;
	font-size: 0.95rem;
}

@media (max-width: 1024px) {
	.hero-section,
	.dashboard-grid {
		grid-template-columns: 1fr;
	}

	.highlights-grid {
		grid-template-columns: 1fr;
	}
}
</style>
