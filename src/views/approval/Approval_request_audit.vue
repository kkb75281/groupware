<template lang="pug">
.title
	h1 결재 작성

hr

template(v-if="step > 0 && showBackStep")
	p.label.essential 결재 양식명
	.input-wrap
		input(@change="(e) => {auditTitle = e.target.value; showBackStep = false}" :value="auditTitle" type="text" placeholder="ex) 시말서, 휴가신청서" required)

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

								tr.approval
									th 결재
									td.left(colspan="3" style="padding: 0; height: 119px;")
										ul.approver-wrap(v-if="selectedAuditors.approvers.length > 0")
											li.approver-list(v-for="(approver, index) in selectedAuditors.approvers" :key="approver.userId")
												span.num {{ index + 1 }}
												span.approver {{ approver.name }}
													button.btn-remove(@click="removeAuditor(approver.userId, 'approvers')")
														.icon
															svg
																use(xlink:href="@/assets/icon/material-icon.svg#icon-close")

											li.approver-list(@click="openModal('approvers')")
												span.add-approver
													.icon
														svg
															use(xlink:href="@/assets/icon/material-icon.svg#icon-add")
										span.empty(v-else @click="openModal('approvers')") 결재 라인을 추가해주세요.

								tr.approval
									th 합의
									td.left(colspan="3" style="padding: 0; height: 119px;")
										ul.approver-wrap(v-if="selectedAuditors.agreers.length > 0")
											li.approver-list(v-for="(agreer, index) in selectedAuditors.agreers" :key="agreer.userId")
												span.num {{ index + 1 }}
												span.approver {{ agreer.name }}
													button.btn-remove(@click="removeAuditor(agreer.userId, 'agreers')")
														.icon
															svg
																use(xlink:href="@/assets/icon/material-icon.svg#icon-close")

											li.approver-list(@click="openModal('agreers')")
												span.add-approver
													.icon
														svg
															use(xlink:href="@/assets/icon/material-icon.svg#icon-add")
										span.empty(v-else @click="openModal('agreers')") 결재 라인을 추가해주세요.

								tr.reference
									th 수신 참조
										.add-btn(@click="isRowModalOpen = true")
											.icon
												svg
													use(xlink:href="@/assets/icon/material-icon.svg#icon-add")
									td.left(colspan="3")
										ul.reference-wrap(v-if="selectedAuditors.receivers.length > 0")
											li.reference-list(v-for="(receiver, index) in selectedAuditors.receivers" :key="receiver.userId")
												span.referencer {{ receiver.name }}
													button.btn-remove(@click="removeAuditor(receiver.userId, 'receivers')")
														.icon
															svg
																use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
											li.reference-list(@click="openModal('receivers')")
												span.add-referencer
													.icon
														svg
															use(xlink:href="@/assets/icon/material-icon.svg#icon-add")
										span.empty(v-else @click="openModal('receivers')") 수신 참조를 추가해주세요.
								
								tr.tr-hover(v-for="(row, index) in addRows" :key="index")
									th {{ row.title }}
									td(colspan="3")
										.input-wrap
											input(type="text" :name="'addRow'+index" v-model="row.value")

								tr
									th 제목
									td(colspan="3")
										.input-wrap
											input#to_audit(type="text" placeholder="제목" required name="to_audit")
								tr
									th 결재 내용
									td(colspan="3")
										.input-wrap
											textarea#inp_content(type="text" placeholder="결재 내용" name="inp_content")

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
				button.btn.outline.btn-preview(type="button" @click="previewAudit") 미리보기
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
			h2.title {{ modalType === 'approvers' ? '결재' : modalType === 'agreers' ? '합의' : '수신참조' }} 라인 선택
			button.btn-close(type="button" @click="closeModal")
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
		.modal-body
			.select-approver-wrap
				.organigram-wrap
					<Organigram :showOrganigram="false" :selectedEmployees="tableUsers" @selection-change="handleOrganigramSelection"/>

				button.btn.outline.btn-add(type="button" @click="addSelectedToTable")
					| 추가
					.icon
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
							
				.table-wrap
					.tb-overflow
						table.table#selected_auditors
							colgroup
								col(style="width: 8%")
								col(style="width: 15%")
								col(style="width: 15%")
								col(style="width: 20%")
							thead
								tr
									th
									th 직급
									th 이름
									th 부서

							tbody
								tr(v-for="user in tableUsers" :key="user.userId")
									td
										button.btn-remove(@click="removeAuditor(user.userId, modalType)")
											.icon
												svg
													use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")
									td {{ user.position }}
									td {{ user.name }}
									td {{ user.division }}

		.modal-footer
			button.btn.bg-gray.btn-cancel(type="button" @click="closeModal") 취소
			button.btn.btn-save(type="submit" @click="saveAuditor") 저장

