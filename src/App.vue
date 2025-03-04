<template lang="pug">
div(v-if='!loaded' style='display: flex;align-items: center;justify-content: center;height: 100vh;position: fixed;width: 100%;')
    Loading
router-view(v-else)
</template>

<script setup>
import { loaded } from '@/main'
import Loading from '@/components/loading.vue';
</script>