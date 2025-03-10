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

.itembox-wrap
	.itembox
		span.time 출근 : #[span.value {{ extractTimeFromDateTime(timeRecords.startTime) }}]
		button.btn.btn-work(@click="startWork") 출근

	.itembox
		span.time 퇴근 : #[span.value {{ extractTimeFromDateTime(timeRecords.endTime) }}]
		button.btn.btn-work(@click="endWork") 퇴근

.itembox(style="margin-top: 3rem; padding: 0; border-radius: 0; box-shadow: none;")
	.title-wrap
		span.title(style="font-size: 1.125rem; font-weight: 700; display: inline-block;") 이전 출퇴근 기록
		span.monthlyWorkTime 총 근무시간 : {{ monthlyWorkTime }}
	.table-wrap
		.tb-overflow
				template(v-if="loading")
						Loading#loading
				table.table#tb-record-commute
						colgroup
								col(style="width: 8%;")
								col(style="width: 5%;")
								col(style="width: 5%;")
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
											td.date {{ record.data.date }}
											td.start-time {{ extractTimeFromDateTime(record.data.startTime) }}
											td.end-time {{ extractTimeFromDateTime(record.data.endTime) }}
											td.work-time {{ record.data.dailyCommuteTime }}
											td.remark
												.input-wrap
													input(type="text" v-model="record.data.remark" @blur="updateDesc(record)")

//- 테스트용 삭제 버튼 (추후 삭제)
//- button.btn.sm(@click="testDelete") delete
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, watch } from 'vue';
import { skapi } from '@/main';
import {
  getDate,
  getTime,
  convertToTimestamp,
  convertTimeToTimestamp,
  addTimeToTimestamp,
  extractTimeFromDateTime,
  convertMsToTime
} from '@/utils/time';
import { user, makeSafe } from '@/user';
// import { divisionNameList } from '@/division';
import type { Ref } from 'vue';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

// 테스트용 삭제 함수 (추후 삭제)
// const testDelete = async() => {
//   const res = await fetchCommuteRecords();
//   console.log('=== testDelete === res : ', res.list);

//   res.list.forEach(record => {
//     console.log(record.data.date);

//     if(record.data.date === '2025-03-09') {
//       const config = {
//         record_id: record.record_id
//       };

//       skapi.deleteRecords(config);
//     }
//   })
// };

// 출퇴근 기록 관련
interface IWorkFormat {
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  startTimeStamp: number | null;
  endTimeStamp: number | null;
  dailyCommuteTime: number | null;
}

// 초기화
const initWorkFormat: IWorkFormat = {
  date: null,
  startTime: null,
  endTime: null,
  startTimeStamp: null,
  endTimeStamp: null,
  dailyCommuteTime: null,
};

const loading = ref(false);
const currentDate = getDate(); // 오늘 날짜
const maxHour = 16; // 퇴근 기록 가능한 최대 시간
const commuteRecords = ref([]); // 출퇴근 기록
const timeRecords = ref(initWorkFormat); // 출퇴근 시간 기록
const monthlyWorkTime = ref(''); // 한 달 총 근무시간

let commuteStorage = []; // 직원별 출퇴근 정보 저장소

const masterStartTime = {
  min: '08:00:00',
  max: '19:59:59',
  minTimestamp: convertToTimestamp(`${currentDate} 08:00:00`),
  maxTimestamp: convertToTimestamp(`${currentDate} 19:59:59`)
};

// 마스터가 정한 퇴근 시간
const masterEndTime = {
  min: '23:00:00',
  max: '02:00:00',
  minTimestamp: convertTimeToTimestamp(`${getDate()} 23:00:00`),
  maxTimestamp: convertTimeToTimestamp(`${getDate()} 02:00:00`)
};

