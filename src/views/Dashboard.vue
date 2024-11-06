<template lang="pug">
h1 안녕하세요. 메인입니다.
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import Component from '@/components/component.vue';

const router = useRouter();
const route = useRoute();
</script>

<style scoped lang="less">

</style>