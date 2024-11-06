<template lang="pug">
router-view
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref, computed, watch } from 'vue';
import { updateUser, loginState } from '@/user'

import Layout from '@/components/layout.vue';
import Login from '@/views/Login.vue';

const router = useRouter();
const route = useRoute();

updateUser();

watch(loginState, (n) => {
	if(!n) {
		router.push('/login');
	}
}, { immediate: true });
</script>

<style scoped lang="less">
</style>