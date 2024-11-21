<template lang="pug">
header#header
	button.btn-mo-navbar(@click="toggleOpen")
		.icon
			svg
				use(xlink:href="@/assets/icon/material-icon.svg#icon-menu")

	button.btn-noti(type="button" :data-count="notiCount" ref="btnNoti" @click="openNotification")
		.icon.icon-bell
			svg
				use(xlink:href="@/assets/icon/material-icon.svg#icon-bell")

	button.btn-profile(type="button" ref="btnProfile" @click="openProfile")
		span.user-name {{ user.name }}
		span.hello 님, 안녕하세요!
		.thumbnail
			template(v-if="profileImage")
				img(:src="profileImage" alt="img-profile")
			template(v-else)
				.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-person")
				//- img(src="https://picsum.photos/250/250" alt="img-profile")

#popup.notification(v-show="isNotiOpen" @click.stop)
	.popup-header
		h3.title 알림 목록

	template(v-if="newNoti")
		.popup-main
			ul
				li
					router-link.router(to="/")
						h5.noti-title 제목입니다. 새로운 글이 등록되었습니다. 안녕하세요. 제목입니다. 새로운 글이 등록되었습니다. 안녕하세요.
						span.upload-time {{time}}시간전
						button.icon(type="button")
							svg
								use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
				li
					router-link.router(to="/")
						h5.noti-title 제목입니다. 새로운 글이 등록되었습니다. 안녕하세요. 제목입니다. 새로운 글이 등록되었습니다. 안녕하세요.
						span.upload-time {{time}}시간전
						button.icon(type="button")
							svg
								use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
				li
					router-link.router(to="/")
						h5.noti-title 제목입니다. 새로운 글이 등록되었습니다. 안녕하세요.
						span.upload-time {{time}}시간전
						button.icon(type="button")
							svg
								use(xlink:href="@/assets/icon/material-icon.svg#icon-close")

	template(v-else)
		.popup-main.no-noti
			h4.title
				.icon
							svg
								use(xlink:href="@/assets/icon/material-icon.svg#icon-error-outline")
				| 새로운 알림이 없습니다.

	.popup-bottom
		router-link.router.view-all(to="/")
			p 전체보기
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

#popup.profile(v-show="isProfileOpen" @click.stop)
	.popup-header
		.image
			template(v-if="profileImage")
				img(:src="profileImage" alt="img-profile")
			template(v-else)
				.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-person")
		.content
			.user
				h4 {{ user.name }}
				span {{ user.access_group === 99 ? '마스터' : user.access_group === 98 ? '관리자' : '직원' }}
			//- p.ip 현재 접속 IP : {{ user.email }}
			p {{ user.email }}
	.popup-main
		ul
			li
				router-link.router(to="/mypage")
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-person")
					p 마이페이지
			
			li(v-if="user.access_group > 98")
				router-link.router(to="/admin/list-divisions")
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-business-center")
					p 회사 정보

			li(v-if="user.access_group < 99")
				router-link.router(to="/admin/list-employee")
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-groups")
					p 직원 목록

			li(@click="logout")
				.router
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-logout")
					p 로그아웃
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { onUnmounted, onMounted, ref, nextTick, watch, computed } from 'vue';
import { user, profileImage } from '@/user'
import { skapi } from '@/main'
import { checkScreenWidth, toggleNavbarFold, toggleOpen } from '@/components/navbar'

const router = useRouter();
const route = useRoute();

let time = ref(1);
let notiCount = ref(9999);
let newNoti = ref(false);
let isNotiOpen = ref(false);
let btnNoti = ref(null);
let isProfileOpen = ref(false);
let btnProfile = ref(null);

let openNotification = () => {
	isNotiOpen.value = !isNotiOpen.value;
};

let closeNotification = (event) => {
	if (isNotiOpen.value && !btnNoti.value.contains(event.target)) {
		isNotiOpen.value = false;
	}
};

let closeNotificatiRouter = () => {
	isNotiOpen.value = false;
};

let openProfile = () => {
	isProfileOpen.value = !isProfileOpen.value;
};

let closeProfile = (event) => {
	if (isProfileOpen.value && !btnProfile.value.contains(event.target)) {
		isProfileOpen.value = false;
	}
};

let closeProfileRouter = () => {
	isProfileOpen.value = false;
};