</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from "vue";
import { skapi } from "@/main";
import { user, makeSafe, verifiedEmail } from "@/user";
import { getDivisionNames, divisionNameList } from "@/division";

import Organigram from '@/components/organigram.vue';

// 결재자 선택 모달 UI 변경
// -> 조직도 데이터로 모든 직원 가져와서 결재자 선택 가능하도록 변경 예정
// 첨부파일 업로드는 postAuditDoc 함수에서 data로 같이 보내면 될 듯
// 결재 요청 > 알림 확인

const router = useRouter();
const route = useRoute();

const isModalOpen = ref(false);
const isRowModalOpen = ref(false);
const showBackStep = ref(true);
const isDesktop = ref(window.innerWidth > 768);

const modalType = ref(''); // 결재라인 모달 타입 구분
const selectedUsers = ref([]); // 조직도에서 선택된 직원
const tableUsers = ref([]); // 모달 내 우측 테이블에 표시될 직원 목록

// 결재자 정보 저장
const selectedAuditors = ref({
    approvers: [],  // 결재
    agreers: [],    // 합의
    receivers: []   // 수신참조
});
const same_division_auditors = ref({});	// 동일 부서 직원 목록
const backupSelected = ref(null);	// 선택된 결재자 백업

const uploadedFile = ref([]);
const backupUploadFile = ref([]);
const removeFileList = ref([]);
const fileNames = ref([]);

const addRows = ref([]);
const step = ref(1);
const auditTitle = ref("");
const disabled = ref(false);

watch(auditTitle, (nv, ov) => {
	if(nv) {
		step.value = 2;
	}
})

// 결재라인 모달 열기
const openModal = (type) => {
    modalType.value = type;
    // selectedUsers.value = [];
    
    // 현재 선택된 사용자들로 테이블 초기화
    tableUsers.value = [...selectedAuditors.value[type]];
    
    // 백업
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
    // 모든 input과 textarea 요소 찾기
    const inputs = printArea.querySelectorAll('input:not([type="hidden"]), textarea');
    
    inputs.forEach(input => {
      // 현재 입력값 저장
      const value = input.value;
      
      // 입력값을 표시할 span 생성
      const span = document.createElement('span');
      span.className = 'print-value';
      span.textContent = value;
      
      // input 바로 뒤에 span 삽입
      input.parentNode.insertBefore(span, input.nextSibling);
    });
  };

  // 프린트 후 추가했던 span 제거
  const cleanupAfterPrint = () => {
    const printValues = printArea.querySelectorAll('.print-value');
    printValues.forEach(span => span.remove());
  };

  // 기존 스타일 저장
  const originalStyle = document.body.className;

  window.onbeforeprint = function() {
    prepareForPrint();
    document.body.className = "print-mode";
  };

  window.onafterprint = function() {
    cleanupAfterPrint();
    document.body.className = originalStyle;
  };

  window.print();
};
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

async function init() {
    await getDivisionNames();
	await getEmpDivision(user.user_id);
	skapi.getUsers().then((res) => {
		// console.log('=== init === getUser = res : ', res);
	});
	// console.log('=== init === divisionNameList : ', divisionNameList.value);
	// console.log('=== init === user : ', user);
	let divisionFullName = divisionNameList.value[user.division];
	let myDivisionTopLevel = divisionFullName.includes("/") ? divisionFullName.split("/")[0] : divisionFullName;
    // let myDivisionTopLevel = divisionNameList.value[user.division].split("/")[0]; // 부서명/팀명/...
    let divToFetch = []; // DIV_1, DIV_2, ...
    for (let k in divisionNameList.value) {
        if (divisionNameList.value[k].startsWith(myDivisionTopLevel)) {
            divToFetch.push(k);
        }
    }

    divToFetch = await Promise.all(
        divToFetch.map((d) => {
            return skapi
                .getRecords(
                    {
                        table: {
                            name: "emp_position_current",
                            access_group: 1,
                        },
                        index: {
                            name: d + ".",
                            value: " ",
                            condition: ">",
                        },
                    },
                    { limit: 1000 }
                )
                .then((res) => res.list);
        })
    );

    let allUsers = [];
    for (let d of divToFetch) {
        allUsers = allUsers.concat(d);
    }

    same_division_auditors.value = allUsers;
}
init();

