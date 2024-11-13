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
                button.btn.outline.warning(:disabled="!selectedList.length" @click="removeDivision") 삭제
                button.btn.outline(@click="router.push('/admin/add-employee')") 등록
    .tb-overflow
        template(v-if="loading")
            Loading#loading
        table.table#employee_list
            colgroup
                col(style="width: 3rem;")
                col(style="width: 3rem;")
                col(style="width: 5rem;")
                col(style="width: 10%;")
                col(style="width: 25%;")
                col(style="width: 11%;")
                col(style="width: 10%; min-width: 6rem;")
                col(style="width: 10%; min-width: 6rem;")
                col(style="min-width: 15rem;")
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
                    th(scope="col") 초청여부
                    th(scope="col") 생년월일
                    th(scope="col") 전화번호
                    th(scope="col") 주소

            tbody
                template(v-if="loading")
                    tr(v-for="i in 4")
                template(v-else-if="!employee")
                    tr
                        td(colspan="8") 데이터가 없습니다.
                template(v-else)
                    tr(v-for="(employee, index) in employee")
                        td
                            label.checkbox
                                input(type="checkbox" name="checkbox" :checked="selectedList.includes(employee.user_id)" @click="toggleSelect(employee.user_id)")
                                span.label-checkbox
                        td.list-num {{ index + 1 }}
                        td {{ employee.access_group }}
                        td {{ employee.name }}
                        td {{ employee.email }}
                        td
                            .btn-wrap
                                button.btn.bg-gray.sm 재전송
                                button.btn.bg-gray.sm 초청취소
                        td {{ employee.birthdate }}
                        td {{ employee.phone_number }}
                        td {{ employee.address }}

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
import { ref, computed } from 'vue';
import { skapi } from '@/main';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

let loading = ref(false);
let currentPage = ref(1);
let selectedList = ref([]);
let isAllSelected = computed(() => {
    return selectedList.value.length > 0 && employee.value.every(emp => selectedList.value.includes(emp.user_id));
});

let sessionEmployee = JSON.parse(window.sessionStorage.getItem('employees'));
let employee = ref(sessionEmployee || []);

skapi.getInvitations().then(res => {
        console.log('=== getInvitations === res : ', res);
        
    });

if (!employee.value.length) {
    loading.value = true;

    skapi.getInvitations().then(res => {
        console.log('=== getInvitations === res : ', res);
        employee.value = res.list;
        displayEmployee(res.list);
        loading.value = false;
    });
} else {
    loading.value = false;
}

function displayEmployee(employee) {
    window.sessionStorage.setItem('employees', JSON.stringify(employee));
}

let toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedList.value = [];
    } else {
        selectedList.value = employee.value.map(item => item.user_id);
    }
}

let toggleSelect = (el) => {
    if (selectedList.value.includes(el)) {
        selectedList.value = selectedList.value.filter(itemId => itemId !== el);
    } else {
        selectedList.value.push(el);
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