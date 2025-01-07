<template lang="pug">
div(style="display: flex; gap: 1rem")
	h1.title 출퇴근 기록

hr

.itembox
	.title-wrap(style="margin-bottom: 0;")
		h3.title 오늘의 출퇴근 기록을 남겨주세요.
		//- button.btns.sm.outline(@click="router.push('/commute-view-calendar')") 출퇴근 기록 캘린더
	span.today 
		.icon
			svg
				use(xlink:href="@/assets/icon/material-icon.svg#icon-clock")
		| {{ timeRecords.date }}

.itembox
	span.time 출근 : {{ timeRecords.startTime }}
	button.btn.btn-work(@click="startWork") 출근

.itembox
	span.time 퇴근 : {{ timeRecords.endTime }}
	button.btn.btn-work(@click="endWork") 퇴근

.itembox(style="margin-top: 3rem; padding: 0; border-radius: 0; box-shadow: none;")
	.title-wrap
		span.title(style="font-size: 1.125rem; font-weight: 700; display: inline-block;") 이전 출퇴근 기록
		span.monthlyWorkTime 총 근무시간 : {{ monthlyWorkTime }}
	.table-wrap
		.tb-head-wrap
				//form#searchForm(@submit.prevent="searchEmp")
						.input-wrap
								select(v-model="searchFor" :disabled="empListType !== '직원목록'")
										option(value="name") 이름
										option(value="division") 부서/직책
										option(value="email") 이메일
						.input-wrap.search(v-if="searchFor !== 'division'")
								input(v-model="searchValue" type="text" placeholder="검색어를 입력하세요" :disabled="empListType !== '직원목록'")
								button.btn-search
						template(v-else)
								.input-wrap
										select(name="searchDivision" v-model="searchValue" :disabled="empListType !== '직원목록'" @change="searchEmp")
								.input-wrap.search(style="width: 176px;")
										input(v-model="searchPositionValue" type="text" placeholder="직책을 입력하세요" :disabled="searchValue === '전체'")
										button.btn-search

				//.tb-toolbar
						.btn-wrap
								button.btn.outline.refresh-icon(:disabled="loading" @click="refresh")
										svg(:class="{'rotate' : loading}")
												use(xlink:href="@/assets/icon/material-icon.svg#icon-refresh")

								template(v-if="user.access_group > 98")
										template(v-if="empListType === '직원목록'")
												button.btn.bg-gray.btn-block(:disabled="!selectedList.length" @click="employeeState('block')") 숨김
												button.btn.outline(@click="router.push('/admin/add-employee')") 등록
										template(v-else-if="empListType === '초청여부'")
												button.btn.outline(@click="router.push('/admin/add-employee')") 등록
										template(v-else-if="empListType === '숨김여부'")
												button.btn.bg-gray.btn-block(:disabled="!selectedList.length" @click="employeeState('unblock')") 숨김 해제
												button.btn.outline.warning.btn-remove(:disabled="!selectedList.length" @click="employeeState('delete')") 삭제

		.tb-overflow
				template(v-if="loading")
						Loading#loading
				table.table#tb-record-commute
						colgroup
								col(style="width: 10%;")
								col(style="width: 10%;")
								col(style="width: 10%;")
								col(style="width: 10%;")
								col(style="width: 10%;")
								
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
								template(v-else-if="!commuteRecords")
									tr
										td(colspan="5") 데이터가 없습니다.
								template(v-else)
										tr(v-for="record in commuteRecords")
											td.date {{ record.date }}
											td.start-time {{ extractTimeFromDateTime(record.startTime) }}
											td.end-time {{ extractTimeFromDateTime(record.endTime) }}
											td.work-time {{ record.dailyCommuteTime }}
											td.remark
												.input-wrap
													input(type="text" v-model="record.remark" @blur="updateDesc(record)")

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
import { ref, onMounted, watch } from "vue";
import { skapi } from '@/main';
import { getDate, getTime, convertToTimestamp, convertTimeToTimestamp, isTimeInRangeTimestramp, addTimeToTimestamp, extractTimeFromDateTime, convertMsToTime } from "@/utils/time";
import { initWorkFormat } from "@/constants/consts";
import { user, makeSafe } from '@/user';
import { divisionNameList } from '@/division'
import { getEmpDivisionPosition, empInfo, employeeDict, getUsers, getInvitations, getUserCache, getInvitationsCache } from '@/employee';
import type { Ref } from 'vue';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

