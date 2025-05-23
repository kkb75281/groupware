<template lang="pug">
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
							//- colgroup
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
									td.left
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
											Wysiwyg(ref="myWysiwyg" @editor-ready="handleEditorReady" @update:content="exportWysiwygData" :savedContent="route.query.mode === 'tempsave' ? tempSaveData?.data?.form_content : route.query.mode === 'reRequest' ? reRequestData?.data?.to_audit_content : selectedForm?.data?.form_content" :showBtn="true")
											textarea#inp_content(type="text" placeholder="결재 내용" name="inp_content" v-model="editorContent" hidden)

								tr
									th 첨부 파일
									td(colspan="3")
										.input-wrap.upload-file
											.file-wrap
												.btn-upload-file
													input#file(type="file" name="additional_data" multiple :disabled="verifiedEmail" @change="updateFileList" hidden)
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

								tr
									th 참조 문서
									td(colspan="3")
										.refer-doc-wrap
											button.btn.sm.outline.btn-open-modal(type="button" @click="openReferModal") 참조 문서 추가
											ul.refer-doc-list
												template(v-if="referDoc.length > 0")
													li.refer-doc-item(v-for="(doc, index) in referDoc" :key="index")
														span.refer-doc-name(@click="showDocDetail(doc)") {{ doc.data.to_audit }}
														button.btn-remove.icon(type="button" @click.stop="removeReferDoc(doc, index)")
															svg
																use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")

			.button-wrap
				template(v-if="isTemplateMode")
					button.btn.bg-gray.btn-cancel(type="button" @click="router.push('/admin/list-form')") 취소
					button.btn(type="button" @click="saveDocForm") 저장

				template(v-else)
					template(v-if="isTempSaveMode")
						button.btn.bg-gray.btn-cancel(type="button" @click="cancelTempSave") 취소
					template(v-else)
						button.btn.bg-gray.btn-cancel(type="button" @click="router.back(); formCategory = 'master'; rejectSetting = false") 취소
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

//- 참조 문서 추가
//- Modal - 참조문서 리스트
#modal.modal.modal-refer-list(v-if="isReferModal" @click="closeReferModal")
	.modal-cont(@click.stop)
		.modal-header
			h2.title 참조 문서 추가
			button.btn-close(type="button" @click="closeReferModal")
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-close")

		.modal-body
			.top-wrap
				p.sub-title 참조 문서를 선택 후 추가해주세요.
				.input-wrap.sel-filter
					select(v-model="referDocFilter")
						option(value="all") 전체
						option(value="outDoc") 발신
						option(value="inDoc") 수신
						option(value="referDoc") 수신참조
			
			.refer-list-wrap
				.table-wrap
					.tb-overflow
						table.table#tb-referList
							colgroup
								col(style="width: 8%")
								col
								col(style="width: 15%")
								col(style="width: 15%")
							thead
								tr
									th 선택
									th 결재 사안
									th 결재 현황
									th 기안자
							tbody
								tr(v-for="(doc, index) in filteredReferDocList" :key="doc.record_id")
									td
										label.checkbox
											input(type="checkbox" v-model="doc.selected")
											span.label-checkbox
									td.left
										a.doc-title(href="#" @click="showDocDetail(doc)")
											span.doc-name {{ doc.data.to_audit }}
									td
										span.status(:class="{approve: doc.documentStatus === '완료됨', reject: doc.documentStatus === '회수됨'}") {{ doc.documentStatus }}
									td {{ doc.drafter }}
								tr(v-if="filteredReferDocList.length === 0")
									td(colspan="4")
										span.empty 선택할 참조 문서가 없습니다.

		.modal-footer(style="padding-top: 0; border-top: none;")
			button.btn.bg-gray.btn-cancel(type="button" @click="closeReferModal") 취소
			button.btn.btn-save(type="button" @click="addRefer") 추가