// 마스터가 정한 부서별 근무시간 설정 데이터 가져오기
const getWorkTime = async () => {
  try {
    const query = {
      table: {
        name: 'dvs_workTime_setting',
        access_group: 1
      }
    };

    const res = await skapi.getRecords(query);
    console.log('=== getWorkTime === res : ', res);
		// console.log('divisionNameList : ', divisionNameList.value);

		// 직원의 부서, 직급 정보 가져오기
		const getDvs = await skapi.getRecords({
				table: {
						name: 'emp_position_current',
						access_group: 1
				},
				unique_id: "[emp_position_current]" + makeSafe(user.user_id),
		});

    // 현재 로그인한 유저의 부서 근무시간 찾기
    const myDivisionWorkTime = res.list.find(workTime => {
			if(workTime.data.division_key === getDvs.list[0].index.name.split('.')[0]) {
				return workTime.data.division_startTime;
			}
    });
    console.log('=== getWorkTime === myDivisionWorkTime : ', myDivisionWorkTime);

    if (myDivisionWorkTime) {
      // 마스터가 설정한 시간으로 업데이트
      masterStartTime.min = myDivisionWorkTime.data.division_startTime.min;
			// console.log('=== masterStartTime.min ===', masterStartTime.min);
      masterStartTime.max = myDivisionWorkTime.data.division_startTime.max;
      masterStartTime.minTimestamp = convertToTimestamp(
        `${currentDate} ${myDivisionWorkTime.data.division_startTime.min}`
      );
			// console.log('=== masterStartTime.minTimestamp ===', masterStartTime.minTimestamp);
      masterStartTime.maxTimestamp = convertToTimestamp(
        `${currentDate} ${myDivisionWorkTime.data.division_startTime.max}`
      );

      masterEndTime.min = myDivisionWorkTime.data.division_endTime.min;
      masterEndTime.max = myDivisionWorkTime.data.division_endTime.max;
      masterEndTime.minTimestamp = convertToTimestamp(
        `${currentDate} ${myDivisionWorkTime.data.division_endTime.min}`
      );
      masterEndTime.maxTimestamp = convertToTimestamp(
        `${currentDate} ${myDivisionWorkTime.data.division_endTime.max}`
      );
    }
  } catch (error) {
    console.error('근무시간 데이터 조회 실패:', {error});
  }
};

// 출근시간 기록 저장소 초기화
const generateWorkTime = () => {
  const currentDate = getDate();
  const currentTime = getTime();
  const startTime = `${currentDate} ${currentTime}`;
  const startTimeStamp = convertToTimestamp(startTime);

  // 마지막 출근 이력
  const lastCommute =
    commuteStorage && commuteStorage.length > 0 && commuteStorage[commuteStorage.length - 1];

  // 새로운 출근 이력
  const newCommuteData = {
    ...initWorkFormat, // 기존 출퇴근 기록 템플릿 복사
    date: currentDate,
    startTime,
    startTimeStamp,
    dailyCommuteTime: ''
  };

  return newCommuteData;
};

// 퇴근시간 기록 저장소 초기화
const generateWorkEndTime = () => {
  const value = commuteStorage[0];

  if (!value || !value.data) {
    return;
  }

  const endTimeStamp = convertToTimestamp(`${getDate()} ${getTime()}`);
  const dailyCommuteTimeStamp = value.data.startTimeStamp
    ? endTimeStamp - value.data.startTimeStamp
    : 0;
  const dailyCommuteTime = value.data.startTimeStamp ? convertMsToTime(dailyCommuteTimeStamp) : '';
  const totalCommuteTime = (value.data.totalCommuteTime || 0) + dailyCommuteTimeStamp;

  const newCommuteData = {
    ...value,
    data: {
      ...value.data,
      endTime: `${getDate()} ${getTime()}`,
      endTimeStamp: convertToTimestamp(`${getDate()} ${getTime()}`),
      dailyCommuteTime,
      totalCommuteTime
    }
  };

  return newCommuteData;
};

// 출퇴근 기록 데이터베이스 저장 함수
const saveCommuteRecord = async (record, isUpdate = false) => {
  try {
    const config = {
      table: {
        name: 'commute_record',
        access_group: 98
      },
      tags: ['[emp_id]' + makeSafe(user.user_id)],
      reference: 'emp_id:' + makeSafe(user.user_id)
    };

    const res = await skapi.postRecord(record, config);

    return res.list ? res.list[0] : res; // list가 있으면 첫 번째 항목 반환, 아니면 res 그대로 반환
  } catch (error) {
    throw error;
  }
};

