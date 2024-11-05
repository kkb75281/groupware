<template lang="pug">
main#main
  h1 안녕하세요. 메인입니다.
  Component
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import Component from '@/components/component.vue';

const router = useRouter();
const route = useRoute();
</script>

<style scoped lang="less">
#main {
    padding-top: var(--header-height);
    padding-left: var(--navbar-width);
    transition: padding-left 0.15s linear;
}
</style>