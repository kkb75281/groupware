<template lang="pug">
//- .title
	h1 {{ pageTitle }}

//- hr

template(v-if="step === 1 && showBackStep && !isTemplateMode && !isTempSaveMode && !isReRequestMode")
	.item-wrap
		.selected-wrap
			p.label 카테고리 선택
			select(name="selCategory" @change="(e) => {formCategory = e.target.value; selectedForm = []; isFormSelected = false;}")
				//- option(disabled selected) 카테고리 선택
				//- option(value="bookmark") 즐겨찾기
				option(value="master") 일반 결재 양식
				option(value="mine") 나의 결재 양식
			
		.selected-wrap
			p.label 결재 양식 선택
			select(v-if="formCategory === 'master'" name="masterForms" :disabled="!masterForms.length" @change="(e) => selDocForm(e)")
				option(value="" disabled selected) {{ masterForms.length ? "기본 결재 양식을 선택해주세요." : "등록된 결재 양식이 없습니다." }}
				option(v-for="form of masterForms" :key="form.record_id" :value="form.record_id") {{ form.data.docform_title }}

			select(v-else-if="formCategory === 'mine'" name="myForms" :disabled="!myForms.length" @change="(e) => selDocForm(e)")
				option(value="" disabled selected) {{ myForms.length ? "나의 결재 양식을 선택해주세요." : "등록된 결재 양식이 없습니다." }}
				option(v-for="form in myForms" :key="form.record_id" :value="form.record_id") {{ form.data.form_title }}

			select(v-else)
				option(value="" disabled selected) 결재 양식을 선택해주세요.
				//- option(v-for="form in masterForms" :key="form.record_id" :value="form.record_id") {{ form.data.form_title }}

	.item
		p.label 결재 옵션
		.label-wrap
			label.radio-button(style="margin-right: 1rem;")
				input(type="radio" name="radio" value="true" v-model="rejectSetting")
				span.label-radio(style="font-size: 0.8rem") 결재 도중 반려시 결재 진행

			label.radio-button
				input(type="radio" name="radio" value="false" v-model="rejectSetting")
				span.label-radio(style="font-size: 0.8rem") 결재 도중 반려시 결재 중단

	.button-wrap
		button.btn.outline.btn-new(type="button" @click="newWriteAudit") 새 양식 생성
		button.btn.btn-next(type="button" :disabled="!isFormSelected" @click="step = 2") 다음

	//- .top-wrap
		p.desc 결재 양식 선택 후 결재 작성이 진행됩니다. 결재 양식을 먼저 선택해주세요.
		button.btn.outline.btn-new(type="button" @click="newWriteAudit") 새로 작성

	//- .item-wrap
		p.label 기본 결재 양식
		.selected-wrap
			select(name="masterForms" @change="(e) => selDocForm(e)")
				option(value="" disabled selected) 기본 결재 양식을 선택해주세요.
				option(v-for="form of masterForms" :key="form.record_id" :value="form.record_id") {{ form.data.form_title }}

	//- .item-wrap
		p.label 나의 양식
		.selected-wrap
			select(name="myForms" @change="(e) => selDocForm(e)")
				option(value="" disabled selected) 나의 결재 양식을 선택해주세요.
				option(v-for="form in myForms" :key="form.record_id" :value="form.record_id") {{ form.data.form_title }}

template(v-if="step === 2 || isTemplateMode || (isTempSaveMode && temploading) || (isReRequestMode && temploading)")
	.form-wrap
		form#_el_request_form(@submit.prevent="requestAudit")
			#printArea
				.title
					.input-wrap.input-title
						input#docform_title(v-model="formTitle" type="text" name="docform_title" placeholder="결재 제목을 입력해주세요." required)

				.table-wrap
					.tb-overflow
						table.table#tb-auditRequest
							colgroup
								col(style="width: 13%")
								col
								template(v-if="isTemplateMode")
									col(style="width: 15%")
									col(style="width: 20%")

							tbody
								//- 작성일자 기안사 :: s
								tr.pc(v-if="isDesktop && !isTemplateMode")
									th 작성 일자
									td
										.input-wrap
											input#inp_date(type="date" name="inp_date" v-model="dateValue")
									th 기안자
									td
										span.drafter {{ user.name }}

								//- 모바일 경우 레이아웃
								tr.mo(v-if="!isTemplateMode && !isDesktop")
									th 작성 일자
									td
										.input-wrap
											input#inp_date(type="date" name="inp_date" v-model="dateValue")

								tr.mo(v-if="!isTemplateMode && !isDesktop")
									th 기안자
									td
										span.drafter {{ user.name }}
								//- 작성일자 기안사 :: e

								tr(v-if="selectedAuditors.approvers.length === 0 && selectedAuditors.agreers.length === 0 && selectedAuditors.receivers.length === 0" style="height: 119px;")
									th.essential 결재 라인
									td.left(colspan="3")
										span.empty(@click="openModal" style="cursor: pointer;") 이곳을 눌러 [ 결재/합의/수신참조 ] 라인을 추가해주세요.

								tr.approval(v-if="selectedAuditors.approvers.length > 0")
									th 결재
									td.left(colspan="3" style="padding: 0; height: 119px;")
										ul.approver-wrap
											li.approver-list(v-for="(approver, index) in selectedAuditors.approvers" :key="approver.data.user_id")
												span.num {{ approver.order }}
												span.approver {{ approver.index.value }}

											li.approver-list(@click="openModal")
												span.add-approver
													.icon
														svg
															use(xlink:href="@/assets/icon/material-icon.svg#icon-add")

								tr.approval(v-if="selectedAuditors.agreers.length > 0")
									th 합의
									td.left(colspan="3" style="padding: 0; height: 119px;")
										ul.approver-wrap
											li.approver-list(v-for="(agreer, index) in selectedAuditors.agreers" :key="agreer.data.user_id")
												span.num {{ agreer.order }}
												span.approver {{ agreer.index.value }}

											li.approver-list(@click="openModal")
												span.add-approver
													.icon
														svg
															use(xlink:href="@/assets/icon/material-icon.svg#icon-add")

								tr.reference(v-if="selectedAuditors.receivers.length > 0")
									th 수신 참조
									td.left(colspan="3")
										ul.reference-wrap
											li.reference-list(v-for="(receiver, index) in selectedAuditors.receivers" :key="receiver.data.user_id")
												span.referencer {{ receiver.index.value }}

											li.reference-list(@click="openModal")
												span.add-referencer
													.icon
														svg
															use(xlink:href="@/assets/icon/material-icon.svg#icon-add")
								
								tr.tr-hover(v-for="(row, index) in addRows" :key="index")
									th {{ row.title }}
									td(colspan="3")
										.row-wrap
											.input-wrap
												input(type="text" :name="'addRow'+index" v-model="row.value")
											.btn-remove(@click.stop="removeRow($event, index)")
												.icon
													svg
														use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")
										

								tr(v-if="!isTemplateMode")
									th.essential 제목
										.add-btn(@click="isRowModalOpen = true")
											.icon
												svg
													use(xlink:href="@/assets/icon/material-icon.svg#icon-add")
									td(colspan="3")
										.input-wrap
											input#to_audit(type="text" v-model="auditTitle" name="to_audit" placeholder="결재 제목을 입력해주세요." required)
								tr
									th.essential 결재 내용
										.add-btn(v-if="isTemplateMode" @click="isRowModalOpen = true")
											.icon
												svg
													use(xlink:href="@/assets/icon/material-icon.svg#icon-add")
									td(colspan="3")
										.wysiwyg-wrap(style="cursor: text;")
											Wysiwyg(@editor-ready="handleEditorReady" @update:content="exportWysiwygData" :savedContent="route.query.mode === 'tempsave' ? tempSaveData?.data?.form_content : route.query.mode === 'reRequest' ? reRequestData?.data?.to_audit_content : selectedForm?.data?.form_content" :showBtn="true")
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
													template(v-if="(uploadedFile.length > 0 && isFormSelected) || uploadedFile.length > 0")
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

			//- .reject-setting
				label.checkbox
					input#setReject(type="checkbox" name="checkbox" v-model="rejectSetting")
					span.label-checkbox 결재 도중 반려와 상관없이 모든 결재자의 결재를 진행합니다.<br>(미체크 경우, 결재 도중 반려시 해당 결재서류 회수)

			.button-wrap
				template(v-if="isTemplateMode")
					button.btn.bg-gray.btn-cancel(type="button" @click="router.push('/admin/list-form')") 취소
					button.btn(type="button" @click="saveDocForm") 저장

				template(v-else)
					template(v-if="isTempSaveMode")
						button.btn.bg-gray.btn-cancel(type="button" @click="cancelTempSave") 취소
					template(v-else)
						button.btn.bg-gray.btn-cancel(type="button" @click="step = 1; formCategory = 'master'; rejectSetting = false") 취소
					button.btn.outline.bg-gray.btn-save-myform(type="button" @click="saveMyDocForm") 양식저장
					button.btn.outline.btn-tempsave(type="button" @click="tempSaveMyDoc") 임시저장
					button.btn(type="submit") 결재요청

