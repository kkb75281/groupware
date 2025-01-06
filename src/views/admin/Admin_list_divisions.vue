<template lang="pug">
h1 부서 관리

hr

.table-wrap
    .tb-head-wrap
        .input-wrap.search
            input(type="text" placeholder="검색어를 입력하세요")
            button.btn-search

        .tb-toolbar
            .btn-wrap
                button.btn.outline.refresh-icon(:disabled="loading" @click="refresh")
                    svg(:class="{'rotate' : loading}")
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-refresh")
                button.btn.outline.warning(:disabled="!Object.keys(selectedList).length" @click="deleteDivision") 삭제
                button.btn.outline(@click="router.push('/admin/add-divisions')") 등록
    .tb-overflow
        template(v-if="loading")
            Loading#loading
        table.table#divisions_list
            colgroup
                col(style="width: 3rem")
                col(style="width: 3rem")
                col
                col(style="width: 10%")
                col(style="width: 10%")
            thead
                tr
                    th(scope="col")
                        label.checkbox
                            input(type="checkbox" name="checkbox" :checked="isAllSelected" @change="toggleSelectAll")
                            span.label-checkbox
                    th(scope="col") NO
                    th.left(scope="col") 부서명
                    th(scope="col") 미결
                    th(scope="col") 수신참조

            tbody
                template(v-if="loading")
                    tr(v-for="i in 4")
                //- template(v-else-if="divisions === 'no data' || !divisions || Object.keys(divisions).length === 0")
                template(v-else-if="Object.keys(divisions).length === 0")
                    tr
                        td(colspan="5") 데이터가 없습니다.
                template(v-else)
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
                        td.pending
                        td.received

    //- .pagination
        button.btn-prev.icon(type="button") 
            svg
                use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
            | Prev
        button.btn-next.icon(type="button" @click="currentPage++;" :class="{'nonClickable': endOfList && currentPage >= maxPage }") Next
            svg
                use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { ref, computed, onMounted } from "vue";
import { skapi } from "@/main";
import {
    loading,
    divisions,
    divisionNameList,
    getDivisionData,
    getDivisionDataRunning,
    getDivisionNamesRunning,
} from "@/division";

import Loading from "@/components/loading.vue";

const router = useRouter();
const route = useRoute();

let currentPage = ref(1);
let selectedList = ref({});
let isAllSelected = computed(() => {
    let keys = Object.keys(divisions.value);
    return (
        keys.length > 0 &&
        keys.every((key) => Object.keys(selectedList.value).includes(key))
    );
});

let toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedList.value = {};
    } else {
        for (let key in divisions.value) {
            selectedList.value[key] = divisions.value[key].data.division_name;
        }
    }
};

let toggleSelect = (id, name) => {
    if (selectedList.value[id]) {
        delete selectedList.value[id];
    } else {
        selectedList.value[id] = name;
    }
};

let refresh = () => {
    // loading.value = true;

    // getDivisions();
    getDivisionData(true);
};

let deleteDivision = async () => {
    let userId = Object.keys(selectedList.value);
    console.log({ userId });
    let name = Object.values(selectedList.value);

    let filteredData = {};
    let isSuccess = [];
    let isFail = [];

    // 회사 자체 레코드 삭제
    await Promise.all(
        userId.map((el) => {
            return skapi
                .deleteRecords({ record_id: el })
                .then((res) => {
                    isSuccess.push(el);
                    delete divisions.value[el];
                })
                .catch((err) => {
                    isFail.push(el);
                    alert("부서 삭제에 실패하였습니다. 관리자에게 문의해주세요.");
                    throw err;
                });
        })
    );

    // 부서명 리스트 비교 및 지울 항목 제외한 데이터 생성
    // try {
    // let res = await skapi.getRecords({
    //     unique_id: '[division_name_list]'
    // });

    let data = divisionNameList; // res.list[0].data;          // { 'DF1': '부서명1', 'DF2': '부서명2', ... }
    let keys = Object.keys(data); // 'DF1', 'DF2', ...
    let values = Object.values(data); // '부서명1', '부서명2', ...
    let nameSet = new Set(name); // Set으로 변환 (빠른 검색)

    // 값 비교 및 제외 로직
    for (let i = 0; i < values.length; i++) {
        if (!nameSet.has(values[i])) {
            filteredData[keys[i]] = values[i]; // 제외되지 않은 항목만 추가
        } else {
            filteredData[keys[i]] = "";
        }
    }
    // } catch (error) {
    //     alert('부서명 리스트를 불러오는데 실패하였습니다. 관리자에게 문의해주세요.');
    //     throw error;
    // }

    // 부서명 리스트 삭제
    try {
        await skapi.deleteRecords({
            unique_id: "[division_name_list]",
        });
    } catch (error) {
        alert("부서명 리스트를 삭제하는데 실패하였습니다. 관리자에게 문의해주세요.");
        throw error;
    }

    // 부서명 리스트 업데이트
    try {
        await skapi.postRecord(filteredData, {
            unique_id: "[division_name_list]",
            table: {
                name: "divisionNames",
                access_group: 1,
            },
        });
    } catch (error) {
        alert("부서명 리스트를 업데이트하는데 실패하였습니다. 관리자에게 문의해주세요.");
        throw error;
    }

    // getDivisions(); // 이미 promise.all에서 삭제되었으므로 불필요

    if (isSuccess.length > 0) {
        alert(`${isSuccess.length}개의 부서가 삭제되었습니다.`);
    } else {
        alert("부서 삭제에 실패하였습니다.");
    }
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

    #loading {
        position: absolute;
        top: 126px;
        left: 50%;
        transform: translateX(-50%);
    }
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
