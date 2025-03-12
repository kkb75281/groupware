<template lang="pug">
ul.card-wrap
    li.card
        router-link.router(to="/admin/list-divisions")
            .icon.img
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-view-list")
            h4.name 부서 관리
            .btn-wrap
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
    li.card
        router-link.router(to="/list-employee")
            .icon.img
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-groups")
            h4.name 직원 관리
            .btn-wrap
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

    li.card
        router-link.router(to="/admin/list-commute")
            .icon.img
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-work-history")
            h4.name 근태 관리
            .btn-wrap
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

    li.card
        router-link.router(to="/admin/list-form")
            .icon.img
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-file")
            h4.name 결재 양식 관리
            .btn-wrap
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
</script>

<style scoped lang="less">

</style>