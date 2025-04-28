<template lang="pug">
//- .title
	h1 공지사항 작성

//- hr

.inner
	.form-wrap
		form#_write_news_form(@submit.prevent="registerNewsletter")
			//- .title
				.input-wrap.input-title
					input#docform_title(v-model="formTitle" type="text" name="docform_title" placeholder="결재 제목을 입력해주세요." required)

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
									span.drafter {{ user.name }}

							//- 모바일 경우 레이아웃
							tr.mo(v-if="!isDesktop")
								th 작성 일자
								td
									.input-wrap
										input#inp_date(type="date" name="inp_date" v-model="dateValue")

							tr.mo(v-if="!isDesktop")
								th 작성자
								td
									span.drafter {{ user.name }}
							//- 작성일자 작성자 :: e

							tr
								th.essential 제목
								td(colspan="3")
									.input-wrap
										input#to_news(type="text" v-model="newsTitle" name="to_news" placeholder="제목을 입력해주세요." required)

							tr(style="height: 119px;")
								th.essential 공개범위
								td.left(colspan="3")
									span.empty(@click="openModal" style="cursor: pointer;") 이곳을 눌러 공개범위를 선택해주세요.

							tr.approval(v-if="selectedMembers.length > 0")
								th 공개 범위
								td.left(colspan="3" style="padding: 0; height: 119px;")
									ul.approver-wrap
										li.approver-list(v-for="(approver, index) in selectedMembers" :key="approver.data.user_id")
											span.num {{ approver.order }}
											span.approver {{ approver.index.value }}

										li.approver-list(@click="openModal")
											span.add-approver
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

							tr
								th.essential 결재 내용
								td(colspan="3")
									.wysiwyg-wrap(style="cursor: text;")
										Wysiwyg(@editor-ready="handleEditorReady" @update:content="exportWysiwygData" :savedContent="selectedForm?.data?.form_content" :showBtn="true")
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
			button.btn.bg-gray.btn-cancel(type="button" @click="router.push('/newsletter')") 취소
			button.btn(type="submit") 등록

//- Modal - 공개 범위 선택
#modal.modal.select-approver(v-if="isModalOpen" @click="closeModal")
	.modal-cont(@click.stop)
		.modal-header
			h2.title 공개 범위 선택
			button.btn-close(type="button" @click="closeModal")
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
		.modal-body
			.select-approver-wrap
				.organigram-wrap
					Organigram(:selectedEmployees="selectedUsers" :excludeCurrentUser="true" :useCheckbox="true" :selectedAuditors="selectedMembers" :onlyDvsName="true" @selection-change="handleOrganigramSelection")

				br

				.table-wrap
					.tb-overflow(v-if="selectedUsers.length > 0")
						table.table#selected_auditors
							colgroup
								col(style="width: 8%")
								col(style="width: 8%")
								col

							thead
								tr
									th 
									th NO
									th 부서
									th 이름
									
							tbody
								tr(v-for="(user, index) in selectedUsers" :key="user.data.user_id")
									td
										button.btn-remove(@click="removeAuditor(user)")
											.icon
												svg
													use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")
									td {{ index + 1 }}
									td {{ divisionNameList[user.index.name.split('.')[0]] }}
									td {{ user.index.value }}

					span.empty(v-else) 선택된 결재자가 없습니다.
		.modal-footer
			button.btn.bg-gray.btn-cancel(type="button" @click="closeModal") 취소
			button.btn.btn-save(type="submit" @click="saveAuditor") 저장

// button.btn.outline.btn-new(type="button" @click="testDelete") delete
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { skapi, mainPageLoading, RealtimeCallback } from '@/main.ts';
import { user, makeSafe, verifiedEmail } from '@/user.ts';
import { divisionNameList } from '@/division.ts';

import Organigram from '@/components/organigram.vue';
import Wysiwyg from '@/components/wysiwyg.vue';

