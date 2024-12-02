<template lang="pug">
div(style="display: flex; gap: 1rem")
    h1.title 직원 목록
    .input-wrap(v-if="user.access_group > 98")
        select(v-model="empListType")
            option(value="직원목록") 직원목록
            option(value="초청여부") 초청여부
            option(value="숨김여부") 숨김여부

hr

.table-wrap
    .tb-head-wrap
        form#searchForm(@submit.prevent="searchEmp")
            .input-wrap
                select(v-model="searchFor" :disabled="empListType !== '직원목록'")
                    option(value="name") 이름
                    option(value="access_group") 부서
                    option(value="email") 이메일
            .input-wrap.search
                input(v-model="searchValue" type="text" placeholder="검색어를 입력하세요" :disabled="empListType !== '직원목록'")
                button.btn-search

        template(v-if="user.access_group > 98")
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
                col(style="width: 10%;")
                col(style="width: 25%;")
                template(v-if='empListType === "초청여부"')
                    col(style="width: 11%;")
                template(v-if='(empListType === "직원목록" || empListType === "숨김여부") && user.access_group > 98')
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
                    th(scope="col") 부서
                    th(scope="col") 이름
                    th(scope="col") 이메일
                    template(v-if='empListType === "초청여부"')
                        th(scope="col") 초청여부
                    template(v-if='(empListType === "직원목록" || empListType === "숨김여부") && user.access_group > 98')
                        th(scope="col") 상세보기
                    th(scope="col") 생년월일
                    th(scope="col") 전화번호
                    th(scope="col") 주소
            tbody
                template(v-if="loading")
                    tr(v-for="i in 4")
                template(v-else-if="!employee || Object.keys(employee).length === 0 || (empListType === '숨김여부' && suspendedLength === 0)")
                    tr
                        td(colspan="10") 데이터가 없습니다.
                template(v-else)
                    tr(v-for="(emp, index) in employee")
                        //- 직원목록/숨김여부
                        template(v-if="empListType === '직원목록' || empListType === '숨김여부'")
                            td
                                label.checkbox
                                    input(type="checkbox" name="checkbox" :checked="selectedList.includes(emp.user_id)" @click="toggleSelect(emp.user_id)")
                                    span.label-checkbox
                            td.list-num {{ index + 1 }}
                            td {{ emp?.position }}
                            td {{ divisionNameList[emp?.division] }}
                            td {{ emp.name }}
                            td {{ emp.email }}
                            template(v-if='user.access_group > 98')
                                td
                                    .btn-wrap(v-if="emp.user_id !== '8891ac0f-bc24-472b-9807-903bf768a944' && emp.user_id !== 'df5d3061-aefb-4a8b-8900-89d4dbd6c33f'")
                                        button.btn.bg-gray.sm(@click="openModal(emp)") 상세보기
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
                            td {{ emp?.position }}
                            td {{ divisionNameList[emp?.division] }}
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

