<template lang="pug">
//- nav#navbar
//-     ul
//-         li.prof
//-             router-link(to="/profile")
//-         li.menu
//-             router-link(to="/") Home
//-         li.menu
//-             router-link(to="/admin") Admin
nav#navbar
    .navbar-wrap
        .logo

        ul.menu-item
            li
                a.item
                    i.icon
                    span.text Admin
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
</script>

<style scoped lang="less">
#navbar {
    width: var(--navbar-width);
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    overflow-y: overlay;
    background-color: rgb(193, 225, 193);
    z-index: 100;
    transition: width 0.15s linear;

    .navbar-wrap {
        overflow: hidden;
        color: var(--gray-color-600);
    }
}
</style>