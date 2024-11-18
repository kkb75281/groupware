<template lang="pug">
h1.title 자료실

hr

.table-wrap
    .tb-head-wrap
        .input-wrap.search
            input(type="text" placeholder="검색어를 입력하세요")
            button.btn-search
        template(v-if="user.access_group > 98")
            .input-wrap
                    select(v-model="empListType")
                        option(value="직원목록") 직원목록
                        option(value="초청여부") 초청여부
                        option(value="숨김여부") 숨김여부
            .tb-toolbar
                .btn-wrap
                    template(v-if="empListType === '직원목록'")
                        button.btn.bg-gray.btn-block(:disabled="!selectedList.length" @click="blockEmployee") 숨김
                        button.btn.outline(@click="router.push('/admin/add-employee')") 등록
                    template(v-else-if="empListType === '초청여부'")
                        button.btn.outline(@click="router.push('/admin/add-employee')") 등록
                    template(v-else-if="empListType === '숨김여부'")
                        button.btn.bg-gray.btn-block(:disabled="!selectedList.length" @click="unblockEmployee") 숨김 해제
                        button.btn.outline.warning.btn-remove(:disabled="!selectedList.length" @click="deleteEmployee") 삭제

    .tb-overflow
        template(v-if="loading")
            Loading#loading
        table.table#employee_list
            colgroup
                col(style="width: 3rem;")
                col(style="width: 3rem;")
                col(style="width: 5rem;")
                col(style="width: 10%;")
                col(style="width: 25%;")
                template(v-if='empListType === "직원목록" || empListType === "숨김여부"')
                
                template(v-if='empListType === "초청여부"')
                    col(style="width: 11%;")
                col(style="width: 10%; min-width: 6rem;")
                col(style="width: 10%; min-width: 6rem;")
                col(style="min-width: 15rem;")
            thead
                tr
                    th(scope="col")
                        label.checkbox
                            input(type="checkbox" name="checkbox" :checked="isAllSelected" @change="toggleSelectAll")
                            span.label-checkbox
                    th(scope="col") NO
                    th(scope="col") 직책(직급)
                    th(scope="col") 이름
                    th(scope="col") 이메일
                    template(v-if='empListType === "직원목록" || empListType === "숨김여부"')

                    template(v-if='empListType === "초청여부"')
                        th(scope="col") 초청여부
                    th(scope="col") 생년월일
                    th(scope="col") 전화번호
                    th(scope="col") 주소
            tbody
                template(v-if="loading")
                    tr(v-for="i in 4")
                template(v-else-if="!employee || Object.keys(employee).length === 0 || (empListType === '숨김여부' && suspendedLength === 0)")
                    tr
                        td(colspan="9") 데이터가 없습니다.
                template(v-else)
                    tr(v-for="(emp, index) in employee" @click="router.push(`/admin/employee/${emp.name}`)")
                        //- 직원목록/숨김여부
                        template(v-if="empListType === '직원목록' || empListType === '숨김여부'")
                            td
                                label.checkbox
                                    input(type="checkbox" name="checkbox" :checked="selectedList.includes(emp.user_id)" @click="toggleSelect(emp.user_id)")
                                    span.label-checkbox
                            td.list-num {{ index + 1 }}
                            td {{ emp.access_group }}
                            td {{ emp.name }}
                            td {{ emp.email }}
                            td {{ emp.birthdate }}
                            td {{ emp.phone_number }}
                            td {{ emp.address }}
                        
                        //- 초청여부
                        template(v-else-if="empListType === '초청여부'")
                            td
                                label.checkbox
                                    input(type="checkbox" name="checkbox" :checked="selectedList.includes(emp.user_id)" @click="toggleSelect(emp.user_id)")
                                    span.label-checkbox
                            td.list-num {{ index + 1 }}
                            td {{ emp.access_group }}
                            td {{ emp.name }}
                            td {{ emp.email }}
                            td
                                .btn-wrap
                                    button.btn.bg-gray.sm(@click="resendInvite(emp.email)") 재전송
                                    button.btn.bg-gray.sm(@click="cancelInvite(emp)") 초청취소
                            td {{ emp.birthdate }}
                            td {{ emp.phone_number }}
                            td {{ emp.address }}

    //- .pagination
        button.btn-prev.icon(type="button") 
            svg
                use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
            | Prev
        button.btn-next.icon(type="button" @click="currentPage++;" :class="{'nonClickable': endOfList && currentPage >= maxPage }") Next
            svg
                use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

br
br
br
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, watch, onMounted } from 'vue';
import { skapi } from '@/main';
import { user } from '@/user'

import Loading from '@/components/loading.vue';

let router = useRouter();
let route = useRoute();

let loading = ref(false);
let currentPage = ref(1);
let selectedList = ref([]);
let empListType = ref("직원목록");
let blockList = ref([]);
let isAllSelected = computed(() => {
    return selectedList.value.length > 0 && employee.value.every(emp => selectedList.value.includes(emp.user_id));
});

// let originalEmployee = JSON.parse(window.sessionStorage.getItem('employee'));
let sessionEmployee;
let employee = ref([]);
let suspendedLength = ref(0);

