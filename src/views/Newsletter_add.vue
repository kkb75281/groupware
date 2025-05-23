<template lang="pug">
//- .title
	h1 게시글 작성

//- hr

.inner
	.form-wrap
		form#_write_news_form(@submit.prevent="registerNews")
			.table-wrap
				.tb-overflow
					table.table#tb-write-newsForm
						colgroup
							col(style="width: 13%")
							col
							col(style="width: 15%")
							col(style="width: 20%")

						tbody
							//- 작성일자 작성자 :: s
							tr.pc(v-if="isDesktop")
								th 작성 일자
								td
									.input-wrap
										input#inp_date(type="date" name="inp_date" v-model="dateValue")
								th 작성자
								td
									span.writer {{ user.name }}

							//- 모바일 경우 레이아웃
							tr.mo(v-if="!isDesktop")
								th 작성 일자
								td.left(style="width: 100%")
									.input-wrap
										input#inp_date(type="date" name="inp_date" v-model="dateValue")

							tr.mo(v-if="!isDesktop")
								th 작성자
								td.left
									span.writer {{ user.name }}
							//- 작성일자 작성자 :: e

							tr
								th.essential 카테고리
								td.left(colspan="3")
									.input-wrap
											select#newsCat(v-model="selCate" name="category" required :disabled="isEditMode || (user.access_group < 99 && isCateMode)")
												option(value="" disabled hidden) 카테고리를 선택해주세요.
												option(v-for="(category, index) in newsCateList" :key="category.record_id" :value="category.record_id") {{ category.data.news_category }}

							tr
								th.essential 제목
								td(colspan="3")
									.input-wrap
										template(v-if="!isEditMode")
											input#news_title(type="text" v-model="newsTitle" name="news_title" placeholder="제목을 입력해주세요." required)
										template(v-else-if="isEditMode && editModeData.data")
											input#news_title(type="text" v-model="editModeData.data.news_title" name="news_title" placeholder="제목을 입력해주세요." required)


							tr(v-if="Object.keys(selectedDivision).length === 0" style="height: 100px;")
								th 공개 범위
								td.left(colspan="3")
									span.empty 카테고리를 선택하면 공개 범위가 자동으로 설정됩니다.

							tr.selected-dvs(v-if="Object.keys(selectedDivision).length > 0")
								th 공개 범위
								td.left(colspan="3")
									ul.dvs-wrap
										li.dvs-list(v-for="(division, index) in Object.keys(selectedDivision)" :key="division")
											span.dvs-name {{ divisionNameList[division] }}

							tr
								th 알림 설정
								td.left(colspan="3")
									label.radio-button
										input(type="radio" name="noti" value="true" v-model="notiSetting")
										span.label-radio(style="font-size: 0.8rem") 허용
									label.radio-button(style="margin-left: 1rem;")
										input(type="radio" name="noti" value="false" v-model="notiSetting")
										span.label-radio(style="font-size: 0.8rem") 비허용

							tr
								th.essential 내용
								td(colspan="3")
									.wysiwyg-wrap(style="cursor: text;")
										Wysiwyg(ref="myWysiwyg" @editor-ready="handleEditorReady" @update:content="exportWysiwygData" :savedContent="route.query.mode === 'edit' ? editModeData?.data?.to_news_content : selectedForm?.data?.form_content" :showBtn="true")
										textarea#inp_content(type="text" placeholder="결재 내용" name="inp_content" v-model="editorContent" hidden)

							tr
								th 첨부 파일
								td(colspan="3")
									.input-wrap.upload-file
										.file-wrap
											.btn-upload-file
												input#file(type="file" name="additional_data" multiple :disabled="verifiedEmail || disabled" @change="updateFileList" hidden)
												label.btn.sm.outline.btn-upload(for="file") 파일 올리기

											ul.upload-file-list
												template(v-if="(uploadedFile.length > 0) || uploadedFile.length > 0")
													li.file-item(v-for="(file, index) in uploadedFile" :key="index" style="border: none; padding: 0;")
														a.file-name(v-if="file.url" :href="file.url" download target="_blank") {{ file.filename }}
														span.only-text(v-else) {{ file.name || file.filename }}
														button.btn-remove.icon(type="button" @click.stop="removeFile(file, index)")
															svg
																use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")
												template(v-else)
													li.file-name(v-for="(name, index) in fileNames" :key="index")
														span.only-text {{ name }}
														button.btn-remove.icon(type="button" @click.stop="removeFile(file, index)")
															svg
																use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")

			.button-wrap
				button.btn.bg-gray.btn-cancel(type="button" @click="router.back()") 취소
				button.btn(type="submit") {{ isEditMode ? '수정' : '등록' }}
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { skapi, mainPageLoading, RealtimeCallback } from '@/main.ts';
import { user, makeSafe, verifiedEmail } from '@/user.ts';
import { divisionNameList } from '@/division.ts';

