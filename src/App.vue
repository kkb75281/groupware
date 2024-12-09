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

watch(loaded, (nv) => {
    if(nv && !iwaslogged.value && !Object.keys(user).length) {
        if(route.name === 'mailing') {
            console.log('mailing');
            return;
        } else {
            router.push('/login');
        }
    }
}, { immediate: true });
</script>

<style scoped lang="less">
</style>