// 게시판 공지
// 이메일 발송의 기존 방식 -> 게시판 형태의 공지 방식으로 변경
// 직원 모두 작성 가능
// 공지사항은 레코드에 저장
// 작성 시 공개범위, 알림발송 설정 가능하게
// --> 공개범위는 부서별로 선택 가능하게
// --> 알림발송은 허용/비허용 설정 가능하게 (공개범위에 해당하는 사람들에게만 알림발송)
// 목록에서 클릭 시, 상세 페이지로 이동
// 등록한 공지사항 삭제, 수정 가능
// 처음 작성시: 알람 허용이면 공개 범위에 해당하는 사람에게만 알람 보내기
// 올리고 수정시: 공개범위에 추가된 부서가 있으면 추가 부서 사람들에게만 알람 보내기
// 댓글 알람: 작성자에게만 알람 보내기, 만약 작성자가 본인글에 댓글 작성시에는 알람 안가는게 맞음
// 대댓글: 댓글 작성자 + 게시물 작성자 알람

const router = useRouter();
const route = useRoute();

const isDesktop = ref(window.innerWidth > 768); // 반응형
const isModalOpen = ref(false); // 공개범위 설정 모달
const selectedDivision = ref([]); // 조직도에서 선택된 부서
const selectedUsers = ref([]); // 조직도에서 선택된 부서의 직원
const selectedMembers = ref([]); // 공개범위 직원 정보 저장
const selectedForm = ref([]); // 선택된 결재 양식
const notiSetting = ref(true); // 알림 설정 관련 체크박스
const backupSelected = ref(null); // 선택된 공개범위 직원 백업
let send_auditors_arr = [];

const uploadedFile = ref([]); // 첨부파일
const fileNames = ref([]);

const newsTitle = ref(''); // 게시글 제목
const disabled = ref(false);

// 에디터 상태 관리
const editorContent = ref('');
const editorIsReady = ref(false);

// 에디터 내용이 변경 감지
watch(editorContent, (newContent) => {
  if (!newContent || newContent === '') {
    // 내용이 완전히 비어있는 경우 기본 p 태그 추가
    const editorElement = document.getElementById('myeditor');
    if (editorElement && (!editorElement.innerHTML || editorElement.innerHTML === '')) {
      editorElement.innerHTML = '<p><br></p>';
    }
  }
});

// 공개범위 모달 열기
const openModal = () => {
  // 열렸을 때 selectedMembers 전체를 original로 백업
  backupSelected.value = [...selectedMembers.value];

  // selectedMembers에 있는 모든 유저를 selectedUsers에 추가
  selectedUsers.value = [];
  console.log('selectedUsers.value : ', selectedUsers.value);

  isModalOpen.value = true;
};

// 공개범위 모달 닫기
const closeModal = () => {
  if (backupSelected.value) {
    selectedMembers.value = [...backupSelected.value];
  } else {
    selectedMembers.value = [];
  }

  selectedUsers.value = [];

  backupSelected.value = null;
  isModalOpen.value = false;
};

// 직원 부서 가져오기
const getEmpDivision = async (userId) => {
  if (!userId) return;

  const userDvsList = await skapi.getRecords({
    table: {
      name: 'emp_division' + makeSafe(emp.user_id),
      access_group: 1
    },
    tag: '[emp_id]' + makeSafe(emp.user_id)
  });
  const currentUserDvs = userDvsList.list[userDvsList.list.length - 1];
  const userDvs = currentUserDvs?.tags[0]?.split(']')[1];

  await skapi
    .getRecords({
      table: {
        name: 'emp_position_current',
        access_group: 1
      },
      unique_id: `[emp_position_current]${makeSafe(userId)}:${userDvs}`
    })
    .then((r) => {
      if (r.list.length === 0) return;

      user.division = r.list[0].index.name.split('.')[0];
      user.position = r.list[0].index.name.split('.')[1];
    });
};

