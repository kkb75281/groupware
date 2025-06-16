<template lang="pug">
//- .title
//- 	h1 직원 상세

//- hr

.inner
    .form-wrap(v-if="currentEmp")
        form#_el_empDetail_form
            .imgbtn-wrap
                .image
                    img#profile-img(:src="currentEmp?.picture" alt="profile image")

                //- .util-wrap
                    .util-btn(:class="{'disabled' : !currentEmp?.phone_number}")
                        a.click-btn(:href="'tel:' + currentEmp?.phone_number" style="display: block;")
                            svg
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-phone-call")
                        span 전화걸기
                    .util-btn
                        button.click-btn(type="button" @click="sendMail(currentEmp?.email)" :disanbled="!currentEmp?.email || disabled")
                            svg
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-mail")
                        span 이메일전송

            .input-wrap
                .top-area
                  p.label 부서/직책
                  button.btn.outline.sm.btn-add(type="button" @click="addDvsInput" v-show="!disabled") + 부서 추가
                .list-area(v-for="(dvs, index) in employeeDivisions" :key="index")
                  .list-item
                    .item.division
                      template(v-if="disabled")
                          input(type="text" name="division" readonly :disabled="disabled" :value="divisionNameList[dvs.division] || '-' ")
                      template(v-else)
                          select(:name="'division-' + index" required v-model="dvs.division")
                              option(value="" disabled) 부서 선택
                              option(v-for="(name, key) in divisionNameList" :key="key" :value="key") {{ name }}
                      p.desc(v-if="user.access_group > 98 && !dvs.division") 부서를 등록해주세요.

                    .item.position
                      input(type="text" :name="'position-' + index" v-model="dvs.position" :disabled="disabled" :readonly="disabled")
                      p.desc(v-if="user.access_group > 98 && !dvs.position") 직책을 등록해주세요.

                  button.btn-delete(type="button" @click="removeDivision(index)" v-show="!disabled && employeeDivisions.length > 1")
                    .icon
                      svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")

            .input-wrap
                p.label 권한
                template(v-if="disabled")
                    input(type="text" name="access_group" :value="access_group[currentEmp?.access_group] || '-' " readonly)
                template(v-else)
                    select(name="access_group" v-model="currentEmp.access_group")
                        option(value="" disabled selected) 권한선택
                        option(value="1") 직원
                        option(value="98") 관리자
                        option(value="99") 마스터
                
            .input-wrap
                p.label 이름
                input(type="text" name="name" :value="currentEmp?.name || '-' "  placeholder="이름을 입력해주세요." :readonly="disabled" disabled required)

            .input-wrap
                p.label 이메일
                input(type="email" name="email" :value="currentEmp?.email || '-' " placeholder="예) user@email.com" disabled)
                .icon(v-if="currentEmp?.email" @click="copy(currentEmp?.email)")
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-file-copy-fill")

            .input-wrap
                p.label 생년월일
                input(type="date" name="birthdate" :value="currentEmp?.birthdate" disabled style="width:100% !important")

            .input-wrap
                p.label 전화번호
                input(type="tel" name="phone_number" :value="currentEmp?.phone_number || '-' " placeholder="예) +821012345678" disabled)
                .icon(v-if="currentEmp?.phone_number")
                    a(:href="'tel:' + currentEmp?.phone_number")
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-phone-call")

            .input-wrap
                p.label 주소
                input(type="text" name="address" :value="currentEmp?.address || '-' " placeholder="예) 서울시 마포구" disabled)

            .input-wrap.upload-stamp
                p.label 도장
                .main-stamp
                    img#stamp-img(:src="getStampImageSrc(mainStamp)" alt="도장 이미지")

            .input-wrap.upload-file(v-if="user.access_group > 98 || user.user_id === currentEmp?.user_id")
                p.label(style="margin-bottom: 0;") 기타자료
                template(v-if="haveDataRecord")
                    .btn-upload-file
                        input#file(type="file" name="additional_data" multiple :disabled="!haveDataRecord || disabled" @change="updateFileList" hidden)
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
                div(v-else style="margin-top: 0.5rem") 
                    p(v-if="user.access_group < 99" style="font-size:0.9rem; color:var(--gray-color-400)") 자료 업로드 기능이 필요하신 경우 FGWORKS 관리자에게 문의 바랍니다.
                    button.btn(v-else type="button" :disabled="disabled" @click="makeFileRoom") 업로드 권한 생성

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

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, nextTick } from 'vue';
import { skapi, mainPageLoading } from '@/main.ts';
import { user, makeSafe } from '@/user.ts';
import { divisionNameList, getDivisionNames } from '@/division.ts';
import { getEmpDivisionPosition, getUsers, employeeDict } from '@/employee.ts';
import { openGmailAppOrWeb } from '@/utils/mail.ts';
import { getStampList, uploadedStamp } from '@/stamp.ts';

