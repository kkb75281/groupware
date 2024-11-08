<template lang="pug">
.wrap
    h1.title 대시보드

    hr

    ul.card-wrap
        li.card
            h4.name 메일
            router-link.router(to="/")
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
        li.card
            h4.name 메일
            router-link.router(to="/")
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
        li.card
            h4.name 메일
            router-link.router(to="/")
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import Component from '@/components/component.vue';

const router = useRouter();
const route = useRoute();
</script>

<style scoped lang="less">
    .card-wrap {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
    }

    .card {
            background-color: #fff;
            box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.05);
            border-radius: 16px;
            padding: 1.2rem;

            .name {
                font-size: 1rem;
                font-weight: 700;
                text-align: center;
            }

            .router {
                display: flex;
                justify-content: center;
                align-items: center;
                margin-top: 2rem;
                gap: 4px;
                color: var(--gray-color-500);
            }

            .btn-go {
                font-size: 0.8rem;
                font-weight: 500;
            }

            .icon {
                padding: 0;

                svg {
                    width: 16px;
                    height: 16px;
                    fill: var(--gray-color-500);
                }
            }
        }
</style>