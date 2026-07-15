import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import RecommendView from '../views/RecommendView.vue'
import GroupView from '../views/GroupView.vue'
import BoardView from '../views/BoardView.vue'
import BoardDetailView from '../views/BoardDetailView.vue'
import BoardWriteView from '../views/BoardWriteView.vue'
import ChatView from '../views/ChatView.vue'
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
			path: '/map',
			name: 'map',
			component: RecommendView,
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
			path: '/board',
			name: 'board',
			component: BoardView,
		},
		{
			path: '/board/write',
			name: 'board-write',
			component: BoardWriteView,
		},
		{
			path: '/board/:id',
			name: 'board-detail',
			component: BoardDetailView,
			props: true,
		},
		{
			path: '/chat',
			name: 'chat',
			component: ChatView,
		},
		{
			path: '/:pathMatch(.*)*',
			name: 'not-found',
			component: NotFoundView,
		},
	],
})

export default router
