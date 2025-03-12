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
                //- button.btn.outline(:disabled="loading" @click="router.push('/approval/request-audit')") 등록
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
                //- template(v-else-if="Object.keys(divisions).length === 0")
                    tr
                        td(colspan="3") 데이터가 없습니다.
                //- template(v-else)
                    tr(v-for="(division, keys, index) in divisions" :key="division.record_id")
                        td 
                            label.checkbox
                                input(type="checkbox" name="checkbox" :checked="Object.keys(selectedList).includes(division.record_id)" @click="toggleSelect(division.record_id, division.data.division_name)")
                                span.label-checkbox
                        td.list-num {{ index + 1 }}
                        td.left 
                            router-link.go-detail(:to="{ name: 'edit-divisions', query: { record_id: division.record_id } }")
                                .img-wrap
                                    img(v-if="division.bin && division.bin.division_logo" :src="division.bin['division_logo'][0].url")
                                span {{ division.data.division_name }}
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { ref, computed } from "vue";
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
const selectedList = ref({});
const searchValue = ref('');
// const isAllSelected = computed(() => {
//     let keys = Object.keys(divisions.value);
//     return (
//         keys.length > 0 &&
//         keys.every((key) => Object.keys(selectedList.value).includes(key))
//     );
// });

// const toggleSelectAll = () => {
//     if (isAllSelected.value) {
//         selectedList.value = {};
//     } else {
//         for (let key in divisions.value) {
//             selectedList.value[key] = divisions.value[key].data.division_name;
//         }
//     }
// };

const toggleSelect = (id, name) => {
    if (selectedList.value[id]) {
        delete selectedList.value[id];
    } else {
        selectedList.value[id] = name;
    }
};

const refresh = () => {

};
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
