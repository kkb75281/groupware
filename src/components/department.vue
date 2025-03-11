<template lang="pug">
details(:class="{ 'disabled-department': isDepartmentDisabled }")
  //- 상위 부서
  summary(:class="{ 'disabled-summary': isDepartmentDisabled }")
    label.checkbox(v-if="useCheckbox && department.total > 0")
      input(
        type="checkbox" 
        name="checkbox" 
        v-model="department.isChecked"
		:checked="department.isChecked"
        :disabled="isDepartmentDisabled"
        @change="$emit('update-check', { type: 'department', target: department, isChecked: department.isChecked })" 
        @click.stop
      )
      span.label-checkbox
    .folder
    span.name(:class="{ 'disabled-text': isDepartmentDisabled }") {{ department.name }} 
    span.total {{ department.total }}
  ul
    //- 부서 구성원
    li.member(
      v-for="(member, index) in department.members" 
      :key="index"
      :class="{ 'disabled-member': isUserDisabled(member) }"
    )
      label.checkbox(v-if="useCheckbox")
        input(
          type="checkbox" 
          name="checkbox" 
          v-model="member.isChecked"
		  :checked="member.isChecked"
          :disabled="isUserDisabled(member)"
          @change="$emit('update-check', { type: 'member', target: member, isChecked: member.isChecked })" 
          @click.stop
        )
        span.label-checkbox
      .icon
        svg
          use(xlink:href="@/assets/icon/material-icon.svg#icon-account-circle-fill")
      .name(:class="{ 'disabled-text': isUserDisabled(member) }") 
        | {{ member.index.value + ' / ' + member.index.name.split('.')[1] }}

    //- 하위 부서
    li(v-for="(sub, index) in department.subDepartments" :key="index")
      Department(
        :department="sub"
        :modalType="modalType"
        :selectedAuditors="selectedAuditors"
		:useCheckbox="useCheckbox"
        @update-check="$emit('update-check', $event)"
        @click.stop
      )
</template>

<script setup>
import { computed, onMounted } from 'vue';

const props = defineProps({
  department: {
    type: Object,
    required: true,
  },
  modalType: {
    type: String,
    required: false,
  },
  selectedAuditors: {
    type: Object,
    required: false,
  },
  useCheckbox: {
	type: Boolean,
	default: false
  }
});

// 초기 체크 상태 설정
const initializeCheckState = () => {
    // 현재 모달 타입의 선택된 사용자들 가져오기
	const selectedUsers = [];
	for (const key in props.selectedAuditors) {
		selectedUsers.push(...props.selectedAuditors[key]);
	}
    const selectedUserIds = selectedUsers.map(user => user.data.user_id);

    // 부서 멤버들의 체크 상태 설정
    props.department.members.forEach(member => {
        member.isChecked = selectedUserIds.includes(member.data.user_id);
    });

    // 모든 멤버가 선택된 경우 부서 체크박스도 체크
    if (props.department.members.length > 0 && 
        props.department.members.every(member => member.isChecked)) {
        props.department.isChecked = true;
    } else {
        props.department.isChecked = false;
    }
};

// 사용자가 이미 다른 역할에 선택되었는지 확인하는 함수
const isUserDisabled = (item) => {
  const userId = item.data?.user_id;
  if (!userId) return false;

  // 다른 역할들 체크
  let keys = [];
  for (const key in props.selectedAuditors) {
	if(key !== item.role) {
		keys.push(key);
	}
  }

  return isSelectedInOtherRoles(userId, keys);
};

// 다른 역할에서 선택되었는지 확인하는 헬퍼 함수
const isSelectedInOtherRoles = (userId, rolesToCheck) => {
  return rolesToCheck.some(role => 
    props.selectedAuditors[role].some(user => user.data.user_id === userId)
  );
};

// 부서 전체가 disabled 되어야 하는지 확인하는 computed 속성
const isDepartmentDisabled = computed(() => {
  // 부서에 속한 모든 직원들의 상태를 확인
  const allMembersDisabled = props.department.members.length > 0 && 
    props.department.members.every(member => isUserDisabled(member));
  
  // 하위 부서가 있는 경우, 모든 하위 부서의 상태도 확인
  const allSubDepartmentsEmpty = props.department.subDepartments.length === 0 || 
    props.department.subDepartments.every(sub => 
      sub.members.length === 0 || sub.members.every(member => isUserDisabled(member))
    );

  // 모든 구성원이 disabled이고 하위 부서도 비어있거나 모든 구성원이 disabled인 경우
  return allMembersDisabled && allSubDepartmentsEmpty;
});

// 컴포넌트 마운트 시 초기화
onMounted(() => {
    initializeCheckState();
});
</script>

<style lang="less" scope>
// 기존 스타일 유지
summary {
  position: relative;
  list-style-type: none;
  padding-left: 1.8rem;
  margin-bottom: 1rem;
  cursor: pointer;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  white-space: nowrap;
  gap: 8px;

  &::-webkit-details-marker {
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
    min-width: 21px;
    min-height: 21px;
  }

  .folder {
    width: 1.2rem;
    height: 1.2rem;
    min-width: 21px;
    min-height: 21px;
    background: url('@/assets/img/icon_folder.svg') no-repeat center center / contain;
  }

  &.disabled-summary {
    opacity: 0.5;
    cursor: default;
  }
}

// disabled 상태 스타일 추가
.disabled-department {
  > summary {
    opacity: 0.5;
    
    .checkbox input {
      cursor: default;
    }
  }
}

.disabled-text {
  color: var(--gray-color-400) !important;
}

.disabled-member {
  opacity: 0.5;
  pointer-events: none;
  
  input[type="checkbox"] {
    cursor: default;
  }
}

input[type="checkbox"]:disabled + .label-checkbox {
  cursor: default;
}

// 나머지 기존 스타일 유지
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
}

ul {
  li {    
    &.member {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-left: 1.8rem;
      white-space: nowrap;

      .icon {
        padding: 0;
        
        svg {
          width: 1.2rem;
          height: 1.2rem;
          min-width: 21px;
          min-height: 21px;
        }
      }
    }
  }
}
</style>