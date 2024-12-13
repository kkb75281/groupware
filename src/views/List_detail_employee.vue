<template lang="pug">
.wrap
    .title
        h1 직원 상세

    hr

    .form-wrap(v-if="!loading")
        form#_el_empDetail_form
            #_el_pictureForm(style="text-align: center;")
                .image
                    img#profile-img( alt="profile image")

            .input-wrap
                p.label 직책
                input(type="text" name="position" v-model="selectedEmpTags.emp_pst" :readonly="disabled")

            .input-wrap
                p.label 부서
                template(v-if="disabled")
                    input(type="text" name="division" :value="divisionNameList[selectedEmp?.division]" :placeholder="divisionNameList[selectedEmp?.division] === '' ? '부서를 선택해주세요.' : ''" readonly)
                template(v-else)
                    select(name="division" required disabled v-model="selectedEmpTags.emp_dvs")
                        option(value="" disabled) 부서 선택
            
            .input-wrap
                p.label 권한
                template(v-if="disabled")
                    input(type="text" name="access_group" :value="access_group[selectedEmp?.access_group] || '-' " readonly)
                template(v-else)
                    select(name="access_group" v-model="selectedEmp.access_group")
                        option(value="" disabled selected) 권한선택
                        option(value="1") 직원
                        option(value="98") 관리자
                        option(value="99") 마스터
                
            .input-wrap
                p.label 이름
                input(type="text" name="name" :value="selectedEmp?.name || '-' "  placeholder="이름을 입력해주세요." disabled)

            .input-wrap
                p.label 이메일
                input(type="email" name="email" :value="selectedEmp?.email || '-' " placeholder="예) user@email.com" disabled)

            .input-wrap
                p.label 생년월일
                input(type="date" name="birthdate" :value="selectedEmp?.birthdate" disabled)

            .input-wrap
                p.label 전화번호
                input(type="tel" name="phone_number" :value="selectedEmp?.phone_number || '-' " placeholder="예) +821012345678" disabled)

            .input-wrap
                p.label 주소
                input(type="text" name="address" :value="selectedEmp?.address || '-' " placeholder="예) 서울시 마포구" disabled)

            .input-wrap.upload-file
                p.label(style="margin-bottom: 0;") 기타자료
                template(v-if="!disabled")
                    .btn-upload-file
                        input#file(type="file" name="additional_data" multiple :disabled="disabled" @change="updateFileList" hidden)
                        label.btn.outline.btn-upload(for="file") 파일 추가
                        ul.upload-file-list
                            li.file-name(v-for="(name, index) in fileNames" :key="index") {{ name }}

                .file-wrap
                    ul.file-list
                        template(v-if="uploadFile.length === 0")
                            li.file-item(style="height: 36px;") 등록된 파일이 없습니다.
                        template(v-else)
                            li.file-item(v-for="(file, index) in uploadFile" :key="index" :class="{'remove': removeFileList.includes(file.record_id)}")
                                a.file-name(:href="file.url" target="_blank") {{ file.filename }}
                                template(v-if="!disabled")
                                    button.btn-cancel(v-if="removeFileList.includes(file.record_id)" type="button" @click="removeFileList = removeFileList.filter((id) => id !== file.record_id);")
                                        svg
                                            use(xlink:href="@/assets/icon/material-icon.svg#icon-undo")
                                    button.btn-remove(v-else type="button" @click="removeFileList.push(file.record_id);")
                                        svg
                                            use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")

            br
            br
            br

            .button-wrap
                template(v-if="user.access_group > 98")
                    template(v-if="disabled")
                        button.btn.bg-gray(type="button" @click="$router.push('/list-employee')") 이전
                        button.btn.btn-edit(type="button" @click="startEditEmp") 수정
                    template(v-else)
                        button.btn.bg-gray.btn-cancel(type="button" @click="cancelEdit") 취소
                        button.btn.btn-register(type="submit" @click="registerEmp") 저장
                template(v-else)
                    button.btn.bg-gray(type="button" @click="$router.push('/list-employee')") 이전


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

// import CropImage from '@/components/crop_image.vue';
import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

let loading = ref(false);
let selectedList = ref([]);
let blockList = ref([]);

let originalEmployee = ref([]);
let employee = ref([]);
let suspendedLength = ref(0);
let selectedEmp = ref(null);
let selectedEmpOriginal = {};
let selectedEmpTags = ref({
    emp_dvs: '',
    emp_pst: '',
});
let uploadFile = ref([]);
let backupUploadFile = ref([]);
let disabled = ref(true);
let removeFileList = ref([]);
let empInfo: {[key:string]: any} = ref({});
let fileNames = ref([]);
let access_group = {
    1: '직원',
    98: '관리자',
    99: '마스터',
};

const userId = route.params.userId;
const sessionEmployee = JSON.parse(window.sessionStorage.getItem('employee'));

