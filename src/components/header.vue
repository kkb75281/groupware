<template lang="pug">
header#header
	button.btn-mo-navbar(@click="toggleOpen" @click.stop="closePopup")
		.icon
			svg
				use(xlink:href="@/assets/icon/material-icon.svg#icon-menu")

	button.btn-noti(type="button" :data-count="unreadCount" ref="btnNoti" @click="openNotification")
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

#popup.notification(v-if="isNotiOpen" @click.stop)
	.popup-header
		h3.title 알림 목록

	template(v-if="realtimes.length > 0")
		.popup-main
			ul
				li(v-for="rt in realtimes" @click.stop="(e) => showRealtimeNoti(e, rt)")
					.router(@click="closePopup" :class="{'read' : Object.keys(readList).includes(rt?.noti_id)}")
						template(v-if="rt.audit_info.audit_type === 'request'")
							h4.noti-type [{{ rt.audit_info.send_auditors.includes(`receiver:${user.user_id.replaceAll('-', '_')}`) ? '수신참조' : '결재요청' }}]
							h5.noti-title {{ rt.audit_info.to_audit }}
							p.noti-sender {{ rt.send_name }}
							p.upload-time {{ formatTimeAgo(rt.send_date) }}

						template(v-else-if="rt.audit_info.audit_type === 'email'")
							h4.noti-type [새이메일]
							h5.noti-title 읽지 않은 메일이 있습니다.
							//- h5.noti-title {{ rt.subject }}
							//- //- .noti-info
							//- p.noti-sender {{ rt.from }}
							span.upload-time {{ formatTimeAgo(rt.dateTimeStamp) }}

						template(v-else-if="rt.audit_info.audit_type === 'canceled'")
							h4.noti-type [결재회수]
							h5.noti-title {{ rt.send_name + '님께서 [' + rt.audit_info.to_audit + '] 문서를 회수하였습니다.' }}
							p.upload-time {{ formatTimeAgo(rt.send_date) }}

						template(v-else)
							h4.noti-type [알림]
							h5.noti-title 
								template(v-if="rt.audit_info.approval === 'approve'") {{ rt.send_name + '님께서 [' + rt.audit_info.to_audit + '] 문서를 승인하였습니다.' }}
								template(v-else) {{ rt.send_name + '님께서 [' + rt.audit_info.to_audit + '] 문서를 반려하였습니다.' }}
							p.upload-time {{ formatTimeAgo(rt.send_date) }}

	template(v-else)
		.popup-main.no-noti
			h4.title
				.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-error-outline")
				| 새로운 알림이 없습니다.

	//- .popup-bottom
		router-link.router.view-all(to="/approval/audit-list" @click="closePopup")
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
			p {{ user.email }}
	.popup-main
		ul
			li
				router-link.router(to="/" @click="closePopup")
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-dashboard")
					p 대시보드

			li
				router-link.router(to="/approval" @click="closePopup")
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-approval")
					p 전자결재

			li
				router-link.router(to="/mypage" @click="closePopup")
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-account-circle-fill")
					p 마이페이지
			
			li(v-if="user.access_group > 98")
				router-link.router(to="/admin" @click="closePopup")
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-settings")
					p 마스터 페이지

			li(v-if="user.access_group < 99")
				router-link.router(to="/list-employee" @click="closePopup")
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-groups")
					p 직원 목록
			
			li
				router-link.router(to="/organigram" @click="closePopup")
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-account-tree")
					p 조직도

			li(@click="logout")
				.router
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-logout")
					p 로그아웃
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { onUnmounted, onMounted, ref, watch } from 'vue';
import { user, profileImage } from '@/user'
import { skapi, resetBadgeCount } from '@/main'
import { toggleOpen } from '@/components/navbar'
import { realtimes, readList, unreadCount, readNoti } from '@/notifications'
import { goToAuditDetail } from '@/audit'

const router = useRouter();
const route = useRoute();

let isNotiOpen = ref(false);
let btnNoti = ref(null);
let isProfileOpen = ref(false);
let btnProfile = ref(null);

