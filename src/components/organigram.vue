<template lang="pug">
.organigram-wrap
    template(v-if="getOrganigramRunning")
        Loading
    template(v-else)
        Department(
            v-for="(department, index) in organigram" 
            :key="index" 
            :department="department" 
            :useCheckbox="props.useCheckbox" 
            :onlyDivision="props.onlyDivision" 
            :onlyMyDivision="props.onlyMyDivision" 
            :excludeCurrentUser="props.excludeCurrentUser" 
            @update-check="updateChildrenCheckStatus" 
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
    onlyMyDivision
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
    }
});

const checkedEmps = ref([]);
const refresh = ref(false);

onMounted(() => {
    excludeCurrentUser.value = props.excludeCurrentUser;
    onlyMyDivision.value = props.onlyMyDivision;
});

watch(onlyMyDivision, async (nv, ov) => {
    if (ov && nv !== ov) {
        refresh.value = true;
    } else {
        refresh.value = false;
    }
    await getOrganigram(refresh.value, onlyMyDivision.value);
    refresh.value = false;
}, { immediate: true });

watch(() => props.selectedEmployees, async (nv, ov) => {
    if (!ov) {
        // 모달 열었을때 체크된 사용자가 있을 경우
        if (nv && nv.length > 0) {
            await nextTick();

            // 먼저 모든 체크박스 상태 초기화
            resetAllCheckStatus();

            // 선택된 사용자들에 대해 체크 상태 설정
            for (const emp of nv) {
                console.log('Selected Employee:', emp);

                // 직원 객체 찾기
                const employeeToCheck = findEmployeeInOrganigram(emp.user?.user_id);

                if (employeeToCheck) {
                    employeeToCheck.isChecked = true;

                    // 체크된 사용자를 checkedEmps 배열에 추가
                    if (!checkedEmps.value.some((u) => u.user?.user_id === emp.user?.user_id)) {
                        checkedEmps.value.push(employeeToCheck);
                    }
                }
            }

            // 부서 체크박스 상태 재계산
            recalculateDepartmentCheckStatus();
        }
    } else {
        if (nv.length !== ov.length) {
            // 삭제된 유저 찾기 (oldValue에는 있지만 newValue에는 없는 항목)
            const removedEmps = ov.filter(
                (oldUser) => !nv.some((newUser) => newUser.user.user_id === oldUser.user.user_id)
            );

            if (removedEmps.length > 0) {
                await nextTick();

                for (const emp of removedEmps) {
                    const employeeToUncheck = findEmployeeInOrganigram(emp.user.user_id);
                    if (employeeToUncheck) {
                        employeeToUncheck.isChecked = false;

                        // 체크 해제된 멤버를 checkedEmps 배열에서 제거
                        const index = checkedEmps.value.findIndex(
                            (u) => u.user.user_id === emp.user.user_id
                        );
                        if (index !== -1) {
                            checkedEmps.value.splice(index, 1);
                        }
                    }
                }

                // 부서 체크박스 상태 재계산
                recalculateDepartmentCheckStatus();
            }
        }
    }
}, { immediate: true, deep: true })

// 모든 부서와 멤버의 체크박스 상태를 초기화하는 함수 추가
function resetAllCheckStatus() {
    const resetDepartment = (department) => {
        department.isChecked = false;

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
            department.members.length === 0 || department.members.every((member) => member.isChecked);

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
function updateChildrenCheckStatus(department, isChecked) {
    department.isChecked = isChecked;

    // 멤버 상태 동기화
    if (department.members && department.members.length > 0) {
        department.members.forEach((member) => {
            member.isChecked = isChecked;

            // 체크된 멤버를 checkedEmps 배열에 추가
            if (isChecked) {
                if (!checkedEmps.value.some((emp) => emp.user.user_id === member.user.user_id)) {
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
    if (department.subDepartments && department.subDepartments.length > 0) {
        department.subDepartments.forEach((sub) => {
            updateChildrenCheckStatus(sub, isChecked);
        });
    }
}

// 부모 부서 상태를 업데이트하는 함수
function updateParentCheckStatus(item) {
    const parentDepartment = findParentDepartment(item); // 부모 부서를 찾는 함수
    if (!parentDepartment) return;

    // 모든 멤버가 체크되었는지 확인
    const allMembersChecked =
        parentDepartment.members.length === 0 ||
        parentDepartment.members.every((member) => member.isChecked);

    // 모든 하위 부서가 체크되었는지 확인
    const allSubDepartmentsChecked =
        parentDepartment.subDepartments.length === 0 ||
        parentDepartment.subDepartments.every((sub) => sub.isChecked);

    // 부모 부서의 체크 상태 업데이트
    parentDepartment.isChecked = allMembersChecked && allSubDepartmentsChecked;

    // 멤버가 체크 안되어있으면 부모 부서도 체크 해제
    if (!item.isChecked) {
        parentDepartment.isChecked = false;
    }

    // 부모 부서의 부모 상태도 동기화
    updateParentCheckStatus(parentDepartment);
}

// 부모 부서를 찾는 함수
function findParentDepartment(item) {
    for (const department of organigram.value) {
        if (department.members.includes(item) || department.subDepartments.includes(item)) {
            return department;
        }

        for (const sub of department.subDepartments) {
            const parent = findParentDepartmentRecursive(sub, item);
            if (parent) return parent;
        }
    }
    return null;
}

function findParentDepartmentRecursive(department, item) {
    if (department.members.includes(item) || department.subDepartments.includes(item)) {
        return department;
    }

    for (const sub of department.subDepartments) {
        const parent = findParentDepartmentRecursive(sub, item);
        if (parent) return parent;
    }

    return null;
}

// 조직도에서 특정 사용자 ID를 가진 직원 객체를 찾는 함수
function findEmployeeInOrganigram(userId) {
    // 재귀적으로 모든 부서를 검색하는 내부 함수
    function searchInDepartment(department) {
        // 현재 부서의 멤버 중에서 찾기
        const foundMember = department.members.find((member) => member.data.user_id === userId);
        if (foundMember) return foundMember;

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
</script>
