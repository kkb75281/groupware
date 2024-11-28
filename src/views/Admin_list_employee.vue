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
                                    .btn-wrap
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
                            td {{ emp.position }}
                            td {{ emp.division }}
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
                input(type="text" name="" :value="selectedEmp?.position || '-' " readonly)

            .input-wrap
                p.label 권한
                input(type="text" name="" :value="selectedEmp?.access_group || '-' " readonly)

            .input-wrap
                p.label 이름
                input(type="text" name="" :value="selectedEmp?.name || '-' " readonly)

            .input-wrap
                p.label 이메일
                input(type="email" name="" :value="selectedEmp?.email || '-' " readonly)

            .input-wrap
                p.label 생년월일
                input(type="email" name="" :value="selectedEmp?.birthdate || '-' " readonly)

            .input-wrap
                p.label 전화번호
                input(type="email" name="" :value="selectedEmp?.phone_number || '-' " readonly)

            .input-wrap
                p.label 주소
                input(type="email" name="" :value="selectedEmp?.address || '-' " readonly)

            .input-wrap.upload-file
                p.label 기타자료
                .file-wrap
                    ul.file-list
                        template(v-if="!uploadFile")
                            li.file-item(style="height: 36px;") 등록된 파일이 없습니다.
                        template(v-else)
                            li.file-item(v-for="(file, index) in uploadFile" :key="index")
                                a.file-name(:href="file.path" download) {{ file.filename }}
                                button.btn-remove(type="button" @click="removeFile(file)")
                                    template(v-if="file.user_id !== user.user_id")
                                        
                                    template(v-else)
                                        svg
                                            use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")
        //- .modal-footer
        //-     button.btn.bg-gray(@click="closeModal") 닫기
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, watch, onMounted, onScopeDispose } from 'vue';
import { skapi } from '@/main';
import { user } from '@/user';
import { divisionNameList } from '@/division'
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
let searchFor: Ref<"name" | "access_group" | "email" | "timestamp"> = ref('name');
let searchValue = ref('');
let uploadFile = ref(null);

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

if(!Object.keys(divisionNameList.value).length) {
    console.log('dd')
    skapi.getRecords({
        table: {
            name: 'divisionNames',
            access_group: 1
        },
    }).then(r => {
        divisionNameList.value = r.list[0].data;
    })
}

let empInfo: {[key:string]: any} = ref({});

