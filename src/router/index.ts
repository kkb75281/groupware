import { createRouter, createWebHistory } from 'vue-router';
import { user } from '@/user';

import Main from '@/views/Main.vue';
import Dashboard from '@/views/Dashboard.vue';
import Mypage from '@/views/Mypage_edit_myinfo.vue';
import Mypage_list_data from '@/views/Mypage_list_data.vue';
import Profile from '@/views/Profile.vue';
import Admin from '@/views/Admin.vue';
import Admin_main from '@/views/Admin_main.vue';
import Admin_add_employee from '@/views/Admin_add_employee.vue';
import Admin_add_divisions from '@/views/Admin_add_divisions.vue';
import Admin_edit_divisions from '@/views/Admin_edit_divisions.vue';
import Admin_list_divisions from '@/views/Admin_list_divisions.vue';
import List_employee from '@/views/List_employee.vue';
// import Admin_list_employee from '@/views/Admin_list_employee.vue';
// import Employee_list_employee from '@/views/Employee_list_employee.vue';
import Login from '@/views/Login.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/verification',
      name: 'verification',
      component: () => import('@/views/Verification.vue')
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: () => import('@/views/Change_password.vue')
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/Forgot_password.vue')
    },
    {
      path: '/mailing',
      name: 'mailing',
      component: () => import('@/views/Mailing.vue'),
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
          path: '/mypage',
          name: 'mypage',
          component: Mypage,
        },
        {
          path: '/list-data',
          name: 'list-data',
          component: Mypage_list_data,
        },
        {
          path: '/list-employee',
          name: 'list-employee',
          component: List_employee,
        },
        {
          path: '/admin',
          component: Admin_main,
          beforeEnter: (to, from, next) => {
            if (user.access_group > 98) {
              next();
            } else {
              next({ name: 'home' });
            }
          },
          children: [
            {
              path: '/admin',
              name: 'admin-home',
              component: Admin
            },
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
            // {
            //   path: 'list-employee',
            //   name: 'list-employee',
            //   component: Admin_list_employee,
            // },
            {
              path: 'employee-data/:userId',
              name: 'employee-data',
              component: () => import('@/views/Employee_data.vue'),
              props: true,
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