console.log('===================== 출퇴근 기록 =====================');
console.log('=== 출퇴근 기록 === user : ', user);

const loading = ref(false);
const currentDate = getDate();	// 오늘 날짜
const maxHour = 16;	// 퇴근 기록 가능한 최대 시간

// 마스터가 정한 출근 시간
const masterStartTime = {
  min: "15:00:00",
  max: "18:30:00",
  minTime: `${currentDate} 15:00:00`,
  maxTime: `${currentDate} 18:30:00`,
  minTimestamp: convertToTimestamp(`${currentDate} 15:00:00`),
  maxTimestamp: convertToTimestamp(`${currentDate} 18:30:00`),
};

// 마스터가 정한 퇴근 시간
const masterEndTime = {
  min: "23:00:00",
  max: "02:00:00",
  minTime: `${getDate()} 23:00:00`,
  maxTime: `${getDate()} 02:00:00`,
  minTimestamp: convertTimeToTimestamp(`${getDate()} 23:00:00`),
  maxTimestamp: convertTimeToTimestamp(`${getDate()} 02:00:00`),
};

// const user = ref({});	// 유저 정보
const commuteRecords = ref([]);	// 출퇴근 기록
const timeRecords = ref(initWorkFormat); // 출퇴근 시간 기록
const monthlyWorkTime = ref("");	// 한 달 총 근무시간

// let userLocalStorage = JSON.parse(window.localStorage.getItem("usersInfo")) || []; // 직원 정보 저장
let commuteStorage; // 직원별 출퇴근 정보 저장소

// 출근시간 기록 저장소 초기화
const generateWorkTime = () => {
  const currentDate = getDate();
  const currentTime = getTime();
  const startTime = `${currentDate} ${currentTime}`;
  const startTimeStamp = convertToTimestamp(startTime);

	// 마지막 출근 이력
  const lastCommute =
    commuteStorage &&
    commuteStorage.length > 0 &&
    commuteStorage[commuteStorage.length - 1];

	// 새로운 출근 이력
  const newCommuteData = {
    ...initWorkFormat,	// 기존 출퇴근 기록 템플릿 복사
    date: currentDate,
    startTime,
    startTimeStamp,
    dailyCommuteTime: '',
    ord: lastCommute?.ord + 1 || 1,	// 출퇴근 순서 (기본값 1)
  };

  return newCommuteData;
};

// 퇴근시간 기록 저장소 초기화
const generateWorkEndTime = () => {
  const value = commuteStorage[commuteStorage.length - 1];	// 마지막 출근 이력

	if (value === undefined) {
    return;
  }

  const endTimeStamp = convertToTimestamp(`${getDate()} ${getTime()}`);
  const dailyCommuteTime = convertMsToTime(endTimeStamp - value.startTimeStamp);
	const dailyCommuteTimeStamp = endTimeStamp - value.startTimeStamp;
	let totalCommuteTime = value.totalCommuteTime || 0;
	totalCommuteTime += dailyCommuteTimeStamp;

  const newCommuteData = {
    ...value,
    endTime: `${getDate()} ${getTime()}`,
    endTimeStamp: convertToTimestamp(`${getDate()} ${getTime()}`),
    dailyCommuteTime,
		totalCommuteTime,
		calculated: false, // 계산 여부 플래그
  };

  return newCommuteData;	
};

// 출퇴근 기록 데이터베이스 저장 함수
const saveCommuteRecord = async (record) => {
  try {
    const config = {
      table: 'commute_records',  // 테이블 이름
      access: 'private'          // 접근 권한 (private으로 설정)
    };

    // skapi postRecord 호출
    const savedRecord = await skapi.postRecord(record, config);
    console.log('Record saved successfully:', savedRecord);
    return savedRecord;
  } catch (error) {
    console.error('Error saving record:', error);
    throw error;
  }
};

