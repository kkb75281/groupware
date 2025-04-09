<template lang="pug">
h1 근태 기록 상세

hr

.table-wrap
    .tb-head-wrap
        //- .input-wrap.search
        //-     input(type="text" placeholder="검색어를 입력하세요")
        //-     button.btn-search

        .tb-toolbar
            .btn-wrap
                button.btn.outline.refresh-icon(:disabled="loading" @click="refresh")
                    svg(:class="{'rotate' : loading}")
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-refresh")
                button.btn.bg-gray.btn-prev(@click="router.push('/admin/list-commute')") 이전
    .tb-overflow
        template(v-if="loading")
            Loading#loading
        table.table#tb-record-empCommute-detail
            colgroup
                col(style="width: 10%")
                col(style="width: 10%")
                col(style="width: 10%")
                col(style="width: 10%")
                col(style="width: 10%")
            thead
                tr
                    th(scope="col") 날짜
                    th(scope="col") 출근
                    th(scope="col") 퇴근
                    th(scope="col") 근무시간
                    th(scope="col") 비고

            tbody
                template(v-if="loading")
                    tr(v-for="i in 5")
                template(v-else-if="!commuteRecords || commuteRecords.length === 0")
                    tr
                        td(colspan="5") 데이터가 없습니다.
                template(v-else)
                    tr(v-for="(record, index) in commuteRecords" :key="record.record_id")
                        td.date {{ record.data.date }}
                        td.startWork {{ extractTimeFromDateTime(record.data.startTime) }}
                        td.endWork {{ extractTimeFromDateTime(record.data.endTime) }}
                        td.work-time {{ record.data.dailyCommuteTime }}
                        td.remark {{ record.data.remark }}
                            //- .input-wrap
                            //-     input(type="text" :value="record.data.remark" readonly)

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
import { ref, onMounted } from "vue";
import { skapi } from "@/main.ts";
import { user, makeSafe } from '@/user.ts';
import { extractTimeFromDateTime } from "@/utils/time.ts";

import Loading from "@/components/loading.vue";

const router = useRouter();
const route = useRoute();
const userId = route.params.userId;

const loading = ref(false);
const commuteRecords = ref(null);

const getEmpCommute = async (userId) => {
    try {
        const query = {
            table: {
                name: 'commute_record',
                access_group: 98,
            },
            reference: "emp_id:" + makeSafe(userId),
        };

        const fetchOptions = {
            ascending: false
        };

        const res = await skapi.getRecords(query, fetchOptions);
        const commuteList = res?.list?.sort((a, b) => b.uploaded - a.uploaded);

        return commuteList;
    } catch (error) {
        console.log('=== getEmpCommute === error : ', {error});
    }
}

// 새로고침
const refresh = async() => {
    loading.value = true;

    const commuteList = await getEmpCommute(userId);
    commuteRecords.value = commuteList;

    loading.value = false;
};

onMounted(async () => {
    const commuteList = await getEmpCommute(userId);
    commuteRecords.value = commuteList;
});
</script>

<style scoped lang="less">
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
.table {
    min-width: 31rem;

    tbody {
        tr {
            &:hover {
                background-color: transparent;
            }
        }
    }
}

.input-wrap {
    input {
        &:hover,
        &:focus {
            border-color: var(--gray-color-200);
            cursor: default;
        }
    }
}
</style>