// 공개범위 모달에서 조직도 선택시
const handleOrganigramSelection = (users) => {
  console.log('모달에서 공개 부서 선택');
  console.log('== handleOrganigramSelection == users : ', users);

  users.forEach((el) => {
    console.log('el : ', el);
    el.index.name.split('.')[0];
    console.log(divisionNameList[el.index.name.split('.')[0]]);
  });
};

// 선택된 모든 결재자 ID 목록 가져오기
const getAllSelectedUserIds = () => {
  const result = {};

  Object.keys(selectedMembers.value).forEach((type) => {
    result[type] = selectedMembers.value[type].map((auditor) => auditor.data.user_id);
  });

  return result;
};

// 결재자 저장
const saveAuditor = () => {
  selectedMembers.value = [];

  selectedUsers.value.forEach((user) => {
    const userCopy = JSON.parse(JSON.stringify(user)); // 깊은 복사 하여 참조를 끊어줌
    selectedMembers.value.push(userCopy);
  });

  backupSelected.value = null;
  isModalOpen.value = false;
};

// 결재자 제거
const removeAuditor = (user, type) => {
  const newMembers = selectedUsers.value.filter((u) => u.data.user_id !== user.data.user_id);
  selectedUsers.value = newMembers;
};

// 에디터 준비 후 테이블 편집 기능 활성화
const handleEditorReady = (status) => {
  editorIsReady.value = status;

  // 에디터가 준비되었을 때
  if (status) {
    setTimeout(() => {
      const editorElement = document.getElementById('myeditor');
      if (editorElement) {
        // console.log('에디터 준비 완료');
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
const postNewsRecord = async ({ to_news, to_news_content }) => {
  // order 추가한 결재자 정보
  const send_auditors_data = {
    approvers: selectedMembers.value.approvers.map((user) => ({
      user_id: user.data.user_id.replaceAll('-', '_'),
      order: user.order
    }))
  };

  // 태그 배열 생성 부분도 수정 (태그 형식을 유지하되 순서 정보는 members 객체에 저장)
  send_auditors_arr = [
    ...send_auditors_data.approvers.map((item) => `approvers:${item.user_id}`),
    ...send_auditors_data.agreers.map((item) => `agreers:${item.user_id}`),
    ...send_auditors_data.receivers.map((item) => `receiver:${item.user_id}`)
  ];

  try {
    // 첨부파일 업로드
    const additionalFormData = new FormData();

    additionalFormData.append('to_news', to_news);
    additionalFormData.append('members', JSON.stringify(send_auditors_data));
    additionalFormData.append('to_news_content', to_news_content);
    additionalFormData.append('noti_setting', notiSetting.value);

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

      console.log('filePromises : ', filePromises);

      // 모든 파일 변환이 끝날 때까지 기다림
      const fileObjects = await Promise.all(filePromises);
      console.log('fileObjects : ', fileObjects);

      // null이 아닌 파일만 필터링하여 FormData에 추가
      fileObjects
        .filter((file) => file !== null)
        .forEach((file) => {
          additionalFormData.append('form_data', file);
        });
    }

    const options = {
      readonly: true, // 결재 올리면 수정할 수 없음. 수정하려면 새로 올려야 함. 이것은 교묘히 수정할 수 없게 하는 방법
      table: {
        name: 'news_doc',
        access_group: 'private' // 프라빗으로 올려야 공개범위 직원들만 접근 가능
      },
      index: {
        name: 'to_news', // 게시글 제목. 제목별로 찾을때 위한 인덱싱
        value: to_news.replaceAll('.', '_')
      },
      source: {
        prevent_multiple_referencing: true // 중복 결재 방지
      },
      tags: 'send_auditors_arr', // 결재, 합의, 수신참조 태그를 각각 구분,
      data: {
        noti_setting: notiSetting.value
      }
    };

    const res = await skapi.postRecord(additionalFormData, options);
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

// 결재자에게 권한을 부여하는 함수
const grantAuditorAccess = async ({ audit_id, auditor_id }) => {
  return skapi.grantPrivateRecordAccess({
    record_id: audit_id,
    user_id: auditor_id
  });
};

// 결재 요청을 생성하고 알림을 보내는 함수
const createAuditRequest = async (
  { audit_id, auditor_id, role, audit_title },
  send_auditors,
  isNotificationTarget = false
) => {
  console.log('send_auditors : ', send_auditors);
  console.log('auditor_id : ', auditor_id);

  if (!audit_id || !auditor_id) return;

  // 결재 요청
  const res = await skapi.postRecord(
    {
      audit_id,
      auditor: auditor_id,
      audit_title
    },
    {
      unique_id: `audit_request:${audit_id}:${auditor_id}`,
      readonly: true,
      table: {
        name: `audit_request_${role}`,
        access_group: 'authorized'
      },
      reference: `audit:${auditor_id}`,
      tags: [audit_id],
      index: {
        name: 'audit_title',
        value: audit_title.replaceAll('.', '_')
      }
    }
  );
  console.log('res : ', res);

  skapi.grantPrivateRecordAccess({
    record_id: res.record_id,
    user_id: auditor_id
  });

  //   // 결재자/합의자를 순서대로 정렬
  //   const approversAndAgreers = [
  //     ...selectedMembers.value.approvers,
  //     ...selectedMembers.value.agreers
  //   ].sort((a, b) => a.order - b.order);
  //   console.log('approversAndAgreers : ', approversAndAgreers);

  //   // 결재자/합의자 중 첫 번째 결재자 또는 수신참조자 찾기
  //   const sendFirstNoti = approversAndAgreers.filter((a) => a.order === 1 || a.role === 'receiver');
  //   console.log('sendFirstNoti : ', sendFirstNoti);

  //   // Id만 추출
  //   const sendFirstNotiId = sendFirstNoti.map((a) => a.data.user_id.replaceAll('-', '_'));
  //   console.log('sendFirstNotiId : ', sendFirstNotiId);

  //   //sendFirstNotiId string으로 변환
  //   const sendFirstNotiIdString = sendFirstNotiId.join(',');
  //   console.log('sendFirstNotiIdString : ', sendFirstNotiIdString);

  // 실시간 알림 보내기
  if (isNotificationTarget) {
    let to_news = document.getElementById('to_news').value;

    let postRealtimeBody = {
      text: `${user.name}님께서 결재를 올렸습니다.`,
      type: 'audit',
      id: audit_id
    };

    skapi
      .postRealtime(
        {
          audit_request: {
            noti_id: res.record_id,
            noti_type: 'audit',
            send_date: new Date().getTime(),
            send_user: user.user_id,
            audit_info: {
              audit_type: 'request',
              to_news: to_news,
              audit_doc_id: audit_id,
              audit_request_id: res.record_id,
              send_auditors: send_auditors
            }
          }
        },
        auditor_id,
        {
          title: '[그룹웨어]',
          // body: JSON.stringify(postRealtimeBody)
          body: `${user.name}님께서 결재를 올렸습니다.`,
          config: {
            always: true // 무조건 알림 받기
          }
        }
      )
      .then((res) => {
        // console.log('실시간 알림 == res : ', res);
      })
      .catch(async (err) => {
        console.error(err);
      });

    // 실시간 못 받을 경우 알림 기록 저장
    skapi.postRecord(
      {
        noti_id: res.record_id,
        noti_type: 'audit',
        send_date: new Date().getTime(),
        send_user: user.user_id,
        audit_info: {
          audit_type: 'request',
          to_news: to_news,
          audit_doc_id: audit_id,
          audit_request_id: res.record_id,
          send_auditors: send_auditors
        }
      },
      {
        readonly: true,
        table: {
          name: `realtime:${auditor_id.replaceAll('-', '_')}`,
          access_group: 'authorized'
        }
      }
    );
  }

  return res;
};

// 결재 요청 Alarm
const postAuditDocRecordId = async (
  auditId,
  formTitle,
  newsTitle,
  userId,
  role,
  isNotificationTarget = false
) => {
  try {
    // 권한 부여
    await grantAuditorAccess({
      audit_id: auditId,
      auditor_id: userId,
      form_title: formTitle,
      audit_title: newsTitle
    });

    // 알림 전송
    return createAuditRequest(
      {
        audit_id: auditId,
        auditor_id: userId,
        role: role,
        form_title: formTitle,
        audit_title: newsTitle
      },
      send_auditors_arr,
      isNotificationTarget
    );
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

// 결재 요청
const registerNewsletter = async (e) => {
  e.preventDefault();

  // 결재 내용이 없을 경우 결재 요청 안되게
  if (!editorContent.value || editorContent.value === '<p><br></p>') {
    alert('결재 내용을 입력해주세요.');
    return;
  }

  try {
    const formData = new FormData(e.target);
    formData.set('inp_content', removeButtonTags(editorContent.value)); // editorContent.value가 이미 현재 에디터 내용을 가지고 있음
    formData.append('noti_setting', notiSetting.value); // 반려 설정 관련 체크박스

    const formValues = Object.fromEntries(formData.entries());

    if (!formValues) return;

    const { to_news, inp_content: to_news_content } = formValues;

    // 선택된 결재자 확인
    const totalSelectedCount = Object.values(selectedMembers.value).reduce(
      (sum, users) => sum + users.length,
      0
    );

    if (totalSelectedCount === 0) {
      alert('결재자, 합의자, 수신참조 중 하나 이상을 선택해주세요.');
      return;
    }

    if (
      selectedMembers.value.approvers.length === 0 &&
      selectedMembers.value.agreers.length === 0
    ) {
      alert('결재자 또는 합의자를 선택해주세요.');
      return;
    }

    mainPageLoading.value = true;

    // 결재 문서 생성
    const auditDoc = await postNewsRecord({
      to_news,
      to_news_content,
      noti_setting: notiSetting.value // 반려 설정 관련 체크박스 값 전달
    });

    const auditId = auditDoc.record_id; // 결재 문서 ID
    const newsTitle = to_news; // 결재건 제목

    // 각 역할별 권한 부여 및 알림 전송 (첫번째 순서, 수신참조만)
    // 결재자/합의자를 순서대로 정렬
    // const approversAndAgreers = [
    //   ...selectedMembers.value.approvers,
    //   ...selectedMembers.value.agreers
    // ].sort((a, b) => a.order - b.order);
    // console.log('approversAndAgreers : ', approversAndAgreers);

    // // 결재자/합의자 중 첫 번째 결재자 또는 수신참조자 찾기
    // const sendFirstNoti = approversAndAgreers.filter((a) => a.order === 1 || a.role === 'receiver');
    // console.log('sendFirstNoti : ', sendFirstNoti);

    // // Id만 추출
    // const sendFirstNotiId = sendFirstNoti.map((a) => a.data.user_id);
    // console.log('sendFirstNotiId : ', sendFirstNotiId);

    // //sendFirstNotiId string으로 변환
    // const sendFirstNotiIdString = sendFirstNotiId.join(',');
    // console.log('sendFirstNotiIdString : ', sendFirstNotiIdString);

    // const processRoles = sendFirstNoti.map((auditor) => ({
    //   userId: auditor.data.user_id,
    //   role: auditor.role,
    //   order: auditor.order
    // }));
    // console.log('processRoles : ', processRoles);

    const processRoles = [
      // 결재
      ...selectedMembers.value.approvers.map((auditor, index) => ({
        userId: auditor.data.user_id,
        role: 'approver',
        order: auditor.order
      })),

      // 합의
      ...selectedMembers.value.agreers.map((auditor) => ({
        userId: auditor.data.user_id,
        role: 'agreer',
        order: auditor.order
      })),

      // 수신참조
      ...selectedMembers.value.receivers.map((auditor) => ({
        userId: auditor.data.user_id,
        role: 'receiver',
        order: auditor.order
      }))
    ];
    console.log('processRoles : ', processRoles);

    // const res = await Promise.all(
    //   processRoles.map((roleInfo) =>
    //     postAuditDocRecordId(auditId, newsTitle, roleInfo.userId, roleInfo.role)
    //   )
    // );

    // 결재자와 합의자를 순서대로 통합 정렬
    const approversAndAgreers = [
      ...selectedMembers.value.approvers,
      ...selectedMembers.value.agreers
    ].sort((a, b) => a.order - b.order);

    // 통합된 목록에서 첫 번째 사람과 모든 수신참조자
    const notificationTargets = [
      // 첫 번째 결재/합의자 (전체 목록 중 첫 번째)
      ...(approversAndAgreers.length > 0 ? [approversAndAgreers[0]] : []),
      // 모든 수신참조자
      ...selectedMembers.value.receivers
    ];

    // 모든 결재자에게 문서 권한 및 요청 레코드 생성
    const res = await Promise.all(
      processRoles.map((roleInfo, index) =>
        postAuditDocRecordId(
          auditId,
          formTitle,
          newsTitle,
          roleInfo.userId,
          roleInfo.role,
          // 알림 대상인지 여부 확인
          notificationTargets.some((target) => target.data.user_id === roleInfo.userId)
        )
      )
    );
    console.log('promiseall : ', res);

    // 결재라인 select option '결재'로 초기화
    selectedUsers.value.forEach((user) => {
      user.role = 'approvers';
    });

    // 결재자 선택 모달 체크박스 초기화
    selectedUsers.value = [];
    selectedMembers.value.approvers = [];
    selectedMembers.value.agreers = [];
    selectedMembers.value.receivers = [];

    alert('결재 요청이 완료되었습니다.');
    router.push({
      path: '/approval/request-list'
    });
  } catch (error) {
    console.error('결재 요청 중 오류 발생:', error);
    if (error?.message === 'index.value should not have special characters') {
      alert('제목은 특수문자 [ ] ^ _ ` : ; < = > ? @ 만 포함 가능합니다.');
    } else {
      alert('결재 요청 중 오류가 발생했습니다.');
    }
  } finally {
    mainPageLoading.value = false;
  }
};

// 결재자 정보 변환 함수
const convertAuditorFormat = (members, role) => {
  return members.map((auditor) => ({
    data: { user_id: auditor.user_id },
    index: {
      value: auditor.name,
      name: `${auditor.division}.${auditor.position}`
    },
    role: role
  }));
};

const dateValue = ref(new Date().toISOString().substring(0, 10));

const updateScreenSize = () => {
  isDesktop.value = window.innerWidth > 768;
};

onMounted(async () => {
  window.addEventListener('resize', updateScreenSize);
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

.approver-wrap {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  text-align: center;
  height: 100%;

  .approver-list {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 6rem;
    border-right: 1px solid var(--gray-color-300);
    border-bottom: 1px solid var(--gray-color-300);
    margin-bottom: -1px;
    position: relative;
  }

  .num {
    border-bottom: 1px solid var(--gray-color-200);
    padding: 0.25rem;
  }

  .approver {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 0.25rem;
  }

  .add-approver {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    cursor: pointer;

    .icon {
      svg {
        fill: var(--gray-color-400);
      }
    }
  }

  .btn-remove {
    margin-left: 4px;

    .icon {
      padding: 0;

      svg {
        width: 16px;
        height: 16px;
      }
    }
  }
}

.reference-wrap {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  text-align: center;

  .reference-list {
    display: flex;
    justify-content: center;
    background-color: var(--gray-color-50);
    border: 1px solid var(--gray-color-300);
    border-radius: 8px;
  }

  .referencer {
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

  .add-referencer {
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

.select-approver {
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

.select-approver-wrap {
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

#selected_auditors {
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

.select-approver {
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
  .approver-wrap {
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
