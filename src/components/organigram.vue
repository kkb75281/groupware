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
import { ref, watch, nextTick, onMounted } from 'vue';
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
        resetAllCheckStatus();
        checkedEmps.value = [];

        // 새로 선택된 사용자들이 있는 경우에만 처리
        if (n && n.length > 0) {
            for (const emp of n) {
                console.log('= watch = emp : ', emp);
                const employeeToCheck = findEmployeeInOrganigram(emp.user?.user_id, emp.division);
                console.log('= watch = employeeToCheck : ', employeeToCheck);

                if (employeeToCheck) {
                    const department = findDepartmentOfEmployee(emp.user?.user_id);
                    console.log('= watch = department : ', department);
                    console.log(`체크됨 = ${emp.user?.name}`);

                    employeeToCheck.isChecked = true;
                    if (department) department.isOpened = true;

                    // selectedEmployees에만 있는 키를 employeeToCheck에 복사
                    Object.keys(emp).forEach((key) => {
                        if (!(key in employeeToCheck)) {
                            employeeToCheck[key] = emp[key];
                        }
                    });

                    // 체크된 사용자를 checkedEmps 배열에 추가
                    if (!checkedEmps.value.some((u) => u.user?.user_id === emp.user?.user_id)) {
                        checkedEmps.value.push(employeeToCheck);
                    }
                }
            }

            // 부서 체크박스 상태 재계산
            recalculateDepartmentCheckStatus();
        }
    }
);

onMounted(async () => {
    let refresh = false;

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
        console.log('= onMounted = props.selectedEmployees : ', props.selectedEmployees);

        // 선택된 사용자들에 대해 체크 상태 설정
        for (const emp of props.selectedEmployees) {
            // 직원 객체 찾기
            const employeeToCheck = findEmployeeInOrganigram(emp.user?.user_id, emp.division);
            console.log('= onMounted = employeeToCheck : ', employeeToCheck);

            if (employeeToCheck) {
                const department = findDepartmentOfEmployee(emp.user?.user_id);
                console.log('= onMounted = department : ', department);

                employeeToCheck.isChecked = true;
                if (department) department.isOpened = true;

                // selectedEmployees에만 있는 키를 employeeToCheck에 복사
                Object.keys(emp).forEach((key) => {
                    if (!(key in employeeToCheck)) {
                        employeeToCheck[key] = emp[key];
                    }
                });

                // 체크된 사용자를 checkedEmps 배열에 추가
                if (!checkedEmps.value.some((u) => u.user?.user_id === emp.user?.user_id)) {
                    checkedEmps.value.push(employeeToCheck);
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

        // 모든 멤버가 체크되었는지 확인
        const allMembersChecked =
            department.members.length === 0 ||
            department.members.every((member) => member.isChecked);

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
    const type = update.type;
    const target = update.target;
    const isChecked = update.isChecked;

    if (type === 'department') {
        target.isChecked = isChecked;

        if (isChecked) target.isOpened = true;

        // 멤버 상태 동기화
        if (target.members && target.members.length > 0) {
            target.members.forEach((member) => {
                member.isChecked = isChecked;

                // 체크된 멤버를 checkedEmps 배열에 추가
                if (isChecked) {
                    if (
                        !checkedEmps.value.some((emp) => emp.user.user_id === member.user.user_id)
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
            if (!checkedEmps.value.some((emp) => emp.user.user_id === target.user.user_id)) {
                checkedEmps.value.push(target);
            }
        } else {
            // 체크 해제된 멤버를 checkedEmps 배열에서 제거
            const index = checkedEmps.value.findIndex(
                (emp) => emp.user.user_id === target.user.user_id
            );
            if (index !== -1) {
                checkedEmps.value.splice(index, 1);
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

    emit('selection-change', sendCheckedEmps);
}

// 조직도에서 특정 사용자 ID와 부서명을 가진 직원 객체를 찾는 함수 (다중 부서 직원 포함)
function findEmployeeInOrganigram(userId, division) {
    console.log('userId : ', userId);
    console.log('division : ', division);

    // 재귀적으로 모든 부서를 검색하는 내부 함수
    function searchInDepartment(department) {
        console.log('= findEmployeeInOrganigram = department : ', department);

        // 현재 부서가 지정된 division과 일치할 경우만 멤버 탐색
        if (!division || department.division === division) {
            const foundMember = department.members.find((member) => {
                return member.user.user_id === userId;
            });
            if (foundMember) return foundMember;
        }

        // 하위 부서에서 찾기
        for (const subDept of department.subDepartments) {
            const found = searchInDepartment(subDept);
            if (found) return found;
        }

        return null;
    }

    // 최상위 부서부터 검색 시작
    for (const topDept of organigram.value) {
        const found = searchInDepartment(topDept);
        if (found) return found;
    }

    return null;
}

// 특정 사용자 ID를 가진 직원이 속한 부서를 찾는 함수
function findDepartmentOfEmployee(userId) {
    function search(department) {
        if (department.members.some((m) => m.user.user_id === userId)) {
            return department;
        }
        for (const sub of department.subDepartments) {
            const found = search(sub);
            if (found) return found;
        }
        return null;
    }
    for (const dept of organigram.value) {
        const found = search(dept);
        if (found) return found;
    }
    return null;
}
</script>
