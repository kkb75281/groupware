<template lang="pug">
.table-wrap
  .tb-overflow
    table.table(:id="tableId")
      colgroup
        slot(name="colgroup")
      
      thead
        tr
          slot(name="thead")
      
      tbody
        template(v-if="loading")
          tr.nohover.loading(style="border-bottom: unset;")
            td(:colspan="colSpan")
              Loading#loading
        
        template(v-else-if="!items || !items.length")
          tr.nohover
            td(:colspan="colSpan") {{ emptyMessage }}
        
        template(v-else)
          slot(name="tbody" :items="items" :startIndex="startIndex")

.pagination
  button.btn-prev.icon(
    type="button"
    :class="{ nonClickable: loading || currentPage <= 1 }"
    @click="goToPrevPage"
  )
    svg
      use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
    | Prev

  button.btn-next.icon(
    type="button"
    :class="{ nonClickable: loading || (endOfList && currentPage >= maxPage) }"
    @click="goToNextPage"
  )
    | Next
    svg
      use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Pager from '@/components/pager.ts';
import Loading from '@/components/loading.vue';

interface Props {
    tableId: string;
    colSpan: number;
    emptyMessage: string;
    fetchFunction: (options: any) => Promise<{ list: any[]; endOfList: boolean }>;
    sortBy?: string;
    ascending?: boolean;
    resultsPerPage?: number;
    idField?: string;
}

const props = withDefaults(defineProps<Props>(), {
    sortBy: 'uploaded',
    ascending: false,
    resultsPerPage: 10,
    idField: 'record_id'
});

const emit = defineEmits<{
    (e: 'pageChange', page: number): void;
    (e: 'itemsLoaded', items: any[]): void;
}>();

// 상태 관리
const loading = ref(false);
const currentPage = ref(1);
const maxPage = ref(0);
const endOfList = ref(false);
const items = ref<any[]>([]);

let pager: Pager | null = null;

// 계산된 속성
const startIndex = computed(() => (currentPage.value - 1) * props.resultsPerPage);

// 페이지 데이터 로드
const loadPage = async (refresh = false) => {
    loading.value = true;

    if (refresh) {
        endOfList.value = false;
        currentPage.value = 1;
    }

    try {
        // 페이저 초기화
        if (refresh || !pager) {
            pager = await Pager.init({
                id: props.idField,
                resultsPerPage: props.resultsPerPage,
                sortBy: props.sortBy,
                order: props.ascending ? 'asc' : 'desc'
            });
        }

        // 이미 로드된 페이지인지 확인
        if (!refresh && maxPage.value >= currentPage.value && !endOfList.value) {
            const pageData = pager.getPage(currentPage.value);
            items.value = pageData.list;
            return;
        }

        // 서버에서 데이터 가져오기
        if (!endOfList.value || refresh) {
            const fetchOptions = {
                fetchMore: !refresh,
                limit: props.resultsPerPage,
                ascending: props.ascending
            };

            const fetchedData = await props.fetchFunction(fetchOptions);

            // endOfList 상태 저장
            endOfList.value = fetchedData.endOfList || false;

            // 페이저에 데이터 삽입
            if (Array.isArray(fetchedData.list) && fetchedData.list.length > 0) {
                await pager.insertItems(fetchedData.list);
            }

            // 페이지 데이터 가져오기
            const pageData = pager.getPage(currentPage.value);
            items.value = pageData.list;
            maxPage.value = pageData.maxPage;

            // 이벤트 발송
            emit('itemsLoaded', items.value);
        }
    } catch (error) {
        console.error('페이지 로드 실패:', error);
        items.value = [];
    } finally {
        loading.value = false;
    }
};

// 페이지 이동 함수들
const goToPrevPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
    }
};

const goToNextPage = () => {
    if (
        currentPage.value < maxPage.value ||
        (!endOfList.value && currentPage.value >= maxPage.value)
    ) {
        currentPage.value++;
    }
};

// 외부에서 호출할 수 있는 함수들
const refresh = () => {
    loadPage(true);
};

const deleteItem = async (itemId: string) => {
    if (pager) {
        await pager.deleteItem(itemId);
        const pageData = pager.getPage(currentPage.value);
        items.value = pageData.list;
        maxPage.value = pageData.maxPage;

        // 현재 페이지에 아이템이 없으면 이전 페이지로
        if (items.value.length === 0 && currentPage.value > 1) {
            currentPage.value--;
        }
    }
};

const updateItem = async (item: any) => {
    if (pager) {
        await pager.editItem(item);
        const pageData = pager.getPage(currentPage.value);
        items.value = pageData.list;
        maxPage.value = pageData.maxPage;
    }
};

// 페이지 변경 감시
watch(currentPage, (newPage, oldPage) => {
    if (
        newPage !== oldPage &&
        newPage > 0 &&
        (newPage <= maxPage.value || (newPage > maxPage.value && !endOfList.value))
    ) {
        loadPage();
        emit('pageChange', newPage);
    } else if (newPage !== oldPage) {
        currentPage.value = oldPage;
    }
});

// 컴포넌트 마운트 시 초기 로드
onMounted(() => {
    loadPage(true);
});

// 외부에서 사용할 수 있도록 expose
defineExpose({
    refresh,
    deleteItem,
    updateItem,
    currentPage: computed(() => currentPage.value),
    maxPage: computed(() => maxPage.value),
    loading: computed(() => loading.value),
    endOfList: computed(() => endOfList.value)
});
</script>

<style scoped lang="less">
.table-wrap {
    .loading {
        position: relative;
        border-bottom: unset;

        #loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
    }
}

.pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;

    .btn-prev,
    .btn-next {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid var(--gray-color-300);
        background: white;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover:not(.nonClickable) {
            background: var(--gray-color-50);
            border-color: var(--gray-color-400);
        }

        &.nonClickable {
            pointer-events: none;
            opacity: 0.5;
            cursor: not-allowed;
        }

        svg {
            width: 1rem;
            height: 1rem;
            fill: var(--gray-color-600);
        }
    }
}

.nohover {
    &:hover {
        background-color: transparent !important;
    }
}
</style>