//- Modal - 참조문서 상세
#modal.modal.modal-refer-detail(v-if="isReferDetailModal" @click="closeDocModal")
	.modal-cont(@click.stop)
		.modal-header
			h2.title 문서 상세보기
			button.btn-close(type="button" @click="closeDocModal")
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
		.modal-body
			.doc-cont
				.table-wrap
					.tb-overflow
						table.table#tb-referDetail
							colgroup
								col(style="width: 13%")
								col
								col(style="width: 15%")
								col(style="width: 20%")

							thead
								//- 작성일자 기안사 :: s
								tr.pc(v-show="isDesktop")
									th 작성 일자
									td {{ formatTimestampToDate(currentDetailDoc.uploaded) }}
									th 기안자
									td
										span.drafter {{ currentDetailDoc.drafter  }}

								//- 모바일 경우 레이아웃
								tr.mo(v-show="!isDesktop" style="border-top: 1px solid var(--gray-color-300);")
									th 작성 일자
									td(colspan="3") {{ formatTimestampToDate(currentDetailDoc.uploaded) }}
								tr.mo(v-show="!isDesktop")
									th 기안자
									td(colspan="3" style="text-align: left")
										span.drafter {{ currentDetailDoc.drafter}}
								//- 작성일자 기안사 :: e

								tr.approval(v-if="currentDetailDoc?.approvers?.length > 0")
									th 결재
									td.left(colspan="3" style="padding: 0; height: 119px;")
										ul.approver-wrap
											li.approver-list(v-for="(approver, index) in currentDetailDoc.approvers" :key="index")
												span.num {{ approver.order }}
												span.sign
													span.approved(v-if="approver.approved === 'approve'") 승인
													span.rejected(v-else-if="approver.approved === 'reject'") 반려
													span.waitting(v-else) 대기
												span.approver {{ approver.name }}

								tr.approval(v-if="currentDetailDoc?.agreers?.length > 0")
									th 합의
									td.left(colspan="3" style="padding: 0; height: 119px;")
										ul.approver-wrap
											li.approver-list(v-for="(agreer, index) in currentDetailDoc.agreers" :key="index")
												span.num {{ agreer.order }}
												span.sign
													span.approved(v-if="agreer.approved === 'approve'") 승인
													span.rejected(v-else-if="agreer.approved === 'reject'") 반려
													span.waitting(v-else) 대기
												span.approver {{ agreer.name }}

								tr.reference(v-if="currentDetailDoc?.receivers?.length > 0")
									th 수신 참조
									td.left(colspan="3") {{ currentDetailDoc.receivers.map(receiver => receiver.name).join(', ') }}

								tr
									th 제목
									td.left(colspan="3") {{ currentDetailDoc.data?.to_audit }}

								tr
									th 결재 내용
									td.left(colspan="3")
										._wysiwyg4all(v-html="currentDetailDoc.data?.to_audit_content")

								tr
									th 첨부 파일
									td.left(colspan="3")
										.input-wrap.upload-file
											.file-wrap
												ul.file-list
													template(v-if="modalUploadedFile?.length > 0")
														li.file-item(v-for="(file, index) in modalUploadedFile" :key="index")
															a.file-name(v-if="file.url" :href="file.url" download target="_blank") {{ file.filename }}
															span.only-text(v-else) {{ file.name || file.filename }}
													template(v-else)
														li(style="color:var(--gray-color-300);") 등록된 파일이 없습니다.

								tr
									th 참조 문서
									td.left(colspan="3")
										ul.refer-doc-list
											template(v-if="modalReferDoc?.length > 0")
												li.refer-doc-item(v-for="(doc, index) in modalReferDoc" :key="index")
													span.refer-doc-name {{ doc?.data?.to_audit }}
											template(v-else)
												li(style="color:var(--gray-color-300); text-align: left;") 등록된 참조 문서가 없습니다.

		.modal-footer(style="padding-top: 0; border-top: none;")
			button.btn.bg-gray.btn-cancel(type="button" @click="closeDocModal") 닫기
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { skapi, mainPageLoading } from '@/main.ts';
import { user, makeSafe, verifiedEmail } from '@/user.ts';
import { getUserInfo } from '@/employee.ts';
import { divisionNameList } from '@/division.ts';
import { reRequestData, getAuditList, getSendAuditList, getAuditReferenceList } from '@/audit.ts';
import {
    addResizer,
    bindCellEvents,
    initButtons,
    tableSelection,
    clearSelection
} from '@/components/wysiwygTable.js';

import Organigram from '@/components/organigram.vue';
import Wysiwyg from '@/components/wysiwyg.vue';

const router = useRouter();
const route = useRoute();

const isTemplateMode = computed(() => route.query.mode === 'template'); // 결재 양식 관리 > 등록 경로인지 확인
const isTempSaveMode = computed(() => route.query.mode === 'tempsave'); // 임시 저장 경로인지 확인
const isReRequestMode = computed(() => route.query.mode === 'reRequest'); // 재요청 모드인지 확인