function formatTimeAgo(timestamp) {
	const now = Date.now(); // 현재 시간 (밀리초)
	const difference = now - timestamp; // 시간 차이 (밀리초)
	
	const seconds = Math.floor(difference / 1000); // 초 단위로 변환
	const minutes = Math.floor(seconds / 60); // 분 단위로 변환
	const hours = Math.floor(minutes / 60); // 시간 단위로 변환
	const days = Math.floor(hours / 24); // 일 단위로 변환

	if (seconds < 60) {
		return `${seconds}초 전`;
	} else if (minutes < 60) {
		return `${minutes}분 전`;
	} else if (hours < 24) {
		return `${hours}시간 전`;
	} else {
		return `${days}일 전`;
	}
}

let openNotification = () => {
	isNotiOpen.value = !isNotiOpen.value;
	resetBadgeCount();
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

let closePopup = () => {
	isNotiOpen.value = false;
	isProfileOpen.value = false;
};

onMounted(() => {
	document.addEventListener('click', closeNotification);
	document.addEventListener('click', closeProfile);
	router.beforeEach((to, from, next) => {
		closeNotificatiRouter();
		closeProfileRouter();
		closePopup();
		next();
	});
});

onUnmounted(() => {
	document.removeEventListener('click', closeNotification);
	document.removeEventListener('click', closeProfile);
});

let showRealtimeNoti = (e, rt) => {
	if(rt.audit_info.audit_type === 'email') {
		window.open(rt.link, "_blank");
	} else {
		goToAuditDetail(e, rt.audit_info.audit_doc_id, router);
	}

	readNoti(rt);
}

let logout = () => {
	skapi.logout().then(() => {
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
	box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.3);

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
		// border-radius: 0.5rem;
		border-radius: 50%;

		&::after {
			content: attr(data-count);
			display: inline-block;
			position: absolute;
			top: -0.5rem;
			right: -14px;
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
		// border-radius: 0.5rem;
		border-radius: 30px;
		background: linear-gradient(90.25deg, var(--primary-color-400) 5%, var(--primary-color-300) 98%);
		color: #fff;
		font-size: 1rem;
		font-weight: 600;
		padding-left: 1.25rem;
		// padding-right: 2.75rem;
		padding-right: 3.75rem;
		position: relative;
		// margin-right: 1rem;
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
		// right: -1rem;
		right: -4px;
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
			flex: none;
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
				word-break: break-all;
			}

			.ip {
				color: var(--gray-color-400);
			}
		}
	}
	
	.popup-main {
		ul {
			li {
				// border-top: 1px solid var(--gray-color-200);
				border-top: 1px solid var(--gray-color-100);
			}
		}

		.router {
			display: flex;
			align-items: center;
			// justify-content: space-between;
			padding: 0.8rem;
			font-size: 0.9rem;
			font-weight: 700;
			cursor: pointer;

			&:hover {
				background-color: var(--primary-color-100);
			}
			&.read {
				opacity: 0.5;
			}

			// .right {
			// 	display: flex;
			// 	align-items: center;
			// 	gap: 10px;
			// }
		}
	}

	&.notification {
		right: 124px;
		max-width: 420px;
		width: calc(100% - 16px);

		.popup-header {
			padding: 34px 30px 24px;

			.title {
				font-size: 24px;
			}
		}

		.popup-main {
			padding-bottom: 1.5rem;

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

				> * {
					white-space: nowrap;
				}
			}

			.noti-type {
				font-size: 0.8rem;
				// color: var(--gray-color-600);
			}

			.noti-title {
				font-size: 16px;
				font-weight: 500;
				overflow: hidden;
				text-overflow: ellipsis;
				// width: 330px;
			}

			.noti-sender {
				font-size: 0.8rem;
				font-weight: 500;
				overflow: hidden;
				text-overflow: ellipsis;
				color: var(--gray-color-600);
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

		.popup-bottom {
			border-top: 1px solid var(--gray-color-200);
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

@media (max-width: 400px) {
	#popup {
		&.profile {
			right: 50%;
        	transform: translateX(50%);
			width: calc(100% - 16px);
		}
	}
}
</style>