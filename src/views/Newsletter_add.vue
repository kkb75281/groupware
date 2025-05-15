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
								td
									.input-wrap
										input#inp_date(type="date" name="inp_date" v-model="dateValue")

							tr.mo(v-if="!isDesktop")
								th 작성자
								td
									span.writer {{ user.name }}
							//- 작성일자 작성자 :: e

							tr
								th.essential 카테고리
								td.left(colspan="3")
									.input-wrap
										select#newsCat(v-model="selCate" name="category" required :disabled="isEditMode")
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
										Wysiwyg(@editor-ready="handleEditorReady" @update:content="exportWysiwygData" :savedContent="route.query.mode === 'edit' ? editModeData?.data?.to_news_content : selectedForm?.data?.form_content" :showBtn="true")
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
				button.btn.bg-gray.btn-cancel(type="button" @click="router.push('/newsletter-category')") 취소
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

// 에디터 상태 관리
const editorContent = ref('');
const editorIsReady = ref(false);

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
          console.log('에디터에 내용 설정됨:', editorContent.value);
        }
        activateTableEditing(editorElement);
      }
    }, 500);
  }
};

// 테이블 편집 기능 활성화 함수
const activateTableEditing = (editorElement) => {
  // 테이블 찾기
  const tables = editorElement.querySelectorAll('table');

  tables.forEach((table) => {
    // 테이블 클래스 추가
    if (!table.classList.contains('wysiwyg-table')) {
      table.classList.add('wysiwyg-table');
    }

    // 테이블에 리사이즈 속성 추가
    table.setAttribute('data-resizable', 'true');

    // 테이블 내 모든 셀을 편집 가능하게 설정
    const cells = table.querySelectorAll('td');
    cells.forEach((cell) => {
      cell.contentEditable = 'true';
      cell.removeAttribute('disabled');

      // 포커스 이벤트 추가
      cell.addEventListener('focus', () => {
        cell.style.outline = '2px solid #4a90e2';
      });

      cell.addEventListener('blur', () => {
        cell.style.outline = 'none';
      });
    });

    // 테이블 컨테이너 확인 또는 생성
    let tableWrap = table.closest('.wysiwyg-table-wrap');
    if (!tableWrap) {
      // 테이블을 컨테이너로 감싸기
      tableWrap = document.createElement('div');
      tableWrap.className = 'wysiwyg-table-wrap';
      table.parentNode.insertBefore(tableWrap, table);
      tableWrap.appendChild(table);
    }

    // 기존 컨트롤 버튼과 리사이저 제거
    const existingControls = tableWrap.querySelectorAll('.btn-control-wrap, .table-resizer');
    existingControls.forEach((control) => control.remove());

    // 테이블 리사이저 추가
    addTableResizers(table, tableWrap);

    // 행 컨트롤 버튼 그룹 생성
    const rowControlWrap = document.createElement('div');
    rowControlWrap.contentEditable = 'false';
    rowControlWrap.tabIndex = '-1';
    rowControlWrap.className = 'btn-control-wrap control-row';

    // 행 추가 버튼
    const addRowBtn = document.createElement('button');
    addRowBtn.className = 'btn-add';
    addRowBtn.type = 'button';
    addRowBtn.textContent = '+';

    // 행 추가 이벤트
    addRowBtn.addEventListener('click', () => {
      const tr = document.createElement('tr');

      // 현재 테이블의 첫 번째 행을 기준으로 열 수 가져오기
      const tbody = table.querySelector('tbody') || table;
      const currentCols = tbody.firstChild ? tbody.firstChild.childNodes.length : 3;

      for (let c = 0; c < currentCols; c++) {
        const td = document.createElement('td');
        td.contentEditable = 'true';
        td.innerHTML = '&nbsp;';

        // 포커스 이벤트
        td.addEventListener('focus', () => {
          td.style.outline = '2px solid #4a90e2';
        });

        td.addEventListener('blur', () => {
          td.style.outline = 'none';
        });

        tr.appendChild(td);
      }

      tbody.appendChild(tr);

      // 행 추가 후 리사이저 업데이트
      addTableResizers(table, tableWrap);
    });

    // 행 삭제 버튼
    const removeRowBtn = document.createElement('button');
    removeRowBtn.className = 'btn-remove';
    removeRowBtn.type = 'button';
    removeRowBtn.textContent = '-';

    // 행 삭제 이벤트
    removeRowBtn.addEventListener('click', () => {
      const tbody = table.querySelector('tbody') || table;
      if (tbody.childNodes.length > 1) {
        tbody.removeChild(tbody.lastChild);

        // 행 삭제 후 리사이저 업데이트
        addTableResizers(table, tableWrap);
      }
    });

    // 열 컨트롤 버튼 그룹 생성
    const colControlWrap = document.createElement('div');
    colControlWrap.contentEditable = 'false';
    colControlWrap.tabIndex = '-1';
    colControlWrap.className = 'btn-control-wrap control-col';

    // 열 추가 버튼
    const addColBtn = document.createElement('button');
    addColBtn.className = 'btn-add';
    addColBtn.type = 'button';
    addColBtn.textContent = '+';

    // 열 추가 이벤트
    addColBtn.addEventListener('click', (e) => {
      e.preventDefault();

      const rows = table.rows;
      for (let i = 0; i < rows.length; i++) {
        const td = document.createElement('td');
        td.contentEditable = 'true';
        td.innerHTML = '&nbsp;';

        td.addEventListener('focus', () => {
          td.style.outline = '2px solid #4a90e2';
        });

        td.addEventListener('blur', () => {
          td.style.outline = 'none';
        });

        rows[i].appendChild(td);
      }

      // 열 추가 후 리사이저 업데이트
      addTableResizers(table, tableWrap);
    });

    // 열 삭제 버튼
    const removeColBtn = document.createElement('button');
    removeColBtn.className = 'btn-remove';
    removeColBtn.type = 'button';
    removeColBtn.textContent = '-';

    // 열 삭제 이벤트
    removeColBtn.addEventListener('click', (e) => {
      e.preventDefault();

      const rows = table.rows;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].childNodes.length > 1) {
          rows[i].removeChild(rows[i].lastChild);
        }
      }

      // 열 삭제 후 리사이저 업데이트
      addTableResizers(table, tableWrap);
    });

    // 컨트롤 버튼 추가
    rowControlWrap.appendChild(addRowBtn);
    rowControlWrap.appendChild(removeRowBtn);

    colControlWrap.appendChild(addColBtn);
    colControlWrap.appendChild(removeColBtn);

    // 모든 컨트롤 추가
    tableWrap.appendChild(rowControlWrap);
    tableWrap.appendChild(colControlWrap);
  });
};