const myWysiwyg = ref(null);
const isModalOpen = ref(false);
const isRowModalOpen = ref(false); // 작성란 추가 모달
const showBackStep = ref(true);
const isDesktop = ref(window.innerWidth > 768);
const loading = ref(false);

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
let send_auditors_arr = [];

const uploadedFile = ref([]);
const fileNames = ref([]);

let step = ref(1);
const addRows = ref([]);
const formTitle = ref(''); // 상단 양식 제목 (ex.마스터가 저장한 양식제목)
const auditTitle = ref(''); // 결재건 제목
const temploading = ref(false);

// 참조문서 관련 변수
const isReferModal = ref(false); // 참조문서 추가 모달
const isReferDetailModal = ref(false); // 참조문서 상세 모달
const referDoc = ref([]); // 선택된 참조문서
const referDocList = ref([]); // 참조문서 목록
const referDocFilter = ref('all'); // 참조문서 필터 (전체, 발신, 수신+수신참조)
const currentDetailDoc = ref(null); // 현재 문서 상세 정보
const modalUploadedFile = ref(null); // 참조문서 첨부파일
const modalReferDoc = ref(null); // 참조문서 모달

// 에디터 상태 관리
const editor = ref(null);
const editorContent = ref('');
const editorIsReady = ref(false);

// 결재라인 모달 열기
const openModal = () => {
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
    prevSelected.value = selectedUsers.value;

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
                    activateTableEditing(editorElement);
                }
            }
        }, 500);
    }
};

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
    editor.value = content;
    editorContent.value = content.html;
};

