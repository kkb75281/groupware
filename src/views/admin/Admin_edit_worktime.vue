<template lang="pug">
h1 출퇴근 시간 설정

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
        table.table#tb-edit-workTime
            colgroup
                col(style="width: 3rem")
                col(style="width: 10%")
                col
                col
                col(style="width: 10%")
            thead
                tr
                    th(scope="col") NO
                    th(scope="col") 부서명
                    th(scope="col") 출근시간
                    th(scope="col") 퇴근시간
                    th(scope="col") 수정

            tbody
                template(v-if="loading")
                    tr(v-for="i in 5")
                template(v-else-if="Object.keys(divisions).length === 0")
                    tr
                        td(colspan="5") 데이터가 없습니다.
                template(v-else)
                    tr(v-for="(division, keys, index) in divisions" :key="division.record_id")
                        td.list-num {{ index + 1 }}
                        td.left
                            .item-wrap
                                .img-wrap
                                    img(v-if="division.bin && division.bin.division_logo" :src="division.bin['division_logo'][0].url")
                                span(style="white-space: nowrap;") {{ division.data.division_name }}
                        td.startWork
                            .input-wrap(style="display: flex; align-items: center; gap: 4px;")
                                input(type="text" :value="workTimes[makeSafe(division.record_id)]?.division_startTime?.min?.slice(0, 5) || ''" readonly)
                                | ~
                                input(type="text" :value="workTimes[makeSafe(division.record_id)]?.division_startTime?.max?.slice(0, 5) || ''" readonly)
                        td.endWork
                            .input-wrap(style="display: flex; align-items: center; gap: 4px;")
                                input(type="text" :value="workTimes[makeSafe(division.record_id)]?.division_endTime?.min?.slice(0, 5) || ''" readonly)
                                | ~
                                input(type="text" :value="workTimes[makeSafe(division.record_id)]?.division_endTime?.max?.slice(0, 5) || ''" readonly)
                        td.edit
                            button.btn.sm.bg-gray(@click="onEditDivision(division)") 수정

    //- .pagination
        button.btn-prev.icon(type="button") 
            svg
                use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
            | Prev
        button.btn-next.icon(type="button" @click="currentPage++;" :class="{'nonClickable': endOfList && currentPage >= maxPage }") Next
            svg
                use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

//- Modal
#modal.modal(v-if="isModalOpen" @click="closeModal")
    .modal-cont(@click.stop)
        .modal-header
            h2.modal-title 출퇴근 시간 설정
            button.btn-close(@click="closeModal")
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
        .modal-body
            .item-wrap
                p.label 출근시간
                .input-wrap
                    input(type="time" v-model="startTimeMin")
                    | ~
                    input(type="time" v-model="startTimeMax")

            .item-wrap
                p.label 퇴근시간
                .input-wrap
                    input(type="time" v-model="endTimeMin")
                    | ~
                    input(type="time" v-model="endTimeMax")

        .modal-footer
            button.btn.bg-gray.btn-cancel(type="button" @click="cancelEdit") 취소
            button.btn.btn-save(type="submit" @click="saveWorkTime") 저장
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import { skapi } from "@/main";
import { loading, divisions, getDivisionData, divisionNameList } from "@/division";
import { makeSafe } from '@/user';

import Loading from "@/components/loading.vue";

const router = useRouter();
const route = useRoute();

const selectedDivision = ref(null);
const workTimes = ref({});
const isModalOpen = ref(false);

const startTimeMin = ref("");
const startTimeMax = ref("");
const endTimeMin = ref("");
const endTimeMax = ref("");

console.log('divisions : ', divisions.value);
console.log('AA === divisionNameList : ', divisionNameList.value);

