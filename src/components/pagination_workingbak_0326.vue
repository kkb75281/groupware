<template lang="pug">
.pagination
	button.btn-prev.icon(type="button" @click="changePage(currentPageNum - 1)" :disabled="currentPageNum === 1")
		svg
			use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
		| Prev

	button.btn-num(type="button" v-for="page in totalPages" :key="page" :class="{ active: page === currentPageNum }" @click="changePage(page)") {{ page }}

	button.btn-next.icon(type="button" @click="changePage(currentPageNum + 1)" :disabled="currentPageNum === totalPages") Next
		svg
			use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script setup>
import { computed } from 'vue';
import { skapi } from '@/main';

const props = defineProps({
  totalItems: Number, // 총 아이템 개수
  itemsPerPage: Number, // 페이지당 표시할 개수
  currentPageNum: Number, // 현재 페이지
});

// 부모 컴포넌트로 이벤트 전달
const emit = defineEmits(['update:currentPageNum']);

// 전체 페이지 수 계산
const totalPages = computed(() => Math.ceil(props.totalItems / props.itemsPerPage));

// 페이지 변경 핸들러
const changePage = (page) => {
	console.log('page : ', page);

	if (page >= 1 && page <= totalPages.value) {
		emit('update:currentPageNum', page);
	}
};
</script>

<style lang="less" scoped>
.pagination {
	margin-top: 1.5rem;
	display: flex;
	justify-content: center;
	gap: 1rem;

	button {
		width: 1.75rem;
		height: 1.75rem;
		background-color: inherit;
		border: none;
		font-size: 0.8rem;
		font-weight: 400;
		color: var(--gray-color-500);

		display: flex;
		justify-content: center;
		align-items: center;
		gap: 4px;

		&.active,
		&:hover {
			background-color: var(--primary-color-100);
			border-radius: 0.5rem;
			color: var(--primary-color-400);

			&.btn-prev,
			&.btn-next {
				background-color: inherit;

				&.icon {
					svg {
						fill: var(--primary-color-400);
					}
				}
			}
		}

		&.btn-prev,
		&.btn-next {
			width: initial;
			height: initial;

			&.icon {
			padding: 0;

			svg {
				width: 14px;
				height: 14px;
				fill: var(--gray-color-400);
				position: relative;
				top: 1px;
			}
			}
		}
	}
}
</style>