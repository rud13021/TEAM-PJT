<template>
	<footer class="site-footer">
		<div class="site-footer__inner">
			<div>
				<p class="site-footer__title">TEAM-PJT-ME</p>
				<p class="site-footer__text">
					Static common layout for the Vue migration start.
				</p>
			</div>

			<div class="site-footer__meta">
				<span>Home</span>
				<span>Map</span>
				<span>Recommend</span>
				<span>Board</span>
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
