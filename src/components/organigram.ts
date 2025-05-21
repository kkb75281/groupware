import { type Ref, ref } from 'vue';
import { skapi } from '@/main.ts';
import { user, makeSafe } from '@/user.ts';
import { getUserInfo } from '@/employee.ts';
import {
  divisions,
  divisionNameList,
  getDivisionData,
  getDivisionDataRunning,
  getDivisionNamesRunning
} from '@/division.ts';
import { Console } from 'console';

export type Organigram = {
  division: string | null;
  name: string;
  members: any[];
  subDepartments: Organigram[];
  total: number;
  isChecked: boolean;
};

export let organigram: Ref<Organigram[]> = ref([]);
export let getOrganigramRunning = ref(false);
export let excludeCurrentUser = ref(false);
export let onlyMyDepartment = ref(false);

export async function getOrganigram(refresh = false, myDepartment = false) {
  onlyMyDepartment.value = myDepartment;

  if (getDivisionNamesRunning instanceof Promise) {
    await getDivisionNamesRunning;
  }

  if (organigram.value.length && !refresh) {
    getOrganigramRunning.value = false;
    return organigram.value;
  }

  getOrganigramRunning.value = true;
  organigram.value = []; // 초기화

  try {
    // 현재 사용자의 부서 정보를 가져오기
    const currentUserDepartment = await getCurrentUserDepartment();

    if (onlyMyDepartment.value && currentUserDepartment) {
      // 내 부서만 보기가 활성화되어 있고, 사용자의 부서 정보가 있을 때
      // 현재 사용자의 최상위 부서와 관련된 모든 부서를 표시
      for (const division in divisionNameList.value) {
        const fullName = divisionNameList.value[division];
        if (typeof fullName !== 'string') continue;

        // 사용자의 최상위 부서로 시작하는 모든 부서를 표시
        if (currentUserDepartment.some((dept) => fullName.startsWith(dept))) {
          const path = fullName.split('/');
          await addDepartment(path, division, organigram.value);
        }
      }
    } else {
      // 전체 부서 보기
      for (const division in divisionNameList.value) {
        const fullName = divisionNameList.value[division];
        if (typeof fullName !== 'string') continue;
        if (fullName.length < 1) continue;

        const path = fullName.split('/');
        await addDepartment(path, division, organigram.value);
      }
    }

    // 전체 부서 트리의 total 값을 재계산
    recalculateTotals(organigram.value);

    // 빈 부서 제거 옵션 (필요시 주석 해제)
    // const filterEmptyDepartments = (departments: Organigram[]) => {
    //   return departments.filter((dept) => {
    //     // 하위 부서가 있으면 재귀적으로 필터링
    //     if (dept.subDepartments.length > 0) {
    //       dept.subDepartments = filterEmptyDepartments(dept.subDepartments);
    //     }
    //     // 멤버가 있거나 하위 부서가 있는 경우만 유지
    //     return dept.members.length > 0 || dept.subDepartments.length > 0;
    //   });
    // };
    // organigram.value = filterEmptyDepartments(organigram.value);
  } catch (error) {
    console.error('=== getOrganigram === error : ', error);
  } finally {
    getOrganigramRunning.value = false;
  }
}

// 전체 부서 트리의 total 값을 상향식으로 재계산하는 함수
function recalculateTotals(departments: Organigram[]): number {
  let totalCount = 0;

  for (const dept of departments) {
    // 하위 부서의 총 인원 수를 계산
    const subDepartmentTotal =
      dept.subDepartments.length > 0 ? recalculateTotals(dept.subDepartments) : 0;

    // 현재 부서의 직접 멤버 수
    const directMembersCount = dept.members.length;

    // 총 인원 수 = 직접 멤버 수 + 하위 부서 총 인원 수
    dept.total = directMembersCount + subDepartmentTotal;

    // 상위 부서 계산을 위해 현재 부서의 총 인원 수를 반환
    totalCount += dept.total;
  }

  return totalCount;
}

