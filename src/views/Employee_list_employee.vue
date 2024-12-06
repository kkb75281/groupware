<template lang="pug">
.wrap
    h1.title 직원 목록

    hr

    .table-wrap
        .tb-head-wrap
            form#searchForm(@submit.prevent="searchEmp")
                .input-wrap
                    select(v-model="searchFor" :disabled="empListType !== '직원목록'")
                        option(value="name") 이름
                        option(value="division") 부서/직책
                        option(value="email") 이메일
                .input-wrap.search(v-if="searchFor !== 'division'")
                    input(v-model="searchValue" type="text" placeholder="검색어를 입력하세요" :disabled="empListType !== '직원목록'")
                    button.btn-search
                template(v-else)
                    .input-wrap
                        select(name="searchDivision" v-model="searchValue" :disabled="empListType !== '직원목록'" @change="searchEmp")
                    .input-wrap.search(style="width: 176px;")
                        input(v-model="searchPositionValue" type="text" placeholder="직책을 입력하세요" :disabled="searchValue === '전체'")
                        button.btn-search

        .tb-overflow
            template(v-if="loading")
                Loading#loading
            table.table#employee_list
                colgroup
                    //- template(v-if="user.access_group > 98")
                        col(style="width: 3rem;")
                    col(style="width: 3rem;")
                    col(style="width: 5rem;")
                    col(style="width: 10%;")
                    col(style="width: 10%;")
                    col(style="width: 25%;")
                    col(style="width: 10%; min-width: 6rem;")
                    col(style="width: 10%; min-width: 6rem;")
                    col(style="min-width: 15rem;")
                thead
                    tr
                        //- template(v-if="user.access_group > 98")
                            th(scope="col")
                                label.checkbox
                                    input(type="checkbox" name="checkbox" :checked="isAllSelected" @change="toggleSelectAll")
                                    span.label-checkbox
                        th(scope="col") NO
                        th(scope="col") 직책(직급)
                        th(scope="col") 부서
                        th(scope="col") 이름
                        th(scope="col") 이메일
                        th(scope="col") 생년월일
                        th(scope="col") 전화번호
                        th(scope="col") 주소
                tbody
                    template(v-if="loading")
                        tr(v-for="i in 4")
                    template(v-else-if="!employee || Object.keys(employee).length === 0")
                        tr
                            td(colspan="10") 데이터가 없습니다.
                    template(v-else)
                        tr(v-for="(emp, index) in employee")
                            //- 직원목록/숨김여부
                            template(v-if="empListType === '직원목록'")
                                //- template(v-if="user.access_group > 98")
                                    td
                                        label.checkbox
                                            input(type="checkbox" name="checkbox" :checked="selectedList.includes(emp.user_id)" @click="toggleSelect(emp.user_id)")
                                            span.label-checkbox
                                td.list-num {{ index + 1 }}
                                td {{ emp?.position }}
                                td {{ divisionNameList[emp?.division] }}
                                td {{ emp.name }}
                                td {{ emp.email }}
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

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { skapi } from '@/main';
import { user } from '@/user';
import { divisionNameList, getDivisionNames } from '@/division'
import type { Ref } from 'vue';

import Loading from '@/components/loading.vue';

let router = useRouter();
let route = useRoute();

let loading = ref(false);
let currentPage = ref(1);
let selectedList = ref([]);
let empListType = ref("직원목록");
let isAllSelected = computed(() => {
    return selectedList.value.length > 0 && employee.value.every(emp => selectedList.value.includes(emp.user_id));
});

let originalEmployee = JSON.parse(window.sessionStorage.getItem('employee'));
let sessionEmployee;
let employee = ref([]);
let searchFor: Ref<"name" | "division" | "email" | "timestamp"> = ref('name');
let searchValue = ref('');
let searchPositionValue = ref('');
let empInfo: {[key:string]: any} = ref({});

let callParams = computed(() => {
    switch (searchFor.value) {
        case 'name':
            return {
                searchFor: 'name',
                value: searchValue.value,
                condition: '>='
            };
        case 'division':
            return {
                searchFor: 'timestamp',
                value: new Date().getTime(),
                condition: '<='
            };
        case 'email':
            return {
                searchFor: 'email',
                value: searchValue.value,
                condition: '='
            };
    }
});

watch(searchFor, (nv) => {
    if (nv) {
        searchValue.value = '';

        if(nv === 'division') {
            nextTick(() => {
                displayDivisionOptions('searchDivision');
                searchValue.value = '전체';
            });
        }
    }
});