const router = useRouter();
const route = useRoute();

const currentEmp = ref(null);
let currentEmpOriginal = {};
const employeeDivisions = ref([]); // 직원 부서/직책 목록 (다중)
const employeeDivisionsOriginal = ref([]); // 수정 취소 시 복원용
let uploadFile = ref([]);
let backupUploadFile = ref([]);
let disabled = ref(true);
let haveDataRecord = ref(false);
let removeFileList = ref([]);
let fileNames = ref([]);
let access_group = {
    1: '직원',
    98: '관리자',
    99: '마스터'
};
let mainStamp = ref({}); // 대표 도장 정보

const userId = route.params.userId;

const makeFileRoom = async () => {
    const params = {
        unique_id: '[emp_additional_data]' + makeSafe(currentEmp.value.user_id),
        table: {
            name: 'emp_access_ref',
            access_group: 99
        },
        index: {
            name: 'user_id',
            value: makeSafe(currentEmp.value.user_id)
        },
        source: {
            can_remove_referencing_records: true // 마스터가 삭제 해당 레코드 삭제시, reference된 모든 레코드들도 지워지도록 한다.
        }
    };

    const res = await skapi.postRecord(null, params);

    // 마스터가 아니면 직원이므로 직원에게 접근권한을 부여한다. (마스터는 모든 레코드를 볼수 있으므로)
    if (currentEmp.value.access_group !== '99') {
        // 생성된 레코드에 대한 접근권한을 부여한다. (레코드를 reference해서 올리면 직원과 마스터만 볼수 있다)
        skapi.grantPrivateRecordAccess({
            record_id: res.record_id,
            user_id: currentEmp.value.user_id
        }).then(r => {
            alert('업로드 권한이 생성되었습니다.');
            getAdditionalData();
        }).catch((err) => {
            console.log('업로드 권한 생성 중 오류 발생:', err);
            alert('업로드 권한 생성 중 오류가 발생했습니다.');
        })
    }
}

// 직원 정보 및 부서/직책 가져오기
const fetchEmployeeData = async () => {
    try {
        // 직원 정보 가져오기
        const employeeList = await getUsers({ searchFor: 'user_id', value: userId });
        const employeeWithDivisions = await Promise.all(
            employeeList.map((emp) => getEmpDivisionPosition(emp))
        );

        if (employeeWithDivisions.length === 0) {
            window.alert('해당 직원을 찾을 수 없습니다.');
            router.push('/list-employee');
            return;
        }

        let emp = employeeWithDivisions[0];
        currentEmp.value = emp;

        // 다중 부서 정보 가져오기
        await fetchEmployeeDivisions(userId);
    } catch (error) {
        console.error('직원 정보를 가져오는 중 오류 발생:', error);
    }
};

