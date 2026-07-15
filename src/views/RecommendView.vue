<script setup>
const startLocations = ['강남역', '홍대입구역', '노원역']
const categories = ['명소탐방', '맛집거리', '축제광장']
const places = [
	{ title: '낙산공원 성곽길 저녁 산책', meta: '서울 종로구 · 4.8', tag: '명소탐방' },
	{ title: '혜화 대학로 숯불갈비', meta: '서울 종로구 · 4.7', tag: '맛집거리' },
	{ title: 'DDP 야간 포토존', meta: '서울 중구 · 4.9', tag: '명소탐방' },
]
</script>

<template>
	<main class="recommend-page">
		<section class="recommend-layout">
			<aside class="control-panel">
				<div class="panel-block">
					<p class="panel-eyebrow">거점 분석 & 지도</p>
					<h1>출발지와 선호 카테고리를 바탕으로 가장 무난한 거점을 찾습니다.</h1>
				</div>

				<div class="panel-block">
					<h2>출발지</h2>
					<div class="chip-list">
						<span v-for="item in startLocations" :key="item" class="chip">{{ item }}</span>
					</div>
				</div>

				<div class="panel-block">
					<h2>카테고리</h2>
					<div class="chip-list">
						<span v-for="item in categories" :key="item" class="chip chip--accent">{{ item }}</span>
					</div>
				</div>

				<div class="panel-block panel-block--grow">
					<h2>추천 장소 리스트</h2>
					<div class="place-list">
						<div v-for="place in places" :key="place.title" class="place-card">
							<span class="place-card__tag">{{ place.tag }}</span>
							<strong>{{ place.title }}</strong>
							<p>{{ place.meta }}</p>
						</div>
					</div>
				</div>
			</aside>

			<section class="map-panel">
				<div class="map-overlay">
					<p>추천 거점</p>
					<h2>을지로4가역</h2>
					<span>대중교통 접근성과 식사·관광 동선 모두 우수</span>
				</div>

				<div class="map-surface">
					<div class="map-route"></div>
					<div class="pin pin--center"></div>
					<div class="pin pin--left"></div>
					<div class="pin pin--right"></div>
				</div>
			</section>
		</section>
	</main>
</template>

<style scoped>
.recommend-page {
	width: 100%;
	max-width: 1200px;
	margin: 0 auto;
	padding: 24px 24px 72px;
	box-sizing: border-box;
}

.recommend-layout {
	display: grid;
	grid-template-columns: minmax(300px, 0.95fr) 1.2fr;
	gap: 20px;
}

.control-panel {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.panel-block {
	padding: 20px;
	border-radius: 22px;
	background: #fff;
	border: 1px solid #e2e8f0;
	box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
}

.panel-block--grow {
	flex: 1;
}

.panel-eyebrow {
	margin: 0 0 8px;
	font-size: 0.8rem;
	font-weight: 800;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: #4f46e5;
}

.panel-block h1,
.panel-block h2 {
	margin: 0;
	color: #0f172a;
}

.panel-block h1 {
	font-size: 1.25rem;
	line-height: 1.45;
}

.panel-block h2 {
	font-size: 1rem;
	margin-bottom: 10px;
}

.chip-list {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.chip {
	display: inline-flex;
	align-items: center;
	padding: 8px 12px;
	border-radius: 999px;
	background: #f8fafc;
	color: #334155;
	font-size: 0.9rem;
}

.chip--accent {
	background: #eef2ff;
	color: #4338ca;
}

.place-list {
	display: grid;
	gap: 10px;
}

.place-card {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 12px 14px;
	border-radius: 16px;
	background: #f8fafc;
}

.place-card__tag {
	font-size: 0.75rem;
	font-weight: 700;
	color: #4f46e5;
}

.place-card strong {
	color: #0f172a;
}

.place-card p {
	margin: 0;
	color: #64748b;
	font-size: 0.9rem;
}

.map-panel {
	position: relative;
	min-height: 560px;
	border-radius: 28px;
	overflow: hidden;
	border: 1px solid #e2e8f0;
	background: linear-gradient(135deg, #e2e8f0 0%, #f8fafc 100%);
	box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08);
}

.map-overlay {
	position: absolute;
	left: 20px;
	top: 20px;
	z-index: 2;
	padding: 16px 18px;
	border-radius: 18px;
	background: rgba(255, 255, 255, 0.95);
	border: 1px solid #e2e8f0;
	backdrop-filter: blur(10px);
}

.map-overlay p {
	margin: 0 0 4px;
	font-size: 0.75rem;
	font-weight: 800;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: #4f46e5;
}

.map-overlay h2 {
	margin: 0 0 4px;
	font-size: 1.2rem;
	color: #0f172a;
}

.map-overlay span {
	color: #64748b;
	font-size: 0.9rem;
}

.map-surface {
	position: absolute;
	inset: 0;
	background:
		radial-gradient(circle at 30% 30%, rgba(79, 70, 229, 0.16) 0, rgba(79, 70, 229, 0.16) 14%, transparent 15%),
		radial-gradient(circle at 75% 35%, rgba(129, 140, 248, 0.18) 0, rgba(129, 140, 248, 0.18) 12%, transparent 13%),
		linear-gradient(135deg, #f8fafc 0%, #dbeafe 100%);
}

.map-route {
	position: absolute;
	left: 24%;
	top: 28%;
	width: 52%;
	height: 42%;
	border: 3px dashed #4f46e5;
	border-radius: 999px;
	transform: rotate(-8deg);
}

.pin {
	position: absolute;
	width: 18px;
	height: 18px;
	border-radius: 999px;
	background: #4f46e5;
	box-shadow: 0 0 0 7px rgba(79, 70, 229, 0.18);
}

.pin--center {
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	background: #ef4444;
	box-shadow: 0 0 0 7px rgba(239, 68, 68, 0.18);
}

.pin--left {
	left: 32%;
	top: 40%;
}

.pin--right {
	right: 28%;
	top: 35%;
}

@media (max-width: 1024px) {
	.recommend-layout {
		grid-template-columns: 1fr;
	}

	.map-panel {
		min-height: 440px;
	}
}
</style>
