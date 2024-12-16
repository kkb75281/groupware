<template lang="pug">
ul.card-wrap
    li.card
        router-link.router(to="/")
            .icon.img
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-mail")
            h4.name 메일
            .btn-wrap
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
    li.card
        router-link.router(to="/")
            .icon.img
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-mail")
            h4.name 메일
            .btn-wrap
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
    li.card
        router-link.router(to="/")
            .icon.img
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-mail")
            h4.name 메일
            .btn-wrap
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
.wrap {
    padding: 3rem 2.4rem 0;
}

.fold {
    .wrap {
        padding: 3rem 2.4rem 0;
    }
}

.card-wrap {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
}

.card {
    .router {
        display: block;
        background-color: #fff;
        box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.05);
        border-radius: 16px;
        padding: 2.5rem 1.2rem 1.5rem;
        transition: all 0.2s ease-in-out;

        &:hover {
            transform: translateY(-6px);
            box-shadow: 1px 1px 10px rgba(72, 127, 242, 0.5);
        }
    }

    .name {
        font-size: 1.2rem;
        font-weight: 700;
        text-align: center;
        margin-top: 1.2rem;
    }

    .btn-wrap {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 2rem;
        gap: 4px;
        color: var(--gray-color-500);
        border-top: 1px solid var(--gray-color-100);
        padding-top: 1.5rem;
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

        &.img {
            text-align: center;

            svg {
                width: 50px;
                height: 50px;
                margin: 0 auto;
            }
        }
    }
}

@media (max-width: 1200px) {
    .wrap {
        padding-top: 3rem;
    }
}
</style>