<template lang="pug">
//- h1 근태 관리

//- hr

.table-wrap
    .tb-head-wrap
        form#searchForm(@submit.prevent="searchEmp")
            .input-wrap
                select(v-model="searchFor")
                    option(value="name") 이름
                    option(value="division") 부서/직책
                    
            .input-wrap.search(v-if="searchFor !== 'division'")
                input(v-model="searchValue" type="text" placeholder="검색어를 입력하세요.")
                button.btn-search
            template(v-else)
                .input-wrap
                    select(name="searchDivision" v-model="searchValue" @change="searchEmp")
                .input-wrap.search(style="width: 176px;")
                    input(v-model="searchPositionValue" type="text" placeholder="직책을 입력하세요." :disabled="searchValue === '전체'")
                    button.btn-search

        .tb-toolbar
            .btn-wrap
                button.btn.outline.refresh-icon(:disabled="loading" @click="refresh")
                    svg(:class="{'rotate' : loading}")
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-refresh")
                button.btn.outline.btn-edit-workTime(@click="router.push('/admin/edit-worktime')") 시간 설정
    .tb-overflow
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
                    tr.nohover.loading(style="border-bottom: none;")
                        td(colspan="6" style="padding: 0; height: initial;")
                            Loading#loading
                template(v-else-if="!employee || Object.keys(employee).length === 0")
                    tr
                        td(colspan="6") 데이터가 없습니다.
                template(v-else)
                    tr(v-for="(emp, index) in employee" :key="emp.user_id" @click.stop="(e) => goToEmpCommute(emp.user_id)")
                        td.list-num {{ index + 1 }}
                        td.user-name
                                span {{ emp.name }}
                        td.dvs
                          .list.position
                            .list-item.position(v-for="(division, index) in getEmployeeDivisions(emp)" :key="index")
                              span {{ division.position || '-' }}
                        td.dvs
                          .list.division
                            .list-item.division(v-for="(division, index) in getEmployeeDivisions(emp)" :key="index")
                              span {{ divisionNameList[division.division] || '-' }}
                        td.startWork
                            span.time {{ extractTimeFromDateTime(emp.startWork) }}
                        td.endWork
                            span.time {{ extractTimeFromDateTime(emp.endWork) }}

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
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { skapi } from '@/main.ts';
import { loading, divisionNameList, getDivisionData } from '@/division.ts';
import { user, makeSafe } from '@/user.ts';
import { getEmpDivisionPosition } from '@/employee.ts';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

// const loading = ref(true);
const employee = ref([]);
const selectedEmp = ref(null);
const searchFor = ref('name');
const searchValue = ref('');
const searchPositionValue = ref('');

const extractTimeFromDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';

  return dateTimeStr.split(' ')[1]; // 시간만 추출 (ex. 2021-08-01 15:00:00 -> 15:00:00)
};

const callParams = computed(() => {
  switch (searchFor.value) {
    case 'name':
      return {
        searchFor: 'name',
        value: searchValue.value,
        condition: '>='
      };

    case 'division':
      return {
        searchFor: 'timestamp',
        value: new Date().getTime(),
        condition: '<='
      };
  }
});

watch(searchFor, (nv) => {
  if (nv) {
    searchValue.value = '';

    if (nv === 'division') {
      nextTick(() => {
        displayDivisionOptions('searchDivision');
        searchValue.value = '전체';
      });
    }
  }
});

watch(searchValue, (nv) => {
  if (nv) {
    if (nv === '전체' && searchFor.value === 'division') {
      callParams.value.searchFor = 'approved';
      callParams.value.value = 'by_skapi:approved';
      callParams.value.condition = '>=';

      searchEmp();
    }
  }
});

// 직원의 모든 부서/직책 정보를 가져오는 함수
const getEmployeeDivisions = (emp) => {
  // 다중 부서
  if (emp.divisions && Array.isArray(emp.divisions) && emp.divisions.length > 0) {
    return emp.divisions;
  }

  // 단일 부서
  return [
    {
      division: emp.division || '',
      position: emp.position || '-'
    }
  ];
};