// 직원의 다중 부서/직책 정보 가져오기
const fetchEmployeeDivisions = async (userId) => {
    const userIdSafe = makeSafe(userId);

    try {
        const empLists = await skapi
            .getUniqueId({
                unique_id: `[emp_position_current]${userIdSafe}`,
                condition: '>='
            })
            .then((res) => res.list);

        if (!empLists || empLists.length === 0) {
            return;
        }

        const response = await Promise.all(
            empLists.map(
                async (emp) =>
                    await skapi
                        .getRecords({
                            table: {
                                name: 'emp_position_current',
                                access_group: 1
                            },
                            unique_id: emp.unique_id
                        })
                        .then((res) => res.list[0] ?? [])
            )
        );

        // 이미 기본 부서/직책은 추가되어 있으므로 employeeDivisions 초기화
        if (response && response.length > 0) {
            // 첫 번째 부서는 이미 추가되어 있으므로 초기화

            response.forEach((res) => {
                const str = res.index.name.split('.');
                const division = str[0] || '';
                const position = str[1] || '';

                employeeDivisions.value.push({
                    division,
                    position
                });
            });
        }
        return;
    } catch (error) {
        console.error('직원 부서 정보를 가져오는 중 오류 발생:', error);
    }
};

// 페이지 초기화
fetchEmployeeData();

// 부서 목록 가져오기
getDivisionNames();

// 추가자료 가져오기
let getAdditionalData = () => {
    if (user.access_group < 99 && user.user_id !== userId) {
        return;
    }

    skapi
        .getRecords({
            table: {
                name: 'emp_additional_data',
                access_group: 99
            },
            reference: '[emp_additional_data]' + makeSafe(userId)
        })
        .then((res) => {
            console.log('추가자료 가져오기 == res : ', res);
            haveDataRecord.value = true;

            if (res.list.length > 0) {

                let fileList = [];

                function getFileUserId(str) {
                    if (!str) return '';

                    return str.split('/')[3];
                }

                res.list.forEach((item) => {
                    if (item.bin.additional_data && item.bin.additional_data.length > 0) {
                        const result = item.bin.additional_data.map((el) => ({
                            ...el,
                            user_id: getFileUserId(el.path),
                            record_id: item.record_id
                        }));

                        fileList.push(...result);
                    }
                });

                uploadFile.value = fileList;
            }
        })
        .catch((err) => {
            haveDataRecord.value = false;
            console.log('== getRecords == err : ', err);
        });
};
getAdditionalData();

let sendMail = async (mail) => {
    const maillink = encodeURIComponent(mail);
    openGmailAppOrWeb(maillink);
};

let copy = (text) => {
    let doc = document.createElement('textarea');
    doc.textContent = text;
    document.body.append(doc);
    doc.select();
    document.execCommand('copy');
    doc.remove();

    alert('이메일이 복사되었습니다.');
};

// 파일 업로드 리스트 업데이트
let updateFileList = (e) => {
    let target = e.target;
    console.log('updateFileList');
    if (target.files) {
        console.log('target.files : ', target.files);
        fileNames.value = Array.from(target.files).map((file) => file.name);
        console.log('fileNames : ', fileNames.value);
    }
};

// 수정 시작
let startEditEmp = async () => {
    disabled.value = false;

    // 현재 상태 저장
    currentEmpOriginal = { ...currentEmp.value };

    // 부서/직책 원본 저장 (깊은 복사)
    employeeDivisionsOriginal.value = JSON.parse(JSON.stringify(employeeDivisions.value));

    fileNames.value = [];
    removeFileList.value = [];

    if (uploadFile.value) {
        backupUploadFile.value = [...uploadFile.value];
    }
};

// 수정 취소
let cancelEdit = () => {
    disabled.value = true;
    currentEmp.value = { ...currentEmpOriginal };

    // 부서/직책 정보 복원
    employeeDivisions.value = JSON.parse(JSON.stringify(employeeDivisionsOriginal.value));

    fileNames.value = [];
    removeFileList.value = [];
    uploadFile.value = [...backupUploadFile.value];
};

// 부서 추가란 추가
const addDvsInput = () => {
    employeeDivisions.value.push({
        division: '',
        position: ''
    });
};

