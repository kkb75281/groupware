<template lang="pug">
//- .title
//- h1 게시글 카테고리명 셋팅

//- hr

.inner
    .form-wrap
        form#_write_news_form(@submit.prevent="registerNewsCat")
            .table-wrap
                .tb-overflow
                    table.table#tb-write-newsForm
                        colgroup
                            col(style="width: 13%; min-width: 92px")
                            col
                            col(style="width: 15%")
                            col(style="width: 20%")

                        tbody
                            tr
                                th.essential 제목
                                td(colspan="3")
                                    .input-wrap
                                        input#name_newsCat(type="text" v-model="newsCatName" name="name_newsCat" placeholder="제목을 입력해주세요." required)

                            tr(v-if="Object.keys(selectedDivisions).length === 0" style="height: 100px;")
                                th.essential 공개범위
                                td.left(colspan="3")
                                    span.empty(@click="openModal" style="cursor: pointer;") 이곳을 눌러 공개범위를 설정해주세요.

                            tr.selected-dvs(v-if="Object.keys(selectedDivisions).length > 0")
                                th.essential 공개 범위
                                td.left(colspan="3")
                                    ul.dvs-wrap
                                        li.dvs-list(v-for="(division, index) in Object.values(selectedDivisions)" :key="division")
                                            span.dvs-name {{ divisionNameList[division] }}

                                        li.dvs-list(@click="openModal" style="min-width: 64px;")
                                            span.add-dvs
                                                .icon
                                                    svg
                                                        use(xlink:href="@/assets/icon/material-icon.svg#icon-add")

                            tr
                                th 알림 설정
                                td.left(colspan="3")
                                    label.radio-button
                                        input(type="radio" name="noti" value="true" v-model="notiSetting")
                                        span.label-radio(style="font-size: 0.8rem") 허용
                                    label.radio-button(style="margin-left: 1rem;")
                                        input(type="radio" name="noti" value="false" v-model="notiSetting")
                                        span.label-radio(style="font-size: 0.8rem") 비허용

            .button-wrap
                button.btn.bg-gray.btn-cancel(type="button" @click="router.push('/admin/list-newsletter')") {{ isMyRecord ? '취소' : '이전' }}
                template(v-if="isMyRecord")
                    button.btn(type="submit") {{ isEditMode ? '수정' : '등록' }}

//- Modal - 공개 범위 선택
#modal.modal.select-dvs(v-if="isModalOpen" @click="closeModal")
    .modal-cont(@click.stop)
        .modal-header
            h2.title 공개 범위 선택
            button.btn-close(type="button" @click="closeModal")
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
        .modal-body
            .select-dvs-wrap
                .organigram-wrap
                    //- Organigram(:selectedEmployees="selectedEmps" :excludeCurrentUser="true" :useCheckbox="true" :selectedAuditors="selectedEmpsArr" :onlyDvsName="true" @selection-change="handleOrganigramSelection")
                    Organigram(:useCheckbox="true" :onlyDivision="true" :selectedDivisions="selectedDivisions" @selection-change="handleOrganigramSelection")

                br

                .table-wrap
                    .tb-overflow(v-if="Object.keys(selectedDivisions).length > 0")
                        table.table#tb-selectEmps
                            colgroup
                                col(style="width: 8%")
                                col(style="width: 8%")
                                col

                            thead
                                tr
                                    th 
                                    th NO
                                    th 부서
                                    
                            tbody
                                tr(v-for="(division, index) in Object.values(selectedDivisions)" :key="division")
                                    td(style="padding: 0")
                                        button.btn-remove(@click="removeDvs(division)")
                                            .icon
                                                svg
                                                    use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")
                                    td {{ index + 1 }}
                                    td {{ divisionNameList[division] }}

                    span.empty(v-else) 선택된 결재자가 없습니다.
        .modal-footer
            button.btn.bg-gray.btn-cancel(type="button" @click="closeModal") 취소
            button.btn.btn-save(type="submit" @click="saveAuditor") 저장
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { skapi } from '@/main.ts';
import { user } from '@/user.ts';
import { divisionNameList } from '@/division.ts';
import { organigram } from '@/components/organigram';

import Organigram from '@/components/organigram.vue';

