<template lang="pug">

.warning-msg(v-if="serviceWorkerRegistMsg")
	.icon
		svg
			use(xlink:href="@/assets/icon/material-icon.svg#icon-error-outline")
	p {{ serviceWorkerRegistMsg }}


.warning-msg(v-if="notificationNotWorkingMsg")
	.icon
		svg
			use(xlink:href="@/assets/icon/material-icon.svg#icon-error-outline")
	p {{ notificationNotWorkingMsg }}

template(v-if="newVersionAvailable")
	p {{ `새로운 버전(${newVersion})이 준비되었습니다.` }}
	button.btn(@click="applyUpdate") 그룹웨어 업데이트 하기

	br

template(v-if="onlyUserGesture")
	button.btn(@click="setNotificationPermission") 그룹웨어 알림 허용하기

	br

ul.card-wrap.gmail
	li.card
		.title-wrap
			h3.title
				.icon.img
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-campaign")
				| 공지사항
			router-link.go-detail(to="/newsletter") 더보기
				.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
		ul.newsletter-mail
			li.mail(v-for="news in newsletterList" :key="news.message_id" @click="router.push('/newsletter-detail/' + news.message_id)")
				.link
					span.mail-title {{ news.subject }}
					span.mail-date {{ convertTimestampToDateMillis(news.timestamp) }}
			.empty(v-if="newsletterList && !newsletterList.length")
				.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-error-outline")
				| 등록된 공지사항이 없습니다.
ul.card-wrap.gmail(v-if="googleAccountCheck")
	li.card
		.title-wrap
			h3.title 
				.icon.img
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-mail")
				| 안읽은 메일
			a.go-detail(v-if="googleAccountCheck" :href="`https://mail.google.com/mail/u/${encodedEmail}/?authuser=${encodedEmail}&login_hint=${encodedEmail}`" target="_blank") 메일 더보기
				.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
			button.btn.outline(v-else @click="googleLogin")
				img(src="@/assets/img/icon_google.svg")
				| 구글 계정 연동하기
		template(v-if="googleAccountCheck")
			//- template(v-if="googleEmailUpdate")
			//- 	Loading#loading
			//- template(v-else)
			ul.unread-mail(v-if="mailList && mailList.length")
				li.mail(v-for="mail in mailList" :key="mail.id" @click="(e) => showMailDoc(e, mail)")
					.link
						span.from {{ mail.from }}
						span.mail-title {{ mail.subject }}
						p.mail-cont {{ mail.snippet }}
						span.attachment(v-if="mail.hasAttachment")
							.icon
								svg
									use(xlink:href="@/assets/icon/material-icon.svg#icon-attach-file")
						span.mail-date {{ mail.date }}
			.empty(v-else-if="mailList && !mailList.length")
				.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-error-outline")
				| 더 이상 읽을 메일이 없습니다.

ul.card-wrap
	li.card
		router-link.router(to="/approval")
			.icon.img
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-approval")
			h4.name 전자결재
			.btn-wrap
				p.btn-go 바로가기
				.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
	li.card
		router-link.router(to="/mypage")
			.icon.img
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-account-circle-fill")
			h4.name 마이페이지
			.btn-wrap
				p.btn-go 바로가기
				.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
	li.card
		template(v-if="user.access_group > 98")
			router-link.router(to="/admin")
				.icon.img
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-settings")
				h4.name 마스터 페이지
				.btn-wrap
					p.btn-go 바로가기
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

		template(v-else)
			router-link.router(to="/list-employee")
				.icon.img
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-groups")
				h4.name 직원 목록
				.btn-wrap
					p.btn-go 바로가기
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import { user } from "@/user.ts";
import { newVersionAvailable, newVersion, applyUpdate } from "@/main.ts";
import { convertTimestampToDateMillis } from "@/utils/time.ts";
import { openGmailAppOrWeb } from '@/utils/mail.ts';
import { mailList, serviceWorkerRegistMsg, notificationNotWorkingMsg, readNoti, newsletterList, getNewsletterList, subscribeNotification, onlyUserGesture, setNotificationPermission } from "@/notifications.ts";
import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

