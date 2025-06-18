<template lang="pug">
.organigram-wrap
    template(v-if="getOrganigramRunning")
        Loading
    template(v-else)
        Department(
            v-for="(department, index) in organigram" 
            :key="index" 
            :open="department.isOpened" 
            :department="department" 
            :useCheckbox="props.useCheckbox" 
            :onlyDivision="props.onlyDivision" 
            :onlyMyDivision="props.onlyMyDivision" 
            :excludeCurrentUser="props.excludeCurrentUser" 
            @update-check="updateCheckStatus" 
            @click.stop
        )
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { skapi } from '@/main.ts';
import { user } from '@/user.ts';
import {
    organigram,
    getOrganigram,
    getOrganigramRunning,
    excludeCurrentUser,
    onlyMyDivision,
    checkedEmps,
    findDepartmentByDivisionName
} from '@/components/organigram';

import Loading from '@/components/loading.vue';
import Department from '@/components/department.vue';

const emit = defineEmits(['selection-change']);
const props = defineProps({
    // 체크박스 사용 여부
    useCheckbox: {
        type: Boolean,
        default: false
    },
    // 부서만 보기 여부
    onlyDivision: {
        type: Boolean,
        default: false
    },
    // 내 부서만 보기 여부
    onlyMyDivision: {
        type: Boolean,
        default: false
    },
    // 본인 제외 여부 (결재 요청 시)
    excludeCurrentUser: {
        type: Boolean,
        default: false
    },
    // 선택된 직원들
    selectedEmployees: {
        type: Array,
        default: () => []
    },
    // 선택된 부서들
    selectedDivisions: {
        type: Array,
        default: () => []
    }
});

// 체크박스 상태 동기화
watch(
    () => props.selectedEmployees,
    (n, o) => {
        // 조직도가 아직 로드되지 않았다면 대기
        if (!organigram.value || organigram.value.length === 0) {
            return;
        }

        // 먼저 모든 체크박스 상태와 checkedEmps 초기화
        // resetAllCheckStatus();
        // checkedEmps.value = [];

        // 새로 선택된 사용자들이 있는 경우에만 처리
        if (n && n.length > 0) {
            for (const emp of n) {
                console.log('= watch = emp(체크해야함) : ', emp);
                const employeeToCheck = findEmployeeInOrganigram(emp.division, emp.user?.user_id);
                const member = employeeToCheck?.member;
                const department = employeeToCheck?.department;

                if (member) {
                    member.isChecked = true;
                    if (department) openParentDepartments(department);

                    // selectedEmployees에만 있는 키를 employeeToCheck에 복사
                    Object.keys(emp).forEach((key) => {
                        if (!(key in member)) {
                            member[key] = emp[key];
                        }
                    });

                    // 체크된 사용자를 checkedEmps 배열에 추가
                    if (!checkedEmps.value.some((u) => u.user?.user_id === emp.user?.user_id)) {
                        checkedEmps.value.push(member);
                    }
                }
            }

            // 있었는데 체크 해제된 사용자들은 checkedEmps에서 제거 + isChecked = false 처리
            checkedEmps.value = checkedEmps.value.filter((emp) => {
                const stillChecked = n.some(
                    (newEmp) => newEmp.user?.user_id === emp.user.user_id && newEmp.division === emp.division
                );

                if (!stillChecked) {
                    emp.isChecked = false; // 체크 해제된 사용자는 isChecked도 false로

                    const otherDvs = findAllDepartmentsOfUser(emp.user.user_id);

                    for (const dvs of otherDvs) {
                        if (dvs.division === emp.division) continue; // 현재 부서와 동일한 부서는 건너뜀

                        const otherMember = dvs.members.find((m) => m.user.user_id === emp.user.user_id);

                        if (emp.isChecked) {
                            otherMember.isDisabled = true;
                        } else {
                            otherMember.isDisabled = false;
                        }
                    }
                }
                return stillChecked;
            });

            console.log('= watch = checkedEmps (새로 체크 됨) : ', checkedEmps.value);

            // 부서 체크박스 상태 재계산
            recalculateDepartmentCheckStatus();
        } else if (n !== o && n.length === 0) {
            checkedEmps.value = [];
            resetAllCheckStatus();
        }
    }
);