for (let key in sessionEmployee) {
    if (sessionEmployee[key].user_id === userId) {
        selectedEmp.value = sessionEmployee[key];
        selectedEmpOriginal = { ...selectedEmp.value };
        selectedEmpTags.value.emp_dvs = selectedEmp.value.division;
        selectedEmpTags.value.emp_pst = selectedEmp.value.position;
        break;
    }
}

console.log('selectedEmp', selectedEmp.value);

function makeSafe(str) {
    return str.replaceAll('.', '_').replaceAll('+', '_').replaceAll('@', '_').replaceAll('-', '_');
}

let displayDivisionOptions = (selectName: string) => {
    let divisionList = document.querySelector(`select[name="${selectName}"]`) as HTMLSelectElement;

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
    } else {
        defaultOption.disabled = true;
        defaultOption.selected = true;
        defaultOption.innerText = '부서 선택';
        divisionList.appendChild(defaultOption);
    }

    // 동적으로 부서 옵션 추가
    for (let key in divisionNameList.value) {
        if(divisionNameList.value[key] !== '') {
            const option = document.createElement('option');
            option.value = key;
            option.innerText = divisionNameList.value[key];
    
            // 선택된 부서 처리
            if (selectName === 'division' && key === selectedEmp.value.division) {
                option.selected = true;
                matchFound = true;
            }
    
            divisionList.appendChild(option);
        }
    }

    // 일치하는 키가 없으면 기본 옵션에 selected 추가
    if (selectName === 'division' && !matchFound) {
        defaultOption.selected = true;
    }

    // 선택박스 활성화
    divisionList.disabled = false;
}

const getEmpsInfo = async (list) => {
    if (!list) {
        console.log('=== getEmpsInfo === list is empty');
        return
    }

    try {
        let promiseList = [];

        for(let e of list) {
            promiseList.push(getEmpDivision(e.user_id));

            if(e.picture) {
                promiseList.push(getProfileImg(e));
            }
        }

        await Promise.all(promiseList);

        for(let e of list) {
            if(empInfo[e.user_id]) {
                e.division = empInfo[e.user_id].division;
                e.position = empInfo[e.user_id].position;
            }
        }
        
        employee.value = list;

        return employee.value;
    } catch (error) {
        console.log('== getEmpsInfo == error : ', error);
    }
}

let getEmpDivision = async (userId) => {
    if(!userId) return;

    try {
        const res = await skapi.getRecords({
            table: {
                name: 'emp_position_current',
                access_group: 1
            },
            unique_id: "[emp_position_current]" + makeSafe(userId)
        })
    
        if (!res || !res.list || res.list.length === 0) return;    
    
        let record = res.list[0];
        let emp_dvs = record?.index?.name?.split('.')[0];
        let emp_id = record?.unique_id?.replace('[emp_position_current]', '').replaceAll('_', '-');
        let emp_pst = record?.index?.name?.split('.')[1];

        empInfo[emp_id] = {
            division: emp_dvs,
            position: emp_pst
        }
    } catch (error) {
        console.error('== getEmpDivision == error == ', error);
    }
}

let getAdditionalData = () => {
    skapi.getRecords({
        table: {
            name: 'emp_additional_data',
            access_group: 99,
        },
        reference: "[emp_additional_data]" + makeSafe(selectedEmp.value.user_id),
    }).then(res => {

        if(res.list.length > 0) {
            let fileList = [];

            function getFileUserId(str: string) {
                if (!str) return '';

                return str.split('/')[3]
            }

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

            uploadFile.value = fileList;
        }
    })
}

const getProfileImg = async (emp) => {
    if(!emp || !emp.picture) return;

    await skapi.getFile(emp.picture, {
        dataType: 'endpoint',
    })
    .then((res: any) => {  
        emp.picture = res;
    })
    .catch((err: Error) => {
        console.log('프로필 사진을 불러오는데 실패했습니다.');
    });

    console.log('dd')
}

let getEmployee = () => {
    skapi.getUsers().then(async(res) => {        
        // empListType.value = '직원목록';

        // selectedList.value = [];


        // const userList = res.list.filter(emp => !emp.approved.includes('by_master'));
        // const result = await getEmpsInfo(userList);
        
        // const list = result.filter(emp => emp.approved.includes('approved'));
        
        employee.value = res.list;
        // displayEmployee(result);
    });
}

let displayEmployee = (employee) => {
    window.sessionStorage.setItem('employee', JSON.stringify(employee));
}

let startEditEmp = async(emp) => {
    disabled.value = false;
    fileNames.value = [];
    uploadFile.value = [];
    removeFileList.value = [];

    nextTick(() => {
        displayDivisionOptions('division');
    });

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

    getAdditionalData();

    if(uploadFile.value){
        backupUploadFile.value = [...uploadFile.value];
    }
}