// 테이블 리사이저 추가 함수
const addTableResizers = (table, tableWrap) => {
  // 기존 리사이저 제거
  const existingResizers = tableWrap.querySelectorAll('.table-resizer');
  existingResizers.forEach((resizer) => resizer.remove());

  // 열 리사이저 추가
  if (table.rows.length > 0) {
    const firstRow = table.rows[0];
    const cellCount = firstRow.cells.length;

    for (let i = 0; i < cellCount - 1; i++) {
      const cell = firstRow.cells[i];

      const resizer = document.createElement('div');
      resizer.className = 'table-resizer col-resizer';
      resizer.setAttribute('data-col-index', i);

      // 위치 계산 및 설정
      const left = cell.offsetLeft + cell.offsetWidth + 4;

      resizer.style.left = `${left}px`;
      resizer.style.height = `${table.offsetHeight}px`;

      // 드래그 이벤트 설정
      resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();

        tableWrap.classList.add('resizing-table');

        const startX = e.clientX;
        const startWidthCell = cell.offsetWidth;
        const nextCell = firstRow.cells[i + 1];
        const startWidthNextCell = nextCell.offsetWidth;

        resizer.classList.add('active');

        function onMouseMove(e) {
          const diffX = e.clientX - startX;

          // 최소 너비 제한
          if (startWidthCell + diffX < 30 || startWidthNextCell - diffX < 30) return;

          // 모든 행의 해당 열 셀 크기 변경
          for (let j = 0; j < table.rows.length; j++) {
            const currentCell = table.rows[j].cells[i];
            const currentNextCell = table.rows[j].cells[i + 1];

            currentCell.style.width = `${startWidthCell + diffX}px`;
            currentNextCell.style.width = `${startWidthNextCell - diffX}px`;
          }

          // 리사이저 위치 업데이트
          const newLeft = currentCell.offsetLeft + currentCell.offsetWidth - 4;
          resizer.style.left = `${newLeft}px`;
        }

        function onMouseUp() {
          resizer.classList.remove('active');
          tableWrap.classList.remove('resizing-table');

          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);

          // 리사이저 위치 업데이트
          addTableResizers(table, tableWrap);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      tableWrap.appendChild(resizer);
    }
  }

  // 행 리사이저 추가
  const rowCount = table.rows.length;

  // 행 리사이저 추가 부분 수정
  for (let i = 0; i < rowCount; i++) {
    const row = table.rows[i];

    const resizer = document.createElement('div');
    resizer.className = 'table-resizer row-resizer';
    resizer.setAttribute('data-row-index', i);

    // 위치 계산 및 설정
    const top = row.offsetTop + row.offsetHeight + 2;
    const left = row.offsetLeft + 5;

    resizer.style.top = `${top}px`;
    resizer.style.left = `${left}px`;
    resizer.style.width = `${table.offsetWidth}px`;

    // 드래그 이벤트 설정
    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      tableWrap.classList.add('resizing-table');

      const startY = e.clientY;
      const startHeight = row.offsetHeight;

      resizer.classList.add('active');

      function onMouseMove(e) {
        const diffY = e.clientY - startY;

        // 최소 높이 제한
        if (startHeight + diffY < 20) return;

        // 셀들의 높이 지정
        const cells = row.cells;
        for (let j = 0; j < cells.length; j++) {
          cells[j].style.height = `${startHeight + diffY}px`;
        }

        // 전체 행의 높이도 설정
        row.style.height = `${startHeight + diffY}px`;

        // 리사이저 위치 업데이트
        resizer.style.top = `${row.offsetTop + row.offsetHeight - 4}px`;
      }

      function onMouseUp() {
        resizer.classList.remove('active');
        tableWrap.classList.remove('resizing-table');

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // 리사이저 위치 업데이트
        setTimeout(() => {
          addTableResizers(table, tableWrap);
        }, 0);
      }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    tableWrap.appendChild(resizer);
  }
};

