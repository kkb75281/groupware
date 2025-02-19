<template lang="pug">
router-view(v-if="loaded")
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { loaded, iwaslogged } from '@/main';
import { user } from '@/user';
import { watch } from 'vue';

const router = useRouter();
const route = useRoute();

watch(loaded, async(nv) => {
    if (!nv) return;

    await router.isReady();

    if(route.name === 'mailing') {
        return;
    }

    if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('OAuth 콜백 처리 중...');
        return;
    }

    if(!iwaslogged.value && Object.keys(user).length === 0) {
        await router.push('/login');
    }
}, { immediate: true });
</script>

<style scoped lang="less">
</style>