const router = useRouter();
const route = useRoute();

// 수정 모드 확인: URL에 record_id가 있으면 수정 모드
const isEditMode = computed(() => !!route.query.record_id);
const recordId = ref(route.query.record_id || null);
const isMyRecord = ref(false); // 내가 저장한 카테고리인지 여부

const disabled = ref(false);
const isDesktop = ref(window.innerWidth > 768); // 반응형
const isModalOpen = ref(false); // 공개범위 설정 모달
const accessDivisions = ref({}); // 권한을 가지고 있는 부서
const accessEmps = ref([]); // 권한을 가지고 있는 user_id
const selectedDivisions = ref([]); // 업데이트 할 선택된 부서
const selectedEmps = ref([]); // 업데이트 할 user_id 저장
const notiSetting = ref(true); // 알림 설정 관련 체크박스
const backupSelected = ref(null); // 선택된 공개범위 직원 백업
const checkedUsers = ref([]); // 체크된 직원

const newsCatName = ref(''); // 게시글 제목

// 수정 모드일 경우 데이터 가져오기
const getEditModeCat = async () => {
    if (!recordId.value) return;

    try {
        const res = await skapi.getRecords({
            table: {
                name: 'news_category',
                access_group: 1
            },
            record_id: recordId.value
        });

        if (res.list && res.list.length > 0) {
            const categoryData = res.list[0];
            console.log('카테고리 데이터: ', categoryData);

            // 데이터 설정
            newsCatName.value = categoryData.data.news_category || '';
            accessDivisions.value = categoryData.data.access_division || {};
            notiSetting.value = String(categoryData.data.notiSetting);
            isMyRecord.value = categoryData.user_id === user.user_id || false;

            const selectedUserIds = Object.values(accessDivisions.value)
                .flat()
                .map((user) => user.user_id)
                .filter(Boolean); // 빈 값 제거

            // 중복 제거 (필요하다면)
            const uniqueUserIds = [...new Set(selectedUserIds)];
            accessEmps.value = uniqueUserIds;

            // 직원 선택 데이터 구성
            if (Object.keys(accessDivisions.value).length > 0) {
                Object.keys(accessDivisions.value).forEach((division) => {
                    if (!selectedDivisions.value.includes(division)) {
                        selectedDivisions.value.push(division);
                    }
                });
            }
        }
    } catch (error) {
        console.error('카테고리 데이터 로드 중 오류 발생:', error);
        alert('카테고리 데이터를 가져오는 중 오류가 발생했습니다.');
    }
};

// 공개범위 모달 열기
const openModal = () => {
    backupSelected.value = {
        employees: [...accessEmps.value],
        divisions: JSON.parse(JSON.stringify(Object.keys(accessDivisions.value)))
    };

    isModalOpen.value = true;
};

// 공개범위 모달 닫기
const closeModal = () => {
    if (backupSelected.value) {
        selectedEmps.value = [...backupSelected.value.employees];
        selectedDivisions.value = JSON.parse(JSON.stringify(backupSelected.value.divisions));
    } else {
        selectedEmps.value = [];
        selectedDivisions.value = {};
    }

    backupSelected.value = null;
    isModalOpen.value = false;
};

// 공개범위 모달에서 조직도 선택시
const handleOrganigramSelection = (users) => {
    if (!users || users.length === 0) {
        selectedDivisions.value = [];
        return;
    }

    const newDivisions = [...new Set(users.map((user) => user.division))];
    const newUserIds = [...new Set(users.map((user) => user.user.user_id))];

    selectedDivisions.value = newDivisions;
    selectedEmps.value = newUserIds;
};

// 공개범위 모달에서 선택된 부서 저장
const saveAuditor = () => {
    backupSelected.value = null;
    isModalOpen.value = false;

    console.log('권한 가진 부서 :', accessDivisions.value);
    console.log('권한 업데이트 부서 :', selectedDivisions.value);
    console.log('권한 가진 직원 : ', accessEmps.value);
    console.log('권한 업데이트 직원 : ', selectedEmps.value);
};

