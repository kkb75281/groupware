<template lang="pug">
header#header(ref="header" :class="{'hide':scroll}")
	button.btn-mo-navbar(@click="toggleOpen")
		.icon
			svg
				use(xlink:href="@/assets/icon/material-icon.svg#icon-menu")

	button.btn-noti(type="button" data-count="9999")
		.icon.icon-bel
			svg
				use(xlink:href="@/assets/icon/material-icon.svg#icon-bell")
	.notification

	button.btn-profile(type="button" @click="showProfile = !showProfile")
		span.user-name {{ user.name }}
		span.hello 님, 안녕하세요!
		.thumbnail
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-person")
			//- img(src="https://picsum.photos/250/250" alt="img-profile")

#popup.profile(v-if="showProfile")
	.popup-header
		.image
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-person")
		.content
			.user
				h4 {{ user.name }}
				span {{ user.access_group === 99 ? '마스터' : user.access_group === 98 ? '관리자' : '직원' }}
			p {{ user.email }}
	.popup-main
		ul
			li
				router-link(to="/")
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-person")
					p 마이페이지
			
			li
				router-link(to="/")
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-business-center")
					p 회사 정보

			li(@click="logout")
				.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-logout")
				p 로그아웃
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { onUnmounted, onMounted, ref, nextTick, watch } from 'vue';
import { user, updateUser } from '@/user'
import { skapi } from '@/main'
import { checkScreenWidth, toggleNavbarFold, toggleOpen } from '@/components/navbar'

const router = useRouter();
const route = useRoute();

let showProfile = ref(false);
let scroll = ref(false);
let previousScrollY = window.scrollY;
let header = ref(null);
let headerHeight = 0;

let logout = () => {
	skapi.logout().then(() => {
        updateUser();
        router.push({ path: "/login" });
    });
}

window.addEventListener('scroll', (e) => {
	// const currentScrollY = window.scrollY;

	// currentScrollY > previousScrollY ? scroll.value = true : scroll.value = false;
	// previousScrollY = currentScrollY;

	let currentScrollY = window.scrollY;

	if (currentScrollY > headerHeight && currentScrollY > previousScrollY) {
		scroll.value = true;
	} else if (currentScrollY < previousScrollY) {
		scroll.value = false;
	}

	previousScrollY = currentScrollY;
})

onMounted(() => {
	nextTick(() => {
		if (header.value) {
			headerHeight = header.value.offsetHeight / 4;
		}
	});
});
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
	// background-color: #b59595;
	display: flex;
	justify-content: flex-end;
	align-items: center;
	// padding: 0 20px 0 var(--navbar-width);
	padding: 0 20px;
	transition: padding 0.15s linear;
	transition: top 0.3s;
	z-index: 999;
	box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.05);

	&.hide {
		// top: calc(-1 * var(--header-height));
	}

	.btn-mo-navbar {
		display: none;
		margin-right: auto;
		
		.icon {
			padding: 0;
		}
	}

	.btn-noti {
		width: 2.75rem;
		height: 2.75rem;
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
			font-size: 0.75rem;
			font-weight: 700;
			color: #fff;
			background-color: var(--primary-color-400);
			padding: 0 .3125rem;
			border-radius: .75rem;
		}
	}

	.icon-bel {
		svg {
			fill: var(--primary-color-400);
		}
	}

	.btn-profile {
		flex: none;
		height: 3rem;
		border-radius: 0.5rem;
		background: linear-gradient(90.25deg, var(--primary-color-400) 5%, var(--primary-color-300) 98%);
		color: #fff;
		font-size: 1rem;
		font-weight: 600;
		padding-left: 1.25rem;
		padding-right: 2.75rem;
		position: relative;
		margin-right: 1rem;
	}

	.thumbnail {
		width: 3rem;
		height: 3rem;
		border: 0.1875rem solid #fff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		position: absolute;
		top: 0;
		right: -1rem;
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
}

#popup {
	position: fixed;
	right: 20px;
	top: calc(8px + var(--header-height));
	background-color: #fff;
	border-radius: 16px;
	border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 1px 1px 20px 0px rgba(0, 0, 0, 0.1);
	overflow: hidden;
	z-index: 99999;

	.popup-header {
		display: flex;
		align-items: center;
		padding: 0.9rem;
		gap: 1rem;

		.image {
			width: 64px;
			height: 64px;
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: var(--gray-color-100);
			border-radius: 50%;
		}
		.content {
			.user {
				display: flex;
				flex-wrap: wrap;
				align-items: end;
				gap: 0.5rem;

				h4 {
					color: var(--primary-color-400);
				}
				span {
					color: var(--gray-color-400);
					font-size: 0.8rem;
				}
			}
			p {
				margin-top: 0.5rem;
				font-size: 0.8rem;
			}
		}
	}
	.popup-main {
		ul {
			li {
				border-top: 1px solid var(--gray-color-200);
				a {
					display: flex;
					align-items: center;
					padding: 0.8rem;
					font-size: 0.9rem;
	
					&:hover {
						background-color: var(--primary-color-100);
					}
				}
			}
		}
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

// @media (max-width: 400px) {
// 	#header {
// 		.btn-profile {
// 			.user-name {
// 				display: none;
// 			}
// 		}
// 	}
// }
</style>