// 출근시간 기록
const startWork = async () => {
  const value = generateWorkTime();
  console.log('=== startWork === value : ', value);

  // 출근 이력이 있는지 확인
  const isCommuted =
    commuteStorage &&
    commuteStorage.length > 0 &&
    commuteStorage[commuteStorage.length - 1].date === value.date;

  // 마지막 출근 이력
  const lastCommute =
    commuteStorage &&
    commuteStorage.length > 0 &&
    commuteStorage[commuteStorage.length - 1].startTimeStamp;

  // 이미 오늘 출근한 이력이 있을 경우
  if (isCommuted) {
    const checkMaxHour = addTimeToTimestamp(lastCommute, {
      seconds: 5,
    });

    if (checkMaxHour >= value.startTimeStamp) {
      alert("이미 출근한 이력이 있습니다.");
      return;
    }
  }

  // 마스터가 정한 출근시간 범위 안에 있는 지 확인
  const isCommute =
    masterStartTime.minTimestamp <= value.startTimeStamp &&
    value.startTimeStamp <= masterStartTime.maxTimestamp;

  // 마스터가 정한 출근시간 범위 지났을 경우
  if (!isCommute) {
    alert("마스터가 정한 출근시간 범위를 벗어났습니다. 출근 기록이 불가합니다.");
    return;
  }

  if (!commuteStorage) {
    commuteStorage = [];
  }

  try {
    // DB에 저장
    const savedRecord = await saveCommuteRecord({ 
      ...value,
      type: 'start',
      user_id: user.user_id
    });

    // 상태 업데이트
    commuteStorage.push({ ...savedRecord });
    commuteRecords.value = commuteStorage;
    timeRecords.value = savedRecord;
  } catch (error) {
    alert('출근 기록 저장에 실패했습니다.');
    console.error(error);
  }
};

// 퇴근시간 기록
const endWork = async () => {
  const value = generateWorkEndTime();
  
  if (!value || value === undefined) {
    const currentDate = getDate();
    const currentTime = getTime();
    const endTime = `${currentDate} ${currentTime}`;
    const endTimeStamp = convertToTimestamp(endTime);

    const lastCommute =
      commuteStorage &&
      commuteStorage.length > 0 &&
      commuteStorage[commuteStorage.length - 1];

    const newCommuteData = {
      ...initWorkFormat,
      date: currentDate,
      endTime,
      endTimeStamp,
      dailyCommuteTime: '',
      ord: lastCommute?.ord + 1 || 1,
    };

    try {
      const savedRecord = await saveCommuteRecord({
        ...newCommuteData,
        type: 'end',
        user_id: user.user_id
      });

      commuteStorage.push({ ...savedRecord });
      commuteRecords.value = commuteStorage;
      timeRecords.value = savedRecord;
    } catch (error) {
      alert('퇴근 기록 저장에 실패했습니다.');
      console.error(error);
    }
    
    return;
  }

  // 퇴근 기록 가능한 최대 시간
  const maxEndTime = addTimeToTimestamp(value.startTimeStamp, {
    seconds: 5,
  });

  const newEndTime = addTimeToTimestamp(maxEndTime, {
    seconds: 5,
  });

  // 마스터가 정한 출근시간 범위 확인
  const isCommute =
    masterStartTime.minTimestamp <= value.endTimeStamp &&
    value.endTimeStamp <= masterStartTime.maxTimestamp;

  if (isCommute && !value.startTime) {
    alert("현재 마스터가 정한 출근시간 입니다. 출근을 먼저 해주세요.");
    return;
  }

  const isEndWork = value.endTimeStamp <= maxEndTime;
  const newEndWork = value.endTimeStamp >= newEndTime;
  
  if (!isEndWork) {
    const maxTimeStr = new Date(maxEndTime).toLocaleTimeString();

    if (newEndWork) {
      alert('새로운 출퇴근 기록이 시작됩니다.');

      if (isCommute) {
        alert("현재 마스터가 정한 출근시간 입니다. 출근을 먼저 해주세요.");
        return;
      }

      const lastCommute =
        commuteStorage &&
        commuteStorage.length > 0 &&
        commuteStorage[commuteStorage.length - 1];

      const endTimeStamp = convertToTimestamp(`${getDate()} ${getTime()}`);
      const dailyCommuteTime = convertMsToTime(endTimeStamp - value.startTimeStamp);
      const dailyCommuteTimeStamp = endTimeStamp - value.startTimeStamp;
      let totalCommuteTime = value.totalCommuteTime || 0;
      totalCommuteTime += dailyCommuteTimeStamp;

      const data = {
        ...initWorkFormat,
        date: getDate(),
        ord: lastCommute?.ord + 1 || 1,
        endTime: getTime(),
        endTimeStamp,
        dailyCommuteTime,
        totalCommuteTime,
        calculated: false,
      };

      try {
        const savedRecord = await saveCommuteRecord({
          ...data,
          type: 'end',
          user_id: user.user_id
        });

        commuteStorage.push({ ...savedRecord });
        commuteRecords.value = commuteStorage;
        timeRecords.value = savedRecord;
      } catch (error) {
        alert('퇴근 기록 저장에 실패했습니다.');
        console.error(error);
      }

      return;
    }

    alert(`마스터가 정한 퇴근시간 범위(${maxTimeStr}까지)를 벗어났습니다.`);
    return;
  }

  try {
    // DB에 저장
    const savedRecord = await saveCommuteRecord({
      ...value,
      type: 'end',
      user_id: user.user_id
    });

    // 상태 업데이트
    const notLastCommutes = commuteStorage.slice(0, commuteStorage.length - 1);
    const commutes = [...notLastCommutes, savedRecord].sort((a, b) => a.ord - b.ord);
    
    commuteStorage = commutes;
    commuteRecords.value = commuteStorage;
    timeRecords.value = savedRecord;

    calcWorkTime(savedRecord);
  } catch (error) {
    alert('퇴근 기록 저장에 실패했습니다.');
    console.error(error);
  }
};