watch(searchValue, (nv) => {
    if (nv) {
        if (nv === '전체' && searchFor.value === 'division') {
            callParams.value.searchFor = 'timestamp';
            callParams.value.value = new Date().getTime();
            callParams.value.condition = '<=';

            searchEmp();
        }
    }
});

watch(empListType, async(nv) => {
    if(nv) {
        // checkbox reset
        selectedList.value = [];
        searchFor.value = 'name';

        if (nv === '직원목록') {
            sessionEmployee = JSON.parse(window.sessionStorage.getItem('employee'));

            if (!sessionEmployee) {
                loading.value = true;

                skapi.getUsers().then(async(res) => {
                    let list = res.list.filter(emp => emp.approved.includes('approved') && emp.user_id !== '0170b6d0-3a49-4257-954a-8216ee98f3d8');

                    employee.value = list;

                    for(let e of employee.value) {
                        await getEmpDivision(e.user_id);

                        if(empInfo[e.user_id]) {
                            console.log(empInfo[e.user_id])
                            e.division = empInfo[e.user_id].division;
                            e.position = empInfo[e.user_id].position;
                        }
                    }

                    displayEmployee(res.list);
                    loading.value = false;
                });
            } else {
                employee.value = sessionEmployee.filter(emp => emp.approved.includes('approved') && emp.user_id !== '0170b6d0-3a49-4257-954a-8216ee98f3d8');
            }
        }
    }
}, { immediate: true });

getDivisionNames();

function makeSafe(str) {
    return str.replaceAll('.', '_').replaceAll('+', '_').replaceAll('@', '_').replaceAll('-', '_');
}

let displayDivisionOptions = (selectName: string) => {
    let divisionList = document.querySelector(`select[name="${selectName}"]`) as HTMLSelectElement;
    console.log(divisionNameList.value)

    // 기존 옵션을 제거하지 않고 새로운 옵션을 추가
    divisionList.innerHTML = ''; // 기존 옵션 초기화

    const allOption = document.createElement('option');
    const defaultOption = document.createElement('option');

    let matchFound = false;

    // 기본 옵션 추가
    if(selectName == 'searchDivision') {
        allOption.value = '전체';
        allOption.innerText = '전체';
        allOption.selected = true;
        divisionList.appendChild(allOption);
    }

    // 동적으로 부서 옵션 추가
    for (let key in divisionNameList.value) {
        if(divisionNameList.value[key] !== '') {
            const option = document.createElement('option');
            option.value = key;
            option.innerText = divisionNameList.value[key];
            divisionList.appendChild(option);
        }
    }

    // 선택박스 활성화
    divisionList.disabled = false;
}

let getEmpDivision = async(userId) => {
    if(!userId) return;

    await skapi.getRecords({
        table: {
            name: 'emp_position_current',
            access_group: 1
        },
        unique_id: "[emp_position_current]" + makeSafe(userId)
    }).then(r => {
        // console.log(r.list)
        if (r.list.length === 0) return;
    
        let record = r.list[0];
        let emp_dvs = record?.index?.name?.split('.')[0];
        let emp_id = record?.unique_id?.replace('[emp_position_current]', '').replaceAll('_', '-');
        let emp_pst = record?.index?.name?.split('.')[1];

        empInfo[emp_id] = {
            division: emp_dvs,
            position: emp_pst
        }
    });
}

