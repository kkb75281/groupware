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

let isadmin = user.access_group > 98;
let onlyAdminRoute = ['admin', 'add-employee', 'add-divisions', 'edit-divisions', 'list-divisions']

watch(loaded, async(nv) => {
    if (!nv) return;

    await router.isReady();

    // if(route.name === 'mailing' && (iwaslogged.value || !iwaslogged.value)) { <- 참이거나 || 아니거나 조건이 의미없음
    if(route.name === 'mailing') {
        return;
    }

    // if(nv && iwaslogged.value && onlyAdminRoute.includes(route.name) && !isadmin) {
    //     await router.push('/');
    // }

    if(!iwaslogged.value && Object.keys(user).length === 0) {
        await router.push('/login');
    }
}, { immediate: true });
</script>

<style scoped lang="less">
</style>