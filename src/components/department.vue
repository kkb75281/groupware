<template lang="pug">
details(:class="{ disabled : department.total === 0 }")
	//- 상위 부서
	summary 
		label.checkbox(v-if="department.total > 0")
			input(type="checkbox" name="checkbox" v-model="department.isChecked" @change="$emit('update-check', { type: 'department', target: department, isChecked: department.isChecked })" @click.stop)
			span.label-checkbox
		.folder
		span.name {{ department.name }} 
		span.total {{ department.total }}
	ul
		//- 부서 구성원
		li.member(v-for="(member, index) in department.members" :key="index")
			label.checkbox
				input(type="checkbox" name="checkbox" v-model="member.isChecked" @change="$emit('update-check', { type: 'member', target: member, isChecked: member.isChecked })" @click.stop)
				span.label-checkbox
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-account-circle-fill")
			//- .position {{ member.index.name.split('.')[1] }}
			.name {{ member.index.value + ' / ' + member.index.name.split('.')[1] }}

		//- 하위 부서
		li(v-for="(sub, index) in department.subDepartments" :key="index")
			Department(:department="sub" @update-check="$emit('update-check', $event)" @click.stop)
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
summary {
	position: relative;
	list-style-type: none;
    padding-left: 1.8rem;
	margin-bottom: 1rem;
    cursor: pointer;
	display: flex;
	align-items: center;
	gap: 8px;

	&::-webkit-details-marker { /* Safari 브라우저용 사용자 정의 스타일 */
		display: none;
	}
	&::before {
		content: "";
		position: absolute;
		top: 50%;
		left: 0;
		transform: translateY(-50%);
		background: url('@/assets/img/arrow_right.svg') no-repeat center center / contain;
		width: 1.2rem;
		height: 1.2rem;
	}

	.folder {
		width: 1.2rem;
		height: 1.2rem;
		background: url('@/assets/img/icon_folder.svg') no-repeat center center / contain;
	}
	.name {
		// margin-right: 8px;
		// font-weight: bold;
	}
	.total {
		color: var(--primary-color-400);
		font-size: 0.9rem;
	}
}

details {
	&[open] {
		> summary {
			&:before {
				background: url('@/assets/img/arrow_drop_down.svg') no-repeat center center / contain;
			}
			.folder {
				background: url('@/assets/img/icon_folder_open.svg') no-repeat center center / contain;
			}
		}
		> ul {
			padding-left: 1.8rem;
		}
	}

	&.disabled {
		opacity: 0.5;
		pointer-events: none;
		cursor: default;

		> summary {
		}
	}
}

ul {
	li {		
		&.member {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.5rem;
			margin-bottom: 1rem;
			padding-left: 1.8rem;

			.icon {
				padding: 0;
				
				svg {
					width: 1.2rem;
					height: 1.2rem;
				}
			}
		}
	}
}
</style>