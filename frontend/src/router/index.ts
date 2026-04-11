import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { guest: true }
    },
    {
      path: '/',
      component: () => import('../views/Dashboard.vue'),
      meta: { auth: true },
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('../views/Home.vue')
        },
        {
          path: 'files',
          name: 'Files',
          component: () => import('../views/Files.vue')
        },
        {
          path: 'apps',
          name: 'Apps',
          component: () => import('../views/Apps.vue')
        },
        {
          path: 'admin',
          name: 'ControlPanel',
          component: () => import('../views/ControlPanel.vue')
        }
      ]
    }
  ]
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  
  if (to.meta.auth && !auth.isAuthenticated) {
    return '/login';
  } else if (to.meta.guest && auth.isAuthenticated) {
    return '/';
  }
});

export default router;
