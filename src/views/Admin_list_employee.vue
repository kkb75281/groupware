<template lang="pug">
h1.title 직원 목록

hr

.table-wrap
    .tb-head-wrap
        .input-wrap.search
            input(type="text" placeholder="검색어를 입력하세요")
            button.btn-search
        .input-wrap
                select(v-model="empListType")
                    option(value="직원목록") 직원목록
                    option(value="초청여부") 초청여부
                    option(value="숨김여부") 숨김여부
        .tb-toolbar
            .btn-wrap
                template(v-if="empListType === '직원목록'")
                    button.btn.bg-gray.btn-block(:disabled="!selectedList.length" @click="changeEmployeeState") 숨김
                template(v-else-if="empListType === '초청여부'")

                template(v-else-if="empListType === '숨김여부'")
                    button.btn.outline.warning.btn-remove(:disabled="!selectedList.length" @click="deleteEmployee") 삭제
                button.btn.outline(@click="router.push('/admin/add-employee')") 등록

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
                    tr(v-for="(employee, index) in employee")
                        //- 직원목록
                        template(v-if="empListType === '직원목록' && !employee.approved.includes('suspended')")
                            td
                                label.checkbox
                                    input(type="checkbox" name="checkbox" :checked="selectedList.includes(employee.user_id)" @click="toggleSelect(employee.user_id)")
                                    span.label-checkbox
                            td.list-num {{ index + 1 }}
                            td {{ employee.access_group }}
                            td {{ employee.name }}
                            td {{ employee.email }}
                            td {{ employee.birthdate }}
                            td {{ employee.phone_number }}
                            td {{ employee.address }}

                        //- 숨김여부
                        template(v-else-if="empListType === '숨김여부' && employee.approved.includes('suspended')")
                            td
                                label.checkbox
                                    input(type="checkbox" name="checkbox" :checked="selectedList.includes(employee.user_id)" @click="toggleSelect(employee.user_id)")
                                    span.label-checkbox
                            td.list-num {{ index + 1 }}
                            td {{ employee.access_group }}
                            td {{ employee.name }}
                            td {{ employee.email }}
                            td {{ employee.birthdate }}
                            td {{ employee.phone_number }}
                            td {{ employee.address }}
                        
                        template(v-else-if="empListType === '초청여부'")
                            td
                                label.checkbox
                                    input(type="checkbox" name="checkbox" :checked="selectedList.includes(employee.user_id)" @click="toggleSelect(employee.user_id)")
                                    span.label-checkbox
                            td.list-num {{ index + 1 }}
                            td {{ employee.access_group }}
                            td {{ employee.name }}
                            td {{ employee.email }}
                            td
                                .btn-wrap
                                    button.btn.bg-gray.sm(@click="resendInvite(employee.email)") 재전송
                                    button.btn.bg-gray.sm(@click="cancelInvite(employee.email)") 초청취소
                            td {{ employee.birthdate }}
                            td {{ employee.phone_number }}
                            td {{ employee.address }}
                    
                    //- 초청여부
                    //- template(v-else-if='empListType === "초청여부"')
                        tr(v-for="(employee, index) in inviteEmployee")
                            td
                                label.checkbox
                                    input(type="checkbox" name="checkbox" :checked="selectedList.includes(employee.user_id)" @click="toggleSelect(employee.user_id)")
                                    span.label-checkbox
                            td.list-num {{ index + 1 }}
                            td {{ employee.access_group }}
                            td {{ employee.name }}
                            td {{ employee.email }}
                            td
                                .btn-wrap
                                    button.btn.bg-gray.sm(@click="resendInvite(employee.email)") 재전송
                                    button.btn.bg-gray.sm(@click="cancelInvite(employee.email)") 초청취소
                            td {{ employee.birthdate }}
                            td {{ employee.phone_number }}
                            td {{ employee.address }}

            //- template(v-else-if='empListType === "초청여부"')
            //-     colgroup
            //-         col(style="width: 3rem;")
            //-         col(style="width: 3rem;")
            //-         col(style="width: 5rem;")
            //-         col(style="width: 10%;")
            //-         col(style="width: 25%;")
            //-         col(style="width: 11%;")
            //-         col(style="width: 10%; min-width: 6rem;")
            //-         col(style="width: 10%; min-width: 6rem;")
            //-         col(style="min-width: 15rem;")
            //-     thead
            //-         tr
            //-             th(scope="col")
            //-                 label.checkbox
            //-                     input(type="checkbox" name="checkbox" :checked="isAllSelected" @change="toggleSelectAll")
            //-                     span.label-checkbox
            //-             th(scope="col") NO
            //-             th(scope="col") 직책(직급)
            //-             th(scope="col") 이름
            //-             th(scope="col") 이메일
            //-             th(scope="col") 초청여부
            //-             th(scope="col") 생년월일
            //-             th(scope="col") 전화번호
            //-             th(scope="col") 주소
            //-     tbody
            //-         template(v-if="loading")
            //-             tr(v-for="i in 4")
            //-         template(v-else-if="!inviteEmployee")
            //-             tr
            //-                 td(colspan="8") 데이터가 없습니다.
            //-         template(v-else)
            //-             tr(v-for="(employee, index) in inviteEmployee")
            //-                 td
            //-                     label.checkbox
            //-                         input(type="checkbox" name="checkbox" :checked="selectedList.includes(employee.user_id)" @click="toggleSelect(employee.user_id)")
            //-                         span.label-checkbox
            //-                 td.list-num {{ index + 1 }}
            //-                 td {{ employee.access_group }}
            //-                 td {{ employee.name }}
            //-                 td {{ employee.email }}
            //-                 td
            //-                     .btn-wrap
            //-                         button.btn.bg-gray.sm(@click="resendInvite(employee.email)") 재전송
            //-                         button.btn.bg-gray.sm(@click="cancelInvite(employee.email)") 초청취소
            //-                 td {{ employee.birthdate }}
            //-                 td {{ employee.phone_number }}
            //-                 td {{ employee.address }}

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
import { ref, computed, watch } from 'vue';
import { skapi } from '@/main';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

