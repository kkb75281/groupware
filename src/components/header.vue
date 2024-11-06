<template lang="pug">
header#header
	button.btn-mo-navbar
		.icon
			svg
				use(xlink:href="@/assets/icon/material-icon.svg#icon-menu")

	button.btn-noti(type="button" data-count="9999")
		.icon
			svg
				use(xlink:href="@/assets/icon/material-icon.svg#icon-bell")
	.notification

	button.btn-profile(type="button")
		span.user-name 사용자
		span.hello 님, 안녕하세요!
		.thumbnail
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-person")
			//- img(src="https://picsum.photos/250/250" alt="img-profile")
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
	// background-color: #fff;
	// background-color: #b59595;
	display: flex;
	justify-content: flex-end;
	align-items: center;
	padding: 0 20px 0 var(--navbar-width);
	transition: padding 0.15s linear;
	z-index: 100;

	.btn-mo-navbar {
		display: none;
		margin-right: auto;
		
		.icon {
			padding: 0;
		}
	}

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
		background: linear-gradient(90.25deg, var(--primary-color-400) 5%, var(--primary-color-300) 98%);
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
		display: flex;
		align-items: center;
		justify-content: center;
		position: absolute;
		top: 0;
		right: -1.5rem;
		background: var(--primary-color-100) url(../images/header/thumb_profile_default.png) center/cover no-repeat;
		overflow: hidden;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			z-index: 1;
			position: relative;
		}
	}

	i {
		font-size: 1.5rem;
		font-weight: 500;
	}
}

@media (max-width: 1200px) {
	#header {
		.btn-mo-navbar {
			display: block;
		}
	}
}

@media (max-width: 576px) {
	#header {
		.btn-profile {
			.hello {
				display: none;
			}
		}
	}
}
</style>