<template lang="pug">
#login
	router-link.logo(to="/")
		//- img(src="@/assets/img/img_logo_symbol.png")
		p 로고영역

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
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
// import Component from '@/components/component.vue';

const router = useRouter();
const route = useRoute();
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

	.input-wrap {
		margin-top: 1.2rem;

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
}
</style>