// 부서 삭제
const removeDivision = (index) => {
    // 적어도 하나의 부서는 유지
    if (employeeDivisions.value.length > 1) {
        employeeDivisions.value.splice(index, 1);
    }
};

// 수정사항 저장
let registerEmp = async (e) => {
    e.preventDefault();
    mainPageLoading.value = true;
    disabled.value = true;

    let user_id_safe = makeSafe(currentEmp.value.user_id);

    try {
        // 기존 부서/직책 데이터 삭제
        await Promise.all(
            employeeDivisionsOriginal.value.map(async (dvs) => {
                return await skapi.deleteRecords({
                    unique_id: `[emp_position_current]${user_id_safe}:${dvs.division}`
                });
            })
        );

        // 각 부서/직책 데이터 저장
        for (const dvs of employeeDivisions.value) {
            // 빈 부서/직책은 저장하지 않음
            if (!dvs.division || !dvs.position) {
                employeeDivisions.value = employeeDivisions.value.filter((item) => item !== dvs);
                continue;
            }

            // 부서/직책 히스토리 저장
            await skapi.postRecord(null, {
                table: {
                    name: 'emp_division' + user_id_safe,
                    access_group: 1
                },
                tags: ['[emp_pst]' + dvs.position, '[emp_id]' + user_id_safe, '[emp_dvs]' + dvs.division]
            });

            // 현재 부서/직책 저장
            await skapi.postRecord(
                {
                    user_id: currentEmp.value.user_id
                },
                {
                    unique_id: `[emp_position_current]${user_id_safe}:${dvs.division}`,
                    table: {
                        name: 'emp_position_current',
                        access_group: 1
                    },
                    index: {
                        name: dvs.division + '.' + dvs.position,
                        value: currentEmp.value.name
                    }
                }
            );
        }

        // 권한 업데이트
        if (currentEmpOriginal.access_group !== currentEmp.value.access_group) {
            await skapi.grantAccess({
                user_id: currentEmp.value.user_id,
                access_group: currentEmp.value.access_group
            });
        }

        console.log('AAAA');

        // 추가자료 업데이트
        let filebox = document.querySelector('input[name="additional_data"]');

        if (filebox && filebox.files.length) {
            for (let file of filebox.files) {
                const formData = new FormData();
                formData.append('additional_data', file);

                await skapi.postRecord(formData, {
                    table: {
                        name: 'emp_additional_data',
                        access_group: 99
                    },
                    reference: '[emp_additional_data]' + user_id_safe
                });
            }

            if (uploadFile.value && uploadFile.value.length) {
                backupUploadFile.value = [...uploadFile.value];
            }

            document.querySelector('input[name="additional_data"]').value = '';
            fileNames.value = [];
        }

        // 파일 삭제 목록 처리
        if (removeFileList.value.length) {
            await skapi.deleteRecords({ record_id: removeFileList.value });
            uploadFile.value = uploadFile.value.filter(
                (file) => !removeFileList.value.includes(file.record_id)
            );
            removeFileList.value = [];
        }

        // 직원 정보 업데이트
        employeeDict[currentEmp.value.user_id] = currentEmp.value;

        // 변경사항 저장 후 데이터 다시 가져오기
        getAdditionalData();
        window.alert('직원 정보 수정이 완료되었습니다.');
    } catch (error) {
        console.error('직원 정보 수정 중 오류 발생:', error);
        window.alert('직원 정보 수정 중 오류가 발생했습니다.');
    } finally {
        disabled.value = true;
        mainPageLoading.value = false;
    }
};

// 도장 이미지 URL 가져오기
const getStampImageSrc = (mainStamp) => {
    // 도장 목록이 비어있으면 빈 문자열 반환
    if (uploadedStamp.value === undefined || uploadedStamp.value.length === 0) {
        return '';
    }

    // 레코드에서 로드된 도장인지 확인 (문자열인 경우)
    if (typeof mainStamp === 'string') {
        return mainStamp;
    }

    // 모달에서 선택된 도장인 경우 (객체로 url 속성을 가진 경우)
    else if (mainStamp && mainStamp.value && mainStamp.value.url) {
        return mainStamp.value.url;
    }

    // 객체 자체에 url 속성이 있는 경우
    else if (mainStamp && mainStamp.url) {
        return mainStamp.url;
    }

    // 아무 것도 없으면 빈 문자열 반환
    return '';
};

