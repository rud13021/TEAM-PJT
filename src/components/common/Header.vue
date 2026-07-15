<template>
	<header class="site-header">
		<div class="site-header__inner">
			<RouterLink class="site-header__brand" :to="{ name: 'home' }" aria-label="LocalHub home">
				<span class="site-header__mark">L</span>
				<span class="site-header__text">LocalHub</span>
			</RouterLink>

			<nav class="site-header__nav" aria-label="Primary">
				<RouterLink class="site-header__nav-link" :to="{ name: 'home' }" active-class="site-header__nav-link--active" exact-active-class="site-header__nav-link--active">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-10.2Z"/></svg>
					<span>Home</span>
				</RouterLink>
				<RouterLink class="site-header__nav-link" :to="{ name: 'map' }" active-class="site-header__nav-link--active">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C7.6 2 4 5.5 4 9.8c0 5.7 6.8 11.7 7.1 12 .5.4 1.3.4 1.8 0 .3-.3 7.1-6.3 7.1-12C20 5.5 16.4 2 12 2Zm0 10.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>
					<span>Map</span>
				</RouterLink>
				<RouterLink class="site-header__nav-link" :to="{ name: 'recommend' }" active-class="site-header__nav-link--active">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 2.9 5.9 6.5 1-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 9l6.5-1L12 2Z"/></svg>
					<span>Recommend</span>
				</RouterLink>
				<RouterLink class="site-header__nav-link" :to="{ name: 'favorites' }" active-class="site-header__nav-link--active">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35 10.55 20.03C5.4 15.36 2 12.27 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.04 6.04 0 0 1 16.5 3 5.5 5.5 0 0 1 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35Z"/></svg>
					<span>Favorites</span>
				</RouterLink>
				<RouterLink class="site-header__nav-link" :to="{ name: 'board' }" active-class="site-header__nav-link--active">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8l-5 2V6a2 2 0 0 1 2-2Zm3 4h8v2H8V8Zm0 4h8v2H8v-2Z"/></svg>
					<span>Board</span>
				</RouterLink>
				<RouterLink class="site-header__nav-link" :to="{ name: 'chat' }" active-class="site-header__nav-link--active">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm3 5h10v2H7V9Zm0 4h7v2H7v-2Z"/></svg>
					<span>Chat</span>
				</RouterLink>
			</nav>

			<div class="site-header__spacer" aria-hidden="true"></div>
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
	justify-content: center;
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
	min-width: 172px;
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
	font-family: var(--font-logo);
}

.site-header__text {
	font-size: 0.95rem;
	font-family: var(--font-logo);
	letter-spacing: 0.04em;
}

.site-header__nav {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 12px;
}

.site-header__spacer {
	min-width: 172px;
}

.site-header__nav-link {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	border-radius: 999px;
	color: var(--text);
	text-decoration: none;
	font-size: 0.9rem;
	font-weight: 500;
	transition:
		color 0.2s ease,
		opacity 0.2s ease,
		background 0.2s ease;
}

.site-header__nav-link svg {
	width: 15px;
	height: 15px;
	fill: currentColor;
}

.site-header__nav-link:hover,
.site-header__nav-link:focus-visible {
	color: var(--text-h);
	background: rgba(37, 99, 235, 0.08);
	outline: none;
}

.site-header__nav-link--active {
	color: var(--text-h);
	font-weight: 700;
	background: rgba(14, 165, 233, 0.14);
}

@media (max-width: 1024px) {
	.site-header__inner {
		padding: 16px 20px;
		flex-direction: column;
		align-items: center;
	}

	.site-header__nav {
		justify-content: center;
		gap: 10px;
	}

	.site-header__spacer {
		display: none;
	}

	.site-header__brand {
		min-width: 0;
	}
}
</style>
