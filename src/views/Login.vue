<template lang="pug">
#login
	router-link.logo(to="/")
		//- img(src="@/assets/img/img_logo_symbol.png")
		p 로고영역

	h2.title Login

	hr

	form(@submit.prevent="login")
		.input-wrap
			p.label Email
			input(type="email" name="email" placeholder="your@email.com" :disabled="promiseRunning" required)

		.input-wrap
			p.label Password
			.input
				input(:type='showPassword ? "text" : "password"' name="password" placeholder="Enter password" :disabled="promiseRunning" required)
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
				span.label-checkbox Remember me

			router-link.btn-forgot(to="/forgot") Forgot Password?

		button.btn.btn-login(type="submit") Login
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { user, updateUser } from '@/user';
import { skapi } from "@/main";
import { ref, watch, onMounted } from 'vue';

const router = useRouter();
const route = useRoute();

let showPassword = ref(false);
let remVal = ref(false); // dom 업데이트시 checkbox value 유지하기 위함
let promiseRunning = ref(false);
let error = ref(null);
let enableAccount = ref(false);

skapi.logout();

onMounted(() => {
    if (window.localStorage.getItem('remember') === 'true') {
        remVal.value = true;
    } else {
        remVal.value = false;
    }
});

let setLocalStorage = (e) => {
    localStorage.setItem('remember', e.target.checked ? 'true' : 'false');
	console.log(window.localStorage.getItem('remember'))
};

let login = (e) => {
    promiseRunning.value = true;

    skapi.login(e).then(async (u) => {
        await updateUser();
        router.push('/');
    }).catch(err => {
		for (let k in user) {
				delete user[k];
		}
		if (err.code === "USER_IS_DISABLED") {
				alert("This account is disabled.");
		}
		else if (err.code === "INCORRECT_USERNAME_OR_PASSWORD") {
				alert("Incorrect email or password.");
		}
		else if (err.code === "NOT_EXISTS") {
				alert("Incorrect email or password.");
		}
		else {
				alert(err.message);
		}
    }).finally(() => {
        promiseRunning.value = false;
    })
};
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
		margin-left: auto;
		margin-top: 3rem;
		min-width: 100px;
	}
}
</style>