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
        table.table#tb-record-empCommute
            colgroup
                col(style="width: 3rem")
                col(style="width: 10%")
                col(style="width: 10%")
                col(style="width: 20%")
                col
                col
            thead
                tr
                    th(scope="col") NO
                    th(scope="col") 이름
                    th(scope="col") 직급
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
                    tr(v-for="(emp, index) in employee" :key="emp.user_id" @click.stop="(e) => goToEmpCommute(e, emp.user_id)")
                        td.list-num {{ index + 1 }}
                        td.user-name
                                span {{ emp.name }}
                        td.dvs {{ emp?.position }}
                        td.dvs {{ emp?.divisionName }}
                        td.startWork
                            span.time {{ emp.startWork }}
                        td.endWork
                            span.time {{ emp.endWork }}

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
import { user, makeSafe } from '@/user';
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

// console.log('=======================================');
// console.log('=== divisions : ', divisions);
// console.log('=== empDivision.value : ', empDivision.value);

const getEmpList = async () => {
    const newEmpList = [];

    try {
        const empList = await skapi.getUsers();

        empList.list.pop(); // 최고 마스터 제거

        const workTime = await skapi.getRecords({
            table:  {
                name: 'dvs_workTime_setting',
                access_group: 1
            },
        });

        function getTimestampFromTimeString(timeString) {
            // 현재 날짜 가져오기
            const today = new Date();

            // 입력된 시간 문자열 분리 (시, 분, 초)
            const [hours, minutes, seconds] = timeString.split(':').map(Number);

            // 오늘 날짜에 입력된 시간 설정
            today.setHours(hours, minutes, seconds, 0);

            // 타임스탬프 반환 (밀리초 기준)
            return today.getTime();
        }

        const hrStartTime = workTime.list.find(wt => (wt.data?.division_name === '개발팀'))?.data.division_startTime.min;
        // console.log('=== HR Start Time: ', hrStartTime);

        const empPromises = empList.list.map(async (emp) => {
            const user_id_safe = makeSafe(emp.user_id);
            const res = await skapi.getRecords({
                table: {
                    name: 'emp_position_current',
                    access_group: 1
                },
                unique_id: "[emp_position_current]" + user_id_safe,
            });

            const query = {
                table: {
                    name: 'commute_record',
                    access_group: 98,
                },
                index: {
                    name: '$uploaded',
                    value: getTimestampFromTimeString(hrStartTime),
                    condition: '>='
                },
                reference: "emp_id:" + makeSafe(emp.user_id),
            };

            const fetchOptions = {
                // limit: 1,
                ascending: false
            };

            // try {
            //     await skapi.getRecords(query, fetchOptions)
            // } catch(err) {
            //     if(err.code === 'NOT_EXISTS') {
            //         // 직원별 출퇴근 기록을 위한 저장소 레코드 생성하기
            //         const res = await skapi.postRecord(null, {
            //             table: {
            //                 name: 'commute_records',
            //                 access_group: 98
            //             },
            //             unique_id: `emp_id:${user_id_safe}`,
            //         });

            //         console.log('AAAAAA === registerEmp === res : ', res);

            //         const grantPrivateRecordAccess = (data) => {
            //             if (!data) return;

            //             return skapi.grantPrivateRecordAccess(data);
            //         };  

            //         await grantPrivateRecordAccess({
            //             record_id: res.record_id,
            //             user_id: emp.user_id
            //         });
            //     }
            // }
            const commuteRecords = await skapi.getRecords(query, fetchOptions)
            const commuteList = commuteRecords?.list?.sort((a, b) => a.uploaded - b.uploaded);
            
            // if (commuteList && commuteList.length > 0) {
            //     if(commuteList.length > 1) {
            //         const lastCommute = commuteList[commuteList.length - 1];
            //         emp.startWork = lastCommute.data.startTime;
            //         emp.endWork = lastCommute.data.endTime;
            //     } else {
            //         const lastCommute = commuteList[0];
            //         console.log('=== lastCommute : ', lastCommute.data.startTime);
            //         emp.startWork = lastCommute.data?.startTime;
            //         emp.endWork = lastCommute.data?.endTime;
            //     }
            // } else {
            //     emp.startWork = '-';
            //     emp.endWork = '-';
            // }

            if (commuteList && commuteList.length > 0) {
                if (commuteList.length > 1) {
                    const lastCommute = commuteList[commuteList.length - 1];
                    emp.startWork = lastCommute?.data?.startTime || '-';
                    emp.endWork = lastCommute?.data?.endTime || '-';
                } else {
                    const lastCommute = commuteList[0];
                    emp.startWork = lastCommute?.data?.startTime || '-';
                    emp.endWork = lastCommute?.data?.endTime || '-';
                }
            } else {
                emp.startWork = '-';
                emp.endWork = '-';
            }
            
            if (res && res.list.length > 0) {
                const empInfo = res.list[0].index.name;
                const empSplit = empInfo.split('.');

                return {
                    ...emp,
                    position: empSplit[1],
                    division: empSplit[0],
                    divisionName: divisionNameList.value[empSplit[0]]
                };
            }

            return emp;
        });

        const results = await Promise.all(empPromises);
        newEmpList.push(...results);

        return newEmpList;
    } catch (error) {
        console.error('=== getEmpList === error : ', error);
        return newEmpList
    }
};

// 새로고침
const refresh = () => {
    getDivisionData(true);
};

const getDivisionName = computed(() => {
    return (divisionId) => {
        return divisionNameList.value?.[divisionId] || '-';
    }
});

// 각 직원 출퇴근 기록 상세 페이지로 이동
const goToEmpCommute = (e, userId) => {
    router.push({ name: 'commute-detail', params: { userId } });        
};

onMounted(async () => {
    await getDivisionData();  // 부서 데이터를 먼저 완전히 로드
    const res = await getEmpList(); // 그 다음 직원 목록 로드

    employee.value = res;
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
    tbody {
        tr {
            &:hover {
                cursor: pointer;
            }
        }
    }
}
</style>