onMounted(async () => {
    let refresh = false;

    console.log('= onMounted = props.selectedEmployees (열렸을때 체크된 유저 확인) : ', props.selectedEmployees);

    if (
        excludeCurrentUser.value !== props.excludeCurrentUser ||
        onlyMyDivision.value !== props.onlyMyDivision
    ) {
        refresh = true;
    }

    excludeCurrentUser.value = props.excludeCurrentUser;
    onlyMyDivision.value = props.onlyMyDivision;

    await getOrganigram(refresh);

    // 먼저 모든 체크박스 상태 초기화
    resetAllCheckStatus();

    if (props.selectedEmployees && props.selectedEmployees.length > 0) {
        // 모달 열었을때 체크된 사용자가 있을 경우
        console.log('= onMounted = props.selectedEmployees (체크된 사용자가 있음) : ', props.selectedEmployees);

        // 선택된 사용자들에 대해 체크 상태 설정
        for (const emp of props.selectedEmployees) {
            // 직원 객체 찾기
            const employeeToCheck = findEmployeeInOrganigram(emp.division, emp.user?.user_id);
            const member = employeeToCheck?.member;
            const department = employeeToCheck?.department;

            console.log('= onMounted = member : ', member);
            console.log('= onMounted = department : ', department);

            if (member) {
                member.isChecked = true;
                if (department) openParentDepartments(department);

                // selectedEmployees에만 있는 키를 employeeToCheck에 복사
                Object.keys(emp).forEach((key) => {
                    if (!(key in member)) {
                        member[key] = emp[key];
                    }
                });

                // 체크된 사용자를 checkedEmps 배열에 추가
                if (!checkedEmps.value.some((u) => u.user?.user_id === emp.user?.user_id && u.division === emp.division)) {
                    checkedEmps.value.push(member);
                }

                const otherDvs = findAllDepartmentsOfUser(member.user.user_id);

                for (const dvs of otherDvs) {
                    if (dvs.division === member.division) continue; // 현재 부서와 동일한 부서는 건너뜀

                    const otherMember = dvs.members.find((m) => m.user.user_id === member.user.user_id);

                    if (member.isChecked) {
                        otherMember.isDisabled = true;
                    } else {
                        otherMember.isDisabled = false;
                    }
                }
            }
        }

        // 부서 체크박스 상태 재계산
        recalculateDepartmentCheckStatus();
    }

    if (props.selectedDivisions && props.selectedDivisions.length > 0) {
        console.log('Selected Divisions onMounted:', props.selectedDivisions);
        // 선택된 부서들에 대해 체크 상태 설정
        for (const divisionName of props.selectedDivisions) {
            const department = findDepartmentByDivisionName(divisionName);
            if (department) {
                department.isChecked = true;
                department.isOpened = true;

                // 하위 부서와 멤버들도 체크 상태 설정
                if (department.members && department.members.length > 0) {
                    department.members.forEach((member) => {
                        member.isChecked = true;
                        // 체크된 멤버를 checkedEmps 배열에 추가
                        if (
                            !checkedEmps.value.some(
                                (emp) => emp.user.user_id === member.user.user_id
                            )
                        ) {
                            checkedEmps.value.push(member);
                        }
                    });
                }
            }
        }

        // 부서 체크박스 상태 재계산
        recalculateDepartmentCheckStatus();
    }

    console.log('= onMounted = checkedEmps (초기화 후) : ', checkedEmps.value);
});

onUnmounted(() => {
    checkedEmps.value = [];
});

// 모든 부서와 멤버의 체크박스 상태를 초기화하는 함수 추가
function resetAllCheckStatus() {
    const resetDepartment = (department) => {
        department.isChecked = false;
        department.isOpened = false;

        // 멤버 상태 초기화
        if (department.members && department.members.length > 0) {
            department.members.forEach((member) => {
                member.isChecked = false;
                member.isDisabled = false;
            });
        }

        // 하위 부서 상태 초기화
        if (department.subDepartments && department.subDepartments.length > 0) {
            department.subDepartments.forEach((sub) => {
                resetDepartment(sub);
            });
        }
    };

    // 최상위 부서부터 재귀적으로 초기화
    organigram.value.forEach((department) => {
        resetDepartment(department);
    });
}

// 부서 체크박스 상태를 재계산하는 함수 추가
function recalculateDepartmentCheckStatus() {
    // 모든 부서를 재귀적으로 검사하는 함수
    const checkDepartmentStatus = (department) => {
        // 먼저 하위 부서의 상태를 재귀적으로 확인
        if (department.subDepartments && department.subDepartments.length > 0) {
            department.subDepartments.forEach((subDept) => {
                checkDepartmentStatus(subDept);
            });
        }

        // excludeCurrentUser.value가 true면 본인 제외
        let membersToCheck = department.members;
        if (excludeCurrentUser.value) {
            membersToCheck = membersToCheck.filter(
                (member) => member.user.user_id !== user.user_id
            );
        }

        // 모든 멤버가 체크되었는지 확인
        const allMembersChecked =
            membersToCheck.length === 0 ||
            membersToCheck.every((member) => member.isChecked);

        // 모든 하위 부서가 체크되었는지 확인
        const allSubDepartmentsChecked =
            department.subDepartments.length === 0 ||
            department.subDepartments.every((subDept) => subDept.isChecked);

        // 부서의 체크 상태 업데이트
        department.isChecked = allMembersChecked && allSubDepartmentsChecked;
    };

    // 최상위 부서부터 시작하여 모든 부서의 체크 상태 재계산
    organigram.value.forEach((department) => {
        checkDepartmentStatus(department);
    });
}