// 출근시간 기록
const startWork = async () => {
  const value = generateWorkTime();

  // 출근 이력이 있는지 확인
  const isCommuted =
    commuteStorage &&
    commuteStorage.length > 0 &&
    commuteStorage[commuteStorage.length - 1].data.date === value.date;

  // 마지막 출근 이력
  const lastCommute =
    commuteStorage &&
    commuteStorage.length > 0 &&
    commuteStorage[commuteStorage.length - 1].data.startTimeStamp;

  // 이미 오늘 출근한 이력이 있을 경우
  if (isCommuted) {
    const checkMaxHour = addTimeToTimestamp(lastCommute, {
      hours: maxHour
      // seconds: 5,
    });

    // 출근시간으로부터 16시간이 지나기 전까지는 출근 재기록 불가
    if (checkMaxHour >= value.startTimeStamp) {
      alert('이미 출근한 이력이 있습니다.');
      return;
    }
  }

  // 마스터가 정한 출근시간 범위 안에 있는지 확인
  const isCommute =
    masterStartTime.minTimestamp <= value.startTimeStamp &&
    value.startTimeStamp <= masterStartTime.maxTimestamp;

  // 마스터가 정한 출근시간 범위 지났을 경우
  if (!isCommute) {
    alert(
      `마스터가 정한 출근시간 범위(${masterStartTime.min.slice(0, 5)} ~ ${masterStartTime.max.slice(0, 5)})를 벗어났습니다.`
    );
    return;
  }

  // 마스터가 정한 출근시간 범위 안에 있을 경우
  if (!commuteStorage) {
    commuteStorage = [];
  }

  try {
    // DB에 저장
    const savedRecord = await saveCommuteRecord({
      ...value
    });

    // 상태 업데이트
    commuteStorage = [...commuteStorage, savedRecord].sort(
      (a, b) => b.data.startTimeStamp - a.data.startTimeStamp
    );
    commuteRecords.value = commuteStorage;
    timeRecords.value = savedRecord.data;

    alert('출근 기록이 저장되었습니다.');
  } catch (error) {
    alert('출근 기록 저장에 실패했습니다.');
  }
};

