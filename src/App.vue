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

let isRefreshing = false;

// document.addEventListener('touchstart', (e) => {
//     const startY = e.touches[0].pageY;
//     document.addEventListener('touchmove', onTouchMove);
//     document.addEventListener('touchend', onTouchEnd);

//     function onTouchMove(e) {
//         const currentY = e.touches[0].pageY;
//         if (currentY - startY > 100 && !isRefreshing) {
//             isRefreshing = true;
//             refreshPage();
//         }
//     }

//     function onTouchEnd() {
//         document.removeEventListener('touchmove', onTouchMove);
//         document.removeEventListener('touchend', onTouchEnd);
//     }
// });

function refreshPage() {
    window.location.reload();
}

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

// watch(user, (nv, ov) => {
// 	if(nv && ov && nv.user_id !== ov.user_id) {
// 		sessionStorage.removeItem('accessToken');
// 	}
// })
</script>

<style scoped lang="less">
</style>