import Organigram from '@/components/organigram.vue';
import Wysiwyg from '@/components/wysiwyg.vue';

// 게시글 수정시 첨부파일 변경 안됨

const router = useRouter();
const route = useRoute();

const isEditMode = computed(() => route.query.mode === 'edit'); // 게시글 수정 모드
const isCateMode = computed(() => route.query.mode === 'category'); // 카테고리 모드

const isDesktop = ref(window.innerWidth > 768); // 반응형
const selectedDivision = ref({}); // 조직도에서 선택된 부서
const selectedUsers = ref([]); // 조직도에서 선택된 부서의 직원
const selectedMembers = ref([]); // 공개범위 직원 정보 저장
const selectedForm = ref([]); // 선택된 결재 양식
const notiSetting = ref(true); // 알림 설정 관련 체크박스
let send_auditors_arr = [];

const uploadedFile = ref([]); // 첨부파일
const fileNames = ref([]);

const newsTitle = ref(''); // 게시글 제목
const disabled = ref(false);

const newsCateList = ref([]); // 카테고리 리스트
const selCate = ref(''); // 선택된 카테고리
const editModeData = ref({}); // 수정 모드 데이터

let selCateId = ''; // 선택된 카테고리 ID
const removeFiles = []; // 삭제할 파일 리스트

// 에디터 상태 관리
const editor = ref(null);
const editorContent = ref('');
const editorIsReady = ref(false);
const myWysiwyg = ref(null);

watch(selCate, (n) => {
  if (n) {
    const selCate = newsCateList.value.find((cat) => cat.record_id === n);

    if (selCate) {
      selectedDivision.value = selCate.data.access_division;

      // 알림설정 체크박스 상태 가져오기
      if (selCate.data.notiSetting) {
        notiSetting.value = selCate.data.notiSetting;
      } else {
        notiSetting.value = true;
      }

      selCateId = n;
    } else {
      selectedDivision.value = {};
    }
  }
});

// 카테고리 리스트 가져오기
const getNewsCateList = async () => {
  const res = await skapi.getRecords({
    table: {
      name: 'news_category',
      access_group: 1
    }
  });

  if (res.list.length > 0) {
    newsCateList.value = res.list;
  } else {
    newsCateList.value = [];
  }
};

// 에디터 내용 변경 감지
watch(editorContent, (newContent) => {
  if (!newContent || newContent === '') {
    // 내용이 완전히 비어있는 경우 기본 p 태그 추가
    const editorElement = document.getElementById('myeditor');
    if (editorElement && (!editorElement.innerHTML || editorElement.innerHTML === '')) {
      editorElement.innerHTML = '<p><br></p>';
    }
  }
});

// 에디터 준비 후 테이블 편집 기능 활성화
const handleEditorReady = (status) => {
  editorIsReady.value = status;

  // 에디터가 준비되었을 때
  if (status) {
    setTimeout(() => {
      const editorElement = document.getElementById('myeditor');
      if (editorElement) {
        // 수정 모드인 경우 내용 직접 설정
        if (isEditMode.value && editModeData.value?.data?.to_news_content) {
          // 기존 내용 직접 설정
          editorElement.innerHTML = editModeData.value.data.to_news_content;
          editorContent.value = editModeData.value.data.to_news_content;
        }
        activateTableEditing(editorElement);
      }
    }, 500);
  }
};

