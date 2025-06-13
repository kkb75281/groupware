<template lang="pug">
details(:class="{hideSummary: props.onlyDivision && department.subDepartments.length === 0}")
    //- 상위 부서
    summary
        label.checkbox(v-if="useCheckbox && department.total > 0")
            input(
                type="checkbox" 
                name="checkbox" 
                v-model="department.isChecked" 
                :checked="department.isChecked" 
                @change="$emit('update-check', { type: 'department', target: department, isChecked: department.isChecked })" 
                @click.stop
            )
            span.label-checkbox
        .folder
        span.name {{ department.name }} 
        span.total(v-if="!props.onlyDivision") {{ props.excludeCurrentUser && currentUserDivisions.includes(department.name) ? department.total - 1 : department.total }}
    ul
        //- 부서 구성원
        template(v-for="(member, index) in department.members")
            li.member(
                v-if="!props.onlyDivision && (props.excludeCurrentUser ? member.user.user_id !== user.user_id : true)"
                :key="index"
            )
                label.checkbox(v-if="useCheckbox")
                    input(
                        type="checkbox" 
                        name="checkbox" 
                        v-model="member.isChecked" 
                        :checked="member.isChecked" 
                        @change="$emit('update-check', { type: 'member', target: member, isChecked: member.isChecked })" 
                        @click.stop
                    )
                    span.label-checkbox
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-account-circle-fill")
                .name
                    | {{ member.user.name + ' / ' + member.position }}

    //- 하위 부서
    Department(
        v-for="(sub, index) in department.subDepartments"
        :key="index" 
        :open="sub.isOpened"
        :department="sub"
        :useCheckbox="props.useCheckbox"
        :onlyDivision="props.onlyDivision"
        @update-check="$emit('update-check', $event)"
        @click.stop
    )
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { user } from '@/user.ts';
import { currentUserDivisions } from '@/components/organigram';

const props = defineProps({
    department: {
        type: Object,
        required: true
    },
    useCheckbox: {
        type: Boolean,
        default: false
    },
    onlyDivision: {
        type: Boolean,
        default: false
    },
    onlyMyDivision: {
        type: Boolean,
        default: false
    },
    excludeCurrentUser: {
        type: Boolean,
        default: false
    },
    selectedEmployees: {
        type: Array,
        default: () => []
    }
});
</script>

<style lang="less" scope>
details {
    &.hideSummary {
        &[open] {
            >summary {
                .folder {
                    background: url('@/assets/img/icon_folder.svg') no-repeat center center / contain;
                }
            }
        }

        >summary {
            &::before {
                display: none;
            }
        }
    }

    details {
        margin-left: 1.8rem;
        // padding-left: 1.8rem;
        // border-left: 1px solid var(--gray-color-200);
    }
}

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
        content: '';
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
    >summary {
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

    input[type='checkbox'] {
        cursor: default;
    }
}

input[type='checkbox']:disabled+.label-checkbox {
    cursor: default;
}

// 나머지 기존 스타일 유지
details {
    &[open] {
        >summary {
            &:before {
                background: url('@/assets/img/arrow_drop_down.svg') no-repeat center center / contain;
            }

            .folder {
                background: url('@/assets/img/icon_folder_open.svg') no-repeat center center / contain;
            }
        }

        >ul {
            margin-left: 2.4rem;
            border-left: 1px dashed var(--gray-color-200);
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
            padding-left: 1.5rem;
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