watch(empListType, (nv) => {
    if(nv) {
        // checkbox reset
        selectedList.value = [];

        if (nv === '직원목록') {
            sessionEmployee = JSON.parse(window.sessionStorage.getItem('employee'));

            if (!sessionEmployee) {
                loading.value = true;

                skapi.getUsers().then(res => {
                    let list = res.list.filter(emp => emp.approved.includes('approved'));

                    employee.value = list;
                    displayEmployee(res.list);
                    loading.value = false;
                });
            } else {
                employee.value = sessionEmployee.filter(emp => emp.approved.includes('approved'));
            }
        } else if (nv === '숨김여부') {
            let list = JSON.parse(window.sessionStorage.getItem('employee'))
            let result  = list.filter(emp => emp.approved.includes('suspended'));

            employee.value = result;
            suspendedLength.value = result.length;
        } else if (nv === '초청여부') {
            sessionEmployee = JSON.parse(window.sessionStorage.getItem('inviteEmployee'));

            if (!sessionEmployee) {
                loading.value = true;

                skapi.getInvitations().then(res => {
                    employee.value = res.list;
                    displayinviteEmployee(res.list);
                    loading.value = false;
                });
            } else {
                employee.value = sessionEmployee;
            }
        }
    }
}, { immediate: true });

console.log('== employee.value == : ', employee.value)

let getEmployee = () => {
    skapi.getUsers().then(res => {        
        // empListType reset
        empListType.value = '직원목록';

        // checkbox reset
        selectedList.value = [];

        // employee list update
        employee.value = res.list.filter(emp => emp.approved.includes('approved'));
        displayEmployee(res.list);
    });
}

let displayEmployee = (employee) => {
    window.sessionStorage.setItem('employee', JSON.stringify(employee));
}

let displayinviteEmployee = (employee) => {
    window.sessionStorage.setItem('inviteEmployee', JSON.stringify(employee));
}

let toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedList.value = [];
    } else {
        selectedList.value = employee.value.map(item => item.user_id);
    }
}

let toggleSelect = (el) => {
    if (selectedList.value.includes(el)) {
        selectedList.value = selectedList.value.filter(itemId => itemId !== el);
    } else {
        selectedList.value.push(el);
    }
}

let blockEmployee = async () => {
    let userId = Object.values(selectedList.value);

    let isSuccess = [];
    let isFail = [];

    await Promise.all(userId.map(el => {
        return skapi.blockAccount({ user_id: el }).then(res => {
            isSuccess.push(el);
            getEmployee();
        }).catch(err => {
            isFail.push(el);
        });
    }));

    if (isSuccess.length > 0) {
        alert(`${isSuccess.length}명의 직원이 숨김 처리되었습니다.`);
    } else {
        alert('숨김 처리에 실패하였습니다.');
    }
}

let unblockEmployee = async () => {
    let userId = Object.values(selectedList.value);

    let isSuccess = [];
    let isFail = [];

    await Promise.all(userId.map(el => {
        return skapi.unblockAccount({ user_id: el }).then(res => {
            isSuccess.push(el);
            getEmployee();
        }).catch(err => {
            isFail.push(el);
        });
    }));

    if (isSuccess.length > 0) {
        alert(`${isSuccess.length}명의 직원이 숨김 해제되었습니다.`);
    } else {
        alert('숨김 해제에 실패하였습니다.');
    }
}

let deleteEmployee = async () => {
    let userId = Object.values(selectedList.value);

    let isSuccess = [];
    let isFail = [];

    await Promise.all(userId.map(el => {
        return skapi.deleteAccount({ user_id: el }).then(res => {
            isSuccess.push(el);
            getEmployee();
        }).catch(err => {
            isFail.push(el);
            console.log('== err == : ', err)
        });
    }));

    if (isSuccess.length > 0) {
        alert(`${isSuccess.length}명의 직원이 삭제되었습니다.`);
    } else {
        alert('직원 삭제에 실패하였습니다.');
    }
}

let resendInvite = (email) => {
    skapi.resendInvitation({ email: email }).then(res => {
        alert('초대메일이 재전송되었습니다.');
    }).catch(err => {
        alert('초대메일 재전송에 실패하였습니다.');
    });
}

function makeSafe(str) {
    return str.replaceAll('.', '_').replaceAll('+', '_').replaceAll('@', '_').replaceAll('-', '_');
}

let cancelInvite = (employee_info) => {
    let safeEmail = makeSafe(employee_info.email);
    let safeUserId = makeSafe(employee_info.user_id);

    let picTable = {
        table: {
            name: 'init_profile_pic_' + safeEmail, // 관리자가 올리는 초기 프로필 사진을 저장하는 테이블
            access_group: 1
        }
    }

    let positionTable = {
        table: {
            name: 'emp_division',
            access_group: 1
        },
        index: {
            name: 'user_id',
            value: safeUserId
        }
    }

    let privateStorage = {
        table: {
            name: 'emp_access_ref',
            access_group: 99
        },
        index: {
            name: 'user_id',
            value: safeUserId
        }
    }

    let ref_info = {
        table: {
            name: 'ref_ids',
            access_group: 1
        },
        index: {
            name: 'user_id',
            value: safeUserId
        },
    }

    skapi.cancelInvitation(employee_info).then((res) => {
        // 이제 record_id 몰라도 query로 레코드 삭제 가능
        skapi.deleteRecords(picTable);
        skapi.deleteRecords(positionTable);
        skapi.deleteRecords(privateStorage);
        skapi.deleteRecords(ref_info);

        alert('초대메일이 취소되었습니다.');

        skapi.getInvitations().then(res => {
            employee.value = res.list;
            displayinviteEmployee(res.list);
        });
    }).catch(err => {
        alert('초대메일 취소에 실패하였습니다.');
    });
}
</script>

<style scoped lang="less">

</style>