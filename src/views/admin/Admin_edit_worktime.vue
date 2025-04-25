<template lang="pug">
form.table-wrap(@submit.prevent="saveSystemWorktime")
    .tb-head-wrap
        .tb-toolbar
            .btn-wrap
                button.btn.bg-gray(type="button" @click="router.push('/admin/list-commute')") 이전
                button.btn(type="submit") 저장

    .tb-overflow
        table.table#tb-edit-workTime
            thead
                tr
                    th(scope="col") 출근
                    th(scope="col") 퇴근

            tbody
                tr.nohover
                    td
                        .input-wrap
                            input#inp_startMin(type="time" :value="system_worktime?.start?.min")
                    td
                        .input-wrap
                            input#inp_endMin(type="time" :value="system_worktime?.end?.min")
                tr.nohover
                    td
                        .input-wrap
                            input#inp_startMax(type="time" :value="system_worktime?.start?.max")
                    td
                        .input-wrap
                            input#inp_endMax(type="time" :value="system_worktime?.end?.max")
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import { makeSafe } from '@/user.ts';
import { skapi, mainPageLoading } from "@/main.ts";
import { getSystemWorktime, system_worktime, getSystemWorktimeId } from "@/views/commute/worktime.ts";

const router = useRouter();
const route = useRoute();

const selectedDivision = ref(null);
const workTimes = ref({});
const isModalOpen = ref(false);

const saveSystemWorktime = (e) => {
    if(!inp_startMin.value || !inp_startMax.value || !inp_endMin.value || !inp_endMax.value) {
        alert('모든 시간을 입력해주세요.');
        return;
    }
    
    mainPageLoading.value = true;

    let data = {
        start: {
            min: `${inp_startMin.value}`,
            max: `${inp_startMax.value}`,
        },
        end: {
            min: `${inp_endMin.value}`,
            max: `${inp_endMax.value}`,
        }
    }

    let config = {
        table: {
			name: "system_worktime",
			access_group: 1,
		}
    }

    if(getSystemWorktimeId.value) {
        config.record_id = getSystemWorktimeId.value;
    }

    skapi.postRecord(data, config).then(r => {
        alert('근무시간이 성공적으로 저장되었습니다.');
        getSystemWorktime(true);
    }).catch(e => {
        alert('근무시간 저장을 실패했습니다.');
    }).finally(() => {
        mainPageLoading.value = false;
    });
}

onMounted(async () => {
    if(!getSystemWorktimeId.value) {
        mainPageLoading.value = true;
        getSystemWorktime().finally(() => {
            mainPageLoading.value = false;
        });
    }
});
</script>

<style scoped lang="less">
.division-logo {
    width: 2rem;
    height: 2rem;
    object-fit: contain;
}

// .btn-wrap {
//     display: flex;
//     justify-content: flex-end;
//     gap: 8px;
// }

.table {
    thead {
        th {
            &:first-child {
                border-right: 1px solid var(--gray-color-200);
            }
        }
    }
    tbody {
        tr {
            &:first-child {
                border-bottom: unset;

                td {
                    position: relative;

                    &::after {
                        content: '~';
                        position: absolute;
                        bottom: -10px;
                        left: 50%;
                        transform: translateX(-50%);
                    }
                }
            }

            td {
                &:first-child {
                    border-right: 1px solid var(--gray-color-200);
                }
            }
        }
    }
}

// .item-wrap {
//     display: flex;
//     flex-wrap: nowrap;
//     align-items: center;
//     gap: 16px;

//     p {
//         white-space: nowrap;
//     }
// }

// .img-wrap {
//     width: 1.5rem;
//     height: 1.5rem;
//     border-radius: 50%;
//     overflow: hidden;
//     border: 1px solid var(--gray-color-300);
//     border-radius: 50%;

//     img {
//         width: 100%;
//         height: 100%;
//         object-fit: contain;
//     }
// }

// .input-wrap {
//     flex-grow: 1;
//     display: flex;
//     flex-wrap: wrap;
//     align-items: center;
//     justify-content: center;
//     gap: 8px;

//     input {
//         flex-grow: 1;
//         width: 47%;
//         min-width: 100px;
//         text-align: center;

//         &:hover,
//         &:focus {
//             cursor: default;
//             border-color: var(--gray-color-200);
//         }
//     }
// }

.modal {
    .item-wrap {
        display: flex;
        align-items: center;
        gap: 8px 16px;
        margin-top: 16px;
        flex-wrap: wrap;

        .label {
            flex: none;
            margin-bottom: 0;
        }
    }

    .input-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 0;
        flex: 1;
        
        input {
            flex: 1;
        }
    }
}
</style>
