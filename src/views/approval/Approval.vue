<template lang="pug">
Navbar(:menuList="menuList")
#main-approval
	router-view

</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import Navbar from '@/components/navbar.vue';

const router = useRouter();
const route = useRoute();

let menuList = [
	{
		show: true,
		text: '결재 작성',
		icon: '#icon-edit',
		to: '/approval/request-audit'
	},
	{
		show: true,
		text: '결재 발신함',
		icon: '#icon-outbox',
		to: '/approval/request-list'
	},
	{
		show: true,
		text: '결재 수신함',
		icon: '#icon-inbox',
		to: '/approval/audit-list'
	},
	{
		show: true,
		text: '수신 참조함',
		icon: '#icon-tag',
		to: '/approval/audit-reference'
	},
	{
		show: true,
		text: '중요 결재함',
		icon: '#icon-star',
		to: '/approval/audit-list-favorite'
	}
];
</script>

<style scoped lang="less">
#main-approval {
	padding-left: var(--navbar-width);
}
</style>