//- Modal - 작성란 추가
#modal.modal.row-title(v-if="isRowModalOpen" @click="closeRowModal")
	.modal-cont(@click.stop)
		.modal-header
			h2.title 행 추가
			button.btn-close(type="button" @click="closeRowModal")
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
		.modal-body
			p 추가할 행의 제목을 입력해주세요.
			.input-wrap(style="margin-top: 1rem;")
				input#add_row_title(type="text" placeholder="ex. 시행자, 시행일자 ...")
		.modal-footer(style="padding-top: 0; border-top: none;")
			button.btn.bg-gray.btn-cancel(type="button" @click="closeRowModal") 취소
			button.btn.btn-save(type="button" @click="addRow") 추가

//- Modal - 결재자 선택
#modal.modal.select-approver(v-if="isModalOpen" @click="closeModal")
	.modal-cont(@click.stop)
		.modal-header
			h2.title 라인 선택
			button.btn-close(type="button" @click="closeModal")
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
		.modal-body
			.select-approver-wrap
				.organigram-wrap
					Organigram(:selectedEmployees="selectedUsers" :excludeCurrentUser="true" :useCheckbox="true" :selectedAuditors="selectedAuditors" :onlyMyDepartment="true" @selection-change="handleOrganigramSelection")

				br

				.table-wrap
					.tb-overflow(v-if="selectedUsers.length > 0")
						table.table#selected_auditors
							colgroup
								col(style="width: 8%")
								col(style="width: 3%")
								col(style="width: 34%")
								col(style="width: 15%")
								col(style="width: 15%")
								col(style="width: 30%")
								col(style="width: 10%")
							thead
								tr
									th 
									th NO
									th 타입
									th 직급
									th 이름
									th 부서
									th 정렬
									
							tbody
								tr(v-for="(user, index) in selectedUsers" :key="user.data.user_id")
									td
										button.btn-remove(@click="removeAuditor(user)")
											.icon
												svg
													use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")
									td {{ index + 1 }}
									td 
										.input-wrap.user-role
											select(v-model="user.role" @change="checkRole(user)")
												option(value="approvers" selected) 결재
												option(value="agreers") 합의
												option(value="receivers") 수신참조
									td {{ user.index.name.split('.')[1] }}
									td {{ user.index.value }}
									td {{ divisionNameList[user.index.name.split('.')[0]] }}
									td
										.btn-wrap.btn-sort
											button.btn-sort-up.icon(type="button" @click="moveUser(user, 'up')" :disabled="user.sortable === false")
												svg
													use(xlink:href="@/assets/icon/material-icon.svg#icon-sort-up")
											button.btn-sort-down.icon(type="button" @click="moveUser(user, 'down')" :disabled="user.sortable === false")
												svg
													use(xlink:href="@/assets/icon/material-icon.svg#icon-sort-down")

					span.empty(v-else) 선택된 결재자가 없습니다.
		.modal-footer
			button.btn.bg-gray.btn-cancel(type="button" @click="closeModal") 취소
			button.btn.btn-save(type="submit" @click="saveAuditor") 저장

// button.btn.outline.btn-new(type="button" @click="testDelete") delete
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { skapi, mainPageLoading, RealtimeCallback } from '@/main.ts';
import { user, makeSafe, verifiedEmail } from '@/user.ts';
import { divisionNameList } from '@/division.ts';
import { reRequestData } from '@/audit.ts';

import Organigram from '@/components/organigram.vue';
import Wysiwyg from '@/components/wysiwyg.vue';

const router = useRouter();
const route = useRoute();

// 결재 요청시 순서 지정
// 결재자가 지정한 순서대로 결재 진행 -> 한명 끝나면 다음 사람이 결재 진행할 수 있도록
// 알람도 순서대로 한명씩한테만 가게 (결재요청자한테는 결재완료될때마다 알림 전송 - 기존처럼 하면 됨)

// 결재자 선택 모달 ::
// 결재자 선택시 좌측에 순서 표시 (수신참조로 선택한 경우에는 맨아래로 가게 - 순서 포함X)
// 우측에는 sort 기능 버튼 넣어서 사용자가 순서 지정할 수 있게
// 사용자가 선택한 순서대로 결재, 합의에 숫자 표시되어야 함

const isTemplateMode = computed(() => route.query.mode === 'template'); // 결재 양식 관리 > 등록 경로인지 확인
const isTempSaveMode = computed(() => route.query.mode === 'tempsave'); // 임시 저장 경로인지 확인
const isReRequestMode = computed(() => route.query.mode === 'reRequest'); // 재요청 모드인지 확인

// const testDelete = () => {
//   skapi
//     .deleteRecords({
//       record_id: 'UjHCkckVC1ogfDF6'
//     })
//     .then((res) => {
//       console.log('삭제완');
//     });
// };

// 페이지 제목 변경
const pageTitle = computed(() => {
  return route.query.mode === 'template' ? '결재 양식 등록' : '결재 작성';
});

const isModalOpen = ref(false);
const isRowModalOpen = ref(false); // 작성란 추가 모달
const showBackStep = ref(true);
const isDesktop = ref(window.innerWidth > 768);

const selectedUsers = ref([]); // 조직도에서 선택된 직원
const selectedUsersOrder = ref([]); // 결재자 순서

// 결재자 정보 저장
const selectedAuditors = ref({
  approvers: [], // 결재
  agreers: [], // 합의
  receivers: [] // 수신참조
});

const formCategory = ref('master'); // 결재 양식 카테고리
const masterForms = ref([]); // 기본 결재 양식
const myForms = ref([]); // 나의 결재 양식
const selectedForm = ref([]); // 선택된 결재 양식
const tempSaveData = ref([]); // 임시 저장된 결재 양식
const isFormSelected = ref(false); // 양식이 선택되었는지 여부
const rejectSetting = ref(false); // 반려 설정 관련 체크박스

const prevSelected = ref([]);
const backupSelected = ref(null); // 선택된 결재자 백업
const same_division_auditors = ref({}); // 동일 부서 직원 목록
let send_auditors_arr = [];

const uploadedFile = ref([]);
const backupUploadFile = ref([]);
const removeFileList = ref([]);
const fileNames = ref([]);