// 현재 사용자의 부서 정보를 가져오는 함수
async function getCurrentUserDepartment() {
  try {
    const userDvsList = await skapi.getUniqueId({
      unique_id: `[emp_position_current]${makeSafe(user.user_id)}`,
      condition: '>='
    });

    const rootDepartments = [];

    // 사용자가 속한 부서가 없는 경우
    if (userDvsList.list && userDvsList.list.length > 0) {
      // 각 부서 정보 가져오기
      const promises = userDvsList.list.map(async (record) => {
        if (record && record.unique_id) {
          const parts = record.unique_id.split(':');
          if (parts.length) {
            const divisionId = parts[1];

            const getPosition = await skapi.getRecords({
              unique_id: `[emp_position_current]${makeSafe(user.user_id)}:${divisionId}`
            });

            // 사용자의 부서 인덱스 가져오기
            const userDeptIndex = getPosition.list[0]?.index?.name;

            // 부서 코드에서 실제 부서 경로 찾기
            for (const division in divisionNameList.value) {
              if (userDeptIndex.startsWith(division)) {
                // 사용자가 속한 부서의 전체 경로 찾기
                const fullPath = divisionNameList.value[division];
                // 최상위 부서 반환 (예: '스카피' 또는 '스카피/디자인팀'의 경우 '스카피')
                const rootDepartment = fullPath.split('/')[0];
                rootDepartments.push(rootDepartment);
              }
            }
          }
        }
      });

      await Promise.all(promises);
    }
    return rootDepartments;
  } catch (error) {
    console.error('=== getCurrentUserDepartment === error : ', error);
    return null;
  }
}

async function addDepartment(path: string[], division: string | null, currentLevel: Organigram[]) {
  if (getDivisionNamesRunning instanceof Promise) {
    await getDivisionNamesRunning;
  }

  const name = path[0]; // 현재 부서 이름
  const restPath = path.slice(1); // 나머지 경로

  // 현재 레벨에서 해당 이름을 가진 부서 찾기
  let department = currentLevel.find((dept) => dept.name === name);

  if (!department) {
    // 부서가 없으면 새로 추가
    department = {
      division: restPath.length === 0 ? division : null, // 마지막 레벨만 division 할당
      name,
      members: [],
      subDepartments: [],
      total: 0,
      isChecked: false
    };

    currentLevel.push(department);
  }

  // 하위 경로가 있으면 재귀적으로 처리
  if (restPath.length > 0) {
    await addDepartment(restPath, division, department.subDepartments);
  }

  // 마지막 레벨이면 멤버 추가
  if (restPath.length === 0 && division) {
    // approved 상태인 직원만 가져오기 (초청 직원 제외)
    const approvedUserIds = await skapi.getUsers({
      searchFor: 'approved',
      value: 'by_skapi:approved',
      condition: '>='
    });

    const approvedIdsSet = new Set(approvedUserIds.list.map((user) => user.user_id));

    // 현재 부서의 모든 직원 데이터를 가져옴
    const searchDepartmentMembers = await skapi.getRecords({
      table: {
        name: 'emp_position_current',
        access_group: 1
      },
      index: {
        name: division + '.',
        value: '',
        condition: '>'
      }
    });

    // approved 상태인 직원만 필터링
    const filteredMembers = searchDepartmentMembers.list.filter((member) =>
      approvedIdsSet.has(member?.data?.user_id)
    );

    const filteredMembersInfo = await Promise.all(
      filteredMembers.map(async (member) => {
        let uif = await getUserInfo(member.data.user_id);
        return {
          ...member,
          index: {
            name: member.index.name,
            value: uif.list[0]?.name || '이름 없음'
          }
        };
      })
    );
    console.log('filteredMembersInfo : ', filteredMembersInfo);
    console.log('excludeCurrentUser.value : ', excludeCurrentUser.value);

    // excludeCurrentUser가 true일 때만 현재 사용자 제외
    department.members = excludeCurrentUser.value
      ? filteredMembersInfo.filter((data) => data.data.user_id !== user.user_id)
      : filteredMembersInfo;

    console.log('department.members : ', department.members);

    // 현재 부서의 직접 멤버 수만 설정 (전체 total은 나중에 recalculateTotals에서 계산됨)
    department.total = department.members.length;
  }
}
