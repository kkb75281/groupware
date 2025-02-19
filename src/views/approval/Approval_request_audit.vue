<template lang="pug">
.title
	h1 결재 작성

hr

template(v-if="step > 0 && showBackStep")
	p.label.essential 결재 양식명
	.input-wrap
		//- input(@change="(e) => {auditTitle = e.target.value; showBackStep = false}" :value="auditTitle" type="text" placeholder="ex) 시말서, 휴가신청서" required)
		select(@change="(e) => {auditTitle = e.target.value; showBackStep = false}" v-model="auditTitle" required)
			option(value="" disabled selected) 결재 양식을 선택해주세요.
			option(v-for="form in auditForms" :key="form.record_id" :value="form.index.value") {{ form.index.value }}

	hr

template(v-if="step > 1")
	.form-wrap
		form#_el_request_form(@submit.prevent="requestAudit")
			#printArea
				input(:value="auditTitle" type="hidden" required name="to_audit" hidden)

				.title
					h2(style="text-align:center" :style="{color: !auditTitle ? '#ddd' : 'black', fontWeight: !auditTitle ? '400' : 'bold'}") {{ auditTitle || "결재 양식명을 입력해주세요." }}
					.icon(v-if="!showBackStep" @click="showBackStep = !showBackStep")
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-edit")

				.table-wrap
					.tb-overflow
						table.table#tb-auditRequest
							colgroup
								col(style="width: 15%")
								col
								col(style="width: 15%")
								col(style="width: 20%")

							tbody
								//- 작성일자 기안사 :: s
								tr.pc(v-show="isDesktop")
									th 작성 일자
									td
										.input-wrap
											input#inp_date(type="date" name="inp_date" v-model="dateValue")
									th 기안자
									td
										span.drafter {{ user.name }}

								//- 모바일 경우 레이아웃
								tr.mo(v-show="!isDesktop")
									th 작성 일자
									td(colspan="3")
										.input-wrap
											input#inp_date(type="date" name="inp_date" v-model="dateValue")
								tr.mo(v-show="!isDesktop")
									th 기안자
									td(colspan="3" style="text-align: left")
										span.drafter {{ user.name }}
								//- 작성일자 기안사 :: e

								tr(v-if="selectedAuditors.approvers.length === 0 && selectedAuditors.agreers.length === 0 && selectedAuditors.receivers.length === 0" style="height: 119px;")
									th.essential 결재 라인
									td.left(colspan="3")
										span.empty(@click="openModal") 이곳을 눌러 [ 결재/합의/수신참조 ] 라인을 추가해주세요.

								tr.approval(v-if="selectedAuditors.approvers.length > 0")
									th 결재
									td.left(colspan="3" style="padding: 0; height: 119px;")
										ul.approver-wrap
											li.approver-list(v-for="(approver, index) in selectedAuditors.approvers" :key="approver.data.user_id")
												span.num {{ index + 1 }}
												span.approver {{ approver.index.value }}
													//- button.btn-remove(@click="removeAuditor(approver.data.user_id, 'approvers')")
														.icon
															svg
																use(xlink:href="@/assets/icon/material-icon.svg#icon-close")

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
												span.num {{ index + 1 }}
												span.approver {{ agreer.index.value }}
													//- button.btn-remove(@click="removeAuditor(agreer.data.user_id, 'agreers')")
														.icon
															svg
																use(xlink:href="@/assets/icon/material-icon.svg#icon-close")

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
													//- button.btn-remove(@click="removeAuditor(receiver.data.user_id, 'receivers')")
														.icon
															svg
																use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
											li.reference-list(@click="openModal")
												span.add-referencer
													.icon
														svg
															use(xlink:href="@/assets/icon/material-icon.svg#icon-add")
								
								tr.tr-hover(v-for="(row, index) in addRows" :key="index")
									th {{ row.title }}
									td(colspan="3")
										.input-wrap
											input(type="text" :name="'addRow'+index" v-model="row.value")

								tr
									th.essential 제목
										.add-btn(@click="isRowModalOpen = true")
											.icon
												svg
													use(xlink:href="@/assets/icon/material-icon.svg#icon-add")
									td(colspan="3")
										.input-wrap
											input#to_audit(type="text" placeholder="제목" required name="to_audit")
								tr
									th.essential 결재 내용
									td(colspan="3")
										.wysiwyg-wrap
											//- Wysiwyg(v-model:content="editorContent" @editor-ready="handleEditorReady")
											Wysiwyg(@editor-ready="handleEditorReady" @update:content="exportWysiwygData")
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
													li.file-name(v-for="(name, index) in fileNames" :key="index") {{ name }}

			.button-wrap
				button.btn.outline.bg-gray.btn-print(type="button" @click="previewAudit")
					.icon(style="padding: 0;")
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-print")
				button.btn(type="submit") 결재 요청

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
					Organigram(:selectedEmployees="selectedUsers" :excludeCurrentUser="true" :useCheckbox="true" :selectedAuditors="selectedAuditors" @selection-change="handleOrganigramSelection")

				br

				.table-wrap
					.tb-overflow(v-if="selectedUsers.length > 0")
						table.table#selected_auditors
							colgroup
								col(style="width: 8%")
								col(style="width: 38%")
								col(style="width: 15%")
								col(style="width: 15%")
								col(style="width: 30%")
							thead
								tr
									th
									th 타입
									th 직급
									th 이름
									th 부서

							tbody
								tr(v-for="user in selectedUsers" :key="user.data.user_id")
									td
										button.btn-remove(@click="removeAuditor(user)")
											.icon
												svg
													use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")
									td 
										.input-wrap
											select(v-model="user.role")
												option(value="approvers" selected) 결재
												option(value="agreers") 합의
												option(value="receivers") 수신참조
									td {{ user.index.name.split('.')[1] }}
									td {{ user.index.value }}
									td {{ divisionNameList[user.index.name.split('.')[0]] }}

					span.empty(v-else) 선택된 결재자가 없습니다.
		.modal-footer
			button.btn.bg-gray.btn-cancel(type="button" @click="closeModal") 취소
			button.btn.btn-save(type="submit" @click="saveAuditor") 저장