// 에디터 내보내기
const exportWysiwygData = (content) => {
  // 내용이 비어있을 때 기본 p 태그 유지
  editorContent.value = content && content.trim() !== '' ? content : '<p><br></p>';
};

// 첨부파일 삭제
const removeFile = (file, index) => {
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
  console.log('accessUser : ', accessUser);

  // 다중부서 직원 중복제거
  const uniqueUsers = accessUser.filter(
    (user, index, self) => index === self.findIndex((u) => u.user_id === user.user_id)
  );
  selectedUsers.value = JSON.parse(JSON.stringify(uniqueUsers));
  console.log('중복제거 = selectedUsers.value : ', selectedUsers.value);

  try {
    const dvs = Object.keys(selectedDivision.value);
    const newsFormData = new FormData();

    const dvsWithName = dvs.map((key) => {
      const name = divisionNameList.value[key] || '-';
      return `${key}.${name}`;
    });
    console.log('dvs : ', dvs);
    console.log('dvsWithName : ', dvsWithName);

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
    console.log('selCate.value : ', selCate.value);
    console.log('selCateId : ', selCateId);

    const options = {
      table: {
        name: 'newsletter',
        access_group: 'private'
      },
      index: {
        name: 'news_title', // 게시글 제목. 제목별로 찾을때 위한 인덱싱
        value: news_title.replaceAll('.', '_')
      },
      reference: selCateId // 카테고리 ID를 레퍼런스
    };
    console.log('options : ', options);

    const res = await skapi.postRecord(newsFormData, options);
    console.log('== postNewsRecord == res : ', res);

    return res;
  } catch (error) {
    console.error(error);
    if (error?.message?.includes('index.value should not have special characters')) {
      throw new Error('index.value should not have special characters');
    }
    throw error;
  }
};

// 게시글 공개범위에게 권한을 부여하는 함수
// const grantNewsUserAccess = async ({ news_id, newsUser_id }) => {
//   return skapi.grantPrivateRecordAccess({
//     record_id: news_id,
//     user_id: newsUser_id
//   });
// };

