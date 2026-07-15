<template>
	<footer class="site-footer">
		<div class="site-footer__inner">
			<div>
				<p class="site-footer__title">LocalHub</p>
				<p class="site-footer__text">
					Meet local, fair, and fast.
				</p>
			</div>

			<div class="site-footer__meta">
				<RouterLink :to="{ name: 'home' }">Home</RouterLink>
				<RouterLink :to="{ name: 'map' }">Map</RouterLink>
				<RouterLink :to="{ name: 'recommend' }">Recommend</RouterLink>
				<RouterLink :to="{ name: 'favorites' }">Favorites</RouterLink>
				<RouterLink :to="{ name: 'board' }">Board</RouterLink>
			</div>
		</div>
	</footer>
</template>

<style scoped>
.site-footer {
	border-top: 1px solid var(--border);
	background: var(--bg);
}

.site-footer__inner {
	width: 100%;
	max-width: 1126px;
	margin: 0 auto;
	padding: 28px 32px;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24px;
}

.site-footer__title {
	margin: 0;
	font-size: 0.95rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	color: var(--text-h);
	font-family: var(--font-logo);
}

.site-footer__text {
	margin-top: 6px;
	color: var(--text);
	font-size: 0.92rem;
}

.site-footer__meta {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 12px 18px;
	color: var(--text);
	font-size: 0.9rem;
}

.site-footer__meta a {
	color: var(--text);
	text-decoration: none;
}

.site-footer__meta a:hover,
.site-footer__meta a:focus-visible {
	color: var(--text-h);
}

@media (max-width: 1024px) {
	.site-footer__inner {
		padding: 22px 20px;
		flex-direction: column;
		align-items: flex-start;
	}

	.site-footer__meta {
		justify-content: flex-start;
	}
}
</style>