//- Modal
#modal.modal(v-if="isModalOpen" @click="closeModal")
    .modal-cont(@click.stop)
        .modal-header
            h2.modal-title 직원 상세
            button.btn-close(@click="closeModal")
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
        .modal-body
            #_el_pictureForm
                .image
                    img#profile-img(:src="selectedEmp?.picture" alt="profile image")

            .input-wrap
                p.label 직책
                input(type="text" name="position" v-model="selectedEmpTags.emp_pst" placeholder="직책을 입력해주세요." :readonly="readonly")

            .input-wrap
                p.label.essential 부서(회사)
                template(v-if="disabled")
                    input(type="text" name="division" :value="divisionNameList[selectedEmp?.division]" :readonly="readonly")
                template(v-else)
                    select(name="division" required disabled v-model="selectedEmpTags.emp_dvs")
                        option(disabled) 부서(회사) 선택
            
            .input-wrap
                p.label 권한
                template(v-if="disabled")
                    input(type="text" name="access_group" :value="access_group[selectedEmp?.access_group] || '-' " :readonly="readonly")
                template(v-else)
                    select(name="access_group" v-model="selectedEmp.access_group" style="height: 40px;")
                        option(disabled selected) 권한선택
                        option(value="1") 직원
                        option(value="98") 관리자
                        option(value="99") 마스터
                
            .input-wrap
                p.label 이름
                input(type="text" name="name" :value="selectedEmp?.name || '-' "  placeholder="이름을 입력해주세요." disabled)

            .input-wrap
                p.label 이메일
                input(type="email" name="email" :value="selectedEmp?.email || '-' " placeholder="이메일을 입력해주세요." disabled)

            .input-wrap
                p.label 생년월일
                input(type="date" name="birthdate" :value="selectedEmp?.birthdate" disabled)

            .input-wrap
                p.label 전화번호
                input(type="tel" name="phone_number" :value="selectedEmp?.phone_number || '-' " placeholder="전화번호를 입력해주세요." disabled)

            .input-wrap
                p.label 주소
                input(type="text" name="address" :value="selectedEmp?.address || '-' " placeholder="주소를 입력해주세요." disabled)

            .input-wrap.upload-file
                p.label(style="margin-bottom: 0;") 기타자료
                template(v-if="!disabled")
                    .btn-add-file(style="margin-top: 12px;")
                        input(type="file" name="additional_data" multiple style="height: initial;")

                .file-wrap
                    ul.file-list
                        template(v-if="!uploadFile")
                            li.file-item(style="height: 36px;") 등록된 파일이 없습니다.
                        template(v-else)
                            li.file-item(v-for="(file, index) in uploadFile" :key="index" :class="{'remove': removeFileList.includes(file.record_id)}")
                                a.file-name(:href="file.path" download) {{ file.filename }}
                                template(v-if="!disabled")
                                    button.btn-cancel(v-if="removeFileList.includes(file.record_id)" type="button" @click="cancelRemoveFile(file)")
                                        svg
                                            use(xlink:href="@/assets/icon/material-icon.svg#icon-undo")
                                    button.btn-remove(v-else type="button" @click="removeFile(file)")
                                        svg
                                            use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")
        .modal-footer
            template(v-if="disabled")
                button.btn.btn-edit(type="button" @click="editEmp") 수정
            template(v-else)
                button.btn.bg-gray.btn-cancel(type="button" @click="cancelEdit") 취소
                button.btn.btn-register(type="submit" @click="registerEmp") 등록
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, watch, onMounted, onScopeDispose, nextTick } from 'vue';
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
let blockList = ref([]);
let isAllSelected = computed(() => {
    return selectedList.value.length > 0 && employee.value.every(emp => selectedList.value.includes(emp.user_id));
});

let originalEmployee = JSON.parse(window.sessionStorage.getItem('employee'));
let sessionEmployee;
let employee = ref([]);
let suspendedLength = ref(0);
let isModalOpen = ref(false);
let selectedEmp = ref(null);
let selectedEmpTags = ref({
    emp_dvs: '',
    emp_pst: '',
});
let searchFor: Ref<"name" | "access_group" | "email" | "timestamp"> = ref('name');
let searchValue = ref('');
let uploadFile = ref(null);
let backupUploadFile = ref([]);
let readonly = ref(true);
let disabled = ref(true);
let removeFileList = ref([]);

let access_group = {
    1: '직원',
    98: '관리자',
    99: '마스터',
};
let callParams = computed(() => {
    switch (searchFor.value) {
        case 'name':
            return {
                searchFor: 'name',
                value: searchValue.value,
                condition: '>='
            };
        case 'access_group':
            return {
                searchFor: 'access_group',
                value: searchValue.value,
                condition: '='
            };
        case 'email':
            return {
                searchFor: 'email',
                value: searchValue.value,
                condition: '='
            };
    }
});

getDivisionNames();

function makeSafe(str) {
    return str.replaceAll('.', '_').replaceAll('+', '_').replaceAll('@', '_').replaceAll('-', '_');
}

let empInfo: {[key:string]: any} = ref({});

let getEmpDivision = async(userId) => {
    if(!userId) return;

    await skapi.getRecords({
        table: {
            name: 'emp_division',
            access_group: 1
        },
        tag: "[emp_id]" + makeSafe(userId)
    },{
        limit: 1,
        ascending: false
    }).then(r => {
        let record = r.list[0];
        let emp_dvs = record.tags.filter(t => t.includes('[emp_dvs]'))[0];
        let emp_id = record.tags.filter(t => t.includes('[emp_id]'))[0];
        let emp_pst = record.tags.filter(t => t.includes('[emp_pst]'))[0];

        emp_dvs = emp_dvs.replace('[emp_dvs]', '');
        emp_id = emp_id.replace('[emp_id]', '').replaceAll('_', '-');
        emp_pst = emp_pst.replace('[emp_pst]', '');

        empInfo[emp_id] = {
            division: emp_dvs,
            position: emp_pst
        }
    })
}

