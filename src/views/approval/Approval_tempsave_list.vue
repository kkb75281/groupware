<template lang="pug">
//- h1 임시 저장함

//- hr

.table-wrap
    .tb-head-wrap
        .tb-toolbar
            .btn-wrap
                button.btn.outline.warning(:disabled="!Object.keys(selectedList).length || loading" @click="deleteDocForm") 삭제

    .tb-overflow
        table.table#docForm_list
            colgroup
                col(style="width: 3rem")
                col(style="width: 3rem")
                col
            thead
                tr
                    th(scope="col")
                        label.checkbox
                            input(type="checkbox" name="checkbox" :checked="isAllSelected" @change="toggleSelectAll")
                            span.label-checkbox
                    th(scope="col") NO
                    th.left(scope="col") 결재 사안

            tbody
                template(v-if="loading")
                    tr.loading(style="border-bottom: none;")
                        td(colspan="3" style="padding: 0; height: initial;")
                            Loading#loading

                template(v-else-if="Object.keys(tempSaveList).length === 0")
                    tr
                        td(colspan="3") 데이터가 없습니다.
                
                template(v-else)
                    tr(v-for="(docForm, index) in tempSaveList" :key="docForm.record_id")
                        td 
                            label.checkbox
                                input(type="checkbox" name="checkbox" :checked="Object.keys(selectedList).includes(docForm.record_id)" @click="toggleSelect(docForm.record_id, docForm.data.form_title)")
                                span.label-checkbox
                        td.list-num {{ index + 1 + (10 * (currentPage - 1)) }}
                        td.left
                            router-link.go-detail(:to="{ name: 'request-audit', query: { record_id: docForm.record_id, mode: 'tempsave' } }")
                                span {{ docForm.data.form_title }}

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
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, onMounted, watch } from 'vue';
import { skapi } from '@/main';
import Loading from '@/components/loading.vue';
import Pager from '@/components/pager';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const selectedList = ref({}); // 선택된 결재 양식 리스트
const tempSaveList = ref([]); // 임시저장 리스트

let pager = null;
const fetching = ref(false); // 데이터를 가져오는 중인지 여부
const maxPage = ref(0); // 최대 페이지 수
const currentPage = ref(1); // 현재 페이지
const endOfList = ref(false); // 리스트의 끝에 도달했는지 여부
const ascending = ref(false); // 오름차순 정렬 여부

const isAllSelected = computed(() => {
    if (tempSaveList.value.length === 0) return false;

    return tempSaveList.value.every((docForm) =>
        Object.keys(selectedList.value).includes(docForm.record_id)
    );
});

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedList.value = {};
    } else {
        const newSelectedList = {};

        tempSaveList.value.forEach((docForm) => {
            newSelectedList[docForm.record_id] = docForm.data.form_title;
        });
        selectedList.value = newSelectedList;
    }
};

const toggleSelect = (id, name) => {
    if (selectedList.value[id]) {
        delete selectedList.value[id];
    } else {
        selectedList.value[id] = name;
    }
};

// 임시 저장한 리스트 가져오기
const getTempSaveMyDoc = async (fetchOptions = {}) => {
    loading.value = true;

    const query = {
        table: {
            name: 'my_tempsave_audit',
            access_group: 'private'
        }
    };

    const options = {
        ascending: false, // 최신순
        ...fetchOptions
    };

    const res = await skapi.getRecords(query, options);
    tempSaveList.value = res.list;
    loading.value = false;
    return {
        list: res.list,
        endOfList: res.endOfList
    };
};

// 결재 양식 삭제
const deleteDocForm = async () => {
    if (!Object.keys(selectedList.value).length) {
        alert('삭제할 결재 양식을 선택해주세요.');
        loading.value = false;
        return;
    }

    const deleteList = Object.keys(selectedList.value);

    let isSuccess = [];
    let isFail = [];

    await Promise.all(
        deleteList.map((record_id) => {
            return skapi
                .deleteRecords({
                    record_id: record_id
                })
                .then((res) => {
                    isSuccess.push(res);
                })
                .catch((err) => {
                    isFail.push(err);
                    alert('부서 삭제에 실패하였습니다. 관리자에게 문의해주세요.');
                    throw err;
                });
        })
    );

    if (isSuccess.length > 0) {
        alert(`${isSuccess.length}개의 결재 양식이 삭제되었습니다.`);

        tempSaveList.value = tempSaveList.value.filter(
            (docForm) => !deleteList.includes(docForm.record_id)
        );
    } else {
        alert('결재 양식 삭제에 실패하였습니다.');
    }

    selectedList.value = {}; // 삭제 버튼 비활성화
};

// pagination
const getPage = async (refresh = false) => {
    if (refresh) {
        endOfList.value = false;
        currentPage.value = 1;
    }

    if (refresh) {
        pager = await Pager.init({
            id: 'record_id',
            resultsPerPage: 10,
            sortBy: 'uploaded',
            order: ascending.value ? 'asc' : 'desc'
        });
    }

    if ((!refresh && maxPage.value >= currentPage.value) || endOfList.value) {
        tempSaveList.value = pager.getPage(currentPage.value).list;
        return;
    } else if (!endOfList.value || refresh) {
        fetching.value = true;

        try {
            // fetch from server
            let fetchOptions = Object.assign(
                { fetchMore: !refresh },
                { limit: 10, ascending: false }
            );
            let fetchedData = await getTempSaveMyDoc(fetchOptions);

            // save endOfList status
            endOfList.value = fetchedData.endOfList;

            // insert data in pager
            if (fetchedData.list.length > 0) {
                await pager.insertItems(fetchedData.list);
            }

            // get page from pager
            let disp = pager.getPage(currentPage.value);

            // set maxpage
            maxPage.value = disp.maxPage;

            // render data
            tempSaveList.value = disp.list;
        } catch (error) {
            console.error('Error getting page:', error);
            tempSaveList.value = [];
        } finally {
            fetching.value = false;
        }
    }
};

// 페이지 변경 시 데이터 가져오기
watch(currentPage, (n, o) => {
    if (n !== o && n > 0 && (n <= maxPage.value || (n > maxPage.value && !endOfList.value))) {
        getPage();
    } else {
        currentPage.value = o; // 페이지가 유효하지 않으면 이전 페이지로 되돌리기
    }
});

onMounted(async () => {
    await getPage(true);
});
</script>

<style scoped lang="less">
.table-wrap {
    position: relative;
}

.go-detail {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 16px;

    span {
        white-space: nowrap;
    }
}
</style>