// 근무시간 저장
const saveWorkTime = async () => {
    loading.value = true;

    try {
        console.log('== AA ===');
        console.log('== selectedDivision : ', selectedDivision.value);

        const findDivision = divisions.value[selectedDivision.value.record_id];

        console.log('== findDivision : ', findDivision);
         console.log('== BB ===');

        if (!findDivision) {
            alert('부서를 찾을 수 없습니다.');
            return;
        }

        // const divisionId = makeSafe(findDivision.record_id);
        const divisionId = makeSafe(selectedDivision.value.record_id);
        const uniqueId = `dvs_workTime_${divisionId}`;

        // 기존 데이터가 있다면 삭제 (unique_id 때문)
        if (workTimes.value[divisionId]) {
            const query = {
                table: 'dvs_workTime_setting',
                unique_id: uniqueId
            };
            
            await skapi.deleteRecords(query);
            console.log('기존 시간 설정 삭제 완료');
        }

        const findDivisionKey = Object.entries(divisionNameList.value).find(([key, value]) => value === findDivision.data.division_name);

        // 새로운 데이터 생성
        const workTimeData = {
            division_name: findDivision.data.division_name || '',
            division_key: findDivisionKey?.[0] || '',
            division_startTime: {
                min: `${startTimeMin.value}:00`,
                max: `${startTimeMax.value}:59`
            },
            division_endTime: {
                min: `${endTimeMin.value}:00`,
                max: `${endTimeMax.value}:59`
            }
        };

        const config = {
            table: {
                name: 'dvs_workTime_setting',
                access_group: 1
            },
            unique_id: uniqueId
        };

        console.log('== workTimeData:', workTimeData);  

        const savedRecord = await skapi.postRecord(workTimeData, config);
        console.log('=== saveWorkTime === savedRecord : ', savedRecord);
        
        // 업데이트
        workTimes.value[divisionId] = savedRecord.data;

        alert('근무시간이 성공적으로 저장되었습니다.');

    } catch (error) {
        console.log('=== saveWorkTime === error : ', error);
        alert('근무시간 저장을 실패했습니다.');
    } finally {
        selectedDivision.value = null;
        startTimeMax.value = '';
        startTimeMin.value = '';
        endTimeMax.value = '';
        endTimeMin.value = '';

        loading.value = false;

        closeModal();
        await getWorkTime();
    }
};

// 근무시간 가져오기
const getWorkTime = async () => {
    try {
        const query = {
            table:  {
                name: 'dvs_workTime_setting',
                access_group: 1
            }
        };
        
        const res = await skapi.getRecords(query);
        console.log('=== getWorkTime === res.list : ', res.list);
        
        // 부서별 근무시간 데이터를 객체로 변환
        const workTimeMap = res.list.reduce((acc, record) => {
            console.log('=== getWorkTime === acc : ', acc);
            console.log('=== getWorkTime === record : ', record);

            const divisionId = record.unique_id.replace('dvs_workTime_', '');
            acc[divisionId] = record.data;

            console.log('=== getWorkTime === divisionId : ', divisionId);

            return acc;
        }, {});

        console.log('=== getWorkTime === workTimeMap : ', workTimeMap);
        
        return workTimeMap;
        
    } catch (error) {
        console.error('=== getWorkTime === error : ', {error});
    }
};

const openModal = () => {
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
};

const cancelEdit = () => {
    closeModal();
};

// 수정 버튼 클릭 시
const onEditDivision = (division) => {
    console.log('=== onEditDivision === : division:', division);
    console.log('divisionNameList:', divisionNameList.value);

    // const result = Object.keys(divisionNameList.value).find((item) => item.record_id === division.record_id);
    // console.log('=== onEditDivision === result : ', result);

    selectedDivision.value = division;

    const divisionId = makeSafe(division.record_id);
    const existingWorkTime = workTimes.value[divisionId];

    console.log('=== onEditDivision === divisionId : ', divisionId);
    console.log('=== onEditDivision === existingWorkTime : ', existingWorkTime);

    // 기존 시간 데이터가 있는 경우
    if (existingWorkTime) {
        startTimeMin.value = existingWorkTime.division_startTime.min.slice(0, 5);
        startTimeMax.value = existingWorkTime.division_startTime.max.slice(0, 5);
        endTimeMin.value = existingWorkTime.division_endTime.min.slice(0, 5);
        endTimeMax.value = existingWorkTime.division_endTime.max.slice(0, 5);
    } else {
        startTimeMin.value = '';
        startTimeMax.value = '';
        endTimeMin.value = '';
        endTimeMax.value = '';
    }
    
    openModal();
};

// 새로고침
const refresh = async () => {
    try {
        loading.value = true;

        await getDivisionData(true);

        const refreshedWorkTimes = await getWorkTime();
        workTimes.value = refreshedWorkTimes;
    } catch (error) {
        console.log('=== refresh === error : ', error);
        alert('데이터 새로고침에 실패했습니다.');
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    try {
        const workTimeData = await getWorkTime();
        workTimes.value = workTimeData;

        console.log('=== onMounted === workTimes.value : ', workTimes.value);
    } catch (error) {
        console.log('=== onMounted === error : ', error);
    }
});
</script>

<style scoped lang="less">
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

.table {
    tbody {
        tr {
            &:hover {
                background-color: transparent;
            }
        }
    }
} 

.item-wrap {
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

.input-wrap {
    input {
        text-align: center;

        &:hover,
        &:focus {
            cursor: default;
            border-color: var(--gray-color-200);
        }
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
