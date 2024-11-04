<template lang="pug">
nav#nav
    ul
        //- li.prof
        //-     router-link(to="/profile")
        li.menu
            router-link(to="/") Home
        li.menu
            router-link(to="/admin") Admin
div(:style="{ marginLeft: `${navWidth}px` }")
    router-view
</template>

<script setup lang="ts">
// import Nav from "@/components/Nav.vue"

import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref, computed, watch } from 'vue';

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
nav {
    position: fixed;
    top: 0;
    height: 100%;
    padding: 1.3rem;

    ul {
        padding: 0;
        margin: 0;

        li {
            list-style: none;
            margin-bottom: 1rem;

            &.prof {
                width: 40px;
                height: 40px;
                margin: 0 auto;
                margin-bottom: 1rem;
                border-radius: 50%;
                background-color: #fff;
                cursor: pointer;
            }

            a {
                text-decoration: none;
                color: #000;
            }
        }
    }
}
</style>