// 게시글 등록하고 알림을 보내는 함수
const createAddNews = async (
  { news_id, newsUser_id, news_title },
  send_newsUser,
  isNotificationTarget = false
) => {
  console.log('== createAddNews == send_newsUser : ', send_newsUser);
  console.log('== createAddNews == newsUser_id : ', newsUser_id);

  if (!news_id || !newsUser_id) return;

  // skapi.grantPrivateRecordAccess({
  //   record_id: news_id,
  //   user_id: newsUser_id
  // });

  // 실시간 알림 보내기
  if (isNotificationTarget) {
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
      })
      .catch(async (err) => {
        console.error(err);
      });

    // 실시간 못 받을 경우 알림 기록 저장
    skapi.postRecord(
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
    );
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
  try {
    // 권한 부여
    // await grantNewsUserAccess({
    //   news_id: newsId,
    //   newsUser_id: userId
    // });

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
    console.log('== postAuditDocRecordId == res : ', res);
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
      console.log('== registerNews == 수정모드');
      // 수정 모드인 경우
      const editNewsId = route.query.news;

      const selectedCategory = newsCateList.value.find((cat) => cat.record_id === selCate.value);
      console.log('selectedCategory : ', selectedCategory);

      if (selectedCategory) {
        selectedDivision.value = selectedCategory.data.access_division;
      } else {
        selectedDivision.value = {};
      }
      console.log('selectedDivision.value : ', selectedDivision.value);

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
      console.log('중복제거 = selectedUsers.value : ', selectedUsers.value);

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

      console.log('== AA == uploadedFile.value : ', uploadedFile.value);

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

      console.log('== BB == uploadedFile.value : ', uploadedFile.value);

      const updateRes = await skapi.postRecord(updateFormData, {
        record_id: editNewsId,
        table: {
          name: 'newsletter',
          access_group: 'private'
        },
        index: {
          name: 'news_title',
          value: news_title.replaceAll('.', '_')
        },
        reference: selCateId
      });
      console.log('updateRes : ', updateRes);

      alert('게시글 수정이 완료되었습니다.');
      router.push(`/newsletter-category?category=${selCate.value}`);
    } else {
      // 등록 모드인 경우
      // 게시글 레코드 생성
      const newsDoc = await postNewsRecord({
        news_title,
        to_news_content,
        noti_setting: notiSetting.value // 알림 설정 관련 체크박스 값 전달
      });
      console.log('등록 = newsDoc : ', newsDoc);

      const newsId = newsDoc.record_id; // 게시글 ID
      const newsTitle = news_title; // 게시글 제목

      const processRoles = [
        ...selectedUsers.value.map((user) => ({
          userId: user.user_id
        }))
      ];
      console.log('processRoles : ', processRoles);

      // 공개범위에게 게시글 열람 권한 및 등록 레코드 생성
      const res = await Promise.all(
        processRoles.map((roleInfo) =>
          postAuditDocRecordId(newsId, newsTitle, roleInfo.userId, notiSetting.value)
        )
      );
      console.log('promiseall res : ', res);

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
            access_group: 'private'
          },
          record_id: editNewsId
        });

        if (record) {
          editModeData.value = record.list[0];
          console.log('onMounted == editModeData.value : ', editModeData.value);

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

.button-wrap {
  margin-top: 3rem;
}

.btn {
  margin-top: 1rem;
}

// .dvs-wrap {
//   display: grid;
//   grid-template-columns: repeat(8, 1fr);
//   text-align: center;
//   height: 100%;

//   .dvs-list {
//     display: flex;
//     flex-direction: column;
//     width: 100%;
//     min-height: 6rem;
//     border-right: 1px solid var(--gray-color-300);
//     border-bottom: 1px solid var(--gray-color-300);
//     margin-bottom: -1px;
//     position: relative;
//   }

//   .num {
//     border-bottom: 1px solid var(--gray-color-200);
//     padding: 0.25rem;
//   }

//   .dvs-name {
//     display: flex;
//     justify-content: center;
//     align-items: center;
//     height: 100%;
//     padding: 0.25rem;
//   }

//   .add-dvs {
//     display: flex;
//     justify-content: center;
//     align-items: center;
//     height: 100%;
//     cursor: pointer;

//     .icon {
//       svg {
//         fill: var(--gray-color-400);
//       }
//     }
//   }

//   .btn-remove {
//     margin-left: 4px;

//     .icon {
//       padding: 0;

//       svg {
//         width: 16px;
//         height: 16px;
//       }
//     }
//   }
// }

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
