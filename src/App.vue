<template lang="pug">
template(v-if="loginState")
    Layout
template(v-else) login page
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref, computed, watch } from 'vue';
import { loginState } from '@/main'

import Layout from '@/components/layout.vue';
import Login from '@/views/Login.vue';

const router = useRouter();
const route = useRoute();

</script>

<style scoped lang="less">
</style>