// 출퇴근 관련 직원 목록 가져오기
const getEmpList = async () => {
  const newEmpList = [];
  loading.value = true;

  try {
    const empList = await skapi.getUsers();

    if (!empList || !empList.list || empList.list.length === 0) {
      loading.value = false;
      return [];
    }

    // 최고 마스터 제거
    if (empList.list.length > 0) {
      empList.list.pop();
    }

    // 부서별 설정된 출퇴근시간 가져오기
    const workTime = await skapi.getRecords({
      table: {
        name: 'dvs_workTime_setting',
        access_group: 1
      }
    });

    if (!workTime.list.length) {
      loading.value = false;
      return [];
    }

    // 직원 정보 처리
    const empPromises = empList.list.map(async (emp) => {
      try {
        // 기본 직원 정보 복사
        const empInfo = { ...emp };

        // 직원의 모든 부서/직책 정보 가져오기
        const userIdSafe = makeSafe(emp.user_id);

        try {
          // 모든 부서 ID 가져오기
          const empDivs = await skapi.getUniqueId({
            unique_id: `[emp_position_current]${userIdSafe}`,
            condition: '>='
          });

          if (empDivs && empDivs.list && empDivs.list.length > 0) {
            // 각 부서 ID에 대한 세부 정보 가져오기
            const divisions = await Promise.all(
              empDivs.list.map(async (record) => {
                if (!record || !record.unique_id) return null;

                const parts = record.unique_id.split(':');
                if (parts.length < 2) return null;

                const divisionId = parts[1];

                // 세부 정보 가져오기
                try {
                  const divisionDetails = await skapi.getRecords({
                    table: {
                      name: 'emp_position_current',
                      access_group: 1
                    },
                    unique_id: record.unique_id
                  });

                  if (divisionDetails && divisionDetails.list && divisionDetails.list.length > 0) {
                    const detail = divisionDetails.list[0];
                    let positionName = '-';

                    // index.name에서 추출 시도
                    if (detail.index && detail.index.name) {
                      const nameParts = detail.index.name.split('.');
                      if (nameParts.length >= 2) {
                        positionName = nameParts[1];
                      }
                    }

                    return {
                      division: divisionId,
                      position: positionName
                    };
                  }
                } catch (error) {
                  console.warn(`부서 세부 정보 조회 중 오류 (${record.unique_id}):`, error);
                }

                return null;
              })
            );

            // null 제거 및 유효한 부서 정보만 추출
            const validDivisions = divisions.filter((div) => div !== null);

            // 직원 객체에 divisions 속성 추가
            if (validDivisions.length > 0) {
              empInfo.divisions = validDivisions;

              // 첫 번째 부서 정보를 기본 부서/직책으로 설정 (이전 코드와의 호환성)
              empInfo.division = validDivisions[0].division;
              empInfo.position = validDivisions[0].position;
            }
          }
        } catch (error) {
          console.error(`직원(${emp.user_id}) 부서 정보 조회 중 오류:`, error);
        }

        // 현재 날짜와 시간 가져오기
        let now = new Date();

        // 오늘 날짜의 0시로 설정
        let todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // timestamp (밀리초 단위)로 변환
        let todaytimestamp = todayStart.getTime();

        // 직원별 출퇴근 기록 가져오기
        try {
          const query = {
            table: {
              name: 'commute_record',
              access_group: 98
            },
            index: {
              name: '$uploaded',
              value: todaytimestamp,
              condition: '>='
            },
            reference: 'emp_id:' + userIdSafe
          };

          const fetchOptions = {
            ascending: false
          };

          // 직원별 출퇴근 기록 가져오기
          const commuteRecords = await skapi.getRecords(query, fetchOptions);
          const commuteList = commuteRecords?.list?.sort((a, b) => a.uploaded - b.uploaded);

          if (commuteList && commuteList.length > 0) {
            if (commuteList.length > 1) {
              const lastCommute = commuteList[commuteList.length - 1];
              empInfo.startWork = lastCommute?.data?.startTime || '-';
              empInfo.endWork = lastCommute?.data?.endTime || '-';
            } else {
              const lastCommute = commuteList[0];
              empInfo.startWork = lastCommute?.data?.startTime || '-';
              empInfo.endWork = lastCommute?.data?.endTime || '-';
            }
          } else {
            empInfo.startWork = '-';
            empInfo.endWork = '-';
          }
        } catch (error) {
          console.log(`직원(${emp.user_id}) 출퇴근 기록 조회 중 오류:`, error);
          empInfo.startWork = '-';
          empInfo.endWork = '-';
        }

        return empInfo;
      } catch (error) {
        console.error(`직원 처리 중 오류:`, error);
        return null;
      }
    });

    const results = await Promise.all(empPromises);
    const filteredResults = results.filter((emp) => emp !== null);
    newEmpList.push(...filteredResults);

    return newEmpList;
  } catch (error) {
    console.error('=== getEmpList === error : ', error);
    return newEmpList;
  } finally {
    loading.value = false;
  }
};