// 퇴근시간 기록
const endWork = async () => {
  const value = generateWorkEndTime();

  if (!value) {
    const currentDate = getDate();
    const currentTime = getTime();
    const endTime = `${currentDate} ${currentTime}`;
    const endTimeStamp = convertToTimestamp(endTime);

    // 마지막 출근 이력
    const lastCommute =
      commuteStorage && commuteStorage.length > 0 && commuteStorage[0];

    // 새로운 출근 이력
    const newCommuteData = {
      ...initWorkFormat, // 기존 출퇴근 기록 템플릿 복사
      date: currentDate,
      endTime,
      endTimeStamp,
      dailyCommuteTime: ''
    };

    try {
      const savedRecord = await saveCommuteRecord({
        ...newCommuteData
      });

      commuteStorage.push({ ...savedRecord });
      commuteRecords.value = commuteStorage;
      timeRecords.value = savedRecord.data;

      alert('퇴근 기록이 저장되었습니다.');
    } catch (error) {
      alert('퇴근 기록 저장에 실패했습니다.');
      console.log('=== endWork === error : ', { error });
    }

    return;
  }

  // 퇴근 기록 가능한 최대 시간 (출근시간으로부터 16시간이 기준)
  const maxEndTime = addTimeToTimestamp(value.data.startTimeStamp, {
    hours: maxHour
    // seconds: 70,
  });

  // 새로운 퇴근 기록 가능한 시간
  const newEndTime = addTimeToTimestamp(maxEndTime, {
    hours: 2
    // seconds: 5,
  });

  // 마스터가 정한 출근시간 범위 안에 있는지 확인
  const isCommute =
    masterStartTime.minTimestamp <= value.data.endTimeStamp &&
    value.data.endTimeStamp <= masterStartTime.maxTimestamp;

  // 마스터가 정한 출근시간 범위 내에서 퇴근시간을 먼저 기록할 경우
  if (isCommute && !value.data.startTime) {
    alert('현재 마스터가 정한 출근시간 입니다. 출근을 먼저 해주세요.');
    return;
  }

  const isEndWork = value.data.endTimeStamp <= maxEndTime; // 마스터가 정한 퇴근시간 범위 안에 있는 지 확인
  const newEndWork = value.data.endTimeStamp >= newEndTime; // 새로운 퇴근 기록 가능한 시간인 지 확인

  // 마스터가 정한 퇴근시간 범위를 벗어날 경우
  if (!isEndWork) {
    console.log('=== 마스터가 정한 퇴근시간 벗어남 === ');

    const maxTimeStr = new Date(maxEndTime).toLocaleTimeString();
    const lastCommute =
      commuteStorage && commuteStorage.length > 0 && commuteStorage[0];

    if (newEndWork) {
      if (lastCommute && lastCommute.data.date === getDate()) {

        // 이전 퇴근기록에서 업데이트
        const config = {
          record_id: lastCommute.record_id
        };

        await skapi.postRecord(value.data, config);

        // 상태 업데이트
        const updatedRecord = {
          record_id: lastCommute.record_id,
          data: value.data
        };

        let notActiveDataList = commuteRecords.value.filter(
          (record) => record.data.startTimeStamp !== value.data.startTimeStamp
        );

        if (notActiveDataList.length < 1) {
          const notLastCommutes = commuteStorage.slice(0, commuteRecords.value.length - 1);
          notActiveDataList = notLastCommutes;
        }

        const commutes = [updatedRecord, ...notActiveDataList];

        commuteStorage = commutes;
        commuteRecords.value = commuteStorage;
        timeRecords.value = value.data;

        alert('퇴근 기록이 저장되었습니다.');
        return;
      }

      alert('새로운 출퇴근 기록이 시작됩니다.');

      if (isCommute) {
        alert('현재 마스터가 정한 출근시간 입니다. 출근을 먼저 해주세요.');
        return;
      }

      const endTimeStamp = convertToTimestamp(`${getDate()} ${getTime()}`);
      const dailyCommuteTime = convertMsToTime(endTimeStamp - value.startTimeStamp);
      const dailyCommuteTimeStamp = endTimeStamp - value.startTimeStamp;
      let totalCommuteTime = value.totalCommuteTime || 0;
      totalCommuteTime += dailyCommuteTimeStamp;

      const data = {
        ...initWorkFormat,
        date: getDate(),
        endTime: getTime(),
        endTimeStamp
      };

      try {
        console.log('=== II 확인 === ');

        const savedRecord = await saveCommuteRecord({
          ...data
        });

        commuteStorage = [savedRecord, ...commuteStorage]; // 저장소 맨 앞에 data 추가
        commuteRecords.value = commuteStorage;
        timeRecords.value = savedRecord.data;
      } catch (error) {
        alert('퇴근 기록 저장에 실패했습니다.');
        console.log('=== endWork === error : ', { error });
      }

      return;
    }

    alert(`마스터가 정한 퇴근시간 범위(${maxTimeStr}까지)를 벗어났습니다.`);
    return;
  }

  // 출근O -> 퇴근O 경우
  try {
    const config = {
      record_id: value.record_id
    };

    await skapi.postRecord(value.data, config);

    // 상태 업데이트
    const updatedRecord = {
      record_id: value.record_id,
      data: value.data
    };

    const notActiveDataList = commuteRecords.value.filter(
      (record) => record.data.startTimeStamp !== value.data.startTimeStamp
    );
    const commutes = [updatedRecord, ...notActiveDataList];

    commuteStorage = commutes;
    commuteRecords.value = commuteStorage;
    timeRecords.value = value.data;

    alert('퇴근 기록이 저장되었습니다.');
  } catch (error) {
    alert('퇴근 기록 저장에 실패했습니다.');
  }
};

let totalWorkTimeMs = 0; // 총 근무시간

// 비고란 작성 내용 업데이트
let timeoutId;

