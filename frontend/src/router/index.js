import { createRouter, createWebHistory } from 'vue-router'
import KanbanView from '../views/KanbanView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/kanban'
    },
    {
      path: '/kanban',
      name: 'kanban',
      component: KanbanView
    },
    {
      path: '/backlog',
      name: 'backlog',
      component: () => import('../views/BacklogView.vue')
    }
  ]
})

export default router