onMounted(async () => {
    window.scrollTo(0, 0);

    await getStampList();

    // 도장 목록이 비어있으면 대표 도장을 설정하지 않음
    if (uploadedStamp.value === undefined || uploadedStamp.value.length === 0) {
        console.log('도장 목록이 없어 대표 도장을 설정하지 않음');
        mainStamp.value = null;
        return;
    }

    // 각 직원에 대한 대표도장 가져오기
    skapi
        .getRecords({
            table: {
                name: 'main_stamp_' + makeSafe(userId),
                access_group: 1
            }
        })
        .then(async (res) => {
            if (res.list.length > 0) {
                mainStamp.value = await skapi.getFile(res.list[0].data, {
                    dataType: 'endpoint'
                });
            } else {
                mainStamp.value = null;
            }
        })
        .catch((err) => {
            console.log('== getRecords == err : ', err);
        });
});
</script>

<style scoped lang="less">
.inner {
    max-width: 1600px;
    margin: 0 auto;
    padding: 2rem;
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

#_el_empDetail_form {
    .imgbtn-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .input-wrap {
        position: relative;
        margin-top: 1rem;

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

        .icon {
            position: absolute;
            bottom: 12px;
            right: 0px;
            cursor: pointer;

            &:hover {
                svg {
                    transform: scale(1.1);
                }
            }

            svg {
                width: 1.2rem;
                height: 1.2rem;
                fill: var(--primary-color-400-dark);
            }
        }
    }

    .util-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 0.5rem;

        .util-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;

            &.disabled {
                .click-btn {
                    background-color: var(--gray-color-200);
                    pointer-events: none;
                    cursor: not-allowed;
                    user-select: none;
                }

                span {
                    color: var(--gray-color-300);
                }
            }

            .click-btn {
                padding: 0.5rem;
                border-radius: 50%;
                background-color: var(--primary-color-400);

                svg {
                    width: 1.2rem;
                    height: 1.2rem;
                    fill: #fff;
                }
            }

            span {
                font-size: 0.8rem;
                color: var(--gray-color-400);
                user-select: none;
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
            content: 'No Image';
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
                content: 'No Image';
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

.input-wrap.upload-stamp {
    .main-stamp {
        #stamp-img {
            &:empty::before {
                content: '도장 등록';
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                color: #888;
                background-color: #fff;
                font-size: 14px;
                text-align: center;
                position: absolute;
                top: 0;
                left: 0;
            }
        }
    }
}

.main-stamp {
    width: fit-content;
    position: relative;
}

#stamp-img {
    width: 100px;
    height: 100px;
    border-radius: 30%;
    display: block;
    object-fit: contain;
    position: relative;
    background-color: #fff;
    border: 2px dashed var(--gray-color-200);
    margin-bottom: 0.5rem;

    &::before {
        content: '도장 등록';
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: #888;
        background-color: #fff;
        font-size: 14px;
        text-align: center;
        position: absolute;
        top: 0;
        left: 0;
    }
}

.top-area {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;

    .label {
        margin-bottom: 0;
    }
}

.list-area {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;

    .list-item {
        display: flex;
        gap: 0.25rem;
        flex: 1;
    }

    .item {
        flex: 1;
    }

    .btn-delete {
        flex: none;
        background: none;
        border: none;
        cursor: pointer;

        .icon {
            position: relative !important;
            bottom: initial !important;
            padding: 0;

            &:hover {
                svg {
                    transform: scale(1) !important;
                }
            }

            svg {
                fill: var(--warning-color-400) !important;
            }
        }
    }
}

@media (max-width: 768px) {
    .inner {
        padding: 1rem;
    }
}
</style>
