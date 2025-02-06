<template lang="pug">
h1 부서 관리

hr

.table-wrap
    .tb-head-wrap
        form#searchForm(@submit.prevent="searchEmp")
            //- .input-wrap
            //-     select(v-model="searchFor")
            //-         option(value="division") 부서/직책
            //-         option(value="name") 이름
            .input-wrap
                select(name="searchDivision" v-model="searchValue" @change="searchEmp")
                    option(value="전체") 전체

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

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ref, computed, onMounted, watch, nextTick } from "vue";
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
let searchValue = ref('');
let searchPositionValue = ref('');
let isAllSelected = computed(() => {
    let keys = Object.keys(divisions.value);
    return (
        keys.length > 0 &&
        keys.every((key) => Object.keys(selectedList.value).includes(key))
    );
});

let callParams = computed(() => {
    return {
        searchFor: 'timestamp',
        value: new Date().getTime(),
        condition: '<='
    };
});

// watch(searchFor, (nv) => {
//     if (nv) {
//         searchValue.value = '';

//         if(nv === 'division') {
//             nextTick(() => {
//                 displayDivisionOptions('searchDivision');
//                 searchValue.value = '전체';
//             });
//         }
//     }
// });

watch(searchValue, (nv) => {
    if (nv) {
        callParams.value.searchFor = 'timestamp';
        callParams.value.value = new Date().getTime();
        callParams.value.condition = '<=';

        searchEmp();
    }
});

nextTick(() => {
    displayDivisionOptions('searchDivision');
    searchValue.value = '전체';
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
    getDivisionData(true);
};

let deleteDivision = async () => {
    let userId = Object.keys(selectedList.value);
    // console.log('=== deleteDivision === userId : ', userId);

    let name = Object.values(selectedList.value);
    // console.log('=== deleteDivision === name : ', name);

    let filteredData = {};
    let isSuccess = [];
    let isFail = [];

    // 회사 자체 레코드 삭제
    await Promise.all(
        userId.map((el) => {
            return skapi
                .deleteRecords({ record_id: el })
                .then((res) => {
                    // console.log('=== deleteDivision === res : ', res);
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


    let data = divisionNameList.value; // res.list[0].data;          // { 'DF1': '부서명1', 'DF2': '부서명2', ... }
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
        }).then((res) => {
            console.log('=== deleteDivision === res : ', res);
        });
    } catch (error) {
        alert("부서명 리스트를 업데이트하는데 실패하였습니다. 관리자에게 문의해주세요.");
        throw error;
    }

    if (isSuccess.length > 0) {
        alert(`${isSuccess.length}개의 부서가 삭제되었습니다.`);
    } else {
        alert("부서 삭제에 실패하였습니다.");
    }

    // 삭제 버튼 비활성화
    selectedList.value = {};
};

let displayDivisionOptions = (selectName: string) => {
    let divisionList = document.querySelector(`select[name="${selectName}"]`) as HTMLSelectElement;

    // 기존 옵션을 제거하지 않고 새로운 옵션을 추가
    divisionList.innerHTML = ''; // 기존 옵션 초기화

    const allOption = document.createElement('option');
    const defaultOption = document.createElement('option');

    let matchFound = false;

    // 기본 옵션 추가
    if(selectName == 'searchDivision') {
        allOption.value = '전체';
        allOption.innerText = '전체';
        allOption.selected = true;
        divisionList.appendChild(allOption);
    } else {
        defaultOption.disabled = true;
        defaultOption.selected = true;
        defaultOption.innerText = '부서 선택';
        divisionList.appendChild(defaultOption);
    }

    // 동적으로 부서 옵션 추가
    for (let key in divisionNameList.value) {
        if(divisionNameList.value[key] !== '') {
            const option = document.createElement('option');
            option.value = key;
            option.innerText = divisionNameList.value[key];
    
            // 선택된 부서 처리
            if (selectName === 'division' && key === selectedEmp.value.division) {
                option.selected = true;
                matchFound = true;
            }
    
            divisionList.appendChild(option);
        }
    }

    // 일치하는 키가 없으면 기본 옵션에 selected 추가
    if (selectName === 'division' && !matchFound) {
        defaultOption.selected = true;
    }

    // 선택박스 활성화
    divisionList.disabled = false;
}

async function searchEmp(refresh) {
    loading.value = true;
    
    if (!searchValue.value) {
        searchValue.value = '';
        callParams.value.searchFor = 'timestamp';
        callParams.value.value = new Date().getTime();
        callParams.value.condition = '<=';
    }

    try{
        // const res = await skapi.getRecords({
        //     table: {
        //         name: 'emp_position_current',
        //         access_group: 1
        //     },
        //     index: {
        //         name: searchPositionValue.value ? searchValue.value + '.' + searchPositionValue.value : searchValue.value + '.',
        //         value: ' ',
        //         condition: '>'
        //     }
        // });

        let gu = [];

        // res.list.forEach(rec => gu.push(rec.data.user_id));

        const result = [...new Set(gu)]; // 중복 제거

        refresh = refresh === true;

    } finally {
        loading.value = false;
    }
}
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
