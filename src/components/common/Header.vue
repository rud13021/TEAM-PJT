<template>
	<header class="site-header">
		<div class="site-header__inner">
			<RouterLink class="site-header__brand" :to="{ name: 'home' }" aria-label="TEAM PJT ME home">
				<span class="site-header__mark">T</span>
				<span class="site-header__text">TEAM-PJT-ME</span>
			</RouterLink>

			<nav class="site-header__nav" aria-label="Primary">
				<RouterLink class="site-header__nav-link" :to="{ name: 'home' }" active-class="site-header__nav-link--active" exact-active-class="site-header__nav-link--active">Home</RouterLink>
				<RouterLink class="site-header__nav-link" :to="{ name: 'map' }" active-class="site-header__nav-link--active">Map</RouterLink>
				<RouterLink class="site-header__nav-link" :to="{ name: 'recommend' }" active-class="site-header__nav-link--active">Recommend</RouterLink>
				<RouterLink class="site-header__nav-link" :to="{ name: 'board' }" active-class="site-header__nav-link--active">Board</RouterLink>
				<RouterLink class="site-header__nav-link" :to="{ name: 'chat' }" active-class="site-header__nav-link--active">Chat</RouterLink>
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

.site-header__nav-link {
	color: var(--text);
	text-decoration: none;
	font-size: 0.95rem;
	font-weight: 500;
	transition:
		color 0.2s ease,
		opacity 0.2s ease;
}

.site-header__nav-link:hover,
.site-header__nav-link:focus-visible {
	color: var(--text-h);
	outline: none;
}

.site-header__nav-link--active {
	color: var(--text-h);
	font-weight: 700;
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