const undoChecked = (divisionName) => {
    // 재귀적으로 부서 찾기
    const findUncheckDepartment = (departments) => {
        for (const dept of departments) {
            // 현재 부서가 찾는 부서인지 확인
            if (dept.division === divisionName) {
                // 부서 체크박스 해제
                dept.isChecked = false;

                // 부서 멤버들도 체크 해제
                if (dept.members && dept.members.length > 0) {
                    dept.members.forEach((member) => {
                        member.isChecked = false;

                        // checkedUsers에서도 제거
                        const index = checkedUsers.value.findIndex(
                            (user) => user.user?.user_id === member.user?.user_id
                        );
                        if (index !== -1) {
                            checkedUsers.value.splice(index, 1);
                            console.log('checkedUsers.value : ', checkedUsers.value);
                        }
                    });
                }

                return true; // 찾았으면 종료
            }

            // 하위 부서에서 찾기
            if (dept.subDepartments && dept.subDepartments.length > 0) {
                if (findUncheckDepartment(dept.subDepartments)) {
                    return true;
                }
            }
        }

        return false; // 못 찾았으면 계속 진행
    };

    // 최상위 부서부터 검색 시작
    findUncheckDepartment(organigram.value);
};

// 공개범위 모달에서 선택된 부서 삭제
const removeDvs = (divisionName) => {
    if (accessDivisions.value[divisionName]) {
        // 조직도에서 해당 부서 찾아 체크 해제하는 함수 호출
        undoChecked(divisionName);

        delete accessDivisions.value[divisionName];
        accessDivisions.value = JSON.parse(JSON.stringify(accessDivisions.value));
        console.log('accessDivisions.value : ', accessDivisions.value);
    }
};

// 게시글 공개범위에게 권한을 부여하는 함수
const grantNewsUserAccess = async ({ news_id, newsUser_id }) => {
    return skapi.grantPrivateRecordAccess({
        record_id: news_id,
        user_id: newsUser_id
    });
};

// 게시글 카테고리 등록/수정
const registerNewsCat = async () => {
    if (!newsCatName.value) {
        alert('제목을 입력해주세요.');
        return;
    }

    if (!accessDivisions.value || accessDivisions.value.length === 0) {
        alert('공개범위를 설정해주세요.');
        return;
    }

    const accessUserId = selectedEmps.value.filter((userId) => !accessEmps.value.includes(userId));

    if (accessUserId.length === 0) {
        alert('권한 부여 대상 사용자가 없습니다.');
        router.push('/admin/list-newsletter');
        return;
    }

    try {
        const data = {
            news_category: newsCatName.value,
            access_division: JSON.parse(JSON.stringify(accessDivisions.value)),
            notiSetting: notiSetting.value
        };

        let res;

        if (isEditMode.value) {
            // 수정 모드
            res = await skapi.postRecord(data, { record_id: recordId.value });
            console.log('게시글 카테고리 수정 결과: ', res);
        } else {
            // 등록 모드
            const config = {
                table: {
                    name: 'news_category',
                    access_group: 1
                },
                index: {
                    name: 'news_category',
                    value: newsCatName.value
                }
            };
            res = await skapi.postRecord(data, config);
            console.log('게시글 카테고리 등록 결과: ', res);
        }

        console.log('selectedEmps.value : ', selectedEmps.value);

        // 카테고리 공개범위에게 권한 부여
        const categoryId = res.record_id;
        console.log('categoryId : ', categoryId);

        await Promise.all(
            accessUserId.map((userId) =>
                grantNewsUserAccess({ news_id: categoryId, newsUser_id: userId })
            )
        ).then((promise) => {
            console.log('Promise.all == promise : ', promise);
            console.log(`${promise.length}명의 사용자에게 권한이 부여되었습니다.`);
        });

        alert(`게시글 카테고리가 ${isEditMode.value ? '수정' : '추가'}되었습니다.`);
    } catch (err) {
        console.error('게시글 카테고리가 추가 중 오류 발생: ', err);
        alert('게시글 카테고리가 추가 중 오류가 발생했습니다.');
    } finally {
        router.push('/admin/list-newsletter');
    }
};

const updateScreenSize = () => {
    isDesktop.value = window.innerWidth > 768;
};

onMounted(async () => {
    window.addEventListener('resize', updateScreenSize);

    // 수정 모드일 경우 데이터 로드
    if (isEditMode.value) {
        await getEditModeCat();
    }
});

onUnmounted(() => {
    window.removeEventListener('resize', updateScreenSize);
});
</script>

<style scoped lang="less">
.inner {
    max-width: 1600px;
    margin: 0 auto;
}

.form-wrap {
    position: relative;
    max-width: 992px;

    .title {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: baseline;
        gap: 4px;
        flex-wrap: wrap;
        margin-bottom: 2rem;

        h2 {
            font-size: 2rem;
        }

        .icon {
            padding: 0;
            cursor: pointer;
        }
    }
}

.table {
    tr {
        td {
            padding: 0.75rem;
        }
    }

    tbody {
        th {
            position: relative;

            .add-btn {
                position: absolute;
                left: 50%;
                top: -12px;
                background-color: #fff;
                border: 1px solid var(--primary-color-300);
                border-radius: 50%;
                transform: translateX(-50%);
                z-index: 10;
                cursor: pointer;

                .icon {
                    padding: 0;

                    svg {
                        width: 18px;
                        height: 18px;
                        fill: var(--primary-color-400);
                    }
                }

                &:hover {
                    background-color: var(--primary-color-50);
                }
            }
        }

        tr {
            &:hover {
                background-color: transparent;
            }

            &:first-of-type {
                border-top: 1px solid var(--gray-color-300);
            }
        }

        td {
            .btn-sort {
                display: flex;
                align-items: center;
                flex-wrap: nowrap;
                gap: 4px;

                .icon {
                    padding: 0;
                    border: 1px solid var(--gray-color-400);
                    border-radius: 6px;
                    width: 20px;
                    height: 20px;

                    svg {
                        width: 20px;
                        height: 20px;
                    }
                }

                button {
                    &:disabled {
                        opacity: 0.3;
                        cursor: default;
                    }
                }
            }
        }
    }
}

.input-wrap {
    margin-top: 1rem;

    &:first-of-type {
        margin-top: 0;
    }

    input[readonly] {
        &:hover {
            cursor: default;
            border-color: var(--gray-color-200);
        }
    }

    &.upload-file {
        .btn-upload-file {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.5rem;

            .btn {
                height: 28px;
                min-width: auto;
            }

            input,
            label,
            button {
                margin: 0;
            }
        }

        .file-wrap {
            margin-top: 0;
        }

        .file-item {
            &.disabled {
                background-color: var(--gray-color-50);
            }

            &.remove {
                background-color: var(--warning-color-50);
                border: 1px dashed var(--warning-color-400);
                color: var(--warning-color-500);
            }
        }
    }
}

.row-wrap {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .input-wrap {
        flex: 1;
    }

    .btn-remove {
        flex: none;
        width: 2rem;
        height: 2rem;
        cursor: pointer;

        .icon {
            padding: 0;
            height: 100%;
            display: flex;
            align-items: center;

            svg {
                width: 1rem;
                height: 1rem;
                fill: var(--warning-color-500);
                margin: 0 auto;
            }
        }
    }
}

.button-wrap {
    margin-top: 3rem;
}

.btn {
    margin-top: 1rem;
}

.dvs-wrap {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    text-align: center;

    .dvs-list {
        display: flex;
        justify-content: center;
        background-color: var(--gray-color-50);
        border: 1px solid var(--gray-color-300);
        border-radius: 8px;
    }

    .dvs-name {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        padding: 0.25rem;
        gap: 2px;

        .icon {
            padding: 0;

            &:hover {
                cursor: pointer;
            }
        }
    }

    .add-dvs {
        display: flex;
        align-items: center;
        cursor: pointer;
    }

    .icon {
        svg {
            width: 18px;
            height: 18px;
            fill: var(--gray-color-400);
        }
    }
}

.select-dvs {
    .modal-body {
        overflow: auto;
    }

    .modal-footer {
        padding-top: 0;
        border-top: none;

        .btn {
            margin-top: 0;
        }
    }
}

.select-dvs-wrap {
    > div {
        border: 1px solid var(--gray-color-300);
        border-radius: 0.5rem;
        padding: 1rem;
        overflow-y: auto;
    }

    .btn-remove {
        .icon {
            padding: 0;

            svg {
                width: 16px;
                height: 16px;
                fill: var(--warning-color-500);
            }
        }
    }
}

.empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    font-size: 0.875rem;
    line-height: 1.3;
    color: var(--gray-color-400);
}

.btn {
    margin-top: 0;
}

#tb-selectedDvs {
    tr {
        td {
            padding: 0.25rem;
        }
    }
}

.upload-file {
    .upload-file-list {
        margin-top: 0;

        .only-text {
            margin-left: 0;
            width: 100%;
            border: 1px dashed var(--gray-color-300);
            border-radius: 8px;
            padding: 9px 12px;
            font-size: 0.75rem;
            color: var(--gray-color-400);
            text-align: left;
        }
    }

    .file-name {
        text-align: left;
        display: inline-block;

        &:first-of-type {
            margin-top: 16px;
        }
    }

    .file-item {
        .file-name {
            margin-top: 0;
        }

        &:first-of-type {
            margin-top: 16px;
        }
    }

    .btn-remove {
        width: initial;
        height: initial;
        border: none;
    }

    .icon {
        padding: 0;

        svg {
            fill: var(--warning-color-500);
        }
    }
}

.wysiwyg-wrap {
    text-align: left;
    border: 1px solid var(--gray-color-200);
    border-radius: 0.5rem;
    overflow: hidden;
}

.input-title {
    input {
        border: none;
        border-bottom: 1px solid var(--gray-color-200);
        border-radius: 0;
        font-size: 1.75rem;
        font-weight: 700;
        line-height: 1.3;
        text-align: center;

        &::placeholder {
            font-size: 1.75rem;
        }
    }
}

.audit-title {
    text-align: left;
}

.select-dvs {
    .table {
        // min-width: 27rem;
    }
}

.item-wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;

    &:last-child {
        margin-bottom: 0;
    }

    .selected-wrap {
        flex: 1;
    }
}

.label-wrap {
    border: 1px solid var(--gray-color-200);
    padding: 0.6rem 0.8rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.desc {
    font-size: 1rem;
    color: var(--warning-color-500);
    line-height: 1.2;
    word-break: keep-all;

    &.essential {
        &::after {
            content: '*';
            display: inline-block;
            width: 0.5rem;
            height: 0.5rem;
            font-size: 1rem;
            font-weight: 700;
            color: #fb9804;
            margin-left: 0.25rem;
        }
    }
}

.reject-setting {
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;

    .checkbox {
        text-align: right;

        input[type='checkbox']:checked ~ .label-checkbox::before {
            border-color: var(--warning-color-500);
            background-color: var(--warning-color-500);
        }

        .label-checkbox {
            display: inline-block;
            line-height: 1.4;
            color: var(--warning-color-500);
            word-break: keep-all;

            &::before {
                position: relative;
                top: 3px;
                width: 0.9rem;
                height: 0.9rem;
                border: 1px solid var(--warning-color-500);
            }
        }
    }
}

.wysiwyg-table {
    tr,
    th,
    td {
        height: auto;
    }
}

@media (max-width: 768px) {
    .dvs-wrap {
        grid-template-columns: repeat(5, 1fr);
    }

    .table {
        tbody {
            th {
                text-align: left;
            }
        }
    }

    .input-title {
        input {
            font-size: 1.5rem;

            &::placeholder {
                font-size: 1.5rem;
            }
        }
    }

    .top-wrap {
        margin-bottom: 2rem;

        .btn-new {
            margin-left: auto;
        }
    }

    .reject-setting {
        .checkbox {
            .label-checkbox {
                font-size: 0.875rem;

                &::before {
                    width: 0.875rem;
                    height: 0.875rem;
                    top: 2px;
                }
            }
        }
    }

    .item-wrap {
        display: block;
        margin-bottom: 1rem;

        .selected-wrap {
            margin-bottom: 1rem;
        }
    }

    .modal {
        .modal-cont {
            min-width: calc(100% - 16px);
        }
    }
}

@media (max-width: 682px) {
    .input-wrap {
        &.upload-file {
            .btn-upload-file {
                input,
                label,
                button {
                    flex-grow: 1;
                }
            }

            .btn-upload-file + .file-list {
                .file-item {
                    width: 100%;
                }
            }

            .file-item {
                width: 100%;
            }
        }
    }
}
</style>
