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
    isOpened: boolean;
    _parent?: Organigram | null; // 부모 부서 참조
};

export let organigram: Ref<Organigram[]> = ref([]);
export let getOrganigramRunning: Ref<boolean> = ref(false);
export let currentUserDivisions: Ref<string[]> = ref([]);
export let excludeCurrentUser = ref(false);
export let onlyMyDivision = ref(false);
export const checkedEmps = ref([]);

export async function getOrganigram(refresh = false) {
    if (getDivisionNamesRunning instanceof Promise) {
        await getDivisionNamesRunning;
    }

    if (organigram.value.length && !refresh) {
        return organigram.value;
    }

    getOrganigramRunning.value = true;
    organigram.value = []; // 초기화

    // 현재 사용자의 부서 정보를 가져오기
    currentUserDivisions.value = await getCurrentUserDepartment();

    if (onlyMyDivision.value && currentUserDivisions.value) {
        // 내 부서만 보기가 활성화되어 있고, 사용자의 부서 정보가 있을 때
        // 현재 사용자의 최상위 부서와 관련된 모든 부서를 표시
        for (const division in divisionNameList.value) {
            const fullName = divisionNameList.value[division];
            if (typeof fullName !== 'string') continue;

            // 사용자의 최상위 부서로 시작하는 모든 부서를 표시
            if (currentUserDivisions.value.some((dept) => fullName.startsWith(dept))) {
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

    function setParentReferences(department: Organigram, parent = null) {
        department._parent = parent;
        if (department.subDepartments && department.subDepartments.length > 0) {
            department.subDepartments.forEach((sub) => setParentReferences(sub, department));
        }
    }
    // 조직도 데이터 로드 후
    organigram.value.forEach((dept) => setParentReferences(dept));

    getOrganigramRunning.value = false;
    console.log({ organigram: organigram.value });
}

// 부서명(division)으로 조직도에서 부서 객체를 찾는 재귀 함수
export function findDepartmentByDivisionName(divisionName: string) {
    // 부모 경로를 추적하며 찾기
    function search(department: Organigram, parents: Organigram[] = []): Organigram | null {
        if (department.division === divisionName) {
            // 부모 부서들의 isOpened를 true로 설정
            parents.forEach((parent) => (parent.isOpened = true));
            return department;
        }
        for (const sub of department.subDepartments) {
            const found = search(sub, [...parents, department]);
            if (found) return found;
        }
        return null;
    }
    for (const dept of organigram.value) {
        const found = search(dept, []);
        if (found) return found;
    }
    return null;
}

// 하위 부서 인원수를 합한 최상위 부서의 총 인원 수를 계산하는 함수
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

        const rootDepartments: string[] = [];

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
            isChecked: false,
            isOpened: false
        };

        currentLevel.push(department);
    } else {
        if (divisionNameList.value[division]) {
            const nameList = divisionNameList.value[division].split('/');

            if (nameList[nameList.length - 1] === department.name) {
                department.division = division; // 이미 존재하는 부서의 경우 division 업데이트
            }
        }
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
                    user: uif.list[0],
                    division: member.index.name.split('.')[0] || '부서 없음',
                    position: member.index.name.split('.')[1] || '직위 없음',
                    isChecked: false,
                    isDisabled: false
                };
            })
        );

        department.members = filteredMembersInfo;

        // 현재 부서의 직접 멤버 수만 설정 (전체 total은 나중에 recalculateTotals에서 계산됨)
        department.total = department.members.length;
    }
}
