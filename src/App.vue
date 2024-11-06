<template lang="pug">
Login
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref, computed, watch } from 'vue';
import Login from '@/views/Login.vue';

const router = useRouter();
const route = useRoute();

</script>

<style scoped lang="less">
</style>