const addRows = ref([]);
let step = ref(1);
const formTitle = ref(''); // 상단 양식 제목 (ex.마스터가 저장한 양식제목)
const auditTitle = ref(''); // 결재건 제목
const disabled = ref(false);
const temploading = ref(false);

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

// 결재라인 모달 열기
const openModal = () => {
  // isTemplateMode 경우에는 결재라인 선택 불가
  // if (isTemplateMode.value) return;

  // 열렸을 때 selectedAuditors 전체를 original로 백업
  backupSelected.value = {
    approvers: [...selectedAuditors.value.approvers],
    agreers: [...selectedAuditors.value.agreers],
    receivers: [...selectedAuditors.value.receivers]
  };

  // selectedAuditors에 있는 모든 유저를 selectedUsers에 추가
  selectedUsers.value = [];

  // selectedAuditors의 각 역할에 따라 selectedUsers에 추가
  for (const role in selectedAuditors.value) {
    selectedAuditors.value[role].forEach((user) => {
      const userCopy = JSON.parse(JSON.stringify(user)); // 깊은 복사 하여 참조를 끊어줌

      userCopy.role = role;
      userCopy.sortable = role !== 'receivers';
      selectedUsers.value.push(userCopy);
    });
  }

  selectedUsers.value = selectedUsers.value.sort((a, b) => a.order - b.order);
  console.log('selectedUsers.value : ', selectedUsers.value);
  prevSelected.value = selectedUsers.value;

  // 모달이 열릴 때 본인 부서 직원만 보이도록 새로 조직도 데이터 가져오기
  // getOrganigram(true, true);

  isModalOpen.value = true;
};

// 결재라인 모달 닫기
const closeModal = () => {
  if (backupSelected.value) {
    selectedAuditors.value = {
      approvers: [...backupSelected.value.approvers],
      agreers: [...backupSelected.value.agreers],
      receivers: [...backupSelected.value.receivers]
    };

    // // 모든 사용자의 role을 '결재'로 초기화
    // selectedUsers.value.forEach((user) => {
    //   user.role = 'approvers';
    // });
  } else {
    selectedAuditors.value = {
      approvers: [],
      agreers: [],
      receivers: []
    };
  }

  selectedUsers.value = [];
  selectedUsersOrder.value = [];

  backupSelected.value = null;
  isModalOpen.value = false;
};

// 작성란 추가 모달 닫기
const closeRowModal = () => {
  isRowModalOpen.value = false;
};

// 작성란 삭제
const removeRow = (event, index) => {
  addRows.value.splice(index, 1);
};

