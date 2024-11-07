<template lang="pug">
#forgot
	template(v-if="step < 3")
		router-link.logo(to="/")
			//- img(src="@/assets/img/img_logo_symbol.png")
			p 로고영역

	template(v-else)
		h2.success Success!

	template(v-if="step === 1")
		h2.title Forgot Password

		hr

		p.desc Request verification code to reset password.<br>Enter login email and click Request Code.

		form(@submit.prevent="forgotPassword")
			.input-wrap
				p.label Login Email
				input#_el_email(type="email" name="email" placeholder="login@email.com" :value="email" @input="(e) => {email = e.target.value; error = '';}" required)

			button.btn.btn-request-code(type="submit") Request Code

	template(v-if="step === 2")
		h2.title Reset Password

		hr
		
		p.desc Enter the verification code sent to #[b {{email}}]<br>Enter the new password and click Reset Password.

		form(@submit.prevent="changePassword" action="")
			.input-wrap
				p.label 6 Letter Verification Code
				input(type="text" name="code" ref="codeField" :value="code" @input="e => {code = e.target.value; e.target.setCustomValidity('');}" @change="validateCode" placeholder="######" required)

			.input-wrap
				p.label New Password
				.input
					input(:type='showPassword ? "text" : "password"' name="new_password" ref="newPasswordField" :value="newPassword"
					@input="e => {newPassword = e.target.value; e.target.setCustomValidity('');}" 
					@change="validateNewPassword" placeholder="At least 6 char" required)
					button.icon.icon-eye(type="button" @click="showPassword = !showPassword")
						template(v-if="showPassword")
							svg
								use(xlink:href="@/assets/icon/material-icon.svg#icon-visibility-fill")
						template(v-else)
							svg
								use(xlink:href="@/assets/icon/material-icon.svg#icon-visibility-off-fill")

			button.btn.btn-reset-password(type="submit" value="Reset Password") Reset Password
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { skapi } from "@/main";
import { ref, watch, onMounted, nextTick } from 'vue';

const router = useRouter();
const route = useRoute();

let step = ref(1);
let error = ref('');
let promiseRunning = ref(false);
let resending = ref(false);
let showPassword = ref(false);
let newPasswordField = ref(null);
let codeField= ref(null);
let email = ref('');
let newPassword = '';
let code = '';

let forgotPassword = async (event) => {
    promiseRunning.value = true;
    error.value = '';

    try {
        await skapi.forgotPassword({ email: email.value });
        step.value++;
    }
    catch (err:any) {
        error.value = err.message;
    }
    finally {
        promiseRunning.value = false;
    }
}

let validateCode = () => {
    if (code.length < 6) {
        codeField.value.setCustomValidity('Min 6 characters');
        codeField.value.reportValidity();
    }
}

let validateNewPassword = () => {
    if (newPassword.length < 6 || newPassword.length > 60) {
        newPasswordField.value.setCustomValidity('Min 6 characters and Max 60 characters');
        newPasswordField.value.reportValidity();
    }
}

let changePassword = async () => {
    promiseRunning.value = true;
    error.value = '';
    try {
        await skapi.resetPassword({ email: email, code: code, new_password: newPassword })
        alert('New password has been set');
		router.push('/login');
    }
    catch (err:any) {
        step.value--;
        nextTick(() => {
            error.value = err.message;
        });
    }
    finally {
        promiseRunning.value = false;
		alert('New password has been set');
		router.push('/login');
    }
}
</script>

<style scoped lang="less">
#forgot {
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

	.desc {
		font-size: 0.9rem;
		font-weight: 400;
		line-height: 1.4;
		margin-bottom: 3rem;
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

	.forgot {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--primary-color-400);
	}

	.btn {
		margin-left: auto;
		margin-top: 3rem;
		min-width: 100px;
	}
}
</style>