function getFileUserId(str: string) {
    if (!str) return '';

    return str.split('/')[3]
}

let searchEmp = async() => {
    loading.value = true;

    if (!searchValue.value) {
        searchFor.value = 'name';
        callParams.value.searchFor = 'timestamp';
        callParams.value.value = new Date().getTime();
        callParams.value.condition = '<=';
    }

    let fetchedData = await skapi.getUsers(callParams.value, { ascending: !searchValue.value ? false : true }).catch((err) => {
        loading.value = false;
        alert(err);
    });

    if(fetchedData) {
        // if(empListType.value === '직원목록') {
        //     employee.value = fetchedData.list.filter(emp => emp.approved.includes('approved'));
        // } else if(empListType.value === '숨김여부') {
        //     employee.value = fetchedData.list.filter(emp => emp.approved.includes('suspended'));
        // } else if(empListType.value === '초청여부') {
        //     employee.value = fetchedData.list;
        // }
        employee.value = fetchedData.list;
    }
    
    loading.value = false;
}

// 추가자료 업로드 한 것 가져오기
const getAdditionalData = (emp) => {
    skapi.getRecords({
        table: {
            name: 'emp_additional_data',
            access_group: 99,
        },
        reference: "[emp_additional_data]" + selectedEmp.value.user_id,
    }).then(res => {
        // console.log('=== openModal; getRecords === res : ', res);

        if(res.list.length === 0) {
            return;
        } else {
            let fileList = [];

            // console.log('== getRecords == res : ', res);

            res.list.forEach((item) => {
                if (item.bin.additional_data && item.bin.additional_data.length > 0) {

                    const result = item.bin.additional_data.map((el) => ({
                        ...el,
                        user_id: getFileUserId(el.path),
                        record_id: item.record_id,
                    }));    

                    fileList.push(...result);
                }
            })

            console.log('== getRecords == fileList : ', fileList);

            uploadFile.value = fileList;
        }
    })
}

let openModal = async(emp: { [key: string]: any }) => {
    console.log(emp.division)
    selectedEmp.value = emp;
    selectedEmpTags.value.emp_dvs = emp.division;
    selectedEmpTags.value.emp_pst = emp.position;
    isModalOpen.value = true;
    uploadFile.value = null;
    removeFileList.value = [];

    if(emp.picture) {
        await skapi.getFile(emp.picture, {
            dataType: 'endpoint',
        })
        .then((res: any) => {  
            emp.picture = res;
        })
        .catch((err: Error) => {
            window.alert('프로필 사진을 불러오는데 실패했습니다.');
            throw err;
        });
    }
    
    // user additional data 가져오기
    skapi.getRecords({
        table: {
            name: 'ref_ids',
            access_group: 1
        },
        index: {
            name: 'user_id',
            value: makeSafe(selectedEmp.value?.user_id)
        },
    }).then((res) => {
        console.log('=== openModal; getRecords === res : ', res);
        getAdditionalData(emp);
    });
};

let closeModal = () => {
    isModalOpen.value = false;
    selectedEmp.value = null;
    readonly.value = true;
    disabled.value = true;
};

