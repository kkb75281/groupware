<template lang="pug">
.title
	h1 조직도

hr

.button-wrap(style="display: flex; justify-content: end; align-items: center;")
	button.btn.outline(type="button" @click="toggleAllDetails") {{ allDetailsOpen ? '모두 닫기' : '모두 열기' }}

br

.department-wrap
	template(v-if="loading")
		Loading
	template(v-else)
		Department(v-for="(department, index) in organigram" :key="index" :department="department" @update-check="onDepartmentCheck")
</template>

<script lang="ts" setup>
import { type Ref, ref } from 'vue'
import { skapi } from '@/main'
import { makeSafe } from '@/user'
import {
    loading,
    divisions,
    divisionNameList,
    getDivisionData,
    getDivisionDataRunning,
    getDivisionNamesRunning,
} from "@/division";

import Loading from '@/components/loading.vue'
import Department from '@/components/department.vue'

type Organigram = {
    division: string | null;
    name: string;
    members: any[];
    subDepartments: Organigram[];
    total: number;
	isChecked: boolean;
};

let currentEmpData = ref([]);
let getEmpPositionCurrentRunning: Promise<any> | null = null;
let organigram: Ref<Organigram[]> = ref([]);
let checkedUserIds = ref<string[]>([]);
let loading = ref(false);
let allDetailsOpen = ref(false);

function toggleAllDetails() {
	allDetailsOpen.value = !allDetailsOpen.value;

	document.querySelectorAll('details').forEach(detail => {
		if(allDetailsOpen.value) {
			detail.open = true;
		} else {
			detail.open = false;
		}
	});
}

async function getEmpPositionCurrent() {
	if(getEmpPositionCurrentRunning instanceof Promise) { // 이미 실행중인 경우
		console.log('!!!!!실행중 getEmpPositionCurrentRunning')
        await getEmpPositionCurrentRunning;
        return currentEmpData.value;
    }

	getEmpPositionCurrentRunning = skapi.getRecords({
		table: {
			name: 'emp_position_current',
			access_group: 1,
		},
	}).finally(() => {
        getEmpPositionCurrentRunning = null;

        if (getDivisionDataRunning instanceof Promise) {
            getDivisionDataRunning.finally(() => {
                loading.value = false;
            });
        } else {
            loading.value = false;
        }
    });

	let res = await getEmpPositionCurrentRunning;

    if (res.list.length) {
        currentEmpData.value = res.list;
    }

	// 예전에 지운 유저인데 남아있는 데이터 삭제
	// for(let data of currentEmpData.value) {
	// 	skapi.getUsers({
	// 		searchFor: 'user_id',
	// 		value: data.data.user_id,
	// 	}).then((res) => {
	// 		console.log(res)
	// 		if(!res.list.length) {
	// 			skapi.deleteRecords({
	// 				unique_id: "[emp_position_current]" + makeSafe(data.data.user_id)
	// 			}).catch(err=>{
	// 				console.log(err);
	// 			});
	// 		}
	// 	});
	// }

    return currentEmpData.value;
}
getEmpPositionCurrent();

async function addDepartment(path: string[], division: string | null, currentLevel: Organigram[]) {
	if (getEmpPositionCurrentRunning instanceof Promise) {
		await getEmpPositionCurrentRunning;
	}

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
        };

        currentLevel.push(department);
    }

    // 하위 경로가 있으면 재귀적으로 처리
    if (restPath.length > 0) {
        addDepartment(restPath, division, department.subDepartments);
    }

	// 하위 부서의 데이터를 상위 부서로 합산
	department.total = department.members.length + department.subDepartments.reduce((sum, subDept) => sum + subDept.total, 0);

	// 마지막 레벨이면 멤버 추가
	if (restPath.length === 0) {
		for (let data of currentEmpData.value) {
			if (data.index.name.includes(division)) {
				department.members.push(data);
			}
		}

		// 멤버 수 업데이트
		department.total = department.members.length + department.subDepartments.reduce((sum, subDept) => sum + subDept.total, 0);
	}
}

async function getOrganigram() {
	loading.value = true;
	organigram.value = []; // 초기화

	try {
        if (getDivisionNamesRunning instanceof Promise) {
            await getDivisionNamesRunning;
        }

		if (getEmpPositionCurrentRunning instanceof Promise) {
			await getEmpPositionCurrentRunning;
		}

        for (const division in divisionNameList.value) {
            const fullName = divisionNameList.value[division];
            if (typeof fullName !== 'string') continue;

            const path = fullName.split('/');
            await addDepartment(path, division, organigram.value);
        }

        console.log('Final organigram:', organigram.value);
    } catch (error) {
        console.error('Error generating organigram:', error);
    } finally {
        loading.value = false;
    }
}

getOrganigram();

function onDepartmentCheck(obj: { type: string; target: any; isChecked: boolean }) {
	const { type, target, isChecked } = obj;

	if (type === 'department') {
		// 현재 부서 및 모든 하위 부서와 멤버 상태를 동기화
		updateChildrenCheckStatus(target, isChecked);

		// 부모 부서의 체크 상태도 업데이트
		updateParentCheckStatus(target);
	} else if (type === 'member') {
		// 멤버의 상태를 업데이트
		target.isChecked = isChecked;

		// 부모 부서의 체크 상태 업데이트
		updateParentCheckStatus(target);
	}

	// 체크된 사용자 ID 업데이트
	checkedUserIds.value = currentEmpData.value.filter((data) => data.isChecked).map((data) => data.data.user_id);

	console.log(checkedUserIds.value);
}

// 자식(하위 부서 및 멤버) 상태를 업데이트하는 함수
function updateChildrenCheckStatus(department: any, isChecked: boolean) {
	department.isChecked = isChecked;

	// 멤버 상태 동기화
	if (department.members && department.members.length > 0) {
		department.members.forEach((member: any) => {
			member.isChecked = isChecked;
		});
	}

	// 하위 부서 상태 동기화
	if (department.subDepartments && department.subDepartments.length > 0) {
		department.subDepartments.forEach((sub: any) => {
			updateChildrenCheckStatus(sub, isChecked);
		});
	}	
}

// 부모 부서 상태를 업데이트하는 함수
function updateParentCheckStatus(item: any) {
	const parentDepartment = findParentDepartment(item); // 부모 부서를 찾는 함수
	if (!parentDepartment) return;

	// 모든 멤버가 체크되었는지 확인
	const allMembersChecked =
		parentDepartment.members.length === 0 ||
		parentDepartment.members.every((member: any) => member.isChecked);

	// 모든 하위 부서가 체크되었는지 확인
	const allSubDepartmentsChecked =
		parentDepartment.subDepartments.length === 0 ||
		parentDepartment.subDepartments.every((sub: any) => sub.isChecked);

	// 부모 부서의 체크 상태 업데이트
	parentDepartment.isChecked = allMembersChecked && allSubDepartmentsChecked;

	// 부모 부서의 부모 상태도 동기화
	updateParentCheckStatus(parentDepartment);
}

// 부모 부서를 찾는 함수
function findParentDepartment(item: any): any {
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

function findParentDepartmentRecursive(department: any, item: any): any {
	if (department.members.includes(item) || department.subDepartments.includes(item)) {
		return department;
	}

	for (const sub of department.subDepartments) {
		const parent = findParentDepartmentRecursive(sub, item);
		if (parent) return parent;
	}

	return null;
}

</script>

<style lang="less" scoped>

</style>