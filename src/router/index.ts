import { createRouter, createWebHistory } from 'vue-router';
import Main from '@/views/Main.vue';
import Dashboard from '@/views/Dashboard.vue';
import Admin from '@/views/Admin.vue';
import Profile from '@/views/Profile.vue';
import Admin_member from '@/views/Admin_member.vue';
import Admin_company from '@/views/Admin_company.vue';
import Admin_list from '@/views/Admin_list.vue';
import Login from '@/views/Login.vue';
import Forgot_password from '@/views/Forgot_password.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/forgot',
      name: 'forgot',
      component: Forgot_password,
    },
    {
      path: '/',
      component: Main,
      children: [
        {
          path: '/',
          name: 'home',
          component: Dashboard,
        },
        {
          path: 'admin',
          name: 'admin',
          component: Admin,
          children: [
            {
              path: 'member',
              name: 'member',
              component: Admin_member,
            },
            {
              path: 'company',
              name: 'company',
              component: Admin_company,
            },
            {
              path: 'list',
              name: 'list',
              component: Admin_list,
            },
          ],
        },
        {
          path: '/profile',
          name: 'profile',
          component: Profile,
        },
        {
          path: '/component',
          name: 'component',
          component: () => import('../components/component.vue'),
        },
      ],
    },

    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // }
  ],
});

export default router;