// 결재요청 미리보기
const previewAudit = () => {
  const printArea = document.getElementById('printArea');

  // 프린트 전에 input 값들을 span으로 변환
  const prepareForPrint = () => {
    cleanupAfterPrint(); // 기존에 추가된 span 제거

    const inputs = printArea.querySelectorAll('input:not([type="hidden"]), textarea');
    inputs.forEach((input) => {
      const value = input.value;

      // 입력값을 표시할 span 생성
      const span = document.createElement('span');
      span.className = 'print-value';
      span.textContent = value;

      // input 바로 뒤에 span 삽입
      input.parentNode.insertBefore(span, input.nextSibling);

      if (
        span.previousElementSibling?.classList.contains('print-value') ||
        span.previousElementSibling?.id === 'inp_content'
      ) {
        span.style.display = 'none';
      }

      // input을 숨김
      input.style.display = 'none';
    });
  };

  // 프린트 후 추가했던 span 제거 및 input 복원
  const cleanupAfterPrint = () => {
    const printValues = printArea.querySelectorAll('.print-value');
    printValues.forEach((span) => span.remove());

    const inputs = printArea.querySelectorAll('input:not([type="hidden"]), textarea');
    inputs.forEach((input) => {
      input.style.display = '';
    });
  };

  // 동적으로 스타일 추가
  const addPrintStyle = () => {
    const style = document.createElement('style');
    style.id = 'print-style';
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #printArea, #printArea * { visibility: visible !important; }
        #printArea { position: absolute; left: 0; top: 0; width: 100%; }
      }
    `;
    document.head.appendChild(style);
  };

  // 스타일 제거
  const removePrintStyle = () => {
    const style = document.getElementById('print-style');
    if (style) {
      style.remove();
    }
  };

  window.onbeforeprint = function () {
    prepareForPrint();
    addPrintStyle();
  };

  window.onafterprint = function () {
    cleanupAfterPrint();
    removePrintStyle();
  };

  window.print();
};

// 작성란 추가
const addRow = () => {
  if (!document.getElementById('add_row_title').value) {
    alert('제목을 입력해주세요.');
    return;
  }

  addRows.value.push({
    title: document.getElementById('add_row_title').value,
    value: ''
  });

  isRowModalOpen.value = false;
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

// 결재라인 모달에서 조직도 선택시
const handleOrganigramSelection = (users) => {
  console.log(users);
  // 선택된 유저들을 초기 처리
  users.forEach((user) => {
    // 선택된 유저들에게 role 정보가 없으면 추가
    if (!user.role) {
      user.role = 'approvers';
    }

    // 결재자 순서 정렬 설정
    if (user.sortable === undefined) {
      // receivers 역할이면 정렬 불가능으로 설정
      user.sortable = user.role !== 'receivers';
    }
  });

  // 수신참조자와 그 외(결재자/합의자)로 분리
  const receiversUsers = users.filter((user) => user.role === 'receivers');
  const nonReceiversUsers = users.filter((user) => user.role !== 'receivers');

  // 비-receivers 사용자들을 먼저 배치하고, 그 뒤에 receivers 사용자들을 배치
  selectedUsers.value = [...nonReceiversUsers, ...receiversUsers];

  // 순서(order) 할당
  // 결재자와 합의자는 현재 배열 순서대로 번호 부여
  let orderCounter = 1;

  selectedUsers.value.forEach((user) => {
    if (user.role !== 'receivers') {
      user.order = orderCounter++;
    }
  });

  // 수신참조자는 별도의 카운터로 순서 부여 (선택적)
  let receiverCounter = 1;
  selectedUsers.value.forEach((user) => {
    if (user.role === 'receivers') {
      user.order = receiverCounter++;
    }
  });

  // 선택된 유저들의 순서 저장
  selectedUsersOrder.value = selectedUsers.value.map((user) => ({
    user_id: user.data.user_id,
    order: user.order,
    type: user.role
  }));
};

// 수신참조자로 선택되면 선택된 결재자에서 가장 아래로 이동
const checkRole = (user) => {
  // 이전 역할 저장
  const previousRole = user.role;

  // 새로운 역할로 변경된 경우
  if (user.role === 'receivers') {
    // receivers로 변경된 경우: 배열에서 제거하고 마지막에 추가
    const index = selectedUsers.value.findIndex((u) => u.data.user_id === user.data.user_id);
    if (index !== -1) {
      selectedUsers.value.splice(index, 1);
      selectedUsers.value.push(user);
    }

    user.sortable = false;

    // 순서 재할당
    reorderUsers();
  } else if (previousRole === 'receivers') {
    // receivers에서 다른 역할로 변경된 경우
    user.sortable = true;

    // 비-receivers 그룹 중 마지막에 배치
    const index = selectedUsers.value.findIndex((u) => u.data.user_id === user.data.user_id);
    if (index !== -1) {
      // 현재 사용자를 제거
      selectedUsers.value.splice(index, 1);

      // receivers와 non-receivers 분리
      const receivers = selectedUsers.value.filter((u) => u.role === 'receivers');
      const nonReceivers = selectedUsers.value.filter((u) => u.role !== 'receivers');

      // non-receivers 끝에 현재 사용자 추가 + receivers 추가
      selectedUsers.value = [...nonReceivers, user, ...receivers];

      // 순서 재할당
      reorderUsers();
    }
  } else {
    // 두 역할 모두 non-receivers인 경우 (approvers <-> agreers)
    // 순서는 그대로 유지하고 역할만 변경
    user.sortable = true;
  }
};

// 모든 사용자의 순서를 재할당하는 유틸리티 함수
const reorderUsers = () => {
  // 결재자와 합의자 순서 번호 재할당
  let orderCounter = 1;
  selectedUsers.value.forEach((user) => {
    if (user.role !== 'receivers') {
      user.order = orderCounter++;
    }
  });

  // 수신참조자 순서 번호 재할당 (선택적)
  let receiverCounter = 1;
  selectedUsers.value.forEach((user) => {
    if (user.role === 'receivers') {
      user.order = receiverCounter++;
    }
  });

  // 선택된 유저들의 순서 정보 업데이트
  selectedUsersOrder.value = selectedUsers.value.map((user) => ({
    user_id: user.data.user_id,
    order: user.order,
    type: user.role
  }));
};

// 선택된 모든 결재자 ID 목록 가져오기
const getAllSelectedUserIds = () => {
  const result = {};

  Object.keys(selectedAuditors.value).forEach((type) => {
    result[type] = selectedAuditors.value[type].map((auditor) => auditor.data.user_id);
  });

  return result;
};

// 결재자 저장
const saveAuditor = () => {
  selectedAuditors.value.agreers = [];
  selectedAuditors.value.approvers = [];
  selectedAuditors.value.receivers = [];

  // user.role에 따라 approvers, agreers, receivers에 추가
  selectedUsers.value.forEach((user) => {
    const userCopy = JSON.parse(JSON.stringify(user)); // 깊은 복사 하여 참조를 끊어줌
    selectedAuditors.value[user.role].push(userCopy);
  });

  backupSelected.value = null;
  isModalOpen.value = false;
};

// 결재자 제거
const removeAuditor = (user, type) => {
  const newAuditors = selectedUsers.value.filter((u) => u.data.user_id !== user.data.user_id);

  selectedUsers.value = newAuditors;
};

// 에디터 준비 후 테이블 편집 기능 활성화
const handleEditorReady = (status) => {
  editorIsReady.value = status;

  // 에디터가 준비되었을 때
  if (status) {
    setTimeout(() => {
      const editorElement = document.getElementById('myeditor');
      if (editorElement) {
        if (
          (isTempSaveMode.value && tempSaveData.value?.data?.form_content) ||
          (isReRequestMode.value && reRequestData.value?.data?.to_audit_content) ||
          selectedForm.value?.data?.form_content
        ) {
          console.log('에디터 준비 완료');
          activateTableEditing(editorElement);
        }
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

  console.log('uploadedFile.value : ', uploadedFile.value);
  console.log('fileNames.value : ', fileNames.value);
};

// let cancelRemoveFile = (item) => {
//   removeFileList.value = removeFileList.value.filter((id) => id !== item.record_id);
// };

// 파일 추가시 파일명 표시
let updateFileList = (e) => {
  // let target = e.target;
  // console.log('target : ', target);

  // if (target.files) {
  //   fileNames.value = Array.from(target.files).map((file) => file.name);
  //   console.log('fileNames.value : ', fileNames.value);
  // }

  const newFiles = Array.from(e.target.files);
  uploadedFile.value.push(...newFiles);
  fileNames.value = uploadedFile.value.map((file) => file.name || file.filename);
  e.target.value = ''; // input 초기화 (같은 파일 다시 업로드 가능하게)

  console.log('newFiles : ', newFiles);
  console.log('uploadedFile.value : ', uploadedFile.value);
  console.log('fileNames.value : ', fileNames.value);
  console.log('isFormSelected.value : ', isFormSelected.value);
};

// 결재 서류 레코드 생성 (결재자 순서 지정)
const postAuditDoc = async ({ docform_title, to_audit, to_audit_content }) => {
  // order 추가한 결재자 정보
  const send_auditors_data = {
    approvers: selectedAuditors.value.approvers.map((user) => ({
      user_id: user.data.user_id.replaceAll('-', '_'),
      order: user.order
    })),

    // agreers도 마찬가지로 order 정보 추가
    agreers: selectedAuditors.value.agreers.map((user) => ({
      user_id: user.data.user_id.replaceAll('-', '_'),
      order: user.order || 0
    })),

    // receivers는 순서가 중요하지 않을 수 있지만 일관성을 위해 추가
    receivers: selectedAuditors.value.receivers.map((user) => ({
      user_id: user.data.user_id.replaceAll('-', '_'),
      order: user.order || 0
    }))
  };

  // 태그 배열 생성 부분도 수정 (태그 형식을 유지하되 순서 정보는 auditors 객체에 저장)
  send_auditors_arr = [
    ...send_auditors_data.approvers.map((item) => `approvers:${item.user_id}`),
    ...send_auditors_data.agreers.map((item) => `agreers:${item.user_id}`),
    ...send_auditors_data.receivers.map((item) => `receiver:${item.user_id}`)
  ];

  try {
    // 첨부파일 업로드
    const filebox = document.querySelector('input[name="additional_data"]');
    const additionalFormData = new FormData();

    additionalFormData.append('docform_title', docform_title);
    additionalFormData.append('to_audit', to_audit);
    additionalFormData.append('auditors', JSON.stringify(send_auditors_data));
    additionalFormData.append('to_audit_content', to_audit_content);
    additionalFormData.append('reject_setting', rejectSetting.value);
    additionalFormData.append('custom_rows', JSON.stringify(addRows.value));

    // 만약 첨부파일이 있는 결재 양식 선택시
    // for (const file of uploadedFile.value) {
    //   // 가져온 파일 데이터를 Blob으로 변환
    //   const blob = await skapi.getFile(file.url, {
    //     dataType: 'blob'
    //   });

    //   console.log('blob : ', blob);

    //   console.log('AA : ', file.filename, { type: blob.type });

    //   // Blob에 원래 파일 이름을 붙여 File 객체 생성
    //   const fileObject = new File([blob], file.filename, { type: blob.type });

    //   // FormData에 추가
    //   additionalFormData.append('additional_data', fileObject);
    // }

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
        name: 'audit_doc',
        access_group: 'private' // 프라빗으로 올려야 결재자만 접근 가능
      },
      index: {
        name: 'to_audit', // 결재 사안 제목. 제목별로 찾을때 위한 인덱싱
        value: to_audit.replaceAll('.', '_')
      },
      source: {
        prevent_multiple_referencing: true // 중복 결재 방지
      },
      tags: send_auditors_arr, // 결재, 합의, 수신참조 태그를 각각 구분,
      data: {
        reject_setting: rejectSetting.value
      }
    };

    const res = await skapi.postRecord(additionalFormData, options);
    console.log('== postAuditDoc == res : ', res);

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
  //     ...selectedAuditors.value.approvers,
  //     ...selectedAuditors.value.agreers
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
    let to_audit = document.getElementById('to_audit').value;

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
              docform_title: docform_title,
              to_audit: to_audit,
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
          docform_title: docform_title,
          to_audit: to_audit,
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
  auditTitle,
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
      audit_title: auditTitle
    });

    // 알림 전송
    return createAuditRequest(
      {
        audit_id: auditId,
        auditor_id: userId,
        role: role,
        form_title: formTitle,
        audit_title: auditTitle
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
const requestAudit = async (e) => {
  e.preventDefault();

  // 결재 내용이 없을 경우 결재 요청 안되게
  if (!editorContent.value || editorContent.value === '<p><br></p>') {
    alert('결재 내용을 입력해주세요.');
    return;
  }

  try {
    const formData = new FormData(e.target);
    formData.set('inp_content', removeButtonTags(editorContent.value)); // editorContent.value가 이미 현재 에디터 내용을 가지고 있음
    formData.append('reject_setting', rejectSetting.value); // 반려 설정 관련 체크박스

    const formValues = Object.fromEntries(formData.entries());

    if (!formValues) return;

    const { docform_title, to_audit, inp_content: to_audit_content } = formValues;

    // 선택된 결재자 확인
    const totalSelectedCount = Object.values(selectedAuditors.value).reduce(
      (sum, users) => sum + users.length,
      0
    );

    if (totalSelectedCount === 0) {
      alert('결재자, 합의자, 수신참조 중 하나 이상을 선택해주세요.');
      return;
    }

    if (
      selectedAuditors.value.approvers.length === 0 &&
      selectedAuditors.value.agreers.length === 0
    ) {
      alert('결재자 또는 합의자를 선택해주세요.');
      return;
    }

    mainPageLoading.value = true;

    // 결재 문서 생성
    const auditDoc = await postAuditDoc({
      docform_title,
      to_audit,
      to_audit_content,
      // roles: getAllSelectedUserIds() // ID 목록만 전달
      reject_setting: rejectSetting.value // 반려 설정 관련 체크박스 값 전달
    });
    console.log('auditDoc : ', auditDoc);

    const auditId = auditDoc.record_id; // 결재 문서 ID
    const formTitle = docform_title; // 상단 양식 제목 (ex.마스터가 저장한 양식제목)
    const auditTitle = to_audit; // 결재건 제목

    // 결재 문서를 레퍼런스하는 결재의견 관련 레코드 생성 (결재자가 의견 작성시 중복 레퍼런스 안돼서)
    // const commentRecord = await skapi.postRecord(null, {
    //   table: {
    //     name: `audit_comment_${auditId}`,
    //     access_group: 'private'
    //   },
    //   reference: `comment:${auditId}`
    // });
    // console.log('commentRecord : ', commentRecord);

    // // 권한 부여
    // const cmtGrantAccess = await grantAuditorAccess({
    //   audit_id: auditId,
    //   auditor_id: commentRecord.user_id
    // });
    // console.log('cmtGrantAccess : ', cmtGrantAccess);

    // 각 역할별 권한 부여 및 알림 전송 (첫번째 순서, 수신참조만)
    // 결재자/합의자를 순서대로 정렬
    // const approversAndAgreers = [
    //   ...selectedAuditors.value.approvers,
    //   ...selectedAuditors.value.agreers
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
      ...selectedAuditors.value.approvers.map((auditor, index) => ({
        userId: auditor.data.user_id,
        role: 'approver',
        order: auditor.order
      })),

      // 합의
      ...selectedAuditors.value.agreers.map((auditor) => ({
        userId: auditor.data.user_id,
        role: 'agreer',
        order: auditor.order
      })),

      // 수신참조
      ...selectedAuditors.value.receivers.map((auditor) => ({
        userId: auditor.data.user_id,
        role: 'receiver',
        order: auditor.order
      }))
    ];
    console.log('processRoles : ', processRoles);

    // const res = await Promise.all(
    //   processRoles.map((roleInfo) =>
    //     postAuditDocRecordId(auditId, auditTitle, roleInfo.userId, roleInfo.role)
    //   )
    // );

    // 결재자와 합의자를 순서대로 통합 정렬
    const approversAndAgreers = [
      ...selectedAuditors.value.approvers,
      ...selectedAuditors.value.agreers
    ].sort((a, b) => a.order - b.order);

    // 통합된 목록에서 첫 번째 사람과 모든 수신참조자
    const notificationTargets = [
      // 첫 번째 결재/합의자 (전체 목록 중 첫 번째)
      ...(approversAndAgreers.length > 0 ? [approversAndAgreers[0]] : []),
      // 모든 수신참조자
      ...selectedAuditors.value.receivers
    ];

    // 모든 결재자에게 문서 권한 및 요청 레코드 생성
    const res = await Promise.all(
      processRoles.map((roleInfo, index) =>
        postAuditDocRecordId(
          auditId,
          formTitle,
          auditTitle,
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
    selectedAuditors.value.approvers = [];
    selectedAuditors.value.agreers = [];
    selectedAuditors.value.receivers = [];

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

// 기존 결재 양식 저장 (마스터가 저장한 결재 양식)
const saveDocForm = async () => {
  console.log('마스터 결재양식 저장');

  // 결재 제목이 없을 경우 저장 불가
  if (!formTitle.value) {
    alert('결재 제목을 입력해주세요.');
    return;
  }

  try {
    // 첨부파일 업로드
    const formData = new FormData();

    formData.append('docform_title', formTitle.value);
    formData.append('form_title', auditTitle.value);
    formData.append('form_content', editorContent.value);
    formData.append('custom_rows', JSON.stringify(addRows.value)); // 추가 행 데이터
    formData.append('reject_setting', rejectSetting.value); // 반려 설정 관련 체크박스

    // 결재자 정보 저장
    const auditorData = {
      approvers: selectedAuditors.value.approvers.map((user) => ({
        user_id: user.data.user_id,
        name: user.index.value,
        position: user.index.name.split('.')[1],
        division: user.index.name.split('.')[0],
        order: user.order // 순서 정보 추가
      })),
      agreers: selectedAuditors.value.agreers.map((user) => ({
        user_id: user.data.user_id,
        name: user.index.value,
        position: user.index.name.split('.')[1],
        division: user.index.name.split('.')[0],
        order: user.order // 순서 정보 추가
      })),
      receivers: selectedAuditors.value.receivers.map((user) => ({
        user_id: user.data.user_id,
        name: user.index.value,
        position: user.index.name.split('.')[1],
        division: user.index.name.split('.')[0],
        order: user.order // 순서 정보 추가
      }))
    };

    formData.append('auditors', JSON.stringify(auditorData ?? []));

    console.log('uploadedFile.value : ', uploadedFile.value);

    // for (const file of uploadedFile.value) {
    //   formData.append('form_data', file);
    // }

    // if (uploadedFile.value.length) {
    //   const filePromises = uploadedFile.value.map(async (file) => {
    //     // 파일 데이터 가져오기
    //     const blob = await skapi.getFile(file.url, { dataType: 'blob' });

    //     // file 객체 생성
    //     return new File([blob], file.filename, { type: blob.type });
    //   });

    //   // 모든 파일 변환이 끝날 때까지 기다림
    //   const fileObjects = await Promise.all(filePromises);

    //   // FormData에 한 번에 추가
    //   fileObjects.forEach((file) => {
    //     formData.append('form_data', file);
    //   });
    // }

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
          formData.append('form_data', file);
        });
    }

    const options = {
      table: {
        name: 'audit_form',
        access_group: 1
      },
      index: {
        name: 'form_title', // 결재 양식 제목. 제목별 검색을 위한 인덱싱
        value: formTitle.value.replaceAll('.', '_')
      }
    };

    console.log('마스터 == formData : ', formData);
    console.log('마스터 == options : ', options);

    const res = await skapi.postRecord(formData, options);
    console.log('마스터 == res : ', res);

    alert('결재 양식이 저장되었습니다.');
    router.push('/admin/list-form');
  } catch (error) {
    console.error('결재 양식 저장 중 오류 발생: ', error);
  }
};

// 내 결재 양식 저장
const saveMyDocForm = async () => {
  console.log('내 결재양식 저장');

  // 결재 제목이 없을 경우 저장 불가
  if (!formTitle.value || !auditTitle.value) {
    alert('결재 제목을 입력해주세요.');
    return;
  }

  try {
    // 첨부파일 업로드
    const formData = new FormData();

    formData.append('docform_title', formTitle.value);
    formData.append('form_title', auditTitle.value);
    formData.append('form_content', editorContent.value);
    formData.append('custom_rows', JSON.stringify(addRows.value ?? [])); // 추가 행 데이터
    formData.append('reject_setting', rejectSetting.value); // 반려 설정 관련 체크박스

    // 결재자 정보 저장
    const auditorData = {
      approvers: selectedAuditors.value.approvers.map((user) => ({
        user_id: user.data.user_id,
        name: user.index.value,
        position: user.index.name.split('.')[1],
        division: user.index.name.split('.')[0],
        order: user.order // 순서 정보 추가
      })),
      agreers: selectedAuditors.value.agreers.map((user) => ({
        user_id: user.data.user_id,
        name: user.index.value,
        position: user.index.name.split('.')[1],
        division: user.index.name.split('.')[0],
        order: user.order // 순서 정보 추가
      })),
      receivers: selectedAuditors.value.receivers.map((user) => ({
        user_id: user.data.user_id,
        name: user.index.value,
        position: user.index.name.split('.')[1],
        division: user.index.name.split('.')[0],
        order: user.order // 순서 정보 추가
      }))
    };

    formData.append('auditors', JSON.stringify(auditorData ?? []));

    // for (const file of uploadedFile.value) {
    //   formData.append('form_data', file);
    // }

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
          formData.append('form_data', file);
        });
    }

    const options = {
      table: {
        name: 'my_audit_form',
        access_group: 1
      },
      index: {
        name: 'form_title', // 제목별 검색을 위한 인덱싱
        value: auditTitle.value.replaceAll('.', '_')
      }
    };
    console.log('내 양식 == formData : ', formData);
    console.log('내 양식 == options : ', options);

    const res = await skapi.postRecord(formData, options);
    console.log('내 양식 == res : ', res);

    alert('결재 양식이 저장되었습니다.');
  } catch (error) {
    console.error('결재 양식 저장 중 오류 발생: ', error);
    alert('결재 양식 저장 중 오류가 발생했습니다.');
  }
};

// 임시 저장
const tempSaveMyDoc = async () => {
  console.log('임시 저장');

  // 결재 제목이 없을 경우 저장 불가
  if (!formTitle.value || !auditTitle.value) {
    alert('결재 제목을 입력해주세요.');
    return;
  }

  try {
    // 첨부파일 업로드
    const filebox = document.querySelector('input[name="additional_data"]');
    const formData = new FormData();

    formData.append('docform_title', formTitle.value);
    formData.append('form_title', auditTitle.value);
    formData.append('form_content', editorContent.value);
    formData.append('custom_rows', JSON.stringify(addRows.value ?? [])); // 추가 행 데이터
    formData.append('reject_setting', rejectSetting.value); // 반려 설정 관련 체크박스

    // 결재자 정보 저장
    const auditorData = {
      approvers: selectedAuditors.value.approvers.map((user) => ({
        user_id: user.data.user_id,
        name: user.index.value,
        position: user.index.name.split('.')[1],
        division: user.index.name.split('.')[0],
        order: user.order // 순서 정보 추가
      })),
      agreers: selectedAuditors.value.agreers.map((user) => ({
        user_id: user.data.user_id,
        name: user.index.value,
        position: user.index.name.split('.')[1],
        division: user.index.name.split('.')[0],
        order: user.order // 순서 정보 추가
      })),
      receivers: selectedAuditors.value.receivers.map((user) => ({
        user_id: user.data.user_id,
        name: user.index.value,
        position: user.index.name.split('.')[1],
        division: user.index.name.split('.')[0],
        order: user.order // 순서 정보 추가
      }))
    };

    formData.append('auditors', JSON.stringify(auditorData ?? []));

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
          formData.append('form_data', file);
        });
    }

    const options = {
      table: {
        name: 'my_tempsave_audit',
        access_group: 'private'
      },
      index: {
        name: 'form_title', // 제목별 검색을 위한 인덱싱
        value: auditTitle.value.replaceAll('.', '_')
      }
    };

    // 임시 저장된 결재 양식이 있는지 확인
    const res = await skapi.getRecords({
      table: {
        name: 'my_tempsave_audit',
        access_group: 'private'
      },
      record_id: route.query.record_id
    });
    console.log('AA == res : ', res);

    console.log('formData : ', formData);
    console.log('route.query.record_id : ', route.query.record_id);

    if (res.list.length === 0 || route.query.record_id === undefined) {
      const res = await skapi.postRecord(formData, options);
      console.log('새로 임시저장됨 == res : ', res);
    } else if (route.query.record_id === res.list[0].record_id) {
      await skapi.deleteRecords({ record_id: res.list[0].record_id }).then((res) => {
        console.log('삭제완');
      });

      await skapi
        .postRecord(formData, {
          table: {
            name: 'my_tempsave_audit',
            access_group: 'private'
          }
        })
        .then((res) => {
          console.log('이전 임시저장 해둬서 업뎃 == res : ', res);
        });
    }

    alert('임시 저장되었습니다.');
    router.push({ path: '/approval/audit-list-tempsave' });
  } catch (error) {
    console.error('임시 저장 중 오류 발생: ', error);
    alert('임시 저장 중 오류가 발생했습니다.');
  }
};

// 마스터가 저장한 결재 양식 가져오기
const getDocForm = async () => {
  try {
    const res = await skapi.getRecords({
      table: {
        name: 'audit_form',
        access_group: 1
      }
    });

    masterForms.value = res.list || [];
    return res;
  } catch (error) {
    console.error('결재 양식 가져오기 중 오류 발생: ', error);
  }
};

// 내 결재 양식 가져오기
const getMyDocForm = async () => {
  try {
    const res = await skapi.getRecords({
      table: {
        name: 'my_audit_form',
        access_group: 1
      }
    });

    myForms.value = res.list || [];
    return res;
  } catch (error) {
    console.error('결재 양식 가져오기 중 오류 발생: ', error);
  }
};

// 임시 저장 리스트 가져오기
const getTempSaveMyDocList = async () => {
  try {
    const res = await skapi.getRecords({
      table: {
        name: 'my_tempsave_audit',
        access_group: 'private'
      }
    });
    console.log('임시저장 : ', res);

    return res;
  } catch (error) {
    console.error('결재 양식 가져오기 중 오류 발생: ', error);
  }
};

// 임시 저장 내용 가져오기
const getTempSaveMyDocCont = async () => {
  if (route.query.mode === 'tempsave' && route.query.record_id) {
    try {
      const res = await skapi.getRecords({
        table: {
          name: 'my_tempsave_audit',
          access_group: 'private'
        },
        record_id: route.query.record_id
      });
      console.log('임시저장 내용 == res : ', res);

      temploading.value = true;

      if (res.list && res.list.length > 0) {
        tempSaveData.value = res.list[0];

        // 폼 데이터 채우기
        formTitle.value = tempSaveData.value.data.docform_title;
        auditTitle.value = tempSaveData.value.data.form_title;
        editorContent.value = tempSaveData.value.data.form_content;

        // 반려 설정
        if (tempSaveData.value.data.reject_setting !== undefined) {
          rejectSetting.value =
            tempSaveData.value.data.reject_setting === 'true' ||
            tempSaveData.value.data.reject_setting === true;
        } else {
          rejectSetting.value = false;
        }

        // 추가 행 데이터
        if (tempSaveData.value.data.custom_rows) {
          addRows.value = JSON.parse(tempSaveData.value.data.custom_rows);
        }

        // 결재자 정보
        if (tempSaveData.value.data.auditors) {
          const auditors = JSON.parse(tempSaveData.value.data.auditors);
          console.log('auditors : ', auditors);

          // 순서 정보를 포함한 결재자 변환 함수
          const convertAuditorFormatWithOrder = (auditors, role) => {
            return auditors.map((auditor) => ({
              data: { user_id: auditor.user_id },
              index: {
                value: auditor.name,
                name: `${auditor.division}.${auditor.position}`
              },
              role: role,
              order: auditor.order || 0,
              sortable: role !== 'receivers'
            }));
          };

          selectedAuditors.value = {
            approvers: convertAuditorFormatWithOrder(auditors.approvers || [], 'approvers'),
            agreers: convertAuditorFormatWithOrder(auditors.agreers || [], 'agreers'),
            receivers: convertAuditorFormatWithOrder(auditors.receivers || [], 'receivers')
          };

          // 결재자 순서대로 정렬
          selectedAuditors.value.approvers.sort((a, b) => (a.order || 0) - (b.order || 0));
          selectedAuditors.value.agreers.sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        console.log('tempSaveData.value : ', tempSaveData.value);

        // 첨부파일이 있는 경우
        if (tempSaveData.value.bin && tempSaveData.value.bin.form_data) {
          console.log('AAA');
          console.log('isFormSelected.value : ', isFormSelected.value);
          uploadedFile.value = tempSaveData.value.bin.form_data;
          console.log('uploadedFile.value : ', uploadedFile.value);
        }
      }

      return res;
    } catch (error) {
      console.error('임시 저장 내용 불러오기 중 오류 발생:', error);
    }
  }
};

// 결재자 정보 변환 함수
const convertAuditorFormat = (auditors, role) => {
  return auditors.map((auditor) => ({
    data: { user_id: auditor.user_id },
    index: {
      value: auditor.name,
      name: `${auditor.division}.${auditor.position}`
    },
    role: role
  }));
};

// 결재자 순서 변경 버튼
const moveUser = (user, direction) => {
  if (direction === 'up') {
    // 현재 선택된 사용자의 인덱스 찾기
    const currentIndex = selectedUsers.value.findIndex((u) => u.data.user_id === user.data.user_id);

    // 이미 첫 번째 항목이면 변경 없음
    if (currentIndex <= 0) return;

    // 바로 위 항목이 "receivers" 역할을 가진 경우 이동 불가능
    if (selectedUsers.value[currentIndex - 1].role === 'receivers') return;

    // 배열 복사
    const newSelectedUsers = [...selectedUsers.value];

    // 현재 항목을 한 단계 위로 이동 (인덱스 감소)
    const temp = newSelectedUsers[currentIndex];
    newSelectedUsers[currentIndex] = newSelectedUsers[currentIndex - 1];
    newSelectedUsers[currentIndex - 1] = temp;

    // 변경된 배열 저장
    selectedUsers.value = newSelectedUsers;

    // 순서 재할당
    reorderUsers();
  } else {
    // 현재 선택된 사용자의 인덱스 찾기
    const currentIndex = selectedUsers.value.findIndex((u) => u.data.user_id === user.data.user_id);

    // 이미 마지막 항목이면 변경 없음
    if (currentIndex >= selectedUsers.value.length - 1) return;

    // 만약 현재 항목이 "receivers" 역할이 아닌데 바로 아래 항목이 "receivers" 역할이면 이동 불가능
    if (user.role !== 'receivers' && selectedUsers.value[currentIndex + 1].role === 'receivers')
      return;

    // 배열 복사
    const newSelectedUsers = [...selectedUsers.value];

    // 현재 항목을 한 단계 아래로 이동 (인덱스 증가)
    const temp = newSelectedUsers[currentIndex];
    newSelectedUsers[currentIndex] = newSelectedUsers[currentIndex + 1];
    newSelectedUsers[currentIndex + 1] = temp;

    // 변경된 배열 저장
    selectedUsers.value = newSelectedUsers;

    // 순서 재할당
    reorderUsers();
  }
};

// 결재 양식 선택
const selDocForm = async (e) => {
  // 선택된 record_id로 양식 찾기
  let selectedFormId = e.target.value;

  // 카테고리에 따라 적절한 목록에서 양식 찾기
  if (formCategory.value === 'master') {
    selectedForm.value = masterForms.value.find((form) => form.record_id === selectedFormId);
  } else if (formCategory.value === 'mine') {
    selectedForm.value = myForms.value.find((form) => form.record_id === selectedFormId);
  }

  isFormSelected.value = !!selectedForm.value;

  // 선택된 양식이 있으면 데이터 채우기
  if (selectedForm.value) {
    formTitle.value = selectedForm.value.data.docform_title;
    auditTitle.value = selectedForm.value.data.form_title || '';
    editorContent.value = selectedForm.value.data.form_content;

    // 결재자
    if (selectedForm.value.data.auditors) {
      const auditors = JSON.parse(selectedForm.value.data.auditors);

      if (auditors) {
        // 순서 정보가 있는 개선된 convertAuditorFormat 함수
        const convertAuditorFormatWithOrder = (auditors, role) => {
          return auditors.map((auditor) => ({
            data: { user_id: auditor.user_id },
            index: {
              value: auditor.name,
              name: `${auditor.division}.${auditor.position}`
            },
            role: role,
            order: auditor.order || 0, // 저장된 순서 정보 사용, 없으면 0
            sortable: role !== 'receivers' // receivers는 정렬 불가능
          }));
        };

        selectedAuditors.value = {
          approvers: convertAuditorFormatWithOrder(auditors.approvers || [], 'approvers'),
          agreers: convertAuditorFormatWithOrder(auditors.agreers || [], 'agreers'),
          receivers: convertAuditorFormatWithOrder(auditors.receivers || [], 'receivers')
        };

        // 결재자 순서대로 정렬
        selectedAuditors.value.approvers.sort((a, b) => (a.order || 0) - (b.order || 0));
        selectedAuditors.value.agreers.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
    } else {
      selectedAuditors.value = {
        approvers: [],
        agreers: [],
        receivers: []
      };
    }

    // 추가 행 데이터
    if (selectedForm.value.data.custom_rows) {
      addRows.value = JSON.parse(selectedForm.value.data.custom_rows);
    } else {
      addRows.value = [];
    }

    // 첨부파일이 있는 경우
    if (selectedForm.value.bin.form_data) {
      uploadedFile.value = selectedForm.value.bin.form_data;
    } else {
      uploadedFile.value = [];
      fileNames.value = [];
    }

    // 체크박스 설정 불러오기
    if (selectedForm.value.data.reject_setting !== undefined) {
      rejectSetting.value =
        selectedForm.value.data.reject_setting === 'true' ||
        selectedForm.value.data.reject_setting === true;
    } else {
      rejectSetting.value = false;
    }
  }
};

// 새로운 결재 양식 작성
const newWriteAudit = () => {
  step.value = 2;

  formTitle.value = '';
  auditTitle.value = '';
  editorContent.value = '';
  selectedForm.value = [];
  selectedAuditors.value = {
    approvers: [],
    agreers: [],
    receivers: []
  };
  addRows.value = [];
  uploadedFile.value = [];
  fileNames.value = [];
  rejectSetting.value = false;

  // 결재라인 select option '결재'로 초기화
  selectedUsers.value.forEach((user) => {
    user.role = 'approvers';
  });

  // 결재자 선택 모달 체크박스 초기화
  selectedUsers.value = [];
  selectedAuditors.value.approvers = [];
  selectedAuditors.value.agreers = [];
  selectedAuditors.value.receivers = [];
};

// isTempSaveMode에서 취소버튼 클릭시
const cancelTempSave = () => {
  console.log('임시저장 취소');

  router.push({ path: '/approval/audit-list-tempsave' });
  formCategory.value = 'master';
  rejectSetting.value = false;

  alert('해당 페이지에서 벗어나면 수정 내용이 저장되지 않습니다.');
};

const dateValue = ref(new Date().toISOString().substring(0, 10));

const updateScreenSize = () => {
  isDesktop.value = window.innerWidth > 768;
};

onMounted(async () => {
  window.addEventListener('resize', updateScreenSize);
  getDocForm();
  getMyDocForm();

  // 임시 저장 모드인 경우 해당 내용 불러오기
  if (isTempSaveMode.value) {
    getTempSaveMyDocCont();
  }

  // 재요청 모드인 경우 바로 step 2로 이동
  if (isReRequestMode.value && reRequestData.value && reRequestData.value.data) {
    step.value = 2;
    temploading.value = true;
    console.log('== onMounted == reRequestData : ', reRequestData.value);

    // 결재 제목 설정
    formTitle.value = reRequestData.value.data.docform_title;
    auditTitle.value = reRequestData.value.data.to_audit;

    // 에디터 내용 설정
    editorContent.value = reRequestData.value.data.to_audit_content;

    // 반려 설정 불러오기
    if (reRequestData.value.data.reject_setting !== undefined) {
      rejectSetting.value =
        reRequestData.value.data.reject_setting === 'true' ||
        reRequestData.value.data.reject_setting === true;
    } else {
      rejectSetting.value = false;
    }

    // 추가 행 데이터 불러오기
    if (reRequestData.value.data.custom_rows) {
      try {
        addRows.value = JSON.parse(reRequestData.value.data.custom_rows);
      } catch (e) {
        console.error('Custom rows parsing error:', e);
        addRows.value = [];
      }
    }

    // 첨부파일이 있는 경우
    if (reRequestData.value.bin && reRequestData.value.bin.form_data) {
      uploadedFile.value = reRequestData.value.bin.form_data;
      console.log('uploadedFile : ', uploadedFile.value);
    }

    // 결재자 정보 불러오기
    if (reRequestData.value.data.auditors) {
      try {
        // 직원 목록 조회
        const empList = await skapi.getRecords({
          table: {
            name: 'emp_position_current',
            access_group: 1
          }
        });

        // 직원 정보 맵 생성
        const empMap = {};
        if (empList && empList.list) {
          empList.list.forEach((emp) => {
            if (emp.data && emp.data.user_id) {
              // 전체 직원 정보를 저장
              empMap[emp.data.user_id] = {
                division: emp.index.name.split('.')[0],
                name: emp.index.value,
                user_id: emp.data.user_id,
                position: emp.index.name.split('.')[1]
              };
            }
          });
        }

        // 결재자 정보 파싱
        const auditors = JSON.parse(reRequestData.value.data.auditors);

        // 결재자 데이터 변환 함수
        const convertAuditors = (auditorsList, role) => {
          return (auditorsList || []).map((auditor) => {
            const userId = auditor.user_id.replaceAll('_', '-');

            return {
              data: { user_id: userId },
              index: {
                value: empMap[userId] ? empMap[userId].name : '',
                name: empMap[userId] ? `${empMap[userId].division}.${empMap[userId].position}` : ''
              },
              role: role,
              order: auditor.order || 0, // 순서 정보 추가
              sortable: role !== 'receivers' // receivers는 정렬 불가능
            };
          });
        };

        // 결재자 정보 설정
        selectedAuditors.value = {
          approvers: convertAuditors(auditors.approvers, 'approvers'),
          agreers: convertAuditors(auditors.agreers, 'agreers'),
          receivers: convertAuditors(auditors.receivers, 'receivers')
        };
        console.log('selectedAuditors : ', selectedAuditors.value);

        // 결재자 순서대로 정렬
        selectedAuditors.value.approvers.sort((a, b) => (a.order || 0) - (b.order || 0));
        selectedAuditors.value.agreers.sort((a, b) => (a.order || 0) - (b.order || 0));

        console.log('결재자 정보 설정 완료:', selectedAuditors.value);
      } catch (error) {
        console.error('결재자 정보 처리 중 오류:', error);
      }
    }

    isFormSelected.value = true;
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize);
});
</script>

<style scoped lang="less">
@media print {
  /* 숨기고 싶은 요소 */
  button,
  .btn,
  .icon,
  input,
  textarea,
  .file-wrap .btn-upload-file,
  header,
  .title,
  hr,
  .approver-list:last-of-type,
  .reference-list:last-of-type,
  .empty,
  .essential::after {
    display: none !important;
  }

  body * {
    visibility: hidden;
  }

  #printArea,
  #printArea * {
    visibility: visible; /* printArea와 그 내부 요소만 보이게 설정 */
  }

  #printArea {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }

  body {
    font-size: 12px;
    line-height: 1.5;
    color: black;
    background: transparent;
  }

  table {
    width: 100%;
    border-collapse: collapse;

    th,
    tr,
    td {
      border: 1px solid var(--gray-color-300);
      padding: 8px;
      text-align: left;
      background-color: #fff;
    }

    tr {
      border-right: 1px solid var(--gray-color-300);
    }
  }

  #printArea {
    .title {
      display: block !important;
      margin-bottom: 2rem;

      h2 {
        text-align: center !important;
      }
    }
  }

  input,
  textarea {
    border: none;
    background: none;
  }

  input[type='hidden'],
  textarea {
    display: none !important;
  }

  .wysiwyg-wrap {
    border: none !important;

    // wysiwyg 컴포넌트 내용만 표시
    :deep(.wysiwyg) {
      // 에디터 내용 컨테이너
      ._wysiwyg4all {
        visibility: visible !important;
        padding: 0 !important;
      }

      .btn-wrap {
        display: none !important;
      }
    }

    #tb-auditRequest {
      font-size: 0.75rem;
    }

    .sub-title {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--gray-color-300);
    }

    .reply-list {
      .auditor {
        margin-bottom: 0.75rem;
      }

      .comment {
        border: 1px solid var(--gray-color-300);
        font-size: 0.75rem;
        padding: 0.75rem 1rem;
      }
    }

    .approver-wrap {
      .approver-list {
        min-height: 5rem;

        .auditor {
          .name {
            font-size: 0.75rem;
          }

          .approved {
            font-size: 0.625rem;
          }

          .date {
            font-size: 0.75rem;
          }
        }
      }

      .sign {
        height: 4rem;

        img {
          width: 4rem;
          height: 4rem;
        }
      }
    }

    .input-wrap.upload-file .file-item,
    .selected-wrap.upload-file .file-item {
      border-color: var(--gray-color-400);
    }

    .table {
      tbody {
        th {
          border-right: 1px solid var(--gray-color-300);
          border-left: 1px solid var(--gray-color-300);
        }

        td {
          height: 2rem;
          padding: 0.5rem;
        }
      }

      tr {
        td {
          border-right: 1px solid var(--gray-color-300);
        }
      }
    }
  }

  #main,
  .wrap {
    padding: 0 !important;
  }

  .wrap {
    + .title {
      display: none !important;
    }
  }

  hr {
    display: none !important;
  }

  .form-wrap {
    position: absolute !important;
    top: 5% !important;
    left: 0 !important;
    width: 100% !important;
  }

  .input-title {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.3;
    text-align: center;
  }
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

.modal {
  .modal-cont {
    min-width: 40rem;
    max-width: 100%;
  }
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
