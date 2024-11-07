<template lang="pug">
router-view(v-if="loaded")
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import { user, updateUser } from '@/user'

import Login from '@/views/Login.vue';

const router = useRouter();
const route = useRoute();

let loaded = ref(false);

updateUser().then(r => {
	if (!Object.keys(user).length) {
		router.push('/login');
	}
}).finally(() => {
    loaded.value = true;
});
</script>

<style scoped lang="less">
</style>