// 자식(하위 부서 및 멤버) 상태를 업데이트하는 함수
function updateCheckStatus(update) {
    console.log('= updateCheckStatus = update : ', update);
    const type = update.type;
    const target = update.target;
    const isChecked = update.isChecked;

    if (type === 'department') {
        target.isChecked = isChecked;

        if (isChecked) target.isOpened = true;

        // 멤버 상태 동기화
        if (target.members && target.members.length > 0) {
            target.members.forEach((member) => {
                if (member.isDisabled) return; // 비활성화된 멤버는 건너뜀
                member.isChecked = isChecked;

                // 체크된 멤버를 checkedEmps 배열에 추가
                if (isChecked) {
                    if (
                        !checkedEmps.value.some((emp) => emp.user.user_id === member.user.user_id &&
                            emp.division === target.division)
                    ) {
                        checkedEmps.value.push(member);
                    }
                } else {
                    // 체크 해제된 멤버를 checkedEmps 배열에서 제거
                    const index = checkedEmps.value.findIndex(
                        (emp) => emp.user.user_id === member.user.user_id
                    );
                    if (index !== -1) {
                        checkedEmps.value.splice(index, 1);
                    }
                }

                const otherDvs = findAllDepartmentsOfUser(member.user.user_id);

                for (const dvs of otherDvs) {
                    if (dvs.division === member.division) continue; // 현재 부서와 동일한 부서는 건너뜀

                    const otherMember = dvs.members.find((m) => m.user.user_id === member.user.user_id);

                    if (member.isChecked) {
                        otherMember.isDisabled = true;
                    } else {
                        otherMember.isDisabled = false;
                    }
                }
            });
        }

        // 하위 부서 상태 동기화
        if (target.subDepartments && target.subDepartments.length > 0) {
            target.subDepartments.forEach((sub) => {
                updateCheckStatus({
                    type: 'department',
                    target: sub,
                    isChecked: isChecked
                });
            });
        }
    } else if (type === 'member') {
        target.isChecked = isChecked;

        // 체크된 멤버를 checkedEmps 배열에 추가
        if (isChecked) {
            console.log('체크 true')
            if (!checkedEmps.value.some((emp) => emp.user.user_id === target.user.user_id && emp.division === target.division)) {
                checkedEmps.value.push(target);
            }
        } else {
            console.log('체크 false')
            // 체크 해제된 멤버를 checkedEmps 배열에서 제거
            const index = checkedEmps.value.findIndex(
                (emp) => emp.user.user_id === target.user.user_id && emp.division === target.division
            );
            console.log('index : ', index);
            if (index !== -1) {
                checkedEmps.value.splice(index, 1);
            }
        }

        const otherDvs = findAllDepartmentsOfUser(target.user.user_id);

        for (const dvs of otherDvs) {
            if (dvs.division === target.division) continue; // 현재 부서와 동일한 부서는 건너뜀

            const otherMember = dvs.members.find((m) => m.user.user_id === target.user.user_id);

            if (isChecked) {
                otherMember.isDisabled = true;
            } else {
                otherMember.isDisabled = false;
            }
        }

        // 부서 체크 상태 재계산
        recalculateDepartmentCheckStatus();
    }

    // 조직도에 관련된 변수는 빼고 checkedEmps 배열을 emit 이벤트로 전달
    let sendCheckedEmps = checkedEmps.value.map((emp) => {
        const { isChecked, ...rest } = emp;
        if (props.excludeCurrentUser && emp.user.user_id === user.user_id) {
            return null; // 본인 제외
        }
        return rest;
    });

    sendCheckedEmps = sendCheckedEmps.filter((emp) => emp !== null); // null 값 제거

    console.log('= updateCheckStatus = sendCheckedEmps : ', sendCheckedEmps);

    emit('selection-change', sendCheckedEmps);
}

// 상위 부서들을 열기 위한 함수
function openParentDepartments(department) {
    if (!department) return;
    department.isOpened = true;
    if (department._parent) {
        openParentDepartments(department._parent);
    }
}

// 조직도에서 특정 사용자 ID와 부서명을 가진 직원 객체를 찾는 함수 (다중 부서 직원은 모두 체크)
function findEmployeeInOrganigram(dvs, userId) {
    // 재귀적으로 모든 부서를 검색하는 내부 함수
    function searchInDepartment(department) {
        if (department.division === dvs) {
            for (const member of department.members) {
                if (member.user.user_id === userId) {
                    // 부서와 멤버를 함께 반환
                    return { department, member };
                }
            }
        }
        // 하위 부서도 재귀 탐색
        for (const subDept of department.subDepartments || []) {
            const found = searchInDepartment(subDept);
            if (found) return found;
        }
        return null;
    }

    // 최상위 부서부터 탐색 시작
    for (const topDept of organigram.value) {
        const found = searchInDepartment(topDept);
        if (found) return found;
    }

    return null;
}

// 특정 userId가 속한 모든 부서(division)를 배열로 반환하는 함수
function findAllDepartmentsOfUser(userId) {
    const result = [];

    function search(department) {
        // 해당 부서에 userId가 있는지 확인
        if (department.members && department.members.some(m => m.user.user_id === userId)) {
            result.push(department);
        }
        // 하위 부서도 재귀 탐색
        if (department.subDepartments && department.subDepartments.length > 0) {
            department.subDepartments.forEach(sub => search(sub));
        }
    }

    organigram.value.forEach(dept => search(dept));
    return result;
}
</script>
