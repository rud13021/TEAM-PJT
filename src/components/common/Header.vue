<template>
	<header class="site-header">
		<div class="site-header__inner">
			<a class="site-header__brand" href="#" aria-label="TEAM PJT ME home">
				<span class="site-header__mark">T</span>
				<span class="site-header__text">TEAM-PJT-ME</span>
			</a>

			<nav class="site-header__nav" aria-label="Primary">
				<a href="#">Home</a>
				<a href="#">Map</a>
				<a href="#">Recommend</a>
				<a href="#">Board</a>
				<a href="#">Chat</a>
			</nav>
		</div>
	</header>
</template>

<style scoped>
.site-header {
	border-bottom: 1px solid var(--border);
	background: rgba(255, 255, 255, 0.92);
	backdrop-filter: blur(10px);
}

.site-header__inner {
	width: 100%;
	max-width: 1126px;
	margin: 0 auto;
	padding: 20px 32px;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24px;
}

.site-header__brand {
	display: inline-flex;
	align-items: center;
	gap: 12px;
	color: var(--text-h);
	text-decoration: none;
	font-weight: 700;
	letter-spacing: 0.08em;
}

.site-header__mark {
	width: 36px;
	height: 36px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 12px;
	background: var(--accent-bg);
	color: var(--accent);
	border: 1px solid var(--accent-border);
	font-size: 1rem;
}

.site-header__text {
	font-size: 0.95rem;
}

.site-header__nav {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 18px;
}

.site-header__nav a {
	color: var(--text);
	text-decoration: none;
	font-size: 0.95rem;
	font-weight: 500;
	transition:
		color 0.2s ease,
		opacity 0.2s ease;
}

.site-header__nav a:hover,
.site-header__nav a:focus-visible {
	color: var(--text-h);
	outline: none;
}

@media (max-width: 1024px) {
	.site-header__inner {
		padding: 16px 20px;
		flex-direction: column;
		align-items: flex-start;
	}

	.site-header__nav {
		justify-content: flex-start;
		gap: 14px 18px;
	}
}
</style>