let totalWorkTimeMs = 0; // 총 근무시간

// 근무시간 계산 함수
const calcWorkTime = (value) => {
  if (!value) return;

  const { startTimeStamp, endTimeStamp, dailyCommuteTime, calculated } = value;

  if (!startTimeStamp || !endTimeStamp || calculated) {
    console.log("유효하지 않은 출퇴근 기록이거나 이미 계산된 기록입니다.");
    return;
  }

  // 새로 계산된 근무시간
  const updatedWorkTimeMs = endTimeStamp - startTimeStamp;

  // 기존 근무시간 (있다면 빼고 갱신)
  const previousWorkTimeMs = value.previousDailyCommuteTime || 0;
  const workTimeDiff = updatedWorkTimeMs - previousWorkTimeMs;

  // 총 근무시간 갱신
  totalWorkTimeMs += workTimeDiff;

  // 현재 기록 업데이트
  value.previousDailyCommuteTime = updatedWorkTimeMs;
  value.calculated = true;

  // 시간 변환
  const totalHours = Math.floor(totalWorkTimeMs / 1000 / 60 / 60);
  const totalMinutes = Math.floor((totalWorkTimeMs / 1000 / 60) % 60);

  monthlyWorkTime.value = `${totalHours}시간 ${totalMinutes}분`;
};

// 비고란 작성 내용 업데이트
const updateDesc = async (record) => {
  try {
    const updatedRecord = await saveCommuteRecord({
      ...record,
      user_id: user.user_id
    });

    const recordIndex = commuteRecords.value.findIndex((r) => r.id === record.id);
    if (recordIndex !== -1) {
      commuteRecords.value[recordIndex] = updatedRecord;
    }
  } catch (error) {
    alert('비고 내용 저장에 실패했습니다.');
    console.error(error);
  }
}; 

// 출퇴근 시간 기록 저장
const onRecord = () => {
  // 만약 출퇴근 기록이 있다면
  if (commuteStorage.length > 0) {
    commuteRecords.value = commuteStorage;	

		// 오늘 출퇴근 기록이 있다면
    if (commuteStorage[commuteStorage.length - 1].date === timeRecords.value.date) {
      timeRecords.value.start = commuteStorage[commuteStorage.length - 1].startWork;
      timeRecords.value.end = commuteStorage[commuteStorage.length - 1].endWork;
    } else {
      timeRecords.value.start = "";
      timeRecords.value.end = "";
    }
  }
};

onMounted(async () => {
  timeRecords.value.date = getDate();

  try {
    // DB에서 기록 조회
    const records = await fetchCommuteRecords();
    commuteStorage = records;
    onRecord();

    if (commuteStorage.length > 0) {
      monthlyWorkTime.value = convertMsToTime(parseInt(commuteStorage[commuteStorage.length - 1].totalCommuteTime, 10));
    }
  } catch (error) {
    console.error('Error loading records:', error);
    commuteStorage = [];
    onRecord();
  }
});
</script>

<style scoped lang="less">
.table-wrap {
	position: relative;

	#loading {
			position: absolute;
			top: 126px;
			left: 50%;
			transform: translateX(-50%);
	}

	#searchForm {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
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
}

.itembox {
  box-shadow: 1px 1px 10px 0px rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  line-height: 1.2;

  .time {
    display: inline-block;
    width: 100%;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2c3e50;
    border-bottom: 1px solid #ccc;
    padding-bottom: 1.5rem;
  }

  .btn-work {
    width: 100%;
    margin-top: 1.5rem;
  }

	.title-wrap {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
}

.today {
  font-size: 1rem;
  color: #777;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;

	.icon {
		padding: 0;
	}
}
</style>