import { createRouter, createWebHistory } from 'vue-router';
import Main from '@/views/Main.vue';
import Admin from '@/views/Admin.vue';
import Profile from '@/views/Profile.vue';
import Admin_member from '@/views/Admin_member.vue';
import Admin_company from '@/views/Admin_company.vue';
import Admin_list from '@/views/Admin_list.vue';
import Login from '@/views/Login.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Main,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/admin',
      name: 'admin',
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
    // {
    //     path: '/admin/member',
    //     name: 'member',
    //     component: Admin_resi_member
    // },
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
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
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
