<template lang="pug">
.title
	h1 조직도

hr

Department(v-for="(department, index) in organigram" :key="index" :department="department")
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { skapi } from '@/main'
import {
    loading,
    divisions,
    divisionNameList,
    getDivisionData,
    getDivisionDataRunning,
    getDivisionNamesRunning,
} from "@/division";

import Department from '@/components/department.vue'

// console.log('divisionNameList', divisionNameList);
// console.log('divisions', divisions);

let organigram = ref([]);

skapi.getRecords({
	table: {
        name: 'emp_position_current',
        access_group: 1
    },
}).then(async(res) => {
	let data = res.list;

	if(getDivisionNamesRunning instanceof Promise) { // 이미 실행중인 경우
		console.log('!!!!!실행중 getDivisionNames')
        await getDivisionNamesRunning;
    }

	// for(let name in divisionNameList.value) {
	// 	type Organigram = {
	// 		name: string,
	// 		members: any[],
	// 		subDepartments: Organigram[],
	// 		total: number,
	// 	};
	// 	let object: Organigram = {
	// 		name: name,
	// 		members: [],
	// 		subDepartments: [],
	// 		total: 0,
	// 	};
	// 	for(let d of data) {
	// 		if(d.index.name.includes(name)) {
	// 			object.members.push(d);
	// 			object.total++;
	// 		}
	// 	}
	// 	organigram.value.push(object);
	// }

	// 상위 부서를 기준으로 그룹화
	const groupedDepartments: Record<string, any> = {};

	// divisionNameList를 순회하여 상위 부서별로 정리
	for (const key in divisionNameList.value) {
		const fullName = divisionNameList.value[key];

		// fullName이 문자열인지 확인
		if (typeof fullName !== 'string') {
			console.warn(`Invalid fullName for key "${key}":`, fullName);
			continue; // 문자열이 아니면 건너뜀
		}

		const [parentName, childName] = fullName.split('/'); // '/'로 나누어 상위/하위 부서 분리

		if (!groupedDepartments[parentName]) {
			// 상위 부서가 없으면 초기화
			groupedDepartments[parentName] = {
				name: parentName,
				members: [],
				subDepartments: [],
				total: 0,
			};
		}

		if (childName) {
			// 하위 부서가 있으면 subDepartments에 추가
			groupedDepartments[parentName].subDepartments.push({
				name: fullName, // 전체 이름
				members: [],
				subDepartments: [],
				total: 0,
			});
		}
	}

	// 최종 구조로 변환
	for (const parentName in groupedDepartments) {
		organigram.value.push(groupedDepartments[parentName]);
	}
	
	console.log('organigram', organigram.value);
});


</script>

<style lang="less" scoped>

</style>