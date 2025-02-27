<template lang="pug">
Header
Navbar
main#main
	.wrap(ref="mainWrap" :class="{ loading: mainPageLoading }")
		Loading#loading(v-if="mainPageLoading") 
		router-view
</template>

<script setup>
import { onMounted, watch, ref, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { updateEmails } from "@/notifications";
import { mainPageLoading } from '@/main'

import Header from '@/components/header.vue';
import Navbar from '@/components/navbar.vue';
import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

let mainWrap = ref(null);
let emailCheckInterval;

onMounted(async () => {
	console.log('메인 페이지 onMounted');

    // 세션 스토리지에 액세스 토큰이 없는지 확인
    if (!sessionStorage.getItem('accessToken')) {
        // 로그인 상태 유지가 체크되어 있고 로컬 스토리지에 액세스 토큰이 있는지 확인
        if (localStorage.getItem('remember') === 'true' && localStorage.getItem('accessToken')) {
            // 로컬 스토리지에서 세션 스토리지로 토큰 복원
            sessionStorage.setItem('accessToken', localStorage.getItem('accessToken'));
            if (localStorage.getItem('refreshToken')) {
                sessionStorage.setItem('refreshToken', localStorage.getItem('refreshToken'));
            }
            console.log('로컬 스토리지에서 액세스 토큰 복원 완료');
        }
    }

	await updateEmails();
	console.log('이메일 업데이트 완료');
	
	// 10초마다 이메일 업데이트
	emailCheckInterval = setInterval(() => {
		console.log('10초마다 이메일 업데이트');
		updateEmails();
	}, 10000);
});

async function refreshAccessToken(refreshToken) {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams();
    params.append('client_id', GOOGLE_CLIENT_ID);
    params.append('client_secret', GOOGLE_CLIENT_SECRET);
    params.append('refresh_token', refreshToken);
    params.append('grant_type', 'refresh_token');

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
    });

    const data = await response.json();
    if (response.ok) {
        sessionStorage.setItem('accessToken', data.access_token);
        return data;
    } else {
        console.error('토큰 갱신 실패:', data);
        throw new Error('토큰 갱신 실패');
    }
}

watch(mainPageLoading, (nv) => {
	if (nv) {
		nextTick(() => {
			const targetElement = document.querySelector('#loading');
			let scrollLocation = document.documentElement.scrollTop;

			// console.log('innerHeight',window.innerHeight);
			// console.log('scrollLocation',scrollLocation);

			targetElement.style.setProperty('--loading-top', `${(window.innerHeight - mainWrap.value.getBoundingClientRect().top + scrollLocation - 200) / 2}px`);
		})
	}
}, { immediate: true });
</script>

<style scoped lang="less">
#main {
	padding-top: calc(var(--header-height));
	padding-left: calc(var(--navbar-width));
	transition: padding-left 0.15s linear;

	.wrap {
		// padding: 3rem 2.4rem 0;
		position: relative;
		padding: 3rem 2.4rem;

		&.loading {
			&::after {
				position: absolute;
				content: '';
				width: 100%;
				height: 100%;
				top: 0;
				left: 0;
				background: rgba(255, 255, 255, 0.6);
			}
		}
	}

	#loading {
		position: absolute;
		top: var(--loading-top);
		left: 50%;
		transform: translateX(-50%);
		z-index: 9999;
	}
}

.fold {
	#navbar {
		width: var(--navbar-fold-width);
	}

	#main {
		padding-left: calc(var(--navbar-fold-width));

		.wrap {
			padding: 3rem 2.4rem 0;
		}
	}

	#header {
		padding-left: var(--navbar-fold-width);
	}
}

@media (max-width: 1200px) {
	#header {
		padding-left: 2.4rem;
	}

	#navbar {
		left: calc(-1 * var(--navbar-width));
	}

	#main {
		padding-left: 0;
	}
}

@media (max-width: 768px) {
	#header {
		padding: 0 16px;
	}

	#main {
		padding-left: 0;

		.wrap {
			padding-left: 16px;
			padding-right: 16px;
		}
	}

	.fold {
		#header {
			padding: 0 16px;
		}

		#navbar {
			left: calc(-1 * var(--navbar-width));
		}

		#main {
			padding-left: 0;
		}
	}
}
</style>