const importWysiwygData = async () => {
    await myWysiwyg.value.exportData();
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

// 참조문서 권한 부여
const grantReferDocAccess = async (referId, processRoles) => {
    console.log('referId : ', referId);
    console.log('processRoles : ', processRoles);

    try {
        // 모든 결재자 ID 목록 생성
        const allAuditorIds = processRoles.map((role) => role.userId);
        console.log('allAuditorIds : ', allAuditorIds);

        for (const id of referId) {
            await skapi
                .grantPrivateRecordAccess({
                    record_id: id,
                    user_id: allAuditorIds
                })
                .then((res) => {
                    console.log('참조문서 권한 부여 성공 : ', res);
                });
        }
    } catch (error) {
        console.error('참조문서 권한 부여 중 오류 : ', error);
        throw new Error('참조문서 권한 부여 중 오류가 발생했습니다.');
    }
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
        const additionalFormData = new FormData();

        // 참조문서 정보
        const referDocInfo = {
            referDocId: referDoc.value.map((doc) => doc.record_id),
            referDocTitle: referDoc.value.map((doc) => doc.data.to_audit)
        };

        additionalFormData.append('docform_title', docform_title);
        additionalFormData.append('to_audit', to_audit);
        additionalFormData.append('auditors', JSON.stringify(send_auditors_data));
        additionalFormData.append('to_audit_content', to_audit_content);
        additionalFormData.append('reject_setting', rejectSetting.value);
        additionalFormData.append('custom_rows', JSON.stringify(addRows.value));
        additionalFormData.append('reference_docs', JSON.stringify(referDocInfo));
        additionalFormData.append('drafter', user.name);

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
                prevent_multiple_referencing: true, // 중복 결재 방지
                allow_granted_to_grant_others: true // 결재자가 다른 결재자에게 권한 부여 가능
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
            throw new Error('특수 문자로 인해 오류가 발생했습니다.');
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

    skapi.grantPrivateRecordAccess({
        record_id: res.record_id,
        user_id: auditor_id
    });

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
            auditor_id: userId
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

    // 에디터에서 내용 가져오기
    await importWysiwygData();

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
            reject_setting: rejectSetting.value // 반려 설정 관련 체크박스 값 전달
        });

        const auditId = auditDoc.record_id; // 결재 문서 ID
        const formTitle = docform_title; // 상단 양식 제목 (ex.마스터가 저장한 양식제목)
        const auditTitle = to_audit; // 결재건 제목

        // 결재 문서를 레퍼런스하는 결재의견 관련 레코드 생성 (결재자가 의견 작성시 중복 레퍼런스 안돼서)
        const commentRecord = await skapi.postRecord(null, {
            table: {
                name: `audit_comment_${auditId}`,
                access_group: 'authorized'
            },
            reference: auditId
        });

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

        // 결재자와 합의자를 순서대로 통합 정렬
        const approversAndAgreers = [
            ...selectedAuditors.value.approvers,
            ...selectedAuditors.value.agreers
        ].sort((a, b) => a.order - b.order);

        // 참조문서 권한 부여
        console.log('referDoc.value : ', referDoc.value);
        if (referDoc.value.length > 0) {
            const referDocIds = referDoc.value.map((doc) => doc.record_id);
            console.log('referDocIds : ', referDocIds);
            await grantReferDocAccess(referDocIds, processRoles);
        }

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
    // 결재 제목이 없을 경우 저장 불가
    if (!formTitle.value) {
        alert('결재 제목을 입력해주세요.');
        return;
    }

    // 에디터에서 내용 가져오기
    await importWysiwygData();

    try {
        // 첨부파일 업로드
        const formData = new FormData();

        // 참조문서 정보
        const referDocInfo = {
            referDocId: referDoc.value.map((doc) => doc.record_id),
            referDocTitle: referDoc.value.map((doc) => doc.data.to_audit)
        };

        formData.append('docform_title', formTitle.value);
        formData.append('form_title', auditTitle.value);
        formData.append('form_content', editorContent.value);
        formData.append('custom_rows', JSON.stringify(addRows.value)); // 추가 행 데이터
        formData.append('reject_setting', rejectSetting.value); // 반려 설정 관련 체크박스
        formData.append('reference_docs', JSON.stringify(referDocInfo)); // 참조문서 정보

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

        // 결재의견 관련 레코드 생성 (결재자가 의견 작성시 중복 레퍼런스 안돼서)
        const commentRecord = await skapi.postRecord(null, {
            table: {
                name: `audit_comment_${auditId}`,
                access_group: 'private'
            },
            reference: auditId
        });

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
                name: 'audit_form',
                access_group: 1
            },
            index: {
                name: 'form_title', // 결재 양식 제목. 제목별 검색을 위한 인덱싱
                value: formTitle.value.replaceAll('.', '_')
            }
        };

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
    // 결재 제목이 없을 경우 저장 불가
    if (!formTitle.value || !auditTitle.value) {
        alert('결재 제목을 입력해주세요.');
        return;
    }

    // 에디터에서 내용 가져오기
    await importWysiwygData();

    try {
        // 첨부파일 업로드
        const formData = new FormData();

        // 참조문서 정보
        const referDocInfo = {
            referDocId: referDoc.value.map((doc) => doc.record_id),
            referDocTitle: referDoc.value.map((doc) => doc.data.to_audit)
        };

        formData.append('docform_title', formTitle.value);
        formData.append('form_title', auditTitle.value);
        formData.append('form_content', editorContent.value);
        formData.append('custom_rows', JSON.stringify(addRows.value ?? [])); // 추가 행 데이터
        formData.append('reject_setting', rejectSetting.value); // 반려 설정 관련 체크박스
        formData.append('reference_docs', JSON.stringify(referDocInfo)); // 참조문서 정보

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
                name: 'my_audit_form',
                access_group: 1
            },
            index: {
                name: 'form_title', // 제목별 검색을 위한 인덱싱
                value: auditTitle.value.replaceAll('.', '_')
            }
        };

        const res = await skapi.postRecord(formData, options);
        console.log('내 양식 == options : ', options);

        alert('결재 양식이 저장되었습니다.');
    } catch (error) {
        console.error('결재 양식 저장 중 오류 발생: ', error);
        alert('결재 양식 저장 중 오류가 발생했습니다.');
    }
};

