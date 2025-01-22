<template lang="pug">
.title
	h1 조직도

hr


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

	for(let name in divisionNameList.value) {
		let object: {
			name: string,
			employees: any[],
			total: number,
		} = {
			name: name,
			employees: [],
			total: 0,
		};
		for(let d of data) {
			if(d.index.name.includes(name)) {
				object.employees.push(d);
				object.total++;
			}
		}
		organigram.value.push(object);
	}
	
	console.log('organigram', organigram.value);
});


</script>

<style lang="less" scoped>

</style>