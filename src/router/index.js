import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import RecommendView from '../views/RecommendView.vue'
import GroupView from '../views/GroupView.vue'
import NotFoundView from '../views/NotFoundView.vue'

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			name: 'home',
			component: HomeView,
		},
		{
			path: '/recommend',
			name: 'recommend',
			component: RecommendView,
		},
		{
			path: '/group',
			name: 'group',
			component: GroupView,
		},
		{
			path: '/:pathMatch(.*)*',
			name: 'not-found',
			component: NotFoundView,
		},
	],
})

export default router