onMounted(() => {
	document.addEventListener('click', closeNotification);
	document.addEventListener('click', closeProfile);
	router.beforeEach((to, from, next) => {
		closeNotificatiRouter();
		closeProfileRouter();
		next();
	});
});

onUnmounted(() => {
	document.removeEventListener('click', closeNotification);
	document.removeEventListener('click', closeProfile);
});

let logout = () => {
	skapi.logout().then(() => {
		Object.assign(user, {});
		localStorage.removeItem('user');
    	localStorage.removeItem('iwaslogged');
        router.push({ path: "/login" });
    });
}

watch(() => route.path, (newPath, oldPath) => {
    if(newPath) {
        if (isProfileOpen.value) {
            isProfileOpen.value = !isProfileOpen.value;
        }
    }
})
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
	display: flex;
	justify-content: flex-end;
	align-items: center;
	padding: 0 2.4rem 0 1rem;
	transition: padding 0.15s linear;
	transition: top 0.3s;
	z-index: 999;
	box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.05);

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

	.icon-bell {
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
		user-select: none;
		cursor: pointer;
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
			// object-fit: contain;
			object-fit: cover;
			z-index: 1;
			position: relative;
		}

		svg {
			fill: var(--gray-color-400);
		}
	}
}

#popup {
	position: fixed;
	right: 52px;
	top: calc(-4px + var(--header-height));
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
			overflow: hidden;
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

			.ip {
				color: var(--gray-color-400);
			}
		}
	}
	
	.popup-main {
		ul {
			li {
				border-top: 1px solid var(--gray-color-200);
			}
		}

		.router {
			display: flex;
			align-items: center;
			padding: 0.8rem;
			font-size: 0.9rem;
			font-weight: 700;
			cursor: pointer;

			&:hover {
				background-color: var(--primary-color-100);
			}
		}
	}

	&.notification {
		right: 124px;
		max-width: 480px;
		width: calc(100% - 16px);

		.popup-header {
			padding: 34px 30px 24px;

			.title {
				font-size: 24px;
			}
		}

		.popup-main {
			ul {
					max-height: 240px;
					overflow-y: scroll;

				li {
					border-top: none;
				}
			}

			a,
			button {
				transition: none;

				&:hover,
				&:active,
				&:focus {
					transition: none;
				}
			}

			.router {
				padding-left: 30px;
				padding-right: 30px;
				gap: 0.8rem;

				&:hover {
					background-color: var(--primary-color-100);

					.icon {
						svg {
							fill: var(--gray-color-400);
						}
					}
				}
			}

			.noti-title {
				font-size: 16px;
				font-weight: 500;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				width: 330px;
			}

			.upload-time {
				font-size: 0.7rem;
				font-weight: 500;
				color: var(--gray-color-600);
				flex: none;
			}

			.icon {
				flex: none;

				svg {
					fill: #fff;
				}
			}
		}

		.icon {
			padding: 0;

			svg {
				width: 16px;
				height: 16px;
			}
		}

		.view-all {
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 8px;
			padding: 24px 0;
			margin: 0 30px;
			border-top: 1px solid var(--gray-color-200);

			p {
				font-size: 14px;
				font-weight: 600;
			}

			.icon {
				svg {
					width: 12px;
					height: 12px;
					fill: var(--gray-color-900);
				}
			}
		}

		.no-noti {
			padding: 0 30px 24px;
			min-height: 200px;

			.title {
				display: flex;
				justify-content: center;
				align-items: center;
				gap: 4px;
				font-size: 0.8rem;
				font-weight: 600;
    		color: var(--gray-color-500);
				line-height: 200px;
			}

			.icon {
				svg {
					fill: var(--gray-color-500);
				}
			}
		}
	}
}

@media (max-width: 1200px) {
	#header {
		padding-left: 2.4rem;

		.btn-mo-navbar {
			display: block;
		}
	}
}

@media (max-width: 768px) {
	#header {
		padding-left: 16px;
		padding-right: 16px;
	}
	
	#popup {
		right: 16px;

		&.notification {
			right: 50%;
			transform: translateX(50%);

			.popup-header {
				padding: 30px 20px 18px;
			}

			.popup-main {
				.router {
					padding-left: 20px;
					padding-right: 20px;
				}
			}

			.view-all {
				padding: 24px 0;
				margin: 0 24px;
			}
		}
	}
}

@media (max-width: 576px) {
	#header {
		.btn-noti {
			margin-right: 1.5rem;
		}

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