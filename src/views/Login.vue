<template lang="pug">
#login
	router-link.logo(to="/")
		//- img(src="@/assets/img/img_logo_symbol.png")
		p 로고영역

	h2.title Login

	form(@submit.prevent="login")
		.input-wrap
			p.label Email
			input(type="email" placeholder="your@email.com" required)
		.input-wrap
			p.label Password
			.input
				input(type="password" placeholder="password" required)
				button.icon(type="button")
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-visibility-off-fill")

		.check-wrap
			label.checkbox
				input(type="checkbox" name="checkbox" checked)
				span.label-checkbox Remember me

			router-link.forgot(to="/forget") Forgot Password?

		button.btn.btn-login Login
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { updateUser, loginState } from '@/user'
import { watch } from 'vue';

// import Component from '@/components/component.vue';

const router = useRouter();
const route = useRoute();

watch(loginState, (n) => {
	if(n) {
		router.push('/');
	}
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
    // top: 2.3622rem;

	.logo {
		display: block;
		margin-bottom: 1.5rem;
	}

	.title {
		    font-size: 1.5rem;
			margin-bottom: 1.5rem;
			padding-bottom: 1.5rem;
			border-bottom: 1px solid var(--gray-color-400);
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
		margin-bottom: 3rem;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.forgot {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--primary-color-400);
	}

	.btn-login {
		margin-left: auto;
		min-width: 100px;
	}
}
</style>