</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted, onUnmounted, watch } from "vue";
import { skapi, mainPageLoading } from "@/main";
import { user, makeSafe, verifiedEmail } from "@/user";
import { divisionNameList } from "@/division";

import Organigram from '@/components/organigram.vue';
import Wysiwyg from '@/components/wysiwyg.vue';

const router = useRouter();
const route = useRoute();

const isModalOpen = ref(false);
const isRowModalOpen = ref(false); // 작성란 추가 모달
const showBackStep = ref(true);
const isDesktop = ref(window.innerWidth > 768);

// const modalType = ref(''); // 결재라인 모달 타입 구분
const selectedUsers = ref([]); // 조직도에서 선택된 직원
// const tableUsers = ref([]); // 모달 내 우측 테이블에 표시될 직원 목록

// 결재자 정보 저장
const selectedAuditors = ref({
    approvers: [],  // 결재
    agreers: [],    // 합의
    receivers: []   // 수신참조
});
const auditForms = ref([
	{
		record_id: "1",
		index: {
			value: "휴가신청서"
		},
	},
	{
		record_id: "2",
		index: {
			value: "시말서"
		},
	},
	{
		record_id: "3",
		index: {
			value: "업무보고서"
		},
	},
	{
		record_id: "4",
		index: {
			value: "기타"
		},
	}
]); // 결재 양식 목록
const backupSelected = ref(null);	// 선택된 결재자 백업
const same_division_auditors = ref({});	// 동일 부서 직원 목록
let send_auditors_arr:string[] = [];

const uploadedFile = ref([]);
const backupUploadFile = ref([]);
const removeFileList = ref([]);
const fileNames = ref([]);

const addRows = ref([]);
const step = ref(1);
const auditTitle = ref("");
const disabled = ref(false);

// 에디터 상태 관리
const editorContent = ref('');
const editorIsReady = ref(false);

watch(auditTitle, (nv, ov) => {
	if(nv) {
		step.value = 2;
	}
})

