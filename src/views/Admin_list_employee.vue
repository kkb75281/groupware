<template lang="pug">
h1 직원 목록

hr

.table-wrap
    .tb-head-wrap
        .input-wrap.search
            input(type="text" placeholder="검색어를 입력하세요")
            button.btn-search

        .tb-toolbar
            .btn-wrap
                button.btn.bg-gray.outline(:disabled="!selectedList.length" @click="removeDivision") 삭제
                button.btn.outline(@click="router.push('/admin/add-employee')") 등록
    .tb-overflow
        table.table#employee_list
            colgroup
                col(style="width: 3rem")
                col(style="width: 3rem")
                col(style="width: 10%")
                col(style="width: 10%")
                col
                col(style="width: 10%")
                col(style="width: 10%")
                col
            thead
                tr
                    th(scope="col")
                        label.checkbox
                            input(type="checkbox" name="checkbox" :checked="isAllSelected" @change="toggleSelectAll")
                            span.label-checkbox
                    th(scope="col") NO
                    th(scope="col") 직책(직급)
                    th(scope="col") 이름
                    th(scope="col") 이메일
                    th(scope="col") 생년월일
                    th(scope="col") 전화번호
                    th(scope="col") 주소

            tbody
                //- tr(v-for="(division, key, index) in divisions")
                //-     td.list-num {{ index + 1 }}
                //-     td.left 
                //-         router-link.go-detail(:to="{ name: 'edit-divisions', query: { record_id: division.record_id } }")
                //-             .img-wrap
                //-                 img(v-if="division.bin && division.bin.division_logo" :src="division.bin['division_logo'][0].url")
                //-             span {{ division.data.division_name }}
                //-     td.pending
                //-     td.received

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
import { useRoute, useRouter } from 'vue-router';
import { ref, computed } from 'vue';
import { skapi } from '@/main';

const router = useRouter();
const route = useRoute();

let emp_division = ref(null);
let divisions = ref(null);
let listNum = ref(1);
let currentPage = ref(1);
let selectedList = ref([]);
let isAllSelected = computed(() => Object.keys(divisions.value).length > 0 && Object.keys(divisions.value).every(key => selectedList.value.includes(key)));

let sessionDivisions = JSON.parse(window.sessionStorage.getItem('divisions'));

// if(!sessionDivisions || Object.keys(sessionDivisions).length < 1) {
//     skapi.getRecords({
//         table: {
//             name: 'divisions',
//             access_group: 99
//         }
//     },
//     ).then(response => {
//         divisions.value = response.list;
//         displayDivisions(response.list)
//     });
// } else {
//     divisions.value = sessionDivisions;
// }

// function displayDivisions(divisions) {
//     let saveSession = {};

//     divisions.forEach((division, index) => {
//         saveSession[division.record_id] = division;
//     });

//     window.sessionStorage.setItem('divisions', JSON.stringify(saveSession));
// }

let toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedList.value = [];
    } else {
        selectedList.value = Object.keys(divisions.value);
    }
}

let toggleSelect = (id) => {
    if (selectedList.value.includes(id)) {
        selectedList.value = selectedList.value.filter(itemId => itemId !== id);
    } else {
        selectedList.value.push(id);
    }
}
</script>

<style scoped lang="less">
#employee_list>a>* {
    vertical-align: middle;
}

.division-logo {
    width: 2rem;
    height: 2rem;
    object-fit: contain;
}

.table-wrap {
    margin-top: 3rem;
}

.go-detail {
    display: flex;
    align-items: center;
    gap: 16px;
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