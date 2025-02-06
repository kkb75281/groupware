<template lang="pug">
ul.card-wrap.gmail
	li.card
		.title-wrap(:style="{ marginBottom: googleAccountCheck ? '1rem' : '0' }")
			h3.title 
				.icon.img
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-mail")
				| 안읽은 메일
			a.go-detail(v-if="googleAccountCheck" :href="'https://mail.google.com/mail/u/0/#inbox'" target="_blank") 메일 더보기
				.icon
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
			button.btn.outline(v-else @click="googleConnect")
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

template(v-if="user.access_group > 98")
	button.btn(@click="viviTest" style="display:inline-block; margin-right:1rem") admin email endpoint
	button.btn(@click="getAdminEmailList" style="display:inline-block") get admin email list
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { skapi, updateEmails, googleEmailUpdate } from "@/main";
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { user } from "@/user";
import { fetchGmailEmails } from "@/utils/mail";
import { mailList, readAudit, readList, readNoti, addEmailNotification, createReadListRecord } from "@/notifications";

import Loading from '@/components/loading.vue';
import { getCombinedNodeFlags } from 'typescript';

const router = useRouter();
const route = useRoute();

let loading = ref(false);
let googleAccountCheck = sessionStorage.getItem('accessToken') ? true : false;
let emailCheckInterval;  // interval 저장용 변수

let viviTest = () => {
	// 어드민 이상 계정이여야 하고 이메일이 + 계정이면 안됨
	skapi.adminNewsletterRequest().then(response => {
		console.log("Your newsletter endpoint:", response)
	});
}

let getAdminEmailList = () => {
	skapi.getNewsletters().then(r => {
		let getAdminMailList = r;
		console.log({getAdminMailList})
	})
}

// 구글 계정 연동하기
let googleConnect = async() => {
	googleLogin();
	// const GOOGLE_CLIENT_ID = '685505600375-tiheatfjtp0if764ri7ilop3o4nuhql3.apps.googleusercontent.com';
	// const REDIRECT_URL = 'http://localhost:5173/login';
	// const SCOPE = encodeURIComponent('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.readonly');

	// const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URL}&response_type=token&scope=${SCOPE}`;
	// // #ggl_skp_connect_ing
	// window.location.href = authUrl;
}

// google login
function googleLogin() {
	loading.value = true;

	const GOOGLE_CLIENT_ID = '685505600375-tiheatfjtp0if764ri7ilop3o4nuhql3.apps.googleusercontent.com';	// mina(broadwayinc.com) 계정으로 생성
	// const GOOGLE_CLIENT_ID = '744531008220-v60665vfj19fgu1ajjlj0dj5sku7o4h8.apps.googleusercontent.com' // qb
	const REDIRECT_URL = 'http://localhost:5173/login';

	let rnd = Math.random().toString(36).substring(2); // Generate a random string
	sessionStorage.setItem('oauth_state', rnd); // Store the state value in session storage

	let url = 'https://accounts.google.com/o/oauth2/v2/auth';
	url += '?client_id=' + GOOGLE_CLIENT_ID;
	url += '&redirect_uri=' + encodeURIComponent(REDIRECT_URL);
	url += '&response_type=token';
	url += '&scope=' + encodeURIComponent('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.readonly');
	url += '&prompt=select_account';
	url += '&state=' + encodeURIComponent(rnd); // Include the state parameter

	window.location.href = url;
}

// async function handleOAuthCallback(hashValue) {  // 파라미터로 해시값을 받도록 수정
//     const params = new URLSearchParams(hashValue.substring(1));
//     const state = params.get('state');
//     const storedState = sessionStorage.getItem('oauth_state');

//     console.log('=== handleOAuthCallback === parms : ', params);
//     console.log('=== handleOAuthCallback === state : ', state);
//     console.log('=== handleOAuthCallback === storedState : ', storedState);

//     loading.value = true;

//     if (state !== storedState || !state || !storedState) {
//         console.error('Invalid state parameter');
//         return;
//     }

//     const OPENID_LOGGER_ID = 'by_skapi';
//     const accessToken = params.get('access_token');
//     sessionStorage.setItem('accessToken', accessToken);

// 	console.log('=== handleOAuthCallback === accessToken : ', accessToken);
// 	loading.value = false;


//     skapi.openIdLogin({ id: OPENID_LOGGER_ID, token: accessToken }).then(u => {
// 		console.log('=== handleOAuthCallback === u : ', u);
//         window.location.href = '/';
//     }).finally(() => {
//     });
// }

let showMailDoc = (e: Event, rt: any) => {
	window.open(rt.link, "_blank");
	readNoti(rt);
}

onMounted(async () => {
    await updateEmails();
    
    // 30초마다 이메일 업데이트
    emailCheckInterval = setInterval(() => {
        updateEmails();
    }, 10000);
});

// 컴포넌트 언마운트 시 인터벌 정리
onUnmounted(() => {
    // if (emailCheckInterval) {
    //     clearInterval(emailCheckInterval);
    // }
});

// // 컴포넌트 마운트 시 이메일 업데이트 되는 거에 따른 mails.value 변경 감지
// watch(mailList, (newVal, oldVal) => {
//     console.log('=== watch === newVal : ', newVal);
//     console.log('=== watch === oldVal : ', oldVal);
//     console.log('========== 확인 !! ==========')
// 	console.log(!oldVal);

//     if(!newVal) {
//         return;
//     }

// 	if((newVal.length && !oldVal) || (newVal.length > oldVal.length)) {
// 		// console.log('=== watch === new email');
// 		console.log('dddd')
// 		for(let i in newVal) {
// 			addEmailNotification(newVal[i]);
// 		}
// 	} else {
// 		console.log('wwww');
// 	}

//     // if(newVal[0].dateTimeStamp > oldVal[0].dateTimeStamp) {
//     //     console.log('=== watch === new email');
//     //     // addEmailNotification(newVal[0]);
// 	// 	for(let i in newVal) {
// 	// 		addEmailNotification(newVal[i]);
// 	// 	}
//     // } else {
//     //     console.log('=== watch === no new email');
//     // }
// });
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
            padding: 1.5rem;
            transition: none;
            width: 100%;

            &:hover {
                transform: none;
                box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.05);
            }
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
            border-top: 1px solid var(--gray-color-200);
            padding: 0.75rem 0.5rem;

            &:hover {
                background-color: var(--primary-color-25);
            }
        }

        .link {
            display: flex;
            align-items: center;
            gap: 1rem;
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

    .title-wrap {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }

	.empty {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--gray-color-500);
		line-height: 1.2;
		min-height: 150px;
		text-align: center;
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