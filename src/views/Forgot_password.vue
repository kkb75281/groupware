<template lang="pug">
#forgot
	template(v-if="step < 4")
		router-link.logo(to="/")
			//- img(src="@/assets/img/img_logo_symbol.png")
			p 로고영역

		h2.title Forgot Password
		p.desc Request verification code to reset password.<br>Enter login email and click Request Code.
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { skapi } from "@/main";
import { ref, watch, onMounted } from 'vue';

const router = useRouter();
const route = useRoute();
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
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--gray-color-400);
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