let searchEmp = async() => {
    loading.value = true;
    
    if (!searchValue.value) {
        searchFor.value = 'name';
        searchValue.value = '';
        callParams.value.searchFor = 'timestamp';
        callParams.value.value = new Date().getTime();
        callParams.value.condition = '<=';
    }

    if (searchFor.value === 'division' && searchValue.value !== '전체') {
        employee.value = [];

        try {
            const res = await skapi.getRecords({
                table: {
                    name: 'emp_position_current',
                    access_group: 1
                },
                index: {
                    name: searchPositionValue.value ? searchValue.value + '.' + searchPositionValue.value : searchValue.value + '.',
                    value: ' ',
                    condition: '>'

                    // 이름도 검색할거면
                    // value: searchNameValue.value ? searchNameValue.value : ' ',
                    // condition: searchNameValue.value ? '>=' : '>'
                }
            });

            const list = res.list.map(emp =>
                emp.unique_id
                    .replace('[emp_position_current]', '')
                    .replaceAll('_', '-')
            );

            const result = [...new Set(list)]; // 중복 제거

            const userList = await Promise.all(
                result.map(async user => {
                    const userResponse = await skapi.getUsers({
                        searchFor: 'user_id',
                        value: user,
                        condition: '='
                    });
                    return userResponse.list.length > 0 ? userResponse.list[0] : null;
                })
            );

            // 숨긴 직원은 제외
            const filterUserList = userList.filter(list => list !== null && !list.approved.includes('suspended') && list.user_id !== '0170b6d0-3a49-4257-954a-8216ee98f3d8');
            console.log(filterUserList)

            const arr = [];

            for (let user of filterUserList) {
                if (!user) continue;

                // 부서 정보 가져오기
                await getEmpDivision(user.user_id);

                // empInfo에서 부서와 직책 정보 추가
                if (empInfo[user.user_id]) {
                    user.division = empInfo[user.user_id].division;
                    user.position = empInfo[user.user_id].position;
                }

                arr.push(user); // 처리된 사용자 추가
            }

            employee.value = arr; // 최종 목록 업데이트
            console.log('=== searchEmp === employee.value : ', employee.value);
        } catch (error) {
            console.error('searchEmp 에러 발생: ', error);
        }

        loading.value = false;
        return;
    }

    // division이 아닌 다른 검색 조건일 경우 처리
    try {
        const fetchedData = await skapi.getUsers(callParams.value, {
            // ascending: !!searchValue.value
        });

        if (fetchedData) {
            const arr = fetchedData.list.filter(emp => emp.user_id !== '0170b6d0-3a49-4257-954a-8216ee98f3d8');

            for (const e of arr) {
                console.log(e)
                await getEmpDivision(e.user_id);

                if (empInfo[e.user_id]) {
                    e.division = empInfo[e.user_id].division;
                    e.position = empInfo[e.user_id].position;
                }
            }

            employee.value = arr;
        }
    } catch (err) {
        console.error('searchEmp 에러 발생: ', err);
        alert(err);
    }

    loading.value = false;
};

let displayEmployee = (employee) => {
    window.sessionStorage.setItem('employee', JSON.stringify(employee));
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

    #searchForm {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
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

#_el_pictureForm {
    text-align: center;

    .image {
        position: relative;
        display: inline-block;

        .label {
            position: absolute;
            right: 0;
            bottom: 0;
            background-color: var(--primary-color-400);
            border-radius: 50%;
            cursor: pointer;

            &.disabled {
                pointer-events: none;
                background-color: var(--gray-color-300);
            }

            .icon {
                padding: 4px;
                width: 32px;
                height: 32px;
                position: relative;

                svg {
                    width: 18px;
                    height: 18px;
                    transform: translate(-50%, -50%);
                    top: 50%;
                    left: 50%;
                    position: absolute;
                }
            }
        }
        
        .options {
            position: absolute;
            right: -113px;
            bottom: -40px;
            z-index: 9;
            background-color: var(--gray-color-100);
            border: 1px solid var(--gray-color-300);
            padding: 5px;
            border-radius: 4px;
            
            li {
                font-size: 0.8rem;
                text-align: left;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;

                &:first-child {
                    margin-bottom: 4px;
                }
                &:hover {
                    background-color: var(--primary-color-400);
                    color: #fff;

                    &.disabled {
                        background-color: unset;
                        color: unset;
                    }
                }
                &.disabled {
                    opacity: 0.25;
                    cursor: default;
                    pointer-events: none;
                }
            }
        }
    }

    #profile-img {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        display: block;
        // object-fit: contain;
        object-fit: cover;
        position: relative;
        background-color: var(--gray-color-100);

        &::before {
            content: "No Image";
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background-color: var(--gray-color-100);
            color: #888;
            font-size: 14px;
            text-align: center;
            position: absolute;
            top: 0;
            left: 0;
        }
    }
}

.modal {
    .input-wrap {
        input {
            border-color: var(--primary-color-400);
            cursor: initial;

            &:read-only {
                border-color: var(--gray-color-200);
                cursor: default;

                &:hover {
                    border-color: var(--gray-color-200);
                }
            }

            &:hover {
                border-color: var(--primary-color-400);
            }
        }

        select {
            border-color: var(--primary-color-400);
        }
    }
}

.upload-file {
    .file-item {
        &.remove {
            background-color: var(--warning-color-50);
            border: 1px dashed var(--warning-color-400);
            color: var(--warning-color-500);
        }
    }
}
</style>