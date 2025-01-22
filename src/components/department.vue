<template lang="pug">
details
	summary {{ divisionNameList[department.name] }}
	ul
		//- 하위 부서
		li(v-for="(sub, index) in department.subDepartments" :key="index")
			Department(:department="sub")

		//- 부서 구성원
		li(v-for="(member, index) in department.members" :key="index") {{ member }}
</template>

<script lang="ts" setup>
import {
    loading,
    divisions,
    divisionNameList,
    getDivisionData,
    getDivisionDataRunning,
    getDivisionNamesRunning,
} from "@/division";

// 부모 컴포넌트로부터 부서 데이터를 받음
defineProps({
	department: {
		type: Object,
		required: true,
	},
});
</script>

<style lang="less" scope>
details {
  margin: 10px 0;
  padding-left: 10px;
  border-left: 2px solid #ddd;
}

summary {
  font-weight: bold;
  cursor: pointer;
  user-select: none;
}

ul {
  list-style: none;
  margin: 5px 0 0 20px;
  padding: 0;
}

li {
  margin: 5px 0;
}
</style>