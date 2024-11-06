<template lang="pug">
h1 부서(회사) 목록

br
hr
br


</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import { skapi } from '@/main';

const router = useRouter();
const route = useRoute();
</script>

<style scoped lang="less">

</style>