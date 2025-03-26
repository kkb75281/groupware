<template lang="pug">
.pagination
	button.btn-prev.icon(type="button" @click="onPrevSection" :disabled="leftmostPage <= 1" :class="{ disabled: leftmostPage <= 1 }")
		svg
			use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
		| Prev

	.btn-num-wrap(v-for="page in paginationArray" :key="page")
		button.btn-num(type="button" :class="{ on: page === currentPage }" @click="() => onChangeCurrentPage(page)") {{ page }}

	button.btn-next.icon(type="button" @click="onNextSection" :disabled="leftmostPage + PAGE_PER_SECTION > totalPage" :class="{ disabled: leftmostPage + PAGE_PER_SECTION > totalPage }") Next
		svg
			use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
	// 전체 데이터 배열
	list: {
		type: Array,
		required: true
	},
	// 한 페이지에 표시할 항목 수 (기본값: 5)
	ITEM_PER_PAGE: {
		type: Number,
		default: 5
	},
	// 한 섹션에 표시할 페이지 번호 개수 (기본값: 5)
	PAGE_PER_SECTION: {
		type: Number,
		default: 5
	},
	// 초기 페이지 번호 (기본값: 1)
	initialPage: {
		type: Number,
		default: 1
	}
});

// 부모 컴포넌트로 이벤트 발생 (페이지 변경 시 상위 컴포넌트에 알릴 이벤트를 정의)
const emit = defineEmits(["change-page"]);

const currentPage = ref(props.initialPage); // 현재 페이지 번호
const leftmostPage = ref(1); // 현재 섹션의 첫 페이지 번호

// 전체 페이지 수 계산
const totalPage = computed(() => {
	// 전체 항목 수를 페이지당 항목 수로 나누고 올림하여 계산
	return Math.ceil((props.list?.length || 0) / props.ITEM_PER_PAGE);
});

// 현재 섹션에 표시할 페이지 번호 배열
const paginationArray = computed(() => {
	const result = [];
	const start = leftmostPage.value;
	const end = Math.min(start + props.PAGE_PER_SECTION, totalPage.value + 1);

	for (let i = start; i < end; i++) {
		result.push(i);
	}

	return result;
});

// 현재 페이지 변경 함수
const onChangeCurrentPage = (page) => {
	console.log('== onChangeCurrentPage == page : ', page);
	currentPage.value = page;
	emit('change-page', page); // 부모 컴포넌트에 이벤트 발생
};

// 이전 섹션으로 이동
const onPrevSection = () => {
	console.log('이전 섹션으로 이동');
	if (leftmostPage.value <= 1) return;

	leftmostPage.value = Math.max(1, leftmostPage.value - props.PAGE_PER_SECTION);
	// 섹션이 변경되면 해당 섹션의 첫 페이지로 이동
	onChangeCurrentPage(leftmostPage.value);
};

// 다음 섹션으로 이동
const onNextSection = () => {
	console.log('다음 섹션으로 이동');
	if (leftmostPage.value + props.PAGE_PER_SECTION > totalPage.value) return;

	leftmostPage.value = leftmostPage.value + props.PAGE_PER_SECTION;
	// 섹션이 변경되면 해당 섹션의 첫 페이지로 이동
	onChangeCurrentPage(leftmostPage.value);
};

// 초기화 시점에 현재 페이지 설정
onMounted(() => {
	currentPage.value = props.initialPage;
	// 현재 페이지가 속한 섹션의 시작 페이지 계산
	leftmostPage.value = Math.floor((currentPage.value - 1) / props.PAGE_PER_SECTION) * props.PAGE_PER_SECTION + 1;
});

// 현재 페이지가 변경될 때 leftmostPage 업데이트
watch(currentPage, (newPage) => {
	// 현재 페이지가 현재 섹션 범위를 벗어나면 적절한 섹션으로 이동
	if (newPage < leftmostPage.value || newPage >= leftmostPage.value + props.PAGE_PER_SECTION) {
		// 페이지에 맞는 섹션의 시작 페이지 계산
		leftmostPage.value = Math.floor((newPage - 1) / props.PAGE_PER_SECTION) * props.PAGE_PER_SECTION + 1;
	}
});

// 리스트가 변경될 때 처리
watch(() => props.list, () => {
	// 현재 페이지가 전체 페이지 수보다 크면 첫 페이지로 이동
	if (currentPage.value > totalPage.value && totalPage.value > 0) {
		onChangeCurrentPage(1);
		leftmostPage.value = 1;
	}
}, { deep: true });
</script>

<style lang="less" scoped>
.pagination {
	margin-top: 1.5rem;
	display: flex;
	justify-content: center;
	align-items: center;
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
		cursor: pointer;

		&.on,
		&:hover:not(.disabled) {
			background-color: var(--primary-color-100);
			border-radius: 0.5rem;
			color: var(--primary-color-400);
		}

		&.disabled {
			opacity: 0.2;
			cursor: default;
		}
	}

	.btn-prev,
	.btn-next {
		width: auto;
		height: auto;
		padding: 0.25rem 0.5rem;

		svg {
			width: 14px;
			height: 14px;
			fill: var(--gray-color-400);
			position: relative;
			top: 1px;
		}

		&:hover:not(.disabled) {
			background-color: inherit;
			
			svg {
				fill: var(--primary-color-400);
			}
		}		
	}
}
</style>