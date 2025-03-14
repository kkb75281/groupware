<template lang="pug">
h1 결재 양식 관리

hr

.table-wrap
    .tb-head-wrap
        form#searchForm(@submit.prevent="searchDocForm")
            .input-wrap.search
                input(type="text" v-model="searchValue" placeholder="결재 양식명을 입력하세요.")

        .tb-toolbar
            .btn-wrap
                button.btn.outline.refresh-icon(:disabled="loading" @click="refresh")
                    svg(:class="{'rotate' : loading}")
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-refresh")
                button.btn.outline.warning(:disabled="!Object.keys(selectedList).length || loading" @click="deleteDocForm") 삭제
                button.btn.outline(:disabled="loading" @click="router.push('/approval/request-audit?mode=template')") 등록

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
                    th.left(scope="col") 제목

            tbody
                template(v-if="loading")
                    tr.loading(style="border-bottom: none;")
                        td(colspan="3" style="padding: 0; height: initial;")
                            Loading#loading

                template(v-else-if="Object.keys(docFormList).length === 0")
                    tr
                        td(colspan="3") 데이터가 없습니다.
                
                template(v-else)
                    tr(v-for="(docForm, index) in docFormList" :key="docForm.record_id")
                        td 
                            label.checkbox
                                input(type="checkbox" name="checkbox" :checked="Object.keys(selectedList).includes(docForm.record_id)" @click="toggleSelect(docForm.record_id, docForm.data.form_title)")
                                span.label-checkbox
                        td.list-num {{ docFormList.length - index }}
                        td.left
                            router-link.go-detail(:to="{ name: 'form-detail', query: { record_id: docForm.record_id } }")
                                span {{ docForm.data.form_title }}
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { ref, computed, onMounted } from "vue";
import { skapi } from "@/main";
import Loading from "@/components/loading.vue";

const router = useRouter();
const route = useRoute();

// - (마스터) 결재양식 업로드 하는 페이지 추가
//     - 양식 등록, 삭제
// - (본인) 이전 올렸던 결재양식 저장 가능 -> 저장했던 거 불러와서 재사용 가능한 기능 추가
//     - 결재요청시 하단 ‘양식저장’ 버튼 추가
//     - 결재요청시 (이전처럼) step1 으로 마스터가 등록한 양식, 본인이 저장한 양식 selectbox로 따로 불러와서 선택할 수 있게
//     - 만약 아예 새로운 양식으로 결재요청을 하고 싶은 경우엔 ‘새 양식 작성’ 버튼 클릭해서 결재요청하게

const loading = ref(false);
const searchValue = ref('');
const selectedList = ref({});
const docFormList = ref([]); // 결재 양식 리스트
const formTitle = ref(''); // 검색한 결재 양식 제목

const isAllSelected = computed(() => {
    if (docFormList.value.length === 0) return false;

    return docFormList.value.every(docForm => 
        Object.keys(selectedList.value).includes(docForm.record_id)
    );
});

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedList.value = {};
    } else {
        const newSelectedList = {};

        docFormList.value.forEach(docForm => {
            newSelectedList[docForm.record_id] = docForm.data.form_title;
        });
        selectedList.value = newSelectedList;
    }
};

const toggleSelect = (id, name) => {
    if (selectedList.value[id]) {
        delete selectedList.value[id];
        console.log('AA 확인');
    } else {
        selectedList.value[id] = name;
        console.log('BB 확인');
    }
};

// 새로고침
const refresh = () => {
    getDocForm();
};

// 결재 양식 저장한 리스트 가져오기
const getDocForm = async () => {
    loading.value = true;

    const query = {
        table: {
            name: 'audit_form',
            access_group: 1
        },
    }

    const fetchOptions = {
        ascending: false, // 최신순
    }

    const res = await skapi.getRecords(query, fetchOptions);
    docFormList.value = res.list;
    console.log('=== getDocForm === docFormList.value : ', docFormList.value);

    loading.value = false;
    return res;
}

// 결재 양식 검색
const searchDocForm = async () => {
    loading.value = true;

    const res = await skapi.getRecords({
        table: {
            name: 'audit_form',
            access_group: 1
        },
        index: {
            name: 'form_title', // 결재 양식 제목으로 검색
            value: searchValue.value,
            condition: '>='
        },
    });

    if (res.list.length > 0) {
        docFormList.value = res.list;
    } else {
        docFormList.value = [];
    }

    if (!searchValue.value) {
        getDocForm();
    }

    loading.value = false;
}

// 결재 양식 삭제
const deleteDocForm = async () => {
    console.log('결재 양식 삭제');

    if(!Object.keys(selectedList.value).length) {
        alert('삭제할 결재 양식을 선택해주세요.');
        loading.value = false;
        return;
    }

    const deleteList = Object.keys(selectedList.value);
    console.log('=== deleteDocForm === deleteList : ', deleteList);

    let isSuccess = [];
    let isFail = [];

    await Promise.all(deleteList.map((record_id) => {
        return skapi.deleteRecords({
            record_id: record_id
        }).then(res => {
            isSuccess.push(res);
        }).catch(err => {
            console.log('결재 양식 삭제 실패 : ', err);
            isFail.push(err);
            console.log('isFail : ', isFail);
            alert("부서 삭제에 실패하였습니다. 관리자에게 문의해주세요.");
            throw err;
        });
    }));

    if(isSuccess.length > 0) {
        alert(`${isSuccess.length}개의 결재 양식이 삭제되었습니다.`);
        
        docFormList.value = docFormList.value.filter(docForm => !deleteList.includes(docForm.record_id));
    } else {
        alert("결재 양식 삭제에 실패하였습니다.");
    }

    selectedList.value = {}; // 삭제 버튼 비활성화
}

onMounted(() => {
    getDocForm();
});
</script>

<style scoped lang="less">
#divisions_list > a > * {
    vertical-align: middle;
}

.division-logo {
    width: 2rem;
    height: 2rem;
    object-fit: contain;
}

.table-wrap {
    position: relative;
    margin-top: 3rem;

    // #loading {
    //     position: absolute;
    //     top: 126px;
    //     left: 50%;
    //     transform: translateX(-50%);
    // }
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

.img-wrap {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid var(--gray-color-300);
    border-radius: 50%;

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
}
</style>