let loading = ref(false);
let currentPage = ref(1);
let selectedList = ref([]);
let empListType = ref("직원목록");
let blockList = ref([]);
let isAllSelected = computed(() => {
    return selectedList.value.length > 0 && employee.value.every(emp => selectedList.value.includes(emp.user_id));
});

let sessionEmployee;
let employee = ref([]);
let suspendedLength = ref(0);

watch(empListType, (nv) => {
    if(nv) {
        if (nv === '직원목록') {
            sessionEmployee = JSON.parse(window.sessionStorage.getItem('employee'));
            if (!sessionEmployee) {
                loading.value = true;

                skapi.getUsers().then(res => {
                    employee.value = res.list;
                    displayEmployee(res.list);
                    loading.value = false;
                });
            } else {
                employee.value = sessionEmployee;
            }
        } else if (nv === '숨김목록') {
            suspendedLength.value = employee.value.filter(emp => emp.approved.includes('suspended')).length;
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
                console.log(employee.value);
            }
        }
    }
}, { immediate: true });

// skapi.getUsers().then(res => {
//     console.log('=== getUsers === res : ', res.list);
// });

// if (!employee.value.length) {
//     loading.value = true;

//     skapi.getUsers().then(res => {
//         employee.value = res.list;
//         displayEmployee(res.list);
//         loading.value = false;
//     });
// } else {
//     loading.value = false;
// }

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

let blockEmployee = () => {
    console.log('click btn blockEmployee');
    
}

// let sessionBlockEmployee = JSON.parse(window.sessionStorage.getItem('blockEmployee'));
// let blockEmployee = ref(sessionBlockEmployee || []);

// let changeEmployeeState = () => {
//     console.log('=== changeBlockList === selectedList : ', selectedList.value);

//     blockList.value = selectedList.value;
//     blockEmployee.value = employee.value.filter(emp => selectedList.value.includes(emp.user_id));

//     console.log('=== changeBlockList === blockList.value : ', blockList.value);
//     console.log('=== changeBlockList === blockEmployee.value : ', blockEmployee.value);

//     // skapi.blockAccount({user_id: selectedList.value}).then(res => {
//     //     console.log('=== blockAccount === res : ', res);
//     // }).catch(err => {
//     //     console.log('=== blockAccount === err : ', err);
//     // });
// }

let resendInvite = (email) => {
    skapi.resendInvitation({ email: email }).then(res => {
        alert('초대메일이 재전송되었습니다.');
    }).catch(err => {
        alert('초대메일 재전송에 실패하였습니다.');
    });
}

let cancelInvite = (email) => {
    skapi.cancelInvitation({email: email}).then(res => {
        alert('초대메일이 취소되었습니다.');
        console.log('=== cancelInvite === res : ', res);
        for(let user of employee.value) {
            if(user.email === email) {
                employee.value = employee.value.filter(emp => emp.email !== email);
                break;
            }
        }
        console.log(employee.value);
        displayinviteEmployee(employee.value);
    }).catch(err => {
        alert('초대메일 취소에 실패하였습니다.');
    })
}
</script>

<style scoped lang="less">
#divisions_list>a>* {
    vertical-align: middle;
}

.division-logo {
    width: 2rem;
    height: 2rem;
    object-fit: contain;
}

.table-wrap {
    position: relative;
    margin-top: 3rem;

    #loading {
        position: absolute;
        top: 126px;
        left: 50%;
        transform: translateX(-50%);
    }
}

.go-detail {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 16px;

    span {
        white-space: nowrap;
    }
}

.img-wrap {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid var(--gray-color-300);
    border-radius: 50%;

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
}
</style>