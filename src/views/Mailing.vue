<template lang="pug">
.mailing
	.maling-cont
		h2.title 회원 인증 완료

		hr(style="margin-bottom: 1.5rem")

		p.desc 
			| 회원 인증이 완료되었습니다.
			br
			| 로그인 페이지로 이동하여 로그인해주세요.

		router-link.btn.btn-go-login(to="/login") 로그인 화면으로
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
</script>

<style scoped lang="less">
.mailing {
	margin: 10% 16px 0;
}

.maling-cont {
	max-width: 500px;
    background-color: var(--primary-color-100);
    border-radius: 16px;
    padding: 2.5rem 2rem;
    margin: 0 auto;

	.title {
		font-weight: 700;
		color: var(--primary-color-400);
		line-height: 1.3;
	}

	.desc {
		color: var(--gray-color-700);
		line-height: 1.6;
	}

	.btn-go-login {
		// max-width: 100px;
		margin: 4rem auto 0;
	}
}

@media (max-width: 768px) {
	.maling-cont {
		padding-left: 1.4rem;
		padding-right: 1.4rem;
	}
}
</style>