// 임시 저장
const tempSaveMyDoc = async () => {
    // 결재 제목이 없을 경우 저장 불가
    if (!formTitle.value || !auditTitle.value) {
        alert('결재 제목을 입력해주세요.');
        return;
    }

    // 에디터에서 내용 가져오기
    await importWysiwygData();

    try {
        // 첨부파일 업로드
        const formData = new FormData();

        // 참조문서 정보
        const referDocInfo = {
            referDocId: referDoc.value.map((doc) => doc.record_id),
            referDocTitle: referDoc.value.map((doc) => doc.data.to_audit)
        };

        formData.append('docform_title', formTitle.value);
        formData.append('form_title', auditTitle.value);
        formData.append('form_content', editorContent.value);
        formData.append('custom_rows', JSON.stringify(addRows.value ?? [])); // 추가 행 데이터
        formData.append('reject_setting', rejectSetting.value); // 반려 설정 관련 체크박스
        formData.append('reference_docs', JSON.stringify(referDocInfo)); // 참조문서 정보

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

        if (res.list.length === 0 || route.query.record_id === undefined) {
            const res = await skapi.postRecord(formData, options);
        } else if (route.query.record_id === res.list[0].record_id) {
            await skapi.deleteRecords({ record_id: res.list[0].record_id }).then((res) => { });

            await skapi
                .postRecord(formData, {
                    table: {
                        name: 'my_tempsave_audit',
                        access_group: 'private'
                    }
                })
                .then((res) => {
                    // console.log('이전 임시저장 해둬서 업뎃 == res : ', res);
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

                // 첨부파일이 있는 경우
                if (tempSaveData.value.bin && tempSaveData.value.bin.form_data) {
                    uploadedFile.value = tempSaveData.value.bin.form_data;
                }

                // 참조문서가 있는 경우
                if (tempSaveData.value.data.reference_docs) {
                    try {
                        const referDocId = JSON.parse(tempSaveData.value.data.reference_docs).referDocId;
                        const fetchPromises = referDocId.map((recordId) =>
                            skapi
                                .getRecords({ record_id: recordId })
                                .then((res) => res.list?.[0] || null)
                                .catch((err) => {
                                    console.error(`record_id ${recordId} 호출 실패:`, err);
                                    return null;
                                })
                        );
                        referDoc.value = await Promise.all(fetchPromises);
                        console.log('referDoc.value : ', referDoc.value);
                    } catch (error) {
                        console.error('참조문서 정보 처리 중 오류:', error);
                    }
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

        // 참조문서가 있는 경우
        if (selectedForm.value.data.reference_docs) {
            try {
                const referDocId = JSON.parse(selectedForm.value.data.reference_docs).referDocId;
                const fetchPromises = referDocId.map((recordId) =>
                    skapi
                        .getRecords({ record_id: recordId })
                        .then((res) => res.list?.[0] || null)
                        .catch((err) => {
                            console.error(`record_id ${recordId} 호출 실패:`, err);
                            return null;
                        })
                );
                referDoc.value = await Promise.all(fetchPromises);
                console.log('referDoc.value : ', referDoc.value);
            } catch (error) {
                console.error('참조문서 정보 처리 중 오류:', error);
            }
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
    router.push({ path: '/approval/audit-list-tempsave' });
    formCategory.value = 'master';
    rejectSetting.value = false;

    alert('해당 페이지에서 벗어나면 수정 내용이 저장되지 않습니다.');
};

// 참조문서 목록 모달 필터링
const filteredReferDocList = computed(() => {
    if (referDocFilter.value === 'all') {
        return referDocList.value;
    } else if (referDocFilter.value === 'inDoc') {
        return referDocList.value.filter((doc) => doc.docType === '수신함');
    } else if (referDocFilter.value === 'referDoc') {
        return referDocList.value.filter((doc) => doc.docType === '수신참조');
    } else if (referDocFilter.value === 'outDoc') {
        return referDocList.value.filter((doc) => doc.docType === '발신함');
    }
    return [];
});

// 참조문서추가 모달 open
const openReferModal = async () => {
    loading.value = true;
    isReferModal.value = true;
    referDocFilter.value = 'all'; // 필터 초기화

    if (referDocList.value.length > 0) {
        // 삭제된 문서 반영을 위해 선택 상태를 다시 동기화
        const selectedMap = new Map(referDoc.value.map((doc) => [doc.record_id, true]));

        referDocList.value.forEach((doc) => {
            doc.selected = selectedMap.has(doc.record_id);
        });

        return;
    }

    try {
        const allDocs = [];
        const selectedMap = new Map(referDoc.value.map((doc) => [doc.record_id, true]));

        const fetchOptions = { limit: 1000 };

        // 결재 수신함 가져오기
        try {
            const receivedDocs = await getAuditList(fetchOptions);

            if (receivedDocs && receivedDocs.list && Array.isArray(receivedDocs.list)) {
                receivedDocs.list.forEach((doc) => {
                    if (doc && doc.record_id) {
                        if (!allDocs.some((d) => d.record_id === doc.record_id)) {
                            allDocs.push({
                                ...doc,
                                docType: '수신함',
                                selected: selectedMap.has(doc.record_id),
                                drafter: doc.user_info.name
                            });
                        }
                    }
                });
            }
        } catch (error) {
            console.error('수신함 오류 : ', error);
        }

        // 결재 발신함 가져오기
        try {
            const sentDocs = await getSendAuditList(fetchOptions);

            if (sentDocs && sentDocs.list && Array.isArray(sentDocs.list)) {
                sentDocs.list.forEach((doc) => {
                    if (doc && doc.record_id) {
                        if (!allDocs.some((d) => d.record_id === doc.record_id)) {
                            allDocs.push({
                                ...doc,
                                docType: '발신함',
                                selected: selectedMap.has(doc.record_id),
                                drafter: user.name
                            });
                        }
                    }
                });
            }
        } catch (error) {
            console.error('발신함 오류 : ', error);
        }

        // 수신참조 가져오기
        try {
            const referenceDocs = await getAuditReferenceList(fetchOptions);

            if (referenceDocs && referenceDocs.list && Array.isArray(referenceDocs.list)) {
                referenceDocs.list.forEach((doc) => {
                    if (doc && doc.record_id) {
                        if (!allDocs.some((d) => d.record_id === doc.record_id)) {
                            allDocs.push({
                                ...doc,
                                docType: '수신참조',
                                selected: selectedMap.has(doc.record_id),
                                drafter: doc.user_info.name
                            });
                        }
                    }
                });
            }
        } catch (error) {
            console.error('수신참조 오류 : ', error);
        }

        // 날짜 내림차순 정렬
        allDocs.sort((a, b) => (b.uploaded || 0) - (a.uploaded || 0));

        referDocList.value = allDocs;
        console.log('referDocList.value : ', referDocList.value);
    } catch (error) {
        console.error('참조문서 목록 가져오기 중 오류 : ', error);
    } finally {
        // loading.value = false;
    }
};

// 선택한 참조문서를 추가
const addRefer = () => {
    const selectedDocs = referDocList.value.filter((doc) => doc.selected);

    selectedDocs.forEach((doc) => {
        if (!referDoc.value.some((existingDoc) => existingDoc.record_id === doc.record_id)) {
            referDoc.value.push(doc);
        }
    });

    referDoc.value = selectedDocs;

    closeReferModal();
};

// 참조문서 제거
const removeReferDoc = (doc, index) => {
    referDoc.value.splice(index, 1);
};

// 참조문서추가 모달 close
const closeReferModal = () => {
    isReferModal.value = false;
};

// 참조문서 상세 보기
const showDocDetail = async (doc) => {
    isReferDetailModal.value = true;

    // 기존 문서 정보 그대로 사용
    currentDetailDoc.value = doc;

    try {
        // 이미 처리된 결재자 정보 사용
        const auditors = currentDetailDoc.value.data?.auditors
            ? JSON.parse(currentDetailDoc.value.data.auditors)
            : { approvers: [], agreers: [], receivers: [] };

        const docApprovals = await skapi.getRecords({
            table: {
                name: 'audit_approval',
                access_group: 'authorized'
            },
            reference: doc.record_id // 문서의 record_id로 결재 정보 조회
        });

        console.log('참조문서 결재 현황:', docApprovals.list);

        // 결재자 이름 가져오기
        const approverIds = auditors.approvers?.map((a) => a.user_id.replaceAll('_', '-')) || [];
        const agreerIds = auditors.agreers?.map((a) => a.user_id.replaceAll('_', '-')) || [];
        const receiverIds = auditors.receivers?.map((a) => a.user_id.replaceAll('_', '-')) || [];

        const allUserIds = [...approverIds, ...agreerIds, ...receiverIds];

        let userInfo = { list: [] };
        if (allUserIds.length > 0) {
            userInfo = await getUserInfo(allUserIds);
        }

        currentDetailDoc.value.approvers = (auditors.approvers || []).map((a) => {
            const userId = a.user_id.replaceAll('_', '-');
            const userInfoData = userInfo.list.find((user) => user.user_id === userId);
            const approvalData = docApprovals.list.find((approval) => approval.user_id === userId);

            return {
                userId: userId,
                name: userInfoData?.name || a.name || '알 수 없음',
                order: a.order || 0,
                approved: approvalData?.data?.approved || null, // 최신 결재 상태 반영
                stamp: approvalData?.data?.stamp || null, // 도장 정보도 반영
                date: approvalData?.data?.date || null // 결재 날짜도 반영
            };
        });

        currentDetailDoc.value.agreers = (auditors.agreers || []).map((a) => {
            const userId = a.user_id.replaceAll('_', '-');
            const userInfoData = userInfo.list.find((user) => user.user_id === userId);
            const approvalData = docApprovals.list.find((approval) => approval.user_id === userId);

            return {
                userId: userId,
                name: userInfoData?.name || a.name || '알 수 없음',
                order: a.order || 0,
                approved: approvalData?.data?.approved || null, // 최신 결재 상태 반영
                stamp: approvalData?.data?.stamp || null, // 도장 정보도 반영
                date: approvalData?.data?.date || null // 결재 날짜도 반영
            };
        });

        currentDetailDoc.value.receivers = (auditors.receivers || []).map((r) => {
            const userId = r.user_id.replaceAll('_', '-');
            const userInfoData = userInfo.list.find((user) => user.user_id === userId);

            return {
                userId: userId,
                name: userInfoData?.name || r.name || '알 수 없음'
            };
        });

        // 최종결재자 정보 확인
        const allApprovers = [
            ...(auditors.approvers || []).map((a) => ({ ...a, type: 'approvers' })),
            ...(auditors.agreers || []).map((a) => ({ ...a, type: 'agreers' }))
        ];

        if (allApprovers.length > 0) {
            const maxOrder = Math.max(...allApprovers.map((a) => a.order));
            const finalApproverData = allApprovers.find((a) => a.order === maxOrder);

            if (finalApproverData) {
                const finalApproverId = finalApproverData.user_id.replaceAll('_', '-');
                const finalApproval = docApprovals.list.find((a) => a.user_id === finalApproverId);
                const statusApproval = docApprovals.list.find((a) => a.data.documentStatus);

                if (statusApproval && statusApproval.data.documentStatus) {
                    currentDetailDoc.value.documentStatus = statusApproval.data.documentStatus;
                } else if (finalApproval && finalApproval.data.approved) {
                    currentDetailDoc.value.documentStatus =
                        finalApproval.data.approved === 'approve' ? '완료됨' : '반려됨';
                }
            }
        }
    } catch (error) {
        console.error('문서 상세정보 처리 오류:', error);
    } finally {
        loading.value = false;
    }

    // 첨부파일
    if (currentDetailDoc.value.bin && currentDetailDoc.value.bin.form_data) {
        modalUploadedFile.value = currentDetailDoc.value.bin.form_data;
    } else {
        modalUploadedFile.value = [];
    }

    // 참조문서가 있는 경우
    if (doc.data.reference_docs) {
        const parseReferDocId = JSON.parse(doc.data.reference_docs).referDocId;

        const fetchPromises = parseReferDocId.map((recordId) =>
            skapi
                .getRecords({ record_id: recordId })
                .then((res) => res.list?.[0] || null)
                .catch((err) => {
                    console.error(`record_id ${recordId} 호출 실패:`, err);
                    return null;
                })
        );

        modalReferDoc.value = await Promise.all(fetchPromises);
    }
};

// 참조문서 상세 모달 close
const closeDocModal = () => {
    isReferDetailModal.value = false;
    currentDetailDoc.value = null;
};

// 타임스탬프를 날짜 형식으로 변환하는 함수
const formatTimestampToDate = (timestamp) => {
    if (!timestamp) return '날짜 없음';

    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
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

                // 결재자 순서대로 정렬
                selectedAuditors.value.approvers.sort((a, b) => (a.order || 0) - (b.order || 0));
                selectedAuditors.value.agreers.sort((a, b) => (a.order || 0) - (b.order || 0));
            } catch (error) {
                console.error('결재자 정보 처리 중 오류:', error);
            }
        }

        // 참조문서 정보 불러오기
        if (reRequestData.value.data.reference_docs) {
            try {
                const referDocId = JSON.parse(reRequestData.value.data.reference_docs).referDocId;
                const fetchPromises = referDocId.map((recordId) =>
                    skapi
                        .getRecords({ record_id: recordId })
                        .then((res) => res.list?.[0] || null)
                        .catch((err) => {
                            console.error(`record_id ${recordId} 호출 실패:`, err);
                            return null;
                        })
                );
                referDoc.value = await Promise.all(fetchPromises);
                console.log('referDoc.value : ', referDoc.value);
            } catch (error) {
                console.error('참조문서 정보 처리 중 오류:', error);
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
            max-width: 3rem;
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
                min-width: 110px;
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
    >div {
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
    max-width: calc(100vw - 117px);
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

        input[type='checkbox']:checked~.label-checkbox::before {
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

// 참조문서
.refer-doc-wrap {
    .btn-open-modal {
        width: 110px;
        height: 28px;
        display: flex;
    }

    .btn-remove {
        padding: 0;
        width: initial;
        height: initial;
        border: none;

        svg {
            width: 16px;
            height: 16px;
            fill: var(--warning-color-500);
        }
    }
}

.refer-doc-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-top: 8px;

    &:first-of-type {
        margin-top: 16px;
    }
}

.refer-doc-name {
    margin-left: 0;
    width: 100%;
    border: 1px dashed var(--gray-color-300);
    border-radius: 8px;
    padding: 9px 12px;
    font-size: 0.75rem;
    color: var(--gray-color-400);
    text-align: left;
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
}

// 참조문서 추가 모달
.modal-refer-list {
    .modal-cont {
        overflow-y: hidden;
    }

    .modal-header {
        margin-bottom: 0;
    }

    .modal-body {
        max-height: calc(100vh - 10rem);
        overflow-y: hidden;
    }

    .refer-list-wrap {
        overflow-y: auto;
        max-height: calc(100vh - 15rem);

        &::-webkit-scrollbar {
            width: 8px;
        }

        &::-webkit-scrollbar-thumb {
            background-color: #ccc;
            /* 스크롤 핸들 색상 */
            border-radius: 10px;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
            /* 스크롤 트랙 배경 */
            border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb:hover {
            background-color: #999;
            /* 마우스 호버 시 색상 */
        }
    }

    .top-wrap {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .sub-title {
        font-size: 1rem;
        flex-wrap: 500;
    }

    .sel-filter {
        width: 10.4rem;
        cursor: pointer;
    }

    .doc-title {
        color: var(--primary-color-500);
        text-decoration: none;
        cursor: pointer;

        &:hover {
            text-decoration: underline;
        }
    }

    .doc-name {
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
    }

    .status {
        border: 1px solid var(--gray-color-400);
        border-radius: 6px;
        padding: 1px 0.4rem;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--gray-color-500);

        &.approve {
            color: var(--primary-color-400);
            border-color: var(--primary-color-400);
        }

        &.reject {
            color: var(--warning-color-500);
            border-color: var(--warning-color-500);
        }
    }
}

// 참조문서 상세 모달
.modal-refer-detail {
    .table {
        tr {
            border-top: 1px solid var(--gray-color-300);
            font-weight: 400;

            td {
                background-color: #fff;
                padding: 0.5rem;
            }
        }
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
            min-width: 100px;
            min-height: 8rem;
            border-right: 1px solid var(--gray-color-300);
            border-bottom: 1px solid var(--gray-color-300);
            margin-bottom: -1px;
            position: relative;

            &.noexist {
                background-color: var(--gray-color-50);

                span {
                    color: var(--gray-color-300);
                }
            }
        }

        .num {
            border-bottom: 1px solid var(--gray-color-200);
            padding: 0.25rem;
        }

        .sign {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            border-bottom: 1px solid var(--gray-color-200);
        }

        .approver {
            height: initial;
        }

        .approved {
            color: var(--primary-color-400);
        }

        .rejected {
            color: var(--warning-color-400);
        }

        .waitting {
            color: var(--gray-color-500);
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
    }

    .upload-file {
        .file-list {
            margin-top: 0;
        }

        .file-item {
            &:first-of-type {
                margin-top: 0;
            }
        }
    }

    .refer-doc-item {
        &:first-of-type {
            margin-top: 0;
        }
    }

    .refer-doc-name {
        cursor: default;
        color: var(--gray-color-500);

        &:hover {
            text-decoration: none;
        }
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

    // 참조문서 추가 모달
    .modal-refer-list {
        .refer-list-wrap {
            &::-webkit-scrollbar {
                display: none;
            }
        }
    }
}

@media (max-width: 682px) {
    .input-wrap {
        &.upload-file {
            .btn-upload-file {

                input,
                button {
                    flex-grow: 1;
                }
            }

            .btn-upload-file+.file-list {
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

@media (max-width: 400px) {
    .refer-doc-wrap {
        .btn-open-modal {
            width: 100%;
        }
    }
}
</style>
