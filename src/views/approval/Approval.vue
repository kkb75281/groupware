<template lang="pug">
ul.card-wrap
    li.card
        router-link.router(to="/approval/request-audit")
            .icon.img
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-edit")
            h4.name 결재 요청
            .btn-wrap
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

    li.card
        router-link.router(to="/approval/audit-list")
            .icon.img
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-stamp")
            h4.name 결재 목록
            .btn-wrap
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

</script>

<style scoped lang="less">

</style>