// 결재라인 모달에서 조직도 선택시
const handleOrganigramSelection = (users) => {
    selectedUsers.value = users;
};

// 결재라인 모달에서 추가 버튼 클릭시
const addSelectedToTable = () => {
    if (selectedUsers.value.length === 0) {
        alert('선택된 직원이 없습니다.');
        return;
    }
    
    // 테이블에 중복 추가 방지
    const newUsers = selectedUsers.value.filter(user => 
        !tableUsers.value.some(existing => existing.userId === user.userId)
    );
    
	// 테이블 목록에 추가
    tableUsers.value = [...tableUsers.value, ...newUsers];
    // selectedUsers.value = [];
};

// 선택된 모든 결재자 ID 목록 가져오기
const getAllSelectedUserIds = () => {
    const result = {};

    Object.keys(selectedAuditors.value).forEach(type => {
        result[type] = selectedAuditors.value[type].map(auditor => auditor.userId);
    });

    return result;
};

// 결재자 저장
const saveAuditor = () => {
    selectedAuditors.value[modalType.value] = [...tableUsers.value];
    backupSelected.value = null;
    closeModal();
};

// 결재자 제거
const removeAuditor = (userId: string, type) => {
    selectedAuditors.value = {
        ...selectedAuditors.value,
        [type]: selectedAuditors.value[type].filter(auditor => auditor.userId !== userId)
    };

    const newAuditors = tableUsers.value.filter(user => user.userId !== userId);
    tableUsers.value = newAuditors;

    // 조직도 컴포넌트의 선택 상태 업데이트
    handleOrganigramSelection(newAuditors);
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
	const send_auditors = {
        approvers: selectedAuditors.value.approvers.map(user => user.userId.replaceAll("-", "_")),
        agreers: selectedAuditors.value.agreers.map(user => user.userId.replaceAll("-", "_")),
        receivers: selectedAuditors.value.receivers.map(user => user.userId.replaceAll("-", "_"))
    };

	console.log('=== postAuditDoc === send_auditors : ', send_auditors);
	console.log('=== postAuditDoc === send_auditors : ', JSON.stringify(send_auditors));

    try {
		// 첨부파일 업로드
        const filebox = document.querySelector('input[name="additional_data"]');
		const additionalFormData = new FormData();

		additionalFormData.append('to_audit', to_audit);
        additionalFormData.append('auditors', JSON.stringify(send_auditors));
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
            tags: [
				...send_auditors.approvers.map(id => `approver:${id}`),
				...send_auditors.agreers.map(id => `agreer:${id}`),
				...send_auditors.receivers.map(id => `receiver:${id}`)
			] // 결재, 합의, 수신참조 태그를 각각 구분
        };

		console.log('=== postAuditDoc === additionalFormData : ', additionalFormData);
		console.log('=== postAuditDoc === options : ', options);

        const res = await skapi.postRecord(additionalFormData, options);

        console.log("결재 서류 레코드 생성 === postAuditDoc === res : ", res);
        return res;
    } catch (error) {
        console.error(error);
    }
};

// 결재자에게 권한을 부여하는 함수
const grantAuditorAccess = async ({ audit_id, auditor_id }) => {
	console.log('=== grantAuditorAccess === audit_id : ', audit_id);
	console.log('=== grantAuditorAccess === auditor_id : ', auditor_id);
	
    return skapi.grantPrivateRecordAccess({
        record_id: audit_id,
        user_id: auditor_id,
    });
};