// 테이블 편집 기능 활성화 함수
const activateTableEditing = (editorElement) => {
  const tableWraps = editorElement.querySelectorAll('.wysiwyg-table-wrap');

  // 테이블 각각에 대해 편집 기능 활성화
  tableWraps.forEach((wrap) => {
    let state = {
      tableWrap: wrap,
      table: wrap.querySelector('table'),
      tbody: wrap.querySelector('tbody'),
      mergeBtn: wrap.querySelector('.btn-merge'),
      unmergeBtn: wrap.querySelector('.btn-unmerge'),
      isResizing: false,
      isDragging: false,
      isSelection: false,
      isMouseDown: false,
      selectionStart: null,
      outlinePosition: {
        top: 0,
        left: 0,
        width: 0,
        height: 0
      }
    };
    addEventListeners(state);
  });

  function addEventListeners(state) {
    const rows = state.table.querySelectorAll('tr');

    for (let r = 0; r < rows.length; r++) {
      const cols = rows[r].querySelectorAll('td');

      for (let c = 0; c < cols.length; c++) {
        const cell = cols[c];

        addResizer(state, cell);
        bindCellEvents(state, cell);
      }
    }

    initButtons(state);

    document.addEventListener('mouseup', () => {
      const mergeBtn = state.tableWrap.querySelector('.btn-merge');
      state.mergeBtn.classList.remove('active');

      if (state.isDragging) {
        const selected = state.table.querySelectorAll('td.dragged-cell');
        if (selected.length >= 2) {
          mergeBtn.classList.add('active'); // 조건에 따라 활성화
        }
      }

      state.isMouseDown = false;
      state.isDragging = false;
      state.isSelection = false;

      tableSelection(state);
    });

    document.addEventListener('click', (e) => {
      if (state.table && !state.table.contains(e.target)) {
        if (e.target.closest('.btn-custom')) {
          return;
        }
        state.isSelection = false;
        clearSelection(state.table);
        tableSelection(state);
      }
    });
  }
};

// 에디터 내보내기
const exportWysiwygData = (content) => {
  console.log('exportWysiwygData', content);
  editor.value = content;
  editorContent.value = content.html;
};

const importWysiwygData = async () => {
  await myWysiwyg.value.exportData();
};

// 첨부파일 삭제
const removeFile = (file, index) => {
  // 삭제 파일 removeFiles 변수에 저장
  removeFiles.push(file);

  uploadedFile.value.splice(index, 1);
  fileNames.value = uploadedFile.value.map((file) => file.name || file.filename);
};

// 파일 추가시 파일명 표시
let updateFileList = (e) => {
  const newFiles = Array.from(e.target.files);
  uploadedFile.value.push(...newFiles);
  fileNames.value = uploadedFile.value.map((file) => file.name || file.filename);
  e.target.value = ''; // input 초기화 (같은 파일 다시 업로드 가능하게)
};

// 게시글 레코드 생성
const postNewsRecord = async ({ news_title, to_news_content }) => {
  const accessUser = [];

  for (const key in selectedDivision.value) {
    const includeUser = selectedDivision.value[key];
    if (Array.isArray(includeUser)) {
      accessUser.push(...includeUser);
    }
  }

  // 다중부서 직원 중복제거
  const uniqueUsers = accessUser.filter(
    (user, index, self) => index === self.findIndex((u) => u.user_id === user.user_id)
  );
  selectedUsers.value = JSON.parse(JSON.stringify(uniqueUsers));

  try {
    const dvs = Object.keys(selectedDivision.value);
    const newsFormData = new FormData();

    const dvsWithName = dvs.map((key) => {
      const name = divisionNameList.value[key] || '-';
      return `${key}.${name}`;
    });

    newsFormData.append('news_title', news_title);
    newsFormData.append('selDvs', dvsWithName.join(','));
    newsFormData.append('members', JSON.stringify(uniqueUsers));
    newsFormData.append('to_news_content', to_news_content);
    newsFormData.append('noti_setting', notiSetting.value);

    if (uploadedFile.value.length) {
      const filePromises = uploadedFile.value.map(async (file) => {
        // 이미 File 객체인 경우 그대로 반환
        if (file instanceof File) {
          return file;
        }

        // URL이 있는 경우 (기존 파일) 파일을 가져와서 변환
        if (file.url) {
          try {
            const blob = await skapi.getFile(file.url, { dataType: 'blob' });
            return new File([blob], file.filename, { type: blob.type });
          } catch (error) {
            console.error('파일 가져오기 실패:', file.filename, error);
            return null;
          }
        }

        // URL도 없고 File 객체도 아닌 경우
        return null;
      });

      // 모든 파일 변환이 끝날 때까지 기다림
      const fileObjects = await Promise.all(filePromises);

      // null이 아닌 파일만 필터링하여 FormData에 추가
      fileObjects
        .filter((file) => file !== null)
        .forEach((file) => {
          newsFormData.append('form_data', file);
        });
    }

    const options = {
      table: {
        name: 'newsletter',
        access_group: 99
      },
      index: {
        name: 'news_title', // 게시글 제목. 제목별로 찾을때 위한 인덱싱
        value: news_title.replaceAll('.', '_')
      },
      reference: selCateId // 카테고리 ID를 레퍼런스
    };

    const res = await skapi.postRecord(newsFormData, options);

    return res;
  } catch (error) {
    console.error(error);
    if (error?.message?.includes('index.value should not have special characters')) {
      throw new Error('index.value should not have special characters');
    }
    throw error;
  }
};

