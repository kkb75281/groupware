<template lang="pug">
#login
	//- 구글 로그인시 로딩
	.overlay(v-if="loading")
		Loading

	img.logo(src="/icon-192.png" style="width: 2rem;")

	//- router-link.logo(to="/")
		img(src="/icon-192.png" style="width: 2rem;")
		//- p 로고영역
		//- svg
			use(xlink:href="@/assets/icon/material-icon.svg#icon-groups-fill")

	h2.title Groupware

	hr

	template(v-if="masterlogin")
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
			button.btn.outline(type="button" @click="masterlogin = false") 이전으로

	template(v-else)
		#el_bt_login.btn-login-google(@click="googleLogin" :disabled="loading" style="margin-top: 0;")
			.inner
				img.google-logo(src="@/assets/img/icon_google.svg")
				span Google 계정으로 로그인
			//- input#input_googleAutoLogin(@change="(e)=>{setLocalStorage(e)}" type="checkbox" name="checkbox" checked hidden)
		//- label.checkbox(style="margin-top: 1rem;")
			input#input_googleAutoLogin(@change="(e)=>{setLocalStorage(e)}" type="checkbox" name="checkbox" checked hidden)
			span.label-checkbox 로그인 상태 유지

		//- .btn-login-google
			img(src="@/assets/img/web_light_sq_SI@3x.png" style="width: 11rem;")
		//- button#el_bt_login.btn.btn-login-google(type="button" @click="googleLogin" :disabled="loading" style="margin-top: 0;")
		//- 	template(v-if="loading")
		//- 		span Google 로그인 중...
		//- 	template(v-else)
		//- 		| Google 로그인
		
		br
		br

		.bottom-wrap(style="display: flex; justify-content: space-between; align-items: center;")
			label.checkbox
				input#input_googleAutoLogin(@change="(e)=>{setLocalStorage(e)}" v-model='remVal' type="checkbox" name="checkbox" hidden)
				span.label-checkbox 로그인 상태 유지
			.master-login(@click="masterlogin = true") 마스터 계정 로그인

		//- button.btn.outline(type="button" @click="masterlogin = true") 마스터 계정 로그인
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { user } from '@/user';
import { skapi, iwaslogged } from "@/main";
import { ref, onMounted } from 'vue';
import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

let masterlogin = ref(false);

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

if (window.localStorage.getItem('remember') === 'true') {
	remVal.value = true;
} else {
	remVal.value = false;
}

let setLocalStorage = (e) => {
	localStorage.setItem('remember', e.target.checked ? 'true' : 'false');
};

let login = (e) => {
	loading.value = true;
	promiseRunning.value = true;

	sessionStorage.removeItem('accessToken');

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

// google login
function googleLogin() {
	let redirect = window.location.href;
	loading.value = true;

	const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
	const REDIRECT_URL = redirect;

	let rnd = Math.random().toString(36).substring(2); // Generate a random string
	sessionStorage.setItem('oauth_state', rnd); // Store the state value in session storage

	let url = 'https://accounts.google.com/o/oauth2/v2/auth';
	url += '?client_id=' + GOOGLE_CLIENT_ID;
	url += '&redirect_uri=' + encodeURIComponent(REDIRECT_URL);
	// url += '&response_type=token';
	url += '&response_type=code'; // Authorization Code Flow 사용
	url += '&scope=' + encodeURIComponent('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.readonly');
	url += '&prompt=select_account';
	url += '&state=' + encodeURIComponent(rnd); // Include the state parameter
	url += '&access_type=offline'; // Refresh Token을 받기 위해 필수

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

	// console.log('=== handleOAuthCallback === parms : ', params);
	// console.log('=== handleOAuthCallback === state : ', state);
	// console.log('=== handleOAuthCallback === storedState : ', storedState);

	loading.value = true;

	if (state !== storedState || !state || !storedState) {
		console.error('Invalid state parameter');
		return;
	}

	const OPENID_LOGGER_ID = 'by_skapi';
	const accessToken = params.get('access_token');
	sessionStorage.setItem('accessToken', accessToken);

	// console.log('=== handleOAuthCallback === accessToken : ', accessToken);

	skapi.openIdLogin({ id: OPENID_LOGGER_ID, token: accessToken }).then(u => {
		// console.log('=== handleOAuthCallback === u : ', u);
		window.location.href = '/';
	}).catch(() => {
		loading.value = false;
	});
}

async function exchangeCodeForTokens(code, redirectUri) {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', GOOGLE_CLIENT_ID);
    params.append('client_secret', GOOGLE_CLIENT_SECRET);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');

	console.log('=== exchangeCodeForTokens === params : ', params);

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        });

        const data = await response.json();
        if (response.ok) {
            const { access_token, refresh_token, expires_in } = data;
            console.log('Access Token:', access_token);
            console.log('Refresh Token:', refresh_token);
            console.log('Expires In:', expires_in); // 초 단위 (예: 3600)
            return data;
        } else {
            console.error('토큰 교환 실패:', data);
        }
    } catch (error) {
        console.error('토큰 교환 중 오류 발생:', error);
    }
}

onMounted(() => {
	// const currentHash = window.location.hash;
	// if (currentHash) {
	// 	handleOAuthCallback(currentHash);
	// }

	const urlParams = new URLSearchParams(window.location.search);
	console.log({urlParams})
	const authorizationCode = urlParams.get('code');
	console.log({authorizationCode})
	if (authorizationCode) {
		const redirectUri = window.location.href.split('?')[0]; // Redirect URI
		console.log({redirectUri})
		exchangeCodeForTokens(authorizationCode, redirectUri);
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
		margin-bottom: 0.5rem;

		svg {
			width: 3rem;
			height: 3rem;
		}
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

.btn-login-google {
	margin: 0 auto;
	border: 1px solid var(--gray-color-300);
	padding: 10px 12px 8px;
	border-radius: 8px;
	transition: all .2s;
	cursor: pointer;
	width: 100%;
	text-align: center;

	&:hover {
		background-color: var(--gray-color-100);
	}

	.inner {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}

	span {
		font-size: 0.9rem;
	}
}
.master-login {
	text-align: center;
	font-size: 14px;
	color: var(--gray-color-400);
	text-decoration: underline;
	cursor: pointer;
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