<template lang="pug">
#login
	//- 구글 로그인시 로딩
	.overlay(v-if="loading")
		Loading

	router-link.logo(to="/")
		//- img(src="@/assets/img/img_logo_symbol.png")
		p 로고영역

	h2.title 로그인

	hr

	form(@submit.prevent="login")
		.input-wrap
			p.label 이메일
			input(type="email" name="email" placeholder="이메일" :disabled="promiseRunning" required)

		.input-wrap
			p.label 비밀번호
			.input
				input(:type='showPassword ? "text" : "password"' name="password" placeholder="비밀번호" :disabled="promiseRunning" required)
				button.icon.icon-eye(type="button" @click="showPassword = !showPassword")
					template(v-if="showPassword")
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-visibility-fill")
					template(v-else)
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-visibility-off-fill")

		.check-wrap
			label.checkbox
				input#input_autoLogin(@change="(e)=>{setLocalStorage(e)}" v-model='remVal' type="checkbox" name="checkbox" checked)
				span.label-checkbox 로그인 상태 유지

			router-link.btn-forgot(to="/forgot-password") 비밀번호 찾기

		button.btn.btn-login(type="submit" style="margin-top: 2.5rem;") 로그인

	button#el_bt_login.btn.outline.btn-login-google(type="button" @click="googleLogin" :disabled="loading")
		template(v-if="loading")
			span Google 로그인 중...
		template(v-else)
			| Google 로그인
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { user } from '@/user';
import { skapi, iwaslogged } from "@/main";
import { ref, watch, onMounted } from 'vue';
import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

if(window.location.hash) {
    console.log('OAuth 콜백 처리중...');
} else if(iwaslogged.value) {
    router.push('/');
}

if(iwaslogged.value) {
	router.push('/'); // 이미 로그인 되어있으면 바로 메인페이지로 이동
}
else {
	// window.sessionStorage.clear();
}

let showPassword = ref(false);
let remVal = ref(false); // dom 업데이트시 checkbox value 유지하기 위함
let promiseRunning = ref(false);
let error = ref(null);
let enableAccount = ref(false);
let loading = ref(false);

// skapi.logout();

// onMounted(() => { // Dom을 기다릴 필요 없음
if (window.localStorage.getItem('remember') === 'true') {
	remVal.value = true;
} else {
	remVal.value = false;
}
// });

let setLocalStorage = (e) => {
    localStorage.setItem('remember', e.target.checked ? 'true' : 'false');
	console.log(window.localStorage.getItem('remember'))
};

let login = (e) => {
	loading.value = true;
    promiseRunning.value = true;

    skapi.login(e).then((u) => {
        router.push('/');
    }).catch(err => {
		for (let k in user) {
			delete user[k];
		}
		if (err.code === "USER_IS_DISABLED") {
			alert("This account is disabled."); // 한글로 할것
		}
		else if (err.code === "INCORRECT_USERNAME_OR_PASSWORD") {
			alert("Incorrect email or password."); // 한글로 할것
		}
		else if (err.code === "NOT_EXISTS") {
			alert("Incorrect email or password."); // 한글로 할것
		}
		else {
			alert(err.message);
		}
    }).finally(() => {
        promiseRunning.value = false;
		loading.value = false;
    })
};

// watch 필요없음, 로그인 성공시 위 코드에서 router.push('/')로 이동하므로, 페이지 방문시만 한번 확인하면 됨.

// watch(iwaslogged, (nv) => {
// 	if(nv && Object.keys(user).length > 0) {
// 		router.push('/');
// 	}
// }, { immediate: true });

// google login
function googleLogin() {
	loading.value = true;

	const GOOGLE_CLIENT_ID = '685505600375-tiheatfjtp0if764ri7ilop3o4nuhql3.apps.googleusercontent.com';	// mina(broadwayinc.com) 계정으로 생성
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

	console.log('=== googleLogin === url : ', url);
	window.location.href = url;
}

// fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
// 	headers: {
// 		Authorization: 'Bearer ' + 'ya29.a0ARW5m757vUJzM6Cn2o2GeqrZ4TG4Po8DlbfOvCjk7lE77Kze9zs1jOruGfJGajX2CL6FHaJdDHwryfm_1Bnz5lyQ9xgwihXgvTl-08SzNedPQOlHsNM8c0l-v1ojwqWJydijXfHw5-xLT3VFlieDRbH5_PLF1WgRyXEaCgYKAW4SARESFQHGX2MikPRMahgxxsn7iyqxjBHsZg0170'
// 	}
// }).then(response => response.json()).then(data => {
// 	console.log('=== googleLogin === data : ', data);
// });

async function handleOAuthCallback(hashValue) {  // 파라미터로 해시값을 받도록 수정
    const params = new URLSearchParams(hashValue.substring(1));
    const state = params.get('state');
    const storedState = sessionStorage.getItem('oauth_state');

    console.log('=== handleOAuthCallback === parms : ', params);
    console.log('=== handleOAuthCallback === state : ', state);
    console.log('=== handleOAuthCallback === storedState : ', storedState);

    loading.value = true;

    if (state !== storedState || !state || !storedState) {
        console.error('Invalid state parameter');
        return;
    }

    const OPENID_LOGGER_ID = 'by_admin';
    const accessToken = params.get('access_token');
    sessionStorage.setItem('accessToken', accessToken);

	console.log('=== handleOAuthCallback === accessToken : ', accessToken);

    skapi.openIdLogin({ id: OPENID_LOGGER_ID, token: accessToken }).then(u => {
		console.log('=== handleOAuthCallback === u : ', u);
        window.location.href = '/';
    }).finally(() => {
        loading.value = false;
    });
}

onMounted(() => {
    const currentHash = window.location.hash;
    if (currentHash) {
        handleOAuthCallback(currentHash);
    }
});
</script>

<style scoped lang="less">
#login {
	max-width: 500px;
	margin: 0 auto;
	padding: 0 1rem;

	height: 100vh;
	min-height: calc(100vh - 4.7244rem);
    display: flex;
    justify-content: center;
    position: relative;
    flex-direction: column;
    // top: 2.3622rem;

	.logo {
		display: block;
		margin-bottom: 1.5rem;
	}

	.title {
		    font-size: 1.5rem;
			// margin-bottom: 1.5rem;
			// padding-bottom: 1.5rem;
			// border-bottom: 1px solid var(--gray-color-400);
	}

	.input-wrap {
		margin-bottom: 1.2rem;

		.label {
			font-weight: 600;
		}
	}

	.input {
		position: relative;

		.icon {
			position: absolute;
			top: 50%;
			right: 0;
			transform: translateY(-50%);
		}
	}

	.check-wrap {
		display: flex;
		justify-content: space-between;
		align-content: center;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.btn-forgot {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--primary-color-400);

		&:hover {
			color: var(--primary-color-400-dark);
			text-decoration: underline;
		}
	}

	.btn {
		margin-top: 1rem;
		width: 100%;
	}
}

.overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background: rgba(255, 255, 255, 0.6);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 9999;
}
</style>