// 게시글 등록하고 알림을 보내는 함수
const createAddNews = async (
  { news_id, newsUser_id, news_title },
  send_newsUser,
  isNotificationTarget = false
) => {
  if (!news_id || !newsUser_id) return;

  // 실시간 알림 보내기
  if (isNotificationTarget === true) {
    let news_title = document.getElementById('news_title').value;

    skapi
      .postRealtime(
        {
          add_news: {
            noti_id: news_id,
            noti_type: 'notice',
            send_date: new Date().getTime(),
            send_user: user.user_id,
            news_info: {
              news_title: news_title,
              news_id: news_id,
              news_refer: selCateId,
              news_noti_id: news_id,
              send_newsUser: send_newsUser
            }
          }
        },
        newsUser_id,
        {
          title: '[그룹웨어]',
          body: `${user.name}님께서 게시글을 올렸습니다.`
          // config: {
          //   always: true // 무조건 알림 받기
          // }
        }
      )
      .then((res) => {
        console.log('실시간 알림 == res : ', res);
        console.log('selCateId : ', selCateId);
      })
      .catch(async (err) => {
        console.error(err);
      });

    // 실시간 못 받을 경우 알림 기록 저장
    skapi
      .postRecord(
        {
          noti_id: news_id,
          noti_type: 'notice',
          send_date: new Date().getTime(),
          send_user: user.user_id,
          news_info: {
            news_title: news_title,
            news_id: news_id,
            news_refer: selCateId,
            news_noti_id: news_id,
            send_newsUser: send_newsUser
          }
        },
        {
          readonly: true,
          table: {
            name: `realtime:${newsUser_id.replaceAll('-', '_')}`,
            access_group: 'authorized'
          }
        }
      )
      .then((res) => {
        console.log('알림 기록 == res : ', res);
        console.log('selCateId : ', selCateId);
      });
  }

  return {
    news_id,
    newsUser_id,
    news_title,
    send_newsUser,
    isNotificationTarget
  };
};

