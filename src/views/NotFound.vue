<template lang="pug">
.error
	.icon
		svg
			use(xlink:href="@/assets/icon/material-icon.svg#icon-warning-triangle")
	h4.title #[strong 요청하신 페이지 및 주소]를 찾을 수 없습니다.
	p.desc URL을 확인하고 다시 시도해 주세요.

	.btn-wrap
		.btn
			router-link(to="/") 홈으로
</template>

<script setup>
import { ref } from 'vue';
import Loading from '@/components/loading.vue';
</script>

<style scoped lang="less">
.error {
    text-align: center;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    padding: 0.5rem;
    word-break: keep-all;
}

.icon {
	padding: 0;
	margin-bottom: 1.5rem;

	svg {
		width: 3.5rem;
		height: 3.5rem;
		fill: var(--warning-color-500);
		margin: 0 auto;
	}
}

.title {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.4;
	margin-bottom: 0.5rem;

    strong {
        color: var(--primary-color-400);
    }
}

.desc {
	margin-bottom: 2rem;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.4;
    color: var(--gray-color-500);
}

.btn-wrap {
    .btn {
        width: fit-content;
        margin: 0 auto;
    }
}
</style>