// 시간 문자열을 타임스탬프로 변환하는 유틸리티 함수
function getTimestampFromTimeString(timeString) {
  const today = new Date();
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  today.setHours(hours, minutes, seconds, 0);
  return today.getTime();
}

const displayDivisionOptions = (selectName) => {
  let divisionList = document.querySelector(`select[name="${selectName}"]`);

  // 기존 옵션을 제거하지 않고 새로운 옵션을 추가
  divisionList.innerHTML = ''; // 기존 옵션 초기화

  const allOption = document.createElement('option');
  const defaultOption = document.createElement('option');

  let matchFound = false;

  // 기본 옵션 추가
  if (selectName == 'searchDivision') {
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
    if (divisionNameList.value[key] !== '') {
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
};

// 직원 검색
const searchEmp = async (refresh) => {
  loading.value = true;

  try {
    const empList = await getEmpList(); // getEmpList는 이미 부서정보와 출퇴근 기록을 모두 가져옴

    // 검색어가 없거나 전체 선택시 모든 직원 표시
    if (!searchValue.value || (searchFor.value === 'division' && searchValue.value === '전체')) {
      employee.value = empList;
      return;
    }

    // 검색 조건에 따른 필터링
    employee.value = empList.filter((emp) => {
      if (searchFor.value === 'name') {
        return emp.name.includes(searchValue.value);
      }

      if (searchFor.value === 'division') {
        if (searchPositionValue.value) {
          // 부서와 직책 모두 검색
          return (
            emp.division === searchValue.value && emp.position.includes(searchPositionValue.value)
          );
        }
        // 부서만 검색
        return emp.division === searchValue.value;
      }

      return true;
    });
  } catch (error) {
    console.error('=== searchEmp === error:', error);
    employee.value = [];
  } finally {
    // loading.value = false;
  }
};

// 새로고침
const refresh = async () => {
  // 검색 영역 초기화
  searchFor.value = 'name';
  searchValue.value = '';
  searchPositionValue.value = '';

  await getDivisionData();
  const res = await getEmpList();
  if (res.length > 0) {
    employee.value = res.filter((emp) => emp.approved.split(':')[1] !== 'suspended');
  }
};

// 각 직원 출퇴근 기록 상세 페이지로 이동
const goToEmpCommute = (userId) => {
  router.push({ name: 'commute-detail', params: { userId } });
};

onMounted(async () => {
  await getDivisionData(); // 부서 데이터를 먼저 완전히 로드
  const res = await getEmpList(); // 그 다음 직원 목록 로드
  // 만약 숨김 직원이 있다면 제거
  if (res.length > 0) {
    employee.value = res.filter((emp) => emp.approved.split(':')[1] !== 'suspended');
  }
});
</script>

<style scoped lang="less">
.table-wrap {
  #searchForm {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.table {
  tbody {
    tr {
      &:hover {
        cursor: pointer;
      }
    }

    td {
      white-space: nowrap;
    }
  }
}
</style>