// 결재라인 모달 열기
const openModal = () => {
	// selectedAuditors 에 있는 모든 유저를 selectedUsers에 추가
	selectedUsers.value = [];
	for (const key in selectedAuditors.value) {
		selectedUsers.value.push(...selectedAuditors.value[key]);
	}

	// 열렸을 때 selectedAuditors 전체를 original로 백업
	backupSelected.value = {
        approvers: [...selectedAuditors.value.approvers],
        agreers: [...selectedAuditors.value.agreers],
        receivers: [...selectedAuditors.value.receivers]
    };

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
    }
    backupSelected.value = null;

    isModalOpen.value = false;
};

// 작성란 추가 모달 닫기
const closeRowModal = () => {
	isRowModalOpen.value = false;
};

// 결재요청 미리보기
const previewAudit = () => {
  const printArea = document.getElementById("printArea");

  // 프린트 전에 input 값들을 span으로 변환
  const prepareForPrint = () => {
    cleanupAfterPrint(); // 기존에 추가된 span 제거

    const inputs = printArea.querySelectorAll('input:not([type="hidden"]), textarea');
    inputs.forEach(input => {
      const value = input.value;

      // 입력값을 표시할 span 생성
      const span = document.createElement('span');
      span.className = 'print-value';
      span.textContent = value;

      // input 바로 뒤에 span 삽입
      input.parentNode.insertBefore(span, input.nextSibling);

			if (span.previousElementSibling?.classList.contains('print-value') || 
          span.previousElementSibling?.id === 'inp_content') {
        span.style.display = "none";
      }

      // input을 숨김
      input.style.display = "none";
    });
  };

  // 프린트 후 추가했던 span 제거 및 input 복원
  const cleanupAfterPrint = () => {
    const printValues = printArea.querySelectorAll('.print-value');
    printValues.forEach(span => span.remove());

    const inputs = printArea.querySelectorAll('input:not([type="hidden"]), textarea');
    inputs.forEach(input => {
      input.style.display = "";
    });
  };

  // 동적으로 스타일 추가
  const addPrintStyle = () => {
    const style = document.createElement("style");
    style.id = "print-style";
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
    const style = document.getElementById("print-style");
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
	if(!document.getElementById('add_row_title').value) {
		alert('제목을 입력해주세요.');
		return;
	}

	addRows.value.push({
		title: document.getElementById('add_row_title').value,
		value: ''
	});

	isRowModalOpen.value = false;
}

// 직원 부서 가져오기
const getEmpDivision = async(userId: string) => {
    if(!userId) return;

    await skapi.getRecords({
        table: {
            name: 'emp_position_current',
            access_group: 1
        },
        unique_id: "[emp_position_current]" + makeSafe(userId)
    }).then(r => {
        if (r.list.length === 0) return;

		user.division = r.list[0].index.name.split(".")[0];
		user.position = r.list[0].index.name.split(".")[1];
    });
}

// 결재라인 모달에서 조직도 선택시
const handleOrganigramSelection = (users) => {
    selectedUsers.value = users;

	// 선택된 유저들에게 role 정보가 없으면 추가
	selectedUsers.value.forEach(user => {
		if(!user.role) {
			user.role = 'approvers';
		}
	});
};

// 선택된 모든 결재자 ID 목록 가져오기
const getAllSelectedUserIds = () => {
    const result = {};

    Object.keys(selectedAuditors.value).forEach(type => {
        result[type] = selectedAuditors.value[type].map(auditor => auditor.data.user_id);
    });

    return result;
};

// 결재자 저장
const saveAuditor = () => {
	selectedAuditors.value.agreers = [];
	selectedAuditors.value.approvers = [];
	selectedAuditors.value.receivers = [];

	// user.role 에 따라 approvers, agreers, receivers에 추가
	selectedUsers.value.forEach(user => {
		selectedAuditors.value[user.role].push(user);
	});

	backupSelected.value = null;
    closeModal();
};

// 결재자 제거
const removeAuditor = (user:object, type:string) => {
	const newAuditors = selectedUsers.value.filter(u => u.data.user_id !== user.data.user_id);

    selectedUsers.value = newAuditors;
};

// 에디터 준비
const handleEditorReady = (status: boolean) => {
  editorIsReady.value = status;
};

// 에디터 내보내기
const exportWysiwygData = (content) => {
	editorContent.value = content;
};

// 업로드 파일 삭제
let removeFile = (item) => {
    removeFileList.value.push(item.record_id);
};

let cancelRemoveFile = (item) => {
    removeFileList.value = removeFileList.value.filter((id) => id !== item.record_id);
};

// 파일 추가시 파일명 표시
let updateFileList = (e) => {
    let target = e.target;

    if (target.files) {
        fileNames.value = Array.from(target.files).map((file) => file.name);
    }
};

// 결재 서류 레코드 생성
const postAuditDoc = async ({ to_audit, to_audit_content }) => {
	const send_auditors_data = {
        approvers: selectedAuditors.value.approvers.map(user => user.data.user_id.replaceAll("-", "_")),
        agreers: selectedAuditors.value.agreers.map(user => user.data.user_id.replaceAll("-", "_")),
        receivers: selectedAuditors.value.receivers.map(user => user.data.user_id.replaceAll("-", "_"))
    };

	send_auditors_arr = [
		...send_auditors_data.approvers.map(id => `approver:${id}`),
		...send_auditors_data.agreers.map(id => `agreer:${id}`),
		...send_auditors_data.receivers.map(id => `receiver:${id}`)
	]

    try {
		// 첨부파일 업로드
        const filebox = document.querySelector('input[name="additional_data"]');
		const additionalFormData = new FormData();

		additionalFormData.append('to_audit', to_audit);
        additionalFormData.append('auditors', JSON.stringify(send_auditors_data));
        additionalFormData.append('to_audit_content', to_audit_content);

        if (filebox && filebox.files.length) {
            Array.from(filebox.files).forEach(file => {
                additionalFormData.append('additional_data', file);
            });
        }

        const options = {
            readonly: true, // 결재 올리면 수정할 수 없음. 수정하려면 새로 올려야 함. 이것은 교묘히 수정할 수 없게 하는 방법
            table: {
                name: "audit_doc",
                access_group: "private", // 프라빗으로 올려야 결재자만 접근 가능
            },
            index: {
                name: "to_audit", // 결재 사안 제목. 제목별로 찾을때 위한 인덱싱
                value: to_audit.replaceAll(".", "_"),
            },
            source: {
                prevent_multiple_referencing: true, // 중복 결재 방지
            },
            tags: send_auditors_arr, // 결재, 합의, 수신참조 태그를 각각 구분,
        };

        const res = await skapi.postRecord(additionalFormData, options);

        return res;
    } catch (error) {
        console.error(error);
    }
};

// 결재자에게 권한을 부여하는 함수
const grantAuditorAccess = async ({ audit_id, auditor_id }) => {
    return skapi.grantPrivateRecordAccess({
        record_id: audit_id,
        user_id: auditor_id,
    });
};

// 결재 요청을 생성하고 알림을 보내는 함수
const createAuditRequest = async ({ audit_id, auditor_id }, send_auditors: string[]) => {
	console.log('=== createAuditRequest === auditor_id : ', auditor_id);

    if (!audit_id || !auditor_id) return;

	// 결재 요청
    const res = await skapi.postRecord(
        {
            audit_id,
            auditor: auditor_id,
        },
        {
            unique_id: `audit_request:${audit_id}:${auditor_id}`,
            readonly: true,
            table: {
                name: "audit_request",
                access_group: "authorized",
            },
            reference: `audit:${auditor_id}`,
            tags: [audit_id],
        }
    );
	console.log('=== createAuditRequest === res : ', res);

    skapi.grantPrivateRecordAccess({
        record_id: res.record_id,
        user_id: auditor_id,
    });

    let to_audit = (document.getElementById('to_audit') as HTMLInputElement).value;

	// 실시간 알림 보내기
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
						to_audit: to_audit,
						audit_doc_id: audit_id,
						audit_request_id: res.record_id,
						send_auditors: send_auditors,
					}
                },
            },
            auditor_id
        )
        .then((res) => {
            // console.log("요청2 === postRealtime === res : ", res);
			console.log("=== postRealtime === auditor_id : ", auditor_id);
        });

	// 실시간 못 받을 경우 알림 기록 저장
	skapi
		.postRecord(
			{	
				noti_id: res.record_id,
				noti_type: 'audit',
				send_date: new Date().getTime(),
				send_user: user.user_id,
				audit_info: {
					audit_type: 'request',
					to_audit: to_audit,
					audit_doc_id: audit_id,
					audit_request_id: res.record_id,
					send_auditors: send_auditors,
				}
			},
			{
				readonly: true,
				table: {
					name: `realtime:${auditor_id.replaceAll('-', '_')}`,
					access_group: "authorized",
				},
			}
		)
		.then((res) => {
            console.log("요청3 === postRecord === res : ", res);
        });

    return res;
};

