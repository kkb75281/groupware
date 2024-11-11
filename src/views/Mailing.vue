<template lang="pug">
.mailing
	.maling-cont
		h3.title 귀하의 초대가 성공적으로 확인되었습니다.

			hr

			p.desc 안녕하세요.<br>그룹웨어에 가입해주셔서 감사합니다.

			router-link.btn.btn-go-login(to="/login") Login
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
	max-width: 800px;
	background-color: #fff;
	border-radius: 16px;
	padding: 3rem 2.4rem;
	margin: 0 auto;
	box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);

	.title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--primary-color-400);
		line-height: 1.3;
	}

	.desc {
		font-size: 1rem;
		color: var(--gray-color-700);
		line-height: 1.6;
	}

	.btn-go-login {
		max-width: 100px;
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