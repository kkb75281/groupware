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
                        td.list-num {{ tempSaveList.length - index }}
                        td.left
                            router-link.go-detail(:to="{ name: 'request-audit', query: { record_id: docForm.record_id, mode: 'tempsave' } }")
                                span {{ docForm.data.form_title }}
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import { skapi } from '@/main';
import Loading from '@/components/loading.vue';
import Pager from '@/components/pager';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const selectedList = ref({});
const tempSaveList = ref([]); // 임시저장 리스트

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
const getTempSaveMyDoc = async () => {
    loading.value = true;

    const query = {
        table: {
            name: 'my_tempsave_audit',
            access_group: 'private'
        }
    };

    const fetchOptions = {
        ascending: false // 최신순
    };

    const res = await skapi.getRecords(query, fetchOptions);
    tempSaveList.value = res.list;
    console.log('tempSaveList', tempSaveList.value);

    loading.value = false;
    return res;
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

onMounted(() => {
    getTempSaveMyDoc();
});
</script>

<style scoped lang="less">
.table-wrap {
    position: relative;
    //   margin-top: 3rem;
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
