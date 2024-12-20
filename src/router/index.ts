import { createRouter, createWebHistory } from 'vue-router';
import { loaded } from '@/main';
import { user } from '@/user';

import Login from '@/views/Login.vue';
import Change_password from '@/views/Change_password.vue';
import Profile from '@/views/Profile.vue';
import Main from '@/views/Main.vue';
import Dashboard from '@/views/Dashboard.vue';
import List_employee from '@/views/List_employee.vue';
import List_detail_employee from '@/views/List_detail_employee.vue';
import Mypage from '@/views/mypage/Mypage.vue';
import Mypage_edit_myinfo from '@/views/mypage/Mypage_edit_myinfo.vue';
import Mypage_edit_mystamp from '@/views/mypage/Mypage_edit_mystamp.vue';
import Mypage_list_data from '@/views/_backup/Mypage_list_data.vue';
import Admin from '@/views/admin/Admin.vue';
import Admin_add_employee from '@/views/admin/Admin_add_employee.vue';
import Admin_add_divisions from '@/views/admin/Admin_add_divisions.vue';
import Admin_edit_divisions from '@/views/admin/Admin_edit_divisions.vue';
import Admin_list_divisions from '@/views/admin/Admin_list_divisions.vue';
import Approval from '@/views/approval/Approval.vue';
import Approval_request_audit from '@/views/approval/Approval_request_audit.vue';
import Approval_audit_list from '@/views/approval/Approval_audit_list.vue';

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
          path: '/detail-employee/:userId',
          name: 'detail-employee',
          component: List_detail_employee,
        },
        {
          path: '/approval',
          children: [
            {
              path: '/approval',
              name: 'approval',
              component: Approval
            },
            {
              path: 'request-audit',
              name: 'request-audit',
              component: Approval_request_audit
            },
            {
              path: 'audit-list',
              name: 'audit-list',
              component: Approval_audit_list
            }
          ]
        },
        {
          path: '/mypage',
          children: [
            {
              path: '/mypage',
              name: 'mypage',
              component: Mypage
            },
            {
              path: 'edit-myinfo',
              name: 'edit-myinfo',
              component: Mypage_edit_myinfo,
            },
            {
                path: 'edit-mystamp',
                name: 'edit-mystamp',
                component: Mypage_edit_mystamp,
            },
          ]
        },
        {
          path: '/admin',
          beforeEnter: async(to, from, next) => {
            if (user.access_group > 98) {
              next();
            } else {
              next({ name: 'home' });
            }
          },
          children: [
            {
              path: '/admin',
              name: 'admin',
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
            // {
            //   path: 'employee-data/:userId',
            //   name: 'employee-data',
            //   component: () => import('@/views/Employee_data.vue'),
            //   props: true,
            // },
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
