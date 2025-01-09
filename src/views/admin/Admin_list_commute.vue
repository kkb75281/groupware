<template lang="pug">
h1 근태 관리

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
                button.btn.outline.btn-edit-workTime(@click="router.push('/admin/edit-worktime')") 시간 설정
    .tb-overflow
        template(v-if="loading")
            Loading#loading
        table.table#divisions_list
            colgroup
                col(style="width: 3rem")
                col(style="width: 10%")
                col
                col
            thead
                tr
                    th(scope="col") NO
                    th(scope="col") 이름
                    th(scope="col") 부서명
                    th(scope="col") 출근시간
                    th(scope="col") 퇴근시간

            tbody
                template(v-if="loading")
                    tr(v-for="i in 5")
                template(v-else-if="Object.keys(divisions).length === 0")
                    tr
                        td(colspan="5") 데이터가 없습니다.
                template(v-else)
                    tr(v-for="(division, keys, index) in divisions" :key="division.record_id")
                        td.list-num {{ index + 1 }}
                        td.user-name
                                span {{ division.data.division_name }}
                        td.dvs {{ division.data.division_name }}
                        td.startWork
                            span.time 00:00:00 ~ 00:00:00
                        td.endWork
                            span.time 00:00:00 ~ 00:00:00

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
import { getEmpDivisionPosition, empInfo, employeeDict, getUsers, getInvitations, getUserCache, getInvitationsCache } from '@/employee';

import Loading from "@/components/loading.vue";

const router = useRouter();
const route = useRoute();


// let currentPage = ref(1);

const employee = ref([]);
const empDivision = ref(null);

const startTimeMin = ref("");
const startTimeMax = ref("");
const endTimeMin = ref("");
const endTimeMax = ref("");

empDivision.value = divisions.value;

console.log('=======================================');
console.log('=== divisions : ', divisions);
console.log('=== empDivision.value : ', empDivision.value);

const getEmpList = async () => {
    try {
        const empList = await skapi.getUsers();
        employee.value = empList;

        console.log('=== getEmpList === employee.value : ', employee.value);
    } catch (error) {
        console.error('=== getEmpList === error : ', error);
        employee.value = [];
    }
};

// 새로고침
const refresh = () => {
    getDivisionData(true);
};


onMounted(() => {
    getDivisionData();
    getEmpList();

    console.log('=== onMounted === employee.value : ', employee.value);
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

.modal {
    .item-wrap {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 16px;

        .label {
            flex: none;
        }
    }

    .input-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 0;
        flex: 1;
    }
}
</style>
