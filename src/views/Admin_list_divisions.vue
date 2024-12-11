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
                template(v-else-if="divisions === 'no data' || !divisions || Object.keys(divisions).length === 0")
                    tr
                        td(colspan="5") 데이터가 없습니다.
                template(v-else)
                    tr(v-for="(division, index) in Object.values(divisions)" :key="division.record_id")
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

br
br
br
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import { skapi } from '@/main';
import { loading, divisions, divisionNameList } from '@/division';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

let sessionDivisions = window.sessionStorage.getItem('divisions');

if(!sessionDivisions || Object.keys(sessionDivisions).length < 1) {
    loading.value = true;

    getDivisions();
} else {
    if(sessionDivisions === 'no data') {
        divisions.value = 'no data';
    } else {
        divisions.value = JSON.parse(sessionDivisions);
    }
}

async function getDivisions() {
    try {
        let res = await skapi.getRecords({
            table: {
                name: 'divisions',
                access_group: 99
            }
        });

        divisions.value = res.list;
        displayDivisions(res.list);
    } catch (error) {
        alert('부서 정보를 불러오는데 실패하였습니다. 관리자에게 문의해주세요.');
        throw error;
    } finally {
        loading.value = false;
    }
}

let displayDivisions = (divisions) => {
    let saveSession = {};

    if (!divisions.length) {
        window.sessionStorage.setItem('divisions', 'no data');

        return;
    }

    divisions.forEach((division) => {
        saveSession[division.record_id] = division;
    });

    window.sessionStorage.setItem('divisions', JSON.stringify(saveSession));
}

let currentPage = ref(1);
let selectedList = ref({});
let isAllSelected = computed(() => {
    let keys = Object.keys(divisions.value);
    return keys.length > 0 && keys.every(key => Object.keys(selectedList.value).includes(key));
});

let toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedList.value = {};
    } else {
        for (let key in divisions.value) {
            selectedList.value[key] = divisions.value[key].data.division_name;
        }
    }
}

let toggleSelect = (id, name) => {
    if(selectedList.value[id]) {
        delete selectedList.value[id];
    } else {
        selectedList.value[id] = name;
    }
}

let deleteDivision = async () => {
    let userId = Object.keys(selectedList.value);
    let name = Object.values(selectedList.value);

    let isSuccess = [];
    let isFail = [];

    // 회사 자체 레코드 삭제
    await Promise.all(userId.map(el => {
        return skapi.deleteRecords({record_id: el}).then(res => {
            isSuccess.push(el);
        }).catch(err => {
            // console.log('== err == : ', err)
            isFail.push(el);
        });
    }));

    // 회사 이름 레코드 삭제
    skapi.getRecords({
        unique_id: '[division_name_list]'
    }).then(r => {
        let data = r.list[0].data;  // { 'DF1': '부서명1', 'DF2': '부서명2', ... }
        let keys = Object.keys(data);
        let values = Object.values(data); // '부서명1', '부서명2', ...

        // Set으로 변환 (빠른 검색)
        let nameSet = new Set(name);

        let filteredData = {};

        // 값 비교 및 제외 로직
        for (let i = 0; i < values.length; i++) {
            if (!nameSet.has(values[i])) {
                filteredData[keys[i]] = values[i]; // 제외되지 않은 항목만 추가
            } else {
                filteredData[keys[i]] = '';
            }
        }

        skapi.deleteRecords({
            unique_id: '[division_name_list]'
        }).then(r => {
            skapi.postRecord(filteredData, {
                unique_id: '[division_name_list]',
                table: {
                    name: 'divisionNames',
                    access_group: 1
                }
            })
        })
    })

    getDivisions();

    if (isSuccess.length > 0) {
        alert(`${isSuccess.length}개의 부서가 삭제되었습니다.`);
    } else {
        alert('부서 삭제에 실패하였습니다.');
    }
}
</script>

<style scoped lang="less">
#divisions_list>a>* {
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