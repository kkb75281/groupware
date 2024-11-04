<template lang="pug">
nav#mainNav
    ul
        li.prof
            router-link(to="/profile")
        li.menu
            router-link(to="/") Home
        li.menu
            router-link(to="/admin") Admin
nav#subNav
    ul
        li
            button 직원등록
        li
            button 부서(회사) 등록
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
</script>

<style scoped lang="less">
nav {
    position: fixed;
    top: 0;
    height: 100%;
    padding: 1.2rem;
    background-color: #EFF0F6;

    &#mainNav {
        left: 0;
    }
    &#subNav {
        right: 0;
    }

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