// 결재 요청 Alarm
const postAuditDocRecordId = async (auditId, userId) => {
	console.log('=== postAuditDocRecordId === auditId : ', auditId);
	console.log('=== postAuditDocRecordId === userId : ', userId);
	
    try {
        // 권한 부여
        await grantAuditorAccess({
            audit_id: auditId,
            auditor_id: userId
        });

		// 알림 전송
		return createAuditRequest({
            audit_id: auditId,
            auditor_id: userId
        }, send_auditors_arr);
    } catch (error) {
        console.error(error);
        throw error;
    }
};


// 결재 요청
const requestAudit = async (e) => {
    e.preventDefault();

    try {
        const formData = new FormData(e.target);
		formData.set('inp_content', editorContent.value); // editorContent.value가 이미 현재 에디터 내용을 가지고 있음
        const formValues = Object.fromEntries(formData.entries());

        if (!formValues) return;

        const { to_audit, inp_content: to_audit_content } = formValues;

        // 선택된 결재자 확인
        const totalSelectedCount = Object.values(selectedAuditors.value)
            .reduce((sum, users) => sum + users.length, 0);

        if (totalSelectedCount === 0) {
            alert("결재자, 합의자, 수신참조 중 하나 이상을 선택해주세요.");
			console.log(selectedAuditors.value);
            return;
        }

		if(selectedAuditors.value.approvers.length === 0 && selectedAuditors.value.agreers.length === 0) {
			alert("결재자 또는 합의자를 선택해주세요.");
			return;
		}

		mainPageLoading.value = true;

        // 결재 문서 생성
        const auditDoc = await postAuditDoc({ 
            to_audit, 
            to_audit_content,
            // roles: getAllSelectedUserIds() // ID 목록만 전달
        });

        const auditId = auditDoc.record_id;

        // 각 역할별 권한 부여 및 알림 전송
        const processRoles = [
			// 결재
			...selectedAuditors.value.approvers.map((auditor, index) => ({
				userId: auditor.data.user_id,
				role: 'approver',
				order: index + 1
			})),

			// 합의
			...selectedAuditors.value.agreers.map(auditor => ({
				userId: auditor.data.user_id,
				role: 'agreer',
				order: null
			})),

			// 수신참조
			...selectedAuditors.value.receivers.map(auditor => ({
				userId: auditor.data.user_id,
				role: 'receiver',
				order: null
			}))
		];
		console.log('요청완료 === requestAudit === processRoles : ', processRoles);

		const res = await Promise.all(processRoles.map(roleInfo => 
			postAuditDocRecordId(auditId, roleInfo.userId)
		));
		console.log('요청완료 === requestAudit === res : ', res);

        alert("결재 요청이 완료되었습니다.");
        router.push({
            path: "/approval/request-list",
        });

    } catch (error) {
        console.error('결재 요청 중 오류 발생:', error);
        alert('결재 요청 중 오류가 발생했습니다.');
    } finally {
		mainPageLoading.value = false;
	}
};

const dateValue = ref(new Date().toISOString().substring(0, 10));

const updateScreenSize = () => {
  isDesktop.value = window.innerWidth > 768;
};

onMounted(() => {
  window.addEventListener('resize', updateScreenSize);
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

	#printArea, #printArea * {
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

	input[type="hidden"],
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
}

.form-wrap {
	position: relative;
    max-width: 900px;

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
	min-width: 20rem;

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
    margin-top: 2rem;
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

	.organigram-wrap {
		// padding-right: 1.5rem;
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
    line-height: 1.2;
    color: var(--gray-color-400);
    cursor: pointer;
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
	}

	.file-name {
		text-align: left;

		&:first-of-type {
			margin-top: 16px;
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
		max-width: 100%;
	}
}

@media (max-width: 768px) {
    .approver-wrap {
        grid-template-columns: repeat(5, 1fr);
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