let cancelEdit = () => {
    disabled.value = true;
    removeFileList.value = [];
    uploadFile.value = [...backupUploadFile.value];
}

let registerEmp = async(e) => {
    e.preventDefault();
    disabled.value = true;

    let user_id_safe = makeSafe(selectedEmp.value.user_id);
    let needUpdate = false;

    // 부서, 직책 업데이트 (history/current)
    if(selectedEmpOriginal.division !== selectedEmpTags.value.emp_dvs || selectedEmpOriginal.position !== selectedEmpTags.value.emp_pst) {
        skapi.postRecord(null, {
            table: {
                name: 'emp_division',
                access_group: 1
            },
            tags: ["[emp_pst]" + selectedEmpTags.value.emp_pst, "[emp_id]" + user_id_safe, "[emp_dvs]" + selectedEmpTags.value.emp_dvs]
        }).then(r => {
            console.log('history부서직책업데이트', r);
        })

        await skapi.deleteRecords({unique_id: "[emp_position_current]" + user_id_safe}).then(async(r) => {
            console.log(r)
            // current
            await skapi.postRecord({
                user_id: selectedEmp.value.user_id,
            }, {
                unique_id: "[emp_position_current]" + user_id_safe,
                table: {
                    name: 'emp_position_current',
                    access_group: 1
                },
                index: {
                    name: selectedEmpTags.value.emp_dvs + '.' + selectedEmpTags.value.emp_pst,
                    value: selectedEmp.value.name
                }
            }).then(r => {
                console.log('current부서직책업데이트', r);
            })
        });
        needUpdate = true;
    }

    // 권한 업데이트
    if(selectedEmpOriginal.access_group !== selectedEmp.value.access_group) {
        skapi.grantAccess({
            user_id: selectedEmp.value.user_id,
            access_group: selectedEmp.value.access_group
        }).then(r => {
            console.log('권한업데이트' ,r)
        })
    }

    // 추가자료 업데이트
    let filebox = document.querySelector('input[name=additional_data]');

    if (filebox && filebox.files.length) {
        for(let file of filebox.files) {
            const formData = new FormData();

            formData.append('additional_data', file);
            
            await skapi.postRecord(formData, {
                table: {
                    name: 'emp_additional_data',
                    access_group: 99
                },
                reference: "[emp_additional_data]" + makeSafe(selectedEmp.value.user_id),
            })
        }

        if(uploadFile.value && uploadFile.value.length) {
            backupUploadFile.value = [...uploadFile.value];
        }
    }

    if(removeFileList.value.length) {
        await skapi.deleteRecords({record_id: removeFileList.value}).then(r => {
            uploadFile.value = uploadFile.value.filter(file => !removeFileList.value.includes(file.record_id));
            
            removeFileList.value = [];
        });
    }

    for(let e of employee.value) {
        if(e.user_id === selectedEmp.value.user_id) {
            e.division = selectedEmpTags.value.emp_dvs;
            e.position = selectedEmpTags.value.emp_pst;
            selectedEmpOriginal = { ...e };
            break;
        }
    }

    displayEmployee(employee.value);    // 세션에 저장
    getAdditionalData();   // 추가자료 가져오기
    window.alert('직원 정보 수정이 완료되었습니다.');

    disabled.value = true;
}

let updateFileList = (e) => {
  let target = e.target;
  if (target.files) {
    fileNames.value = Array.from(target.files).map(file => file.name);
  }
};

onMounted(() => {
  window.scrollTo(0, 0);
});
</script>

<style scoped lang="less">
.wrap {
    padding: 3rem 2.4rem 0;
}

.title {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 1rem;

    span {
        color: var(--gray-color-400);
        line-height: 1.4;
    }
}

.form-wrap {
    max-width: 650px;
    margin: 0 auto;
}

#_el_empDetail_form {
    .input-wrap {
        margin-top: 16px;

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

    .image {
        position: relative;
        display: inline-block;

        label {
            position: absolute;
            right: 0;
            bottom: 0;
            background-color: var(--primary-color-400);
            border-radius: 50%;
            cursor: pointer;

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
    }

    img {
        width: 100px;
        height: 100px;
        border-radius: 30%;
        display: block;
        object-fit: contain;
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

        &#profile-img {
            border-radius: 50%;

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

    .image-wrap {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        // justify-content: center;
        gap: 1rem;

        .seal {
            img {
                background-color: unset;
                border: 2px dashed var(--gray-color-100);
    
                &::before {
                    background-color: #fff;
                }
            }
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

.btn-upload-file {
    margin-top: 12px;
}

.button-wrap {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 8px;
}

@media (max-width: 768px) {
    .wrap {
        padding-left: 16px;
        padding-right: 16px;
    }
}
</style>