// 결재 요청을 생성하고 알림을 보내는 함수
const createAuditRequest = async ({ audit_id, auditor_id }, send_auditors) => {
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

    console.log("요청1 === postRecord === res : ", res);

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
            console.log("요청2 === postRealtime === res : ", res);
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
const postAuditDocRecordId = async (auditId, userId, roleInfo) => {
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
        }, {
            role: roleInfo.role,
            order: roleInfo.order,
            allRoles: roleInfo.roles
        });
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
        const formValues = Object.fromEntries(formData.entries());

        if (!formValues) return;

        const { to_audit, inp_content: to_audit_content } = formValues;

        // 선택된 결재자 확인
        const totalSelectedCount = Object.values(selectedAuditors.value)
            .reduce((sum, users) => sum + users.length, 0);

        if (totalSelectedCount === 0) {
            alert("결재자, 합의자, 수신참조 중 하나 이상을 선택해주세요.");
            return;
        }

        if (selectedAuditors.value.approvers.length === 0) {
            alert("결재자를 한 명 이상 선택해주세요.");
            return;
        }

        // 결재 문서 생성
        const auditDoc = await postAuditDoc({ 
            to_audit, 
            to_audit_content,
            roles: getAllSelectedUserIds() // ID 목록만 전달
        });

        const auditId = auditDoc.record_id;

		console.log('=== requestAudit === auditId : ', auditId);
		console.log('=== requestAudit === auditDoc : ', auditDoc);

        // 각 역할별 권한 부여 및 알림 전송
        const processRoles = [
			// 결재
			...selectedAuditors.value.approvers.map((auditor, index) => ({
				userId: auditor.userId,
				role: 'approver',
				order: index + 1
			})),

			// 합의
			...selectedAuditors.value.agreers.map(auditor => ({
				userId: auditor.userId,
				role: 'agreer',
				order: null
			})),

			// 수신참조
			...selectedAuditors.value.receivers.map(auditor => ({
				userId: auditor.userId,
				role: 'receiver',
				order: null
			}))
		];

		await Promise.all(processRoles.map(roleInfo => 
			postAuditDocRecordId(auditId, roleInfo.userId, {
				role: roleInfo.role,
				order: roleInfo.order,
				roles: getAllSelectedUserIds()
			})
		));

        alert("결재 요청이 완료되었습니다.");
        router.push({
            path: "/approval/request-list",
        });

    } catch (error) {
        console.error('결재 요청 중 오류 발생:', error);
        alert('결재 요청 중 오류가 발생했습니다.');
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
	.file-wrap,
	header,
	.title,
	hr,
	.approver-list:last-of-type,
	.empty {
		display: none !important;
	}

	// body {
	// 	#header {
	// 		display: none !important;
	// 	}
	// }
		

	// header {
	// 	visibility: hidden !important;
	// 	opacity: 0 !important;
	// 	position: relative !important;
	// }

	// /* 제목 스타일 (audit_title) */
	// #printArea .title-value {
	// 	text-align: center;
	// 	font-size: 24px;
	// 	font-weight: bold;
	// 	margin-bottom: 16px;
	// }

	// /* 일반 입력값 정렬 */
	// #printArea .print-value {
	// 	text-align: left; /* 기본 왼쪽 정렬 */
	// 	font-size: 14px;
	// 	color: #000;
	// 	display: block;
	// 	padding: 4px 0;
	// 	min-height: 20px; /* 빈공간 유지 */
	// }

	/* input 대체 텍스트 스타일 */
	.print-value {
		font-size: 14px;
		color: #000;
		display: inline-block;
		padding: 4px 0;
		text-align: left;
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
				bottom: -12px;
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

// .form-item {
//     margin-top: 2rem;
//     padding-top: 2rem;
//     border-top: 1px solid var(--gray-color-200);
// }

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
    .modal-cont {
        min-width: 750px;
        max-width: fit-content;
    }

	.modal-body {
		min-height: 600px;
		height: 600px;
		overflow: hidden;
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
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
	align-items: center;
	height: 100%;

	> div {
		border: 1px solid var(--gray-color-300);
		border-radius: 0.5rem;
		padding: 1rem;
		height: 100%;
		overflow-y: auto;
	}

	.organigram-wrap {
		flex: none;
		min-width: 17.5rem;
	}

	.btn-add {
		height: 2rem;
		padding: 0.5rem;
		gap: 0.25rem;

		.icon {
			padding: 0;

			svg {
				width: 16px;
				height: 16px;
				fill: var(--primary-color-400);
			}
		}
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

	.table-wrap {
		flex: 1;
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

@media (max-width: 768px) {
    .approver-wrap {
        grid-template-columns: repeat(5, 1fr);
    }

    .select-approver {
        .modal-cont {
            min-width: 100%;
            max-width: 100%;
        }

		.modal-body {
			min-height: initial;
			height: initial;
			overflow: auto;
		}
    }

	.select-approver-wrap {
		flex-direction: column;

		> div {
			width: 100%;
			height: initial;
		}	

		.organigram-wrap {
			flex: auto;
		}

		.table-wrap {
			flex: auto;
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
        &.upload-stamp {
        }
    }
}
</style>
