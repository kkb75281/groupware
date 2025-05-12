<template lang="pug">
#main-nav
	Navbar(:menuList="currentMenuList")
	.main-nav-wrap
		router-view
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, watch, computed, nextTick } from 'vue';
import { user } from '@/user.ts';

import Navbar from '@/components/navbar.vue';

const router = useRouter();
const route = useRoute();

let routePath = ref('');
let currentMenuList = ref(null);
let isadmin = computed(() => user.access_group > 98);

let menuLists = {
  commute: [
    {
      show: true,
      text: '출퇴근 관리',
      name: 'commute-record',
      icon: '#icon-work-history',
      to: '/commute/commute-record'
    }
    // {
    //     show: true,
    //     text: '연차 관리',
    //     name: 'commute-year',
    //     icon: '#icon-clock',
    //     to: '/commute/commute-year'
    // }
  ],
  approval: [
    {
      show: true,
      text: '결재 작성',
      name: 'request-audit',
      icon: '#icon-edit',
      to: '/approval/request-audit'
    },
    {
      show: true,
      text: '결재 발신함',
      name: 'request-list',
      icon: '#icon-outbox',
      to: '/approval/request-list',
      child: ['audit-detail']
    },
    {
      show: true,
      text: '임시 저장함',
      name: 'audit-list-tempsave',
      icon: '#icon-outbox',
      to: '/approval/audit-list-tempsave'
    },
    {
      show: true,
      text: '결재 수신함',
      name: 'audit-list',
      icon: '#icon-inbox',
      to: '/approval/audit-list',
      child: ['audit-detail']
    },
    {
      show: true,
      text: '수신 참조함',
      name: 'audit-reference',
      icon: '#icon-tag',
      to: '/approval/audit-reference',
      child: ['audit-detail-reference']
    },
    {
      show: true,
      text: '중요 결재함',
      name: 'audit-list-favorite',
      icon: '#icon-star',
      to: '/approval/audit-list-favorite',
      child: ['audit-detail-favorite']
    }
  ],
  admin: [
    {
      show: isadmin.value,
      text: '부서 관리',
      name: 'list-divisions',
      icon: '#icon-hive',
      to: '/admin/list-divisions',
      child: ['add-divisions']
    },
    {
      show: isadmin.value,
      text: '직원 관리',
      name: 'list-employee',
      icon: '#icon-groups',
      to: '/list-employee'
      // detail: {
      // 	show: true,
      // 	name: 'detail-employee',
      // 	to: '/detail-employee',
      // }
    },
    {
      show: isadmin.value,
      text: '근태 관리',
      name: 'list-commute',
      icon: '#icon-clock',
      to: '/admin/list-commute',
      child: ['edit-worktime', 'commute-detail']
    },
    {
      show: isadmin.value,
      text: '결재양식 관리',
      name: 'list-form',
      icon: '#icon-docs',
      to: '/admin/list-form',
      child: ['form-detail']
    },
    {
      show: isadmin.value,
      text: '공지사항 관리',
      name: 'list-newsletter',
      icon: '#icon-noti',
      to: '/admin/list-newsletter',
      child: ['news-setting-detail']
    }
  ]
};

watch(
  () => route.path,
  (nv) => {
    routePath.value = nv.split('/')[1];
  },
  { immediate: true }
);

watch(
  routePath,
  (nv) => {
    if (nv) {
      currentMenuList.value = menuLists[nv];
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="less">
#main-nav {
  width: 100%;
  // display: flex;
  // flex-wrap: nowrap;

  .main-nav-wrap {
    flex-grow: 1;
    padding: 2rem;
    padding-left: 130px;
  }
}

@media (max-width: 768px) {
  #main-nav {
    .main-nav-wrap {
      padding: 1rem;
    }
  }
}
</style>
