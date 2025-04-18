import { type Ref, ref } from 'vue';
import { skapi } from '@/main.ts';
import { user } from '@/user.ts';
import { getUserInfo } from '@/employee.ts';
import {
  divisions,
  divisionNameList,
  getDivisionData,
  getDivisionDataRunning,
  getDivisionNamesRunning
} from '@/division.ts';

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
export let onlyMyDepartment = ref(false); // 내 부서만 보기

export async function getOrganigram(refresh = false) {
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
    for (const division in divisionNameList.value) {
      const fullName = divisionNameList.value[division];
      if (typeof fullName !== 'string') continue;

      const path = fullName.split('/');
      await addDepartment(path, division, organigram.value);
    }

    // 빈 부서 제거 (멤버가 0명이고 하위 부서도 없는 경우)
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

  // 하위 부서의 데이터를 상위 부서로 합산
  department.total =
    department.members.length +
    department.subDepartments.reduce((sum, subDept) => sum + subDept.total, 0);

  // 마지막 레벨이면 멤버 추가
  if (restPath.length === 0) {
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
    // const departmentMembers = searchDepartmentMembers.list;

    // approved 상태인 직원만 필터링
    const filteredMembers = searchDepartmentMembers.list.filter((member) =>
      approvedIdsSet.has(member?.data?.user_id)
    );
    console.log('=== filteredMembers ===', filteredMembers);

    const filteredMembersInfo = await Promise.all(
      filteredMembers.map(async (member) => {
        let uif = await getUserInfo(member.data.user_id);
        // console.log('=== uif ===', uif.list[0]);

        return {
          ...member,
          index: {
            name: member.index.name,
            value: uif.list[0].name
          }
        };
      })
    );
    console.log('=== filteredMembersInfo ===', filteredMembersInfo);

    // 본인 찾기
    const myIndex = filteredMembersInfo.find((member) => member.data.user_id === user.user_id);
    console.log('myIndex : ', myIndex);

    // 내 부서만 보기일 때
    if (onlyMyDepartment.value) {
      console.log('내 부서만 보기');
      // 내 부서의 멤버만 필터링
      const myDepartmentMembers = filteredMembersInfo.filter((member) => {
        console.log('member : ', member);
        member.index.name.startsWith(user.department);
      });
      console.log('myDepartmentMembers : ', myDepartmentMembers);
    } else {
      console.log('전체 보기');
    }

    // excludeCurrentUser가 true일 때만 현재 사용자 제외
    // department.members = excludeCurrentUser.value ? departmentMembers.filter((data) => data.data.user_id !== user.user_id) : departmentMembers;
    // department.members = excludeCurrentUser.value ? filteredMembers.filter((data) => data.data.user_id !== user.user_id) : filteredMembers;
    department.members = excludeCurrentUser.value
      ? filteredMembersInfo.filter((data) => data.data.user_id !== user.user_id)
      : filteredMembersInfo;

    // 멤버 수 업데이트
    department.total =
      department.members.length +
      department.subDepartments.reduce((sum, subDept) => sum + subDept.total, 0);

    return department;
  }
}
