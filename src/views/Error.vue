<template lang="pug">
.error
    h4.title 요청하신 페이지 및 주소를 찾을 수 없습니다.
    p.desc URL을 확인하고 다시 시도해 주세요.

    .btn-wrap
        .btn
            router-link(to="/") 홈으로
</template>

<script setup>
import { ref } from 'vue';
import Loading from '@/components/loading.vue';
</script>