let loading = ref(false);
let googleAccountCheck = localStorage.getItem('accessToken') ? true : false;
const encodedEmail = encodeURIComponent(user.email);

// google login
function googleLogin() {
	loading.value = true;

	const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
	const REDIRECT_URL = 'http://localhost:5173/login';

	let rnd = Math.random().toString(36).substring(2); // Generate a random string

	let url = 'https://accounts.google.com/o/oauth2/v2/auth';
	url += '?client_id=' + GOOGLE_CLIENT_ID;
	url += '&redirect_uri=' + encodeURIComponent(REDIRECT_URL);
	url += '&response_type=token';
	url += '&scope=' + encodeURIComponent('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.readonly');
	url += '&prompt=select_account';
	url += '&state=' + encodeURIComponent(rnd); // Include the state parameter

	window.location.href = url;
}

let showMailDoc = (e, rt) => {
	console.log('rt', rt);
	console.log('mailList', mailList.value);
	openGmailAppOrWeb(rt.link, rt.id);
	// window.open(rt.link, "_blank");
	// readNoti(rt);
}

getNewsletterList();

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
	&.gmail {
		display: flex;

		.card {
			// padding: 1.5rem;
			transition: none;
			width: 100%;

			&:hover {
				transform: none;
				// box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.2);
			}

			ul {
				padding-bottom: 1.5rem;
			}
		}

		.title-wrap {
			padding: 1.5rem;
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 1rem;
			flex-wrap: wrap;
			border-bottom: 1px solid var(--gray-color-300);
		}

		.title {
			display: flex;
			align-items: center;
			gap: 0.5rem;
		}

		.go-detail {
			display: flex;
			align-items: center;
			gap: 0.25rem;
			font-size: 0.875rem;
			color: var(--gray-color-500);
		}

		.icon.img {
			svg {
				width: 1.5rem;
				height: 1.5rem;
				margin: 0;
			}
		}

		.mail {
			// padding: 1.5rem 0;
			// border-top: 1px solid var(--gray-color-300);
			padding: 0.75rem 0.5rem;
			cursor: pointer;

			&:hover {
				background-color: var(--primary-color-25);
			}
		}

		.link {
			display: flex;
			align-items: center;
			gap: 1rem;
			padding: 0 1.5rem;
			font-size: 0.875rem;
			line-height: 1.2;
			color: var(--gray-color-500);

			> * {
				overflow: hidden;
				text-overflow: ellipsis;
				display: -webkit-box;
				-webkit-line-clamp: 1;
				-webkit-box-orient: vertical;
			}
		}

		.from {
			font-weight: 600;
			color: var(--gray-color-900);
			flex: none;
			width: 100px;
		}

		.mail-title {
			font-weight: 600;
			color: var(--gray-color-900);
		}

		.mail-cont {
			font-size: 0.75rem;
			color: var(--gray-color-400);
			margin-right: 1rem;
			flex: 1;
		}

		.attachment {
			.icon {
				svg {
					width: 1rem;
					height: 1rem;
					fill: var(--gray-color-400);
				}
			}
		}

		.mail-date {
			font-size: 0.75rem;
			margin-left: auto;
			flex: none;
		}
	}

	.empty {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 4px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--gray-color-500);
		line-height: 1.4;
		min-height: 150px;
		text-align: center;
		padding-top: 1.5rem;

		.icon {
			flex: none;
		}
	}
}

.warning-msg {
	display: flex;
	align-items: flex-start;
	gap: 4px;
	line-height: 1.2;
	margin-bottom: 1rem;

	.icon {
		padding: 0;
		flex: none;
		position: relative;
		top: 2px;

		svg {
			width: 16px;
			height: 16px;
			fill: var(--warning-color-400);
		}
	}
	p {
		font-size: 0.8rem;
		color: var(--warning-color-500);
	}
}

@media (max-width: 1200px) {
	.wrap {
		padding-top: 3rem;
	}
}

@media (max-width: 768px) {
	.card-wrap {
		&.gmail {
			.from,
			.mail-cont {
				display: none;
			}
		}
	}
}
</style>