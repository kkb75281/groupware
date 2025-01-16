<template lang="pug">
ul.card-wrap
    li.card
        router-link.router(to="/mypage/edit-myinfo")
            .icon.img
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-edit")
            h4.name 회원 정보 수정
            .btn-wrap
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

    li.card
        router-link.router(to="/mypage/edit-mystamp")
            .icon.img
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-stamp")
            h4.name 도장 관리
            .btn-wrap
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
    
    li.card
        router-link.router(to="/mypage/record-commute")
            .icon.img
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-work-history")
            h4.name 근퇴 관리
            .btn-wrap
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

    li.card
        router-link.router(to="/change-password")
            .icon.img
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-password")
            h4.name 비밀번호 변경
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