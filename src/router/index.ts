import { createRouter, createWebHistory } from 'vue-router';
import { skapi } from '@/main';

import Main from '@/views/Main.vue';
import Dashboard from '@/views/Dashboard.vue';
import Admin from '@/views/Admin.vue';
import Profile from '@/views/Profile.vue';
import Admin_add_employee from '@/views/Admin_add_employee.vue';
import Admin_add_divisions from '@/views/Admin_add_divisions.vue';
import Admin_edit_divisions from '@/views/Admin_edit_divisions.vue';
import Admin_list_divisions from '@/views/Admin_list_divisions.vue';
import Login from '@/views/Login.vue';
import Forgot_password from '@/views/Forgot_password.vue';

let checkUser = async (t, f, n) => {
  let u = await skapi.getProfile();
  if (u) return n();
  n('/login');
};

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
      beforeEnter: checkUser,
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
              path: 'add-employee',
              name: 'add-employee',
              component: Admin_add_employee,
            },
            {
              path: 'add-divisions',
              name: 'add-divisions',
              component: Admin_add_divisions,
            },
            {
              path: 'edit-divisions',
              name: 'edit-divisions',
              component: Admin_edit_divisions,
            },
            {
              path: 'list-divisions',
              name: 'list-divisions',
              component: Admin_list_divisions,
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
        {
          path: '/mailing',
          name: 'mailing',
          component: () => import('../views/Mailing.vue'),
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
