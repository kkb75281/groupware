<template lang="pug">
Layout
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref, computed, watch } from 'vue';
import Layout from '@/components/layout.vue';

const router = useRouter();
const route = useRoute();

let navWidth = ref(0);

onMounted(() => {
    let navEl = document.getElementById('nav');
    
    if (navEl) {
        navWidth.value = navEl.offsetWidth;

        // Adjust width on window resize
        window.addEventListener('resize', () => {
            navWidth.value = navEl.offsetWidth;
        });
    }
});
</script>

<style scoped lang="less">
</style>