<template lang="pug">
#login
	//- 구글 로그인시 로딩
	.overlay(v-if="loading")
		Loading

	img.logo(src="/img_fgworks_logo.png" style="width: 12rem;")

	hr

	template(v-if="masterlogin")
		form(@submit.prevent="login")
			.input-wrap
				p.label 이메일
				input(type="email" name="email" placeholder="이메일" :disabled="loading" required)

			.input-wrap
				p.label 비밀번호
				.input
					input(:type='showPassword ? "text" : "password"' name="password" placeholder="비밀번호" :disabled="loading" required)
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
		
		br
		br

		.bottom-wrap(style="display: flex; justify-content: space-between; align-items: center;")
			label.checkbox
				input#input_googleAutoLogin(@change="(e)=>{setLocalStorage(e)}" v-model='remVal' type="checkbox" name="checkbox" hidden)
				span.label-checkbox 로그인 상태 유지
			.master-login(@click="masterlogin = true") 마스터 계정 로그인
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { user } from '@/user.ts';
import { skapi } from "@/main.ts";
import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

let masterlogin = ref(false);

let showPassword = ref(false);
let remVal = ref(false); // dom 업데이트시 checkbox value 유지하기 위함
let loading = ref(false);

if (window.localStorage.getItem('remember') === 'true') {
    remVal.value = true;
}
else {
    remVal.value = false;
}

let setLocalStorage = (e) => {
    console.log(e.target.checked);
    localStorage.setItem('remember', e.target.checked ? 'true' : 'false');
}

let login = (e) => {
    loading.value = true;

    skapi.login(e).then((u) => {
        console.log({ u });
        router.push('/').then(r => console.log({ r })).catch(err => {
            console.log({ err });
        });
    }).catch(err => {
        for (let k in user) {
            delete user[k];
        }
        if (err.code === "USER_IS_DISABLED") {
            alert("이 계정은 비활성화되었습니다.");
        }
        else if (err.code === "INCORRECT_USERNAME_OR_PASSWORD") {
            alert("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        else if (err.code === "NOT_EXISTS") {
            alert("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        else {
            alert(err.message);
        }
    }).finally(() => {
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

    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += '?client_id=' + GOOGLE_CLIENT_ID;
    url += '&redirect_uri=' + encodeURIComponent(REDIRECT_URL);
    // url += '&response_type=token';
    url += '&response_type=code'; // Authorization Code Flow 사용
    url += '&scope=' + encodeURIComponent('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.readonly');
    url += '&prompt=consent'; //select_account';
    url += '&state=' + encodeURIComponent(rnd); // Include the state parameter
    url += '&access_type=offline'; // Refresh Token을 받기 위해 필수

    window.location.href = url;
}

async function exchangeCodeForTokens(code, redirectUri) {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = {
        code: code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: "$CLIENT_SECRET",
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
    }

    const data = await skapi.clientSecretRequest({
        clientSecretName: "ggltoken",
        url: tokenUrl,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        data: params
    });

    if (data.error) {
        console.error('토큰 교환 실패:', data);
        throw data
    }

    const { access_token, refresh_token, expires_in } = data;
    // console.log({ data });
    // console.log('Access Token:', access_token);
    // console.log('Refresh Token:', refresh_token);
    // console.log('Expires In:', expires_in); // 초 단위 (예: 3600)

    localStorage.setItem('accessToken', access_token);
    localStorage.setItem('refreshToken', refresh_token);

    return { access_token, refresh_token, expires_in };
}

const handlePopState = () => {
    loading.value = false;
    console.log('popstate');
};

onMounted(async () => {
    window.addEventListener('popstate', handlePopState);

    const urlParams = new URLSearchParams(window.location.search);
    const authorizationCode = urlParams.get('code');

    loading.value = false;

    if (authorizationCode) {
        loading.value = true;
        const redirectUri = window.location.href.split('?')[0]; // Redirect URI
        try {
            let { access_token } = await exchangeCodeForTokens(authorizationCode, redirectUri);
            if (access_token) {
                // 로그인
                await skapi.openIdLogin({ id: import.meta.env.VITE_OPENID_LOGGER_ID, token: access_token });
                router.push('/');
            }
        }
        catch (err) {
            console.error(err);
            if (err.message === "Signup is not allowed for this service.") {
                alert("유효하지 않은 회원입니다. 다른 계정으로 로그인하세요.");
            }
            router.replace('/login');
        }
        finally {
            loading.value = false;
        }
    }
});

onUnmounted(() => {
    window.removeEventListener('popstate', handlePopState);
});

watch(() => route.fullPath, () => {
    loading.value = false;
}, { immediate: true });
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

    .logo {
        display: block;
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