const updateDesc = async (record) => {
  try {
    const values = {
      ...record.data,
      remark: record.data.remark
    };

    const config = {
      record_id: record.record_id
    };

    await skapi.postRecord(values, config);

    // 상태 업데이트
    const updatedRecord = {
      record_id: record.record_id,
      data: values
    };
  } catch (error) {
    alert('비고 내용 저장에 실패했습니다.');
    console.error(error);
  }
}

// 1200ms마다 한 번씩만 실행되도록 설정
function autoUpdateDesc (record) {
    // 이전 타이머가 있다면 제거
    if (timeoutId) window.clearTimeout(timeoutId);

    // 새로운 타이머 설정
    timeoutId = window.setTimeout(() => {
      updateDesc(record);
    }, 1200);
}

// 출퇴근 기록 조회
const fetchCommuteRecords = async (userId = null, options = {}) => {
  try {
    if (!commuteStorage) {
      console.log('No commute records found');
      return [];
    }

    const query = {
      table: {
        name: 'commute_record',
        access_group: 98
      },
      reference: 'emp_id:' + makeSafe(user.user_id)
    };

    const fetchOptions = {
      // limit,
      ascending: false
    };

    const response = await skapi.getRecords(query, fetchOptions);
    return response;
  } catch (error) {
    // console.error('Error fetching records:', error);
    return [];
  }
};

// 출퇴근 시간 기록 저장
const onRecord = () => {
  // 만약 출퇴근 기록이 있다면
  if (commuteStorage.length > 0) {
    commuteRecords.value = commuteStorage;

    console.log('=== timeRecords.value ===', timeRecords.value);

    timeRecords.value.startTime = commuteStorage[0].data.startTime;
    timeRecords.value.endTime = commuteStorage[0].data.endTime;
  } else {
    timeRecords.value.startTime = '';
    timeRecords.value.endTime = '';
  }
};

// 최신 출퇴근 기록을 보이게 셋팅
watch(commuteRecords, (newVal) => {
  if (newVal.length > 0) {
    const result = {
      ...newVal[0].data,
      recordId: newVal[0].record_id,
      updated: newVal[0].updated,
      uploaded: newVal[0].uploaded
    };

    timeRecords.value = result;
  }
});

// 근무시간 계산
watch(commuteRecords, (newVal) => {
  // 근무시간 계산
  const validRecords = newVal.filter(
    (record) => record.data && record.data.startTimeStamp && record.data.endTimeStamp
  );

  const totalMilliseconds = validRecords.reduce((total, record) => {
    const workTime = record.data.endTimeStamp - record.data.startTimeStamp;
    return total + workTime;
  }, 0);

  const totalSeconds = Math.floor(totalMilliseconds / 1000); // 초로 변환
  const totalMinutes = Math.floor(totalSeconds / 60); // 분으로 변환

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  monthlyWorkTime.value = `${hours}시간 ${minutes}분`;
});

onMounted(async () => {
  console.log('출퇴근 기록 페이지');
  timeRecords.value.date = getDate();

  try {
    // 마스터가 설정한 부서별 근무시간 가져오기
    const getWorkTimes = await getWorkTime();
    console.log('=== getWorkTimes ===', getWorkTimes);

    // DB에서 기록 조회
    const res = await fetchCommuteRecords();
    if (res.list && Array.isArray(res.list)) {
      commuteStorage = [...res.list].sort((a, b) => b.uploaded - a.uploaded); // uploaded(레코드 최초 생성순) 기준으로 정렬해야 함.
    } else {
      commuteStorage = [];
    }
    onRecord();
  } catch (error) {
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
    min-width: 35rem;

    tbody {
      tr {
        &:hover {
          background-color: transparent;
        }
      }
    }
  }
}

.itembox-wrap {
  display: flex;
  gap: 0 24px;
  flex-wrap: wrap;
}

.itembox {
  box-shadow: 1px 1px 10px 0px rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  line-height: 1.2;
  flex: 1;

  .time {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2c3e50;
    border-bottom: 1px solid #ccc;
    padding-bottom: 1.5rem;

    .value {
      flex: 1;
      margin-left: 8px;
    }
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
    margin-bottom: 20px;
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

@media (max-width: 768px) {
  .itembox-wrap {
    flex-direction: column;
  }
}
</style>
