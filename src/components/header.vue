<template lang="pug">
header#header
	button.mo-navbar

	button.btn-noti(type="button" data-count="9999")
		i.icon
	.notification

	button.btn-profile(type="button")
		span.user-name 사용자
		span.hello 님, 안녕하세요!
		.thumbnail
			img(scr="https://placeimg.com/100/100/people" alt="img-profile")
</template>

<script setup lang="ts">

</script>

<style scoped lang="less">
#header {
	width: 100%;
	height: var(--header-height);
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background-color: #fff;
	background-color: #b59595;
	display: flex;
	justify-content: flex-end;
	align-items: center;
	padding: 0 3rem 0 var(--navbar-width);
	transition: padding 0.15s linear;

	.btn-noti {
		width: 2.875rem;
		height: 2.875rem;
		background-color: var(--primary-color-100);
		position: relative;
		margin-right: 2rem;
		border-radius: 0.5rem;

		&::after {
			content: attr(data-count);
			display: inline-block;
			position: absolute;
			top: -0.5rem;
			right: -1rem;
			min-width: 1.625rem;
			height: 1.625rem;
			line-height: 1.625rem;
			font-size: 0.875rem;
			font-weight: 700;
			color: #fff;
			background-color: var(--primary-color-400);
			padding: 0 .3125rem;
			border-radius: .75rem;
		}
	}

	.btn-profile {
		flex: none;
		height: 3.375rem;
		border-radius: 0.5rem;
		background: linear-gradient(90.25deg, var(--primary-color-400) 5%, var(--primary-color-200) 98%);
		color: #fff;
		font-size: 1rem;
		font-weight: 600;
		padding-left: 1.25rem;
		padding-right: 2.75rem;
		position: relative;
		margin-right: 1.3125rem;
	}

	.thumbnail {
		width: 3.375rem;
		height: 3.375rem;
		border: 0.1875rem solid #fff;
		border-radius: 50%;
		position: absolute;
		top: 0;
		right: -1.5rem;
		background: var(--primary-color-100) url(../images/header/thumb_profile_default.png) center/cover no-repeat;
		overflow: hidden;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}
}

/*
* responsive
*/

@media (max-width: 1399.98px) {
}
@media (max-width: 1199.98px) {
}
@media (max-width: 991.98px) {
}
@media (max-width: 767.98px) {
}
@media (max-width: 575.98px) {
}

</style>