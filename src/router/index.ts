import { createRouter, createWebHistory } from 'vue-router';
import { user } from '@/user.ts';

import Login from '@/views/Login.vue';
import Main from '@/views/Main.vue';
import Dashboard from '@/views/Dashboard.vue';
import Mypage from '@/views/mypage/Mypage.vue';
import Admin from '@/views/admin/Admin.vue';
import Approval from '@/views/approval/Approval.vue';
import NotFound from '@/views/NotFound.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      beforeEnter: (to, from, next) => {
        // console.log('beforeEnter for /login', { user });
        if (Object.keys(user).length) {
          next({ name: 'home' });
          return;
        }
        next();
      },
      name: 'login',
      component: Login
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
      component: () => import('@/views/Mailing.vue')
    },
    // {
    // 	path: '/notification-permission',
    // 	name: 'notification-permission',
    // 	component: () => import('@/views/Notification_permission.vue'),
    // },
    {
      path: '/',
      beforeEnter: (to, from, next) => {
        if (!Object.keys(user).length) {
          next({ name: 'login' });
          return;
        }
        next();
      },
      component: Main,
      children: [
        {
          path: '/',
          name: 'home',
          component: Dashboard
        },
        {
          path: '/organigram',
          name: 'organigram',
          component: () => import('@/views/Organ.vue')
        },
        {
          path: '/newsletter',
          name: 'newsletter',
          component: () => import('@/views/Newsletter.vue')
        },
        {
          path: '/newsletter-add',
          name: 'newsletter-add',
          component: () => import('@/views/Newsletter_add.vue')
        },
        {
          path: '/newsletter-detail/:messageId',
          name: 'newsletter-detail',
          component: () => import('@/views/Newsletter_detail.vue')
        },
        // {
        //   path: '/list-data',
        //   name: 'list-data',
        //   component: Mypage_list_data,
        // },
        {
          path: '/list-employee',
          name: 'list-employee',
          component: () => import('@/views/List_employee.vue') // List_employee,
        },
        {
          path: '/detail-employee/:userId',
          name: 'detail-employee',
          component: () => import('@/views/List_detail_employee.vue') // List_detail_employee,
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
              path: 'request-list',
              name: 'request-list',
              component: () => import('@/views/approval/Approval_request_list.vue')
            },
            {
              path: 'request-audit',
              name: 'request-audit',
              component: () => import('@/views/approval/Approval_request_audit.vue') // Approval_request_audit,
              // component: () => import('@/views/approval/Approval_request_audit_qb.vue'), // Approval_request_audit,
            },
            {
              path: 'audit-list',
              name: 'audit-list',
              component: () => import('@/views/approval/Approval_audit_list.vue')
            },
            {
              path: 'audit-reference',
              name: 'audit-reference',
              component: () => import('@/views/approval/Approval_audit_list.vue')
            },
            {
              path: 'audit-list-favorite',
              name: 'audit-list-favorite',
              component: () => import('@/views/approval/Approval_audit_list.vue') // 즐겨찾기한 결재 리스트
            },
            {
              path: 'audit-detail/:auditId',
              name: 'audit-detail',
              component: () => import('@/views/approval/Approval_audit_detail.vue')
            },
            {
              path: 'audit-detail-reference/:auditId',
              name: 'audit-detail-reference',
              component: () => import('@/views/approval/Approval_audit_detail.vue')
            },
            {
              path: 'audit-detail-favorite/:auditId',
              name: 'audit-detail-favorite',
              component: () => import('@/views/approval/Approval_audit_detail.vue')
            },
            {
              path: 'audit-list-tempsave',
              name: 'audit-list-tempsave',
              component: () => import('@/views/approval/Approval_tempsave_list.vue')
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
              component: () => import('@/views/mypage/Mypage_edit_myinfo.vue') // Mypage_edit_myinfo,
            },
            {
              path: 'edit-mystamp',
              name: 'edit-mystamp',
              component: () => import('@/views/mypage/Mypage_edit_mystamp.vue')
            },
            // {
            // 	path: 'edit-myfile',
            // 	name: 'edit-myfile',
            // 	component: () => import('@/views/mypage/Mypage_edit_myfile.vue'),
            // },
            {
              path: 'record-commute',
              name: 'record-commute',
              component: () => import('@/views/mypage/Mypage_record_commute.vue') // Mypage_record_commute,
            }
          ]
        },
        {
          path: '/admin',
          beforeEnter: (to, from, next) => {
            if (user.access_group > 98) {
              next();
              return;
            }
            next({ name: 'home' });
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
              component: () => import('@/views/admin/Admin_add_employee.vue') // Admin_add_employee,
            },
            {
              path: 'add-divisions',
              name: 'add-divisions',
              component: () => import('@/views/admin/Admin_add_divisions.vue') // Admin_add_divisions,
            },
            {
              path: 'edit-divisions',
              name: 'edit-divisions',
              component: () => import('@/views/admin/Admin_edit_divisions.vue') //Admin_edit_divisions,
            },
            {
              path: 'list-divisions',
              name: 'list-divisions',
              component: () => import('@/views/admin/Admin_list_divisions.vue')
            },
            {
              path: 'list-commute',
              name: 'list-commute',
              component: () => import('@/views/admin/Admin_list_commute.vue') //Admin_list_commute,
            },
            {
              path: '/commute-detail/:userId',
              name: 'commute-detail',
              component: () => import('@/views/admin/Admin_commute_detail.vue') //Admin_commute_detail,
            },
            {
              path: 'edit-worktime',
              name: 'edit-worktime',
              component: () => import('@/views/admin/Admin_edit_worktime.vue') // Admin_edit_worktime,
            },
            {
              path: 'list-form',
              name: 'list-form',
              component: () => import('@/views/admin/Admin_list_form.vue') // 마스터가 올린 결재 양식 리스트,
            },
            {
              path: 'form-detail',
              name: 'form-detail',
              component: () => import('@/views/admin/Admin_form_detail.vue') // 마스터가 올린 결재 양식 리스트 상세,
            }
          ]
        },
        {
          path: '/component',
          name: 'component',
          component: () => import('../components/component.vue')
        },
        {
          path: '/test',
          name: 'test',
          component: () => import('../components/test.vue')
        }
      ]
    },

    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // }

    // 404 page
    {
      path: '/404page',
      name: '404page',
      component: NotFound
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404page'
    }
  ]
});

export default router;