watch(empListType, async(nv) => {
    if(nv) {
        // checkbox reset
        selectedList.value = [];

        if (nv === '직원목록') {
            sessionEmployee = JSON.parse(window.sessionStorage.getItem('employee'));

            if (!sessionEmployee) {
                loading.value = true;

                skapi.getUsers().then(async(res) => {
                    let list = res.list.filter(emp => emp.approved.includes('approved'));
                    // 마스터 계정 제외
                    // 8891ac0f-bc24-472b-9807-903bf768a944
                    // df5d3061-aefb-4a8b-8900-89d4dbd6c33f

                    employee.value = list;
                    for(let e of employee.value) {
                        if(e.user_id !== '8891ac0f-bc24-472b-9807-903bf768a944' && e.user_id !== 'df5d3061-aefb-4a8b-8900-89d4dbd6c33f') {
                            await getEmpDivision(e.user_id);
                        }
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

                skapi.getInvitations().then(async(res) => {
                    employee.value = res.list;
                    for(let e of employee.value) {
                        if(e.user_id !== '8891ac0f-bc24-472b-9807-903bf768a944' && e.user_id !== 'df5d3061-aefb-4a8b-8900-89d4dbd6c33f') {
                            await getEmpDivision(e.user_id);
                        }
                        if(empInfo[e.user_id]) {
                            e.division = empInfo[e.user_id].division;
                            e.position = empInfo[e.user_id].position;
                        }
                    }
                    displayinviteEmployee(res.list);
                    loading.value = false;
                });

            } else {
                employee.value = sessionEmployee;
            }
        }

        getEmpDivision();
    }
}, { immediate: true });

let getEmployee = () => {
    skapi.getUsers().then(res => {        
        empListType.value = '직원목록';

        selectedList.value = [];

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

        // skapi.getInvitations().then(res => {
        //     employee.value = res.list;
        //     displayinviteEmployee(res.list);
        // });

        let session = JSON.parse(window.sessionStorage.getItem('inviteEmployee'));
        let newSession = session.filter(emp => emp.user_id !== employee_info.user_id);

        employee.value = newSession;
        displayinviteEmployee(newSession);
    }).catch(err => {
        alert('초대메일 취소에 실패하였습니다.');
    });
}

let removeFile =  (item) => {
    removeFileList.value.push(item.record_id);
}

let cancelRemoveFile = (item) => {
    removeFileList.value = removeFileList.value.filter((id) => id !== item.record_id);
}

let editEmp = () => {
    readonly.value = false;
    disabled.value = false;
    nextTick(() => {
        for(let key in divisionNameList.value) {
            const option = document.createElement('option');
            const select = document.querySelector('select[name="division"]');
            option.value = key;
            option.innerText = divisionNameList.value[key];
            if(key === selectedEmp.value.division) {
                option.selected = true;
            }
            document.querySelector('select[name="division"]').appendChild(option);
        }
        console.log(selectedEmp.value.division)
        document.querySelector('select[name="division"]').disabled = false;
    });
    if(uploadFile.value){
        backupUploadFile.value = [...uploadFile.value];
    }
}

let cancelEdit = () => {
    readonly.value = true;
    disabled.value = true;
    removeFileList.value = [];
    uploadFile.value = [...backupUploadFile.value];
}

let registerEmp = async(e) => {
    e.preventDefault();

    console.log('=== registerEmp === e : ', e);
    console.log('=== registerEmp === selectedEmp.value : ', selectedEmp.value);
    readonly.value = true;
    disabled.value = true;

    let user_id_safe = makeSafe(selectedEmp.value.user_id);

    // 부서, 직책 업데이트
    skapi.postRecord(null, {
        table: {
            name: 'emp_division',
            access_group: 1
        },
        tags: ["[emp_pst]" + selectedEmpTags.value.emp_pst, "[emp_id]" + user_id_safe, "[emp_dvs]" + selectedEmpTags.value.emp_dvs]
    }).then(r => {
        console.log('부서직책업데이트', r);
    })

    let access_group_value = document.querySelector('select[name=access_group]').value;

    // 권한 업데이트
    skapi.grantAccess({
        user_id: selectedEmp.value.user_id,
        access_group: access_group_value
    }).then(r => {
        console.log('권한업데이트' ,r)
    })

    // 추가자료 업데이트
    let filebox = document.querySelector('input[name=additional_data]');

    if (filebox && filebox.files.length) {
        console.log('파일 있음');

        for(let file of filebox.files) {
            const formData = new FormData();

            formData.append('additional_data', file);
            
            await skapi.postRecord(formData, {
                table: {
                    name: 'emp_additional_data',
                    access_group: 99
                },
                reference: {
                    unique_id: "[emp_additional_data]" + selectedEmp.value.user_id,
                }
            });

            backupUploadFile.value = [...uploadFile.value];
        }
    } else {
        console.log('파일 없음');
    }

    if(removeFileList.value.length) {
        console.log('삭제파일 있음');
        skapi.deleteRecords({record_id: removeFileList.value}).then(r => {
            removeFileList.value = [];
        });
    } else {
        console.log('삭제파일 없음');
    }

    for(let e of employee.value) {
        if(e.user_id === selectedEmp.value.user_id) {
            e.division = selectedEmpTags.value.emp_dvs;
            e.position = selectedEmpTags.value.emp_pst;
            break;
        }
    }

    displayEmployee(employee.value);    // 세션에 저장
    getAdditionalData();    // 추가자료 가져오기
    window.alert('등록완료');
    readonly.value = true;
    disabled.value = true;
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