let getEmpDivision = async() => {
    await skapi.getRecords({
        table: {
            name: 'emp_division',
            access_group: 1
        }
    }).then(r => {
        for(let record of r.list) {
            let udvs = record.tags.filter(t => t.includes('_udvs_'))[0];
            let uid = record.tags.filter(t => t.includes('_uid_'))[0];
            let upst = record.tags.filter(t => !t.includes('_udvs_') && !t.includes('_uid_'))[0];
            
            udvs = udvs.replace('_udvs_', '');
            uid = uid.replace('_uid_', '').replaceAll('_', '-');



            // for(let e of employee.value){
            //     if(e.user_id === uid) {
            //         e.division = udvs;
            //         e.position = upst;
            //     }
            // }
        }
        // window.sessionStorage.setItem('employee', JSON.stringify(employee.value));
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
const getAdditionalData = () => {
    // 방어코드
    if (!selectedEmp || !selectedEmp.value) return;

    const referenceId = JSON.parse(selectedEmp.value?.misc);

    if (!referenceId) return;

    skapi.getRecords({
        table: {
            name: 'emp_additional_data',
            access_group: 99,
        },
        reference: referenceId.private_record_id,
    }).then((r) => {
        console.log('=== openModal; getRecords === r : ', r);

        if(r.list.length === 0) {
            return;
        } else {
            let fileList = [];

            console.log('== getRecords == res : ', r);

            r.list.forEach((item) => {
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

        // // uploadFile.value에 값을 추가
        // if (!uploadFile.value) {
        //     uploadFile.value = []; // 초기화
        // }

        // // r.list의 각 요소를 순회
        // for (let list of r.list) {
        //     console.log('=== getRecords === list : ', list.bin.additional_data);
        //     uploadFile.value.push(list.bin.additional_data);
        // }

        // const objList = JSON.parse(JSON.stringify(uploadFile.value));
        // const combined = objList.flat().filter(item => typeof item === 'object' && item !== null);

        // console.log('=== objList === : ', objList);
        // console.log('=== combined === : ', combined);

        // if (r.list.length === 0) {
        //     return uploadFile.value = null;
        // }

        // uploadFile.value = combined;
        
        // // for(let i of uploadFile.value) {
        // //     console.log('=== openModal; getRecords === i : ', i);
        // //     i.user_id = r.list[0].user_id;
        // // }
        // console.log('=== getRecords === uploadFile.value : ', uploadFile.value);
        // console.log('=== getRecords === selectedEmp.value : ', selectedEmp.value);
    })
}

let openModal = async(emp: { [key: string]: any }) => {
    selectedEmp.value = emp;
    isModalOpen.value = true;
    uploadFile.value = null

    if(emp.picture) {
        skapi.getFile(emp.picture, {
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
    }).then(() => {
        getAdditionalData();
    });
};

let closeModal = () => {
    isModalOpen.value = false;
    selectedEmp.value = null;
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
                    console.log(res.list)
                    let list = res.list.filter(emp => emp.approved.includes('approved'));
                    // 0ea3a557-908c-4b2e-9398-b35b391159cf
                    // 0958b372-802a-4b9a-be93-b1f53c354cdc
                    // e966fb01-736e-441d-b1f0-7740b56a96cc

                    // 8891ac0f-bc24-472b-9807-903bf768a944
                    // df5d3061-aefb-4a8b-8900-89d4dbd6c33f
                    // console.log(list)
                    // getEmpDivision();

                    employee.value = list;
                    displayEmployee(res.list);
                });
            } else {
                employee.value = sessionEmployee.filter(emp => emp.approved.includes('approved'));
            }

            await getEmpDivision();
            console.log('here')
            loading.value = false;
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

// 업로드 파일 삭제
let removeFile =  (item) => {
    let query = {
        record_id: [item.record_id]
    };

     skapi.deleteRecords(query).then(() => {
        getAdditionalData();
    });
}

// let removeFile = (file) => {
//     console.log('AA === removeFile === file : ', file);
//     console.log('AA == removeFile === uploadFile.value : ', uploadFile.value);

//     // skapi.deleteRecords({
//     //     table: {
//     //         name: 'emp_additional_data',
//     //         access_group: 99,
//     //     },
//     //     reference: 
//     // }).then(res => {
//     //     console.log('=== deleteRecords === res : ', res);
//     // }).catch(err => {
//     //     console.log('=== deleteRecords === err : ', err);
//     //     throw err;
//     // });

//     // for(let i of uploadFile.value) {
//     //     console.log('=== removeFile === i : ', i);
//     //     if(file.path === i.path) {
//     //         uploadFile.value = uploadFile.value.filter((f) => {
//     //             return f.path !== file.path;
//     //         });
//     //         break;
//     //     }
//     // }

//     // console.log('BB == removeFile === uploadFile.value : ', uploadFile.value);

//     // let misc = JSON.parse(selectedEmp.value?.misc || null);
//     // let miscParse = JSON.parse(selectedEmp.value?.misc);

//     // skapi.deleteRecords(uploadFile.value).then(res => {
//     //     console.log('=== deleteRecords === res : ', res);
//     // }).catch(err => {
//     //     console.log('=== deleteRecords === err : ', err);
//     // });

//     // skapi.postRecord(uploadFile.value, {
//     //     record_id: miscParse.private_record_id,
//     //     table: {
//     //         name: 'emp_additional_data',
//     //         access_group: 99,
//     //     },
//     //     reference: miscParse.private_record_id,
//     // }).then((res) => {
//     //     console.log('AA === postRecord === res : ', res)
//     //     console.log('BB === removeFile === file : ', file)
//     //     console.log('CC == removeFile === uploadFile.value : ', uploadFile.value);

//     //     // uploadFile.value = uploadFile.value.filter((f) => {
//     //     //     console.log('=== removeFile === f : ', f);
//     //     //     return f.filename !== file.filename;
//     //     // });

//     //     // res.list[0].bin.additional_data = uploadFile.value;

//     //     // console.log('CC uploadFile.value : ', uploadFile.value);
//     //     console.log('BB === postRecord === res : ', res);
//     // }).catch((err) => {
//     //     console.log('=== deleteRecords === err : ', err);
//     // });
// }
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
</style>