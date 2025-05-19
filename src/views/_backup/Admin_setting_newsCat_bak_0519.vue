<template lang="pug">
//- .title
	h1 게시글 카테고리명 셋팅

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

							tr(v-if="Object.keys(selectedDivision).length === 0" style="height: 100px;")
								th.essential 공개범위
								td.left(colspan="3")
									span.empty(@click="openModal" style="cursor: pointer;") 이곳을 눌러 공개범위를 설정해주세요.

							tr.selected-dvs(v-if="Object.keys(selectedDivision).length > 0")
								th.essential 공개 범위
								td.left(colspan="3")
									ul.dvs-wrap
										li.dvs-list(v-for="(division, index) in Object.keys(selectedDivision)" :key="division")
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
				button.btn.bg-gray.btn-cancel(type="button" @click="router.push('/admin/list-newsletter')") 취소
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
					Organigram(:selectedEmployees="selectedEmps" :excludeCurrentUser="true" :useCheckbox="true" :selectedAuditors="selectedEmpsArr" :onlyDvsName="true" @selection-change="handleOrganigramSelection")

				br

				.table-wrap
					.tb-overflow(v-if="Object.keys(selectedDivision).length > 0")
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
								tr(v-for="(division, index) in Object.keys(selectedDivision)" :key="division")
									td
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
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { skapi, mainPageLoading, RealtimeCallback } from '@/main.ts';
import { divisionNameList } from '@/division.ts';

import Organigram from '@/components/organigram.vue';

const router = useRouter();
const route = useRoute();

// 수정 모드 확인: URL에 record_id가 있으면 수정 모드
const isEditMode = computed(() => !!route.query.record_id);
const recordId = ref(route.query.record_id || null);

const disabled = ref(false);
const isDesktop = ref(window.innerWidth > 768); // 반응형
const isModalOpen = ref(false); // 공개범위 설정 모달
const selectedDivision = ref({}); // 조직도에서 선택된 부서
const selectedUsers = ref([]); // 조직도에서 선택된 부서의 직원
const selectedEmps = ref([]); // 공개범위 직원 정보 저장
const selectedEmpsArr = ref([]); // 공개범위 직원 정보 저장
const notiSetting = ref(true); // 알림 설정 관련 체크박스
const backupSelected = ref(null); // 선택된 공개범위 직원 백업

const uploadedFile = ref([]); // 첨부파일
const fileNames = ref([]);

const newsCatName = ref(''); // 게시글 제목

const adminId = ref([]);

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
    console.log('== getEditModeCat == res : ', res);

    if (res.list && res.list.length > 0) {
      const categoryData = res.list[0];

      // 데이터 설정
      newsCatName.value = categoryData.data.news_category || '';
      selectedDivision.value = categoryData.data.access_division || {};
      notiSetting.value = String(categoryData.data.notiSetting);

      // 직원 선택 데이터 구성
      if (Object.keys(selectedDivision.value).length > 0) {
        Object.keys(selectedDivision.value).forEach((division) => {
          const departmentUsers = selectedDivision.value[division];
          departmentUsers.forEach((user) => {
            let parseUser = JSON.parse(JSON.stringify(user));
            let pushUser = {
              data: {
                user_id: parseUser.user_id
              },
              index: {
                name: user.dvs.split('.')[0] + '.' + parseUser.position,
                value: parseUser.name
              },
              dvs: `${parseUser.dvs.split('.')[0]}.${divisionNameList[division]}`,
              position: parseUser.position,
              name: parseUser.name
            };
            selectedEmps.value.push(pushUser);
          });
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
  // 열렸을 때 selectedEmps 전체를 original로 백업
  backupSelected.value = [...selectedEmps.value];
  selectedEmpsArr.value = selectedEmps.value.map((user) => {
    return [user];
  });

  isModalOpen.value = true;
};

// 공개범위 모달 닫기
const closeModal = () => {
  if (backupSelected.value) {
    console.log('backupSelected.value : ', backupSelected.value);
    selectedEmps.value = [...backupSelected.value];
  } else {
    selectedEmps.value = [];
  }

  selectedDivision.value = {};
  selectedUsers.value = [];

  // backupSelected.value = null;
  isModalOpen.value = false;
};

// 공개범위 모달에서 조직도 선택시
const handleOrganigramSelection = (users) => {
  users.forEach((user) => {
    const division = user.index.name.split('.')[0];
    const newUserInfo = {
      user_id: user.data.user_id,
      dvs: `${user.index.name.split('.')[0]}.${divisionNameList.value[division]}`,
      position: user.index.name.split('.')[1],
      name: user.index.value
    };
    const emp = JSON.parse(JSON.stringify(newUserInfo));

    if (!selectedDivision.value[division]) {
      selectedDivision.value[division] = [];
    }

    // 중복 체크 (동일한 부서가 이미 있는지 확인)
    const isDuplicate = selectedDivision.value[division].some((u) => u.user_id === emp.user_id);

    if (!isDuplicate) {
      selectedDivision.value[division].push(emp);
    }
  });

  console.log('조직도선택 == selectedDivision.value : ', selectedDivision.value);
};

// 공개범위 모달에서 선택된 부서 저장
const saveAuditor = () => {
  // 선택된 모든 부서의 사용자 추가
  if (Object.keys(selectedDivision.value).length > 0) {
    Object.keys(selectedDivision.value).forEach((division) => {
      const departmentUsers = selectedDivision.value[division];

      departmentUsers.forEach((user) => {
        // 이미 추가된 사용자인지 확인
        const isDuplicate = selectedEmps.value.some(
          (existingUser) => existingUser.user_id === user.user_id
        );

        if (!isDuplicate) {
          const userCopy = JSON.parse(JSON.stringify(user));
          selectedEmps.value.push(userCopy);
        }
      });
    });
  }

  backupSelected.value = null;
  isModalOpen.value = false;
  console.log('저장 부서 :', selectedDivision.value);
  console.log('저장 직원 : ', selectedEmps.value);
};

// 공개범위 모달에서 선택된 부서 삭제
const removeDvs = (divisionName) => {
  if (selectedDivision.value[divisionName]) {
    // 해당 부서의 모든 사용자 체크 해제
    // selectedUsers.value = selectedUsers.value.filter(
    //   (user) => user.index.name.split('.')[0] !== divisionName
    // );

    delete selectedDivision.value[divisionName];
    selectedDivision.value = JSON.parse(JSON.stringify(selectedDivision.value));
    console.log('삭제 == selectedDivision :', selectedDivision.value);
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

  if (!selectedDivision.value || selectedDivision.value.length === 0) {
    alert('공개범위를 설정해주세요.');
    return;
  }

  try {
    const data = {
      news_category: newsCatName.value,
      access_division: JSON.parse(JSON.stringify(selectedDivision.value)),
      notiSetting: notiSetting.value
    };

    if (isEditMode.value) {
      // 수정 모드
      const res = await skapi.postRecord(data, { record_id: recordId.value });
      console.log('수정 == res : ', res);
      alert('게시글 카테고리가 수정되었습니다.');
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

      const res = await skapi.postRecord(data, config);
      console.log('== registerNewsCat == res : ', res);

      // 카테고리 공개범위에게 권한 부여
      const categoryId = res.record_id;
      const accessUserId = selectedEmps.value.map((user) => user.user_id);

      await Promise.all(
        accessUserId.map((userId) =>
          grantNewsUserAccess({ news_id: categoryId, newsUser_id: userId })
        )
      );

      alert('게시글 카테고리가 추가되었습니다.');
    }
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
  // max-width: 960px;
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
  // min-width: 20rem;

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
    min-width: 27rem;
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
