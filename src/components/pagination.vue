<template lang="pug">
.pagination
    button.btn-prev.icon(type="button" @click="currentPage--;" :class="{'nonClickable': fetching || currentPage <= 1 }")
        svg
            use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
        | Prev

    button.btn-next.icon(type="button" @click="currentPage++;" :class="{'nonClickable': fetching || endOfList && currentPage >= maxPage }") Next
        svg
            use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import Pager from '@/components/pager';

defineProps({
    fetchFunction: {
        type: Function,
        required: true
    },
    ascending: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:pageData']);
console.log('emit', emit);

let pager = null;
const fetching = ref(false); // 데이터를 가져오는 중인지 여부
const maxPage = ref(0); // 최대 페이지 수
const currentPage = ref(1); // 현재 페이지
const endOfList = ref(false); // 리스트의 끝에 도달했는지 여부

const loadPage = async (refresh = false) => {
    if (refresh) {
        endOfList.value = false;
        currentPage.value = 1;
        pager = await Pager.init({
            id: 'record_id',
            resultsPerPage: 10,
            sortBy: 'uploaded',
            order: props.ascending ? 'asc' : 'desc'
        });
    }

    // 이미 로드된 페이지 범위 내거나 endOfList면 그대로 반환
    if ((!refresh && maxPage.value >= currentPage.value) || endOfList.value) {
        emit('update:pageData', pager.getPage(currentPage.value).list);
        return;
    } else if (!endOfList.value || refresh) {
        fetching.value = true;

        try {
            const fetchedData = await props.fetchFunction({
                fetchMore: !refresh,
                limit: 10,
                ascending: props.ascending
            });

            endOfList.value = fetchedData.endOfList;

            if (fetchedData.list.length > 0) {
                await pager.insertItems(fetchedData.list);
            }

            const disp = pager.getPage(currentPage.value);
            maxPage.value = disp.maxPage;

            emit('update:pageData', disp.list);
        } catch (error) {
            console.error('Error getting page:', error);
            emit('update:pageData', []);
        } finally {
            fetching.value = false;
        }
    }
};

// 페이지 변경 시 데이터 가져오기
watch(currentPage, (n, o) => {
    if (n !== o && n > 0 && (n <= maxPage.value || (n > maxPage.value && !endOfList.value))) {
        loadPage();
    } else {
        currentPage.value = o; // 페이지가 유효하지 않으면 이전 페이지로 되돌리기
    }
});

onMounted(async () => await loadPage(true));
</script>