// 결재 요청 Alarm
const postAuditDocRecordId = async (newsId, newsTitle, userId, isNotificationTarget = false) => {
  console.log('newsId : ', newsId);
  console.log('newsTitle : ', newsTitle);
  console.log('userId : ', userId);
  console.log('isNotificationTarget : ', isNotificationTarget);

  try {
    // 알림 전송
    const res = await createAddNews(
      {
        news_id: newsId,
        newsUser_id: userId,
        news_title: newsTitle
      },
      send_auditors_arr,
      isNotificationTarget
    );
    console.log('결재 요청 알림 전송 결과 : ', res);
    return res;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const removeButtonTags = (content) => {
  if (!content) return '';

  // 임시 DOM 요소 생성
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;

  // 버튼 요소들 선택
  const buttons = tempDiv.querySelectorAll('button');

  // 버튼 요소들 제거
  buttons.forEach((button) => {
    button.remove();
  });

  // 컨트롤 버튼 그룹 요소 제거 (btn-control-wrap 클래스를 가진 요소)
  const controlWraps = tempDiv.querySelectorAll('.btn-control-wrap');
  controlWraps.forEach((wrap) => {
    wrap.remove();
  });

  // 변경된 HTML 반환
  return tempDiv.innerHTML;
};

// 게시글 등록
const registerNews = async (e) => {
  e.preventDefault();

  // 에디터에서 내용 가져오기
  await importWysiwygData();

  // 카테고리 선택 안했을 경우 등록 불가
  if (!selCate.value) {
    alert('카테고리를 선택해주세요.');
    return;
  }

  // 제목이 없을 경우 등록 불가
  if (!newsTitle.value) {
    alert('제목을 입력해주세요.');
    return;
  }

  // 내용이 없을 경우 등록 불가
  if (!editorContent.value || editorContent.value === '<p><br></p>') {
    alert('내용을 입력해주세요.');
    return;
  }

  try {
    const formData = new FormData(e.target);
    formData.set('inp_content', removeButtonTags(editorContent.value)); // editorContent.value가 이미 현재 에디터 내용을 가지고 있음
    formData.append('noti_setting', notiSetting.value); // 알림 설정 관련 체크박스

    const formValues = Object.fromEntries(formData.entries());

    if (!formValues) return;

    const { news_title, inp_content: to_news_content } = formValues;

    mainPageLoading.value = true;

    if (isEditMode.value) {
      // 수정 모드인 경우
      const editNewsId = route.query.news;
      const selNews = newsCateList.value.find((cat) => cat.record_id === selCate.value);

      if (selNews) {
        selectedDivision.value = selNews.data.access_division;
      } else {
        selectedDivision.value = {};
      }

      // 선택된 부서에서 직원 정보 가져오기
      const accessUser = [];
      for (const key in selectedDivision.value) {
        const includeUser = selectedDivision.value[key];
        if (Array.isArray(includeUser)) {
          accessUser.push(...includeUser);
        }
      }

      // 중복 제거
      const uniqueUsers = accessUser.filter(
        (user, index, self) => index === self.findIndex((u) => u.user_id === user.user_id)
      );
      selectedUsers.value = JSON.parse(JSON.stringify(uniqueUsers));

      // FormData 활용
      const updateFormData = new FormData();

      // 기본 정보 추가
      updateFormData.append('news_title', news_title);
      updateFormData.append('to_news_content', to_news_content);
      updateFormData.append('noti_setting', notiSetting.value);
      updateFormData.append('isEdit', true);

      // 부서 정보 추가
      const dvsWithName = Object.keys(selectedDivision.value)
        .map((key) => {
          const name = divisionNameList.value[key] || '-';
          return `${key}.${name}`;
        })
        .join(',');
      updateFormData.append('selDvs', dvsWithName);

      // 직원 정보 추가
      updateFormData.append('members', JSON.stringify(selectedUsers.value));

      // 첨부파일 처리
      if (uploadedFile.value.length) {
        const filePromises = uploadedFile.value.map(async (file) => {
          if (file instanceof File) {
            return file;
          }

          if (file.url) {
            try {
              const blob = await skapi.getFile(file.url, { dataType: 'blob' });
              return new File([blob], file.filename, { type: blob.type });
            } catch (error) {
              console.error('파일 가져오기 실패:', file.filename, error);
              return null;
            }
          }
          return null;
        });

        const fileObjects = await Promise.all(filePromises);

        fileObjects
          .filter((file) => file !== null)
          .forEach((file) => {
            updateFormData.append('form_data', file);
          });
      }

      try {
        const config = {
          record_id: editNewsId,
          table: {
            name: 'newsletter',
            access_group: 99
          },
          index: {
            name: 'news_title',
            value: news_title.replaceAll('.', '_')
          },
          reference: selCateId
        };

        let updateRes;

        if (uploadedFile.value.length) {
          // 첨부파일 변경이 있을 경우
          config.remove_bin = removeFiles;
          updateRes = await skapi.postRecord(updateFormData, config);
        } else {
          updateRes = await skapi.postRecord(updateFormData, config);
        }

        if (editModeData.value.data?.noti_setting === 'false' && notiSetting.value === true) {
          const newsId = updateRes.record_id; // 게시글 ID
          const newsTitle = updateRes.data.news_title; // 게시글 제목

          const processRoles = [
            ...selectedUsers.value.map((user) => ({
              userId: user.user_id
            }))
          ];

          const res = await Promise.all(
            processRoles.map((roleInfo) =>
              postAuditDocRecordId(newsId, newsTitle, roleInfo.userId, notiSetting.value === 'true')
            )
          );

          selectedUsers.value = [];
          selectedMembers.value = [];
        }

        alert('게시글 수정이 완료되었습니다.');
      } catch (err) {
        console.error('게시글 수정 중 오류 발생:', err);
        alert('게시글 수정 중 오류가 발생했습니다.');
      } finally {
        router.push(`/newsletter?category=${selCate.value}`);
      }
    } else {
      // 등록 모드인 경우
      // 게시글 레코드 생성
      const newsDoc = await postNewsRecord({
        news_title,
        to_news_content,
        noti_setting: notiSetting.value // 알림 설정 관련 체크박스 값 전달
      });

      const newsId = newsDoc.record_id; // 게시글 ID
      const newsTitle = news_title; // 게시글 제목

      const processRoles = [
        ...selectedUsers.value.map((user) => ({
          userId: user.user_id
        }))
      ];

      // 공개범위에게 게시글 열람 권한 및 등록 레코드 생성
      const res = await Promise.all(
        processRoles.map((roleInfo) =>
          postAuditDocRecordId(newsId, newsTitle, roleInfo.userId, notiSetting.value === 'true')
        )
      );

      selectedUsers.value = [];
      selectedMembers.value = [];

      alert('게시글 등록이 완료되었습니다.');
      router.push(`/newsletter?category=${selCate.value}`);
    }
  } catch (error) {
    console.error('게시글 등록 중 오류 발생:', error);
    if (error?.message === 'index.value should not have special characters') {
      alert('제목은 특수문자 [ ] ^ _ ` : ; < = > ? @ 만 포함 가능합니다.');
    } else {
      alert('게시글 등록 중 오류가 발생했습니다.');
    }
  } finally {
    mainPageLoading.value = false;
  }
};

// 결재자 정보 변환 함수
const convertAuditorFormat = (members) => {
  return members.map((auditor) => ({
    data: { user_id: auditor.user_id },
    index: {
      value: auditor.name,
      name: `${auditor.division}.${auditor.position}`
    }
  }));
};

const dateValue = ref(new Date().toISOString().substring(0, 10));

const updateScreenSize = () => {
  isDesktop.value = window.innerWidth > 768;
};

onMounted(async () => {
  window.addEventListener('resize', updateScreenSize);

  await getNewsCateList();

  if (isEditMode.value && editModeData.value) {
    const editNewsId = route.query.news;

    if (editNewsId) {
      const categoryId = route.query.category;

      if (categoryId) {
        selCate.value = categoryId;
      }

      try {
        const record = await skapi.getRecords({
          table: {
            name: 'newsletter',
            access_group: 99
          },
          record_id: editNewsId
        });

        if (record) {
          editModeData.value = record.list[0];

          newsTitle.value = editModeData.value.data?.news_title || '';
          editorContent.value = editModeData.value.data?.to_news_content || '';
          notiSetting.value = editModeData.value.data?.noti_setting === 'false' ? false : true;

          if (editModeData.value.data?.selDvs) {
            const divisions = {};
            editModeData.value.data.selDvs.split(',').forEach((item) => {
              const [key] = item.split('.');
              divisions[key] = editModeData.value.data.members || [];
            });
            selectedDivision.value = divisions;
          }

          if (
            editModeData.value.bin &&
            editModeData.value.bin.form_data &&
            editModeData.value.bin.form_data.length
          ) {
            uploadedFile.value = editModeData.value.bin.form_data;
          }
        }
      } catch (error) {
        console.error('error : ', error);
        alert('게시글을 불러오는 중 오류가 발생했습니다.');
      }
    }
  }

  if (isCateMode.value) {
    selCate.value = route.query.category; // 카테고리 ID

    const selCateItem = newsCateList.value.find((cat) => cat.record_id === route.query.category);

    if (selCateItem) {
      selectedDivision.value = selCateItem.data.access_division;

      // 알림설정 체크박스 상태 가져오기
      if (selCateItem.data.notiSetting) {
        notiSetting.value = selCateItem.data.notiSetting;
      } else {
        notiSetting.value = true;
      }

      selCateId = route.query.category;
    } else {
      selectedDivision.value = {};
    }
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
  padding: 2rem;
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

  #newsCat {
    &:disabled {
      background-color: var(--gray-color-50);
      color: var(--gray-color-900);
      background-image: none;
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

  .icon {
    svg {
      width: 18px;
      height: 18px;
      fill: var(--gray-color-400);
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

  .inner {
    padding: 1rem;
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
