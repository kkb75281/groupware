<template lang="pug">
ul.card-wrap
	li.card
		router-link.router(to="/approval/request-audit")
			.icon.img
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-edit")
			h4.name 결재 작성
			.btn-wrap
				p.btn-go 바로가기
				.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

	li.card
		router-link.router(to="/approval/audit-list")
			.icon.img
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-inbox")
			h4.name 결재 수신함
			.btn-wrap
				p.btn-go 바로가기
				.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

	li.card
		router-link.router(to="/approval/request-list")
			.icon.img
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-outbox")
			h4.name 결재 발신함
			.btn-wrap
				p.btn-go 바로가기
				.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

	li.card
		router-link.router(to="/approval/audit-reference")
			.icon.img
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-tag")
			h4.name 수신참조
			.btn-wrap
				p.btn-go 바로가기
				.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

	li.card
		router-link.router(to="/approval/audit-list-favorite")
			.icon.img
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-star")
			h4.name 중요메일
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