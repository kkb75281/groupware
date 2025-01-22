<template lang="pug">
.title
	h1 결재 요청

hr

template(v-if="step > 0 && showBackStep")
	p.label.essential 결재 양식명
	.input-wrap
		input(@change="(e) => {auditTitle = e.target.value; showBackStep = false}" :value="auditTitle" type="text" placeholder="ex) 시말서, 휴가신청서" required)

	hr

template(v-if="step > 1")
	.form-wrap
		form#_el_request_form(@submit.prevent="requestAudit")
			#print-area
				//- .input-wrap.title
					input#audit_title(type="text" placeholder="결재 양식명을 입력해주세요.  ex) 시말서" required name="to_audit" style="font-size:2rem; font-weight:bold; text-align:center;")

				input(:value="auditTitle" type="text" required name="to_audit" hidden)
				//- h2.title(style="text-align:center" :style="{color: !auditTitle ? '#ddd' : 'black', fontWeight: !auditTitle ? '400' : 'bold'}") {{ auditTitle || "결재 양식명을 입력해주세요." }}
				.title-wrap
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
										//- span.empty 결재 라인을 추가해주세요.
										ul.approver-wrap
											li.approver-list
												span.num 1
												span.approver 김이름
											li.approver-list(@click="openModal")
												span.add-approver
													.icon
														svg
															use(xlink:href="@/assets/icon/material-icon.svg#icon-add")

								tr.approval
									th 합의
									td.left(colspan="3" style="padding: 0; height: 119px;" @click="openModal")
										span.empty 결재 라인을 추가해주세요.
										//- ul.approver-wrap
											li.approver-list
												span.num 1
												span.approver 김이름

								tr.reference
									th 수신 참조
										.add-btn(@click="isRowModalOpen = true")
											.icon
												svg
													use(xlink:href="@/assets/icon/material-icon.svg#icon-add")
									td.left(colspan="3")
										ul.reference-wrap
											li.reference-list
												span.referencer
													| 김이름
													.icon
														svg
															use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
											li.reference-list
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
												
												ul.file-list
													template(v-if="uploadedFile.length > 0")
														li.file-item(v-for="(file, index) in uploadedFile" :key="index" :class="{'remove': removeFileList.includes(file.record_id), 'disabled': disabled}")
															//- a.file-name(:href="file.url" download) {{ file.filename }} {{ "___" + file.record_id }}
															a.file-name(:href="file.url" target="_blank") {{ file.filename }}
															template(v-if="(!verifiedEmail && !disabled) && file.user_id === user.user_id")
																button.btn-cancel(v-if="removeFileList.includes(file.record_id)" type="button" @click="cancelRemoveFile(file)")
																	svg
																		use(xlink:href="@/assets/icon/material-icon.svg#icon-undo")
																button.btn-remove(v-else type="button" @click="removeFile(file)")
																	svg
																		use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")
													template(v-if="uploadedFile.length === 0")
														li.file-item(style="height: 36px;") 등록된 파일이 없습니다.

			//- button.btn.outline(type="button") + 작성란 추가

			.button-wrap
				button.btn.outline.btn-preview(type="button" @click="previewAudit" style="margin-top: 0;") 미리보기
				button.btn(type="submit" style="margin-top: 0;") 결재 요청

//- Modal
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
				input#add_row_title(type="text" placeholder="ex. 시행자, 시행일자, ...")
		.modal-footer(style="padding-top: 0; border-top: none;")
			button.btn.bg-gray.btn-cancel(type="button" @click="closeRowModal") 취소
			button.btn.btn-save(type="button" @click="addRow") 추가

//- Modal
#modal.modal.select-approver(v-if="isModalOpen" @click="closeModal")
	.modal-cont(@click.stop)
		.modal-header
			h2.title 결재자 선택
			button.btn-close(type="button" @click="closeModal")
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
		.modal-body
			.table-wrap
				.tb-overflow
					table.table#same_division_auditors
						thead
							tr
								th NO
								th 직급
								th 이름
								th 부서
								th 결재 여부
								th 합의 여부
								th 수신 참조

						tbody
							tr(v-for="(auditor, index) in same_division_auditors")
								template(v-if="auditor.data.user_id !== user.user_id")
									td {{ index + 1 }}
									td {{ auditor.index.name.split('.')[1] }}
									td {{ auditor.index.value }}
									td {{ divisionNameList[auditor.index.name.split('.')[0]] }}
									td
										label.checkbox
											input(type="checkbox" name="checkbox" :value="auditor.user_id" @change="checkAuditor(auditor.data.user_id)")
											span.label-checkbox
									td
										label.checkbox
											input(type="checkbox" name="checkbox" :value="auditor.user_id" @change="checkAuditor(auditor.data.user_id)")
											span.label-checkbox
									td
										label.checkbox
											input(type="checkbox" name="checkbox" :value="auditor.user_id" @change="checkAuditor(auditor.data.user_id)")
											span.label-checkbox

		.modal-footer
			button.btn.bg-gray.btn-cancel(type="button" @click="closeModal") 취소
			button.btn.btn-save(type="submit" @click="saveWorkTime") 저장

</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted, onUnmounted, watch } from "vue";
import { skapi } from "@/main";
import { user, makeSafe, verifiedEmail } from "@/user";
import { getDivisionNames, divisionNameList } from "@/division";

const router = useRouter();
const route = useRoute();

const isModalOpen = ref(false);
const isRowModalOpen = ref(false);
const showBackStep = ref(true);
const isDesktop = ref(window.innerWidth > 768);

const same_division_auditors = ref({});
const send_auditors = [];
const uploadedFile = ref([]);
const backupUploadFile = ref([]);
const removeFileList = ref([]);
const originUserProfile = {};

let addRows = ref([]);
let step = ref(1);
let auditTitle = ref("");
let fileNames = ref([]);
let disabled = ref(false);

watch(auditTitle, (nv, ov) => {
	if(nv) {
		step.value = 2;
	}
})

let previewAudit = () => {
	let initBody;
	window.onbeforeprint = function () {
		// 기존 HTML 저장
		initBody = document.body.innerHTML;

		// 입력값을 텍스트로 변환
		document.querySelectorAll("#print-area input, #print-area textarea").forEach((el) => {
			const textNode = document.createElement("span");
			textNode.className = "print-value";

			// 값이 있으면 텍스트 설정, 없으면 빈공간
			if (el.value) {
				textNode.textContent = el.value;
			} else {
				textNode.innerHTML = "&nbsp;"; // 빈공간 유지
			}

			// 제목은 따로 스타일 추가
			if (el.id === "audit_title") {
				textNode.classList.add("title-value");
			}

			el.parentNode.replaceChild(textNode, el);
		});

		// 프린트 영역만 출력
		document.body.innerHTML = document.getElementById("print-area").innerHTML;
	};
	window.onafterprint = function () {
		// 원래 HTML 복원
		document.body.innerHTML = initBody;
	};
	window.print();
};

const openModal = () => {
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
};

const closeRowModal = () => {
	isRowModalOpen.value = false;
}

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
		console.log('!!!!!!!!!',res)
	});
	console.log('=== init === divisionNameList : ', divisionNameList.value);
	console.log('=== init === user : ', user);
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

// 결재자 체크 박스
const checkAuditor = (userId: string) => {
    if (send_auditors.includes(userId)) {
        send_auditors = send_auditors.filter((auditor) => auditor !== userId);
    } else {
        send_auditors.push(userId);
    }
};

// 결재 서류 업로드
const postAuditDoc = async ({ to_audit, to_audit_content }) => {
    try {
        const params = {
            to_audit,
            auditors: send_auditors,
            to_audit_content,
        };

        const options = {
            readonly: true,
            table: {
                name: "audit_doc",
                access_group: "private",
            },
            index: {
                name: "to_audit",
                value: to_audit.replaceAll(".", "_"),
            },
            source: {
                prevent_multiple_referencing: true,
            },
            tags: [...new Set(send_auditors.map((u) => u.replaceAll("-", "_")))], // 중복 제거
        };

        const res = await skapi.postRecord(params, options);

        console.log("결재 서류 === postAuditDoc === res : ", res);
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
const poistAuditDocRecordId = async (audit_id) => {
    try {
        const uniqueAuditors = [...new Set(send_auditors)]; // 중복 제거
        const requests = uniqueAuditors.flatMap((auditor_id) => [
            grantAuditorAccess({ audit_id, auditor_id }),
            createAuditRequest({ audit_id, auditor_id }, uniqueAuditors),
        ]);

        return Promise.all(requests);
    } catch (error) {
        console.error(error);
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

        if (send_auditors.length === 0) {
            alert("결재자를 1명 이상 선택해주세요.");
            return;
        }

        const auditDoc = await postAuditDoc({ to_audit, to_audit_content });

        const auditId = auditDoc.record_id;

        await poistAuditDocRecordId(auditId);

        alert("결재 요청이 완료되었습니다.");

        router.push({
            path: "/approval/request-list",
        });
    } catch (error) {
        console.error(error);
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
	.file-wrap {
		display: none !important;
	}

	// /* 제목 스타일 (audit_title) */
	// #print-area .title-value {
	// 	text-align: center;
	// 	font-size: 24px;
	// 	font-weight: bold;
	// 	margin-bottom: 16px;
	// }

	// /* 일반 입력값 정렬 */
	// #print-area .print-value {
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
}

.form-wrap {
	position: relative;
    max-width: 900px;

	
	// .title-wrap {
	// 	display: flex;
	// 	justify-content: center;
		
	// 	.title {
	// 	    font-size: 2rem;
	// 	    margin-bottom: 2rem;
	// 	    text-align: center;
	// 	}
	// 	.icon {
	// 		cursor: pointer;
	// 	}
	// }

	.title-wrap {
		text-align: center;
	}

	.title {
		position: relative;
		display: inline-block;

		h2 {
			font-size: 2rem;
		    margin-bottom: 2rem;
		}
		.icon {
			position: absolute;
			right: -30px;
			top: 0;
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
        max-width: 750px;
    }

    .modal-footer {
        padding-top: 0;
        border-top: none;

        .btn {
            margin-top: 0;
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

@media (max-width: 768px) {
    .approver-wrap {
        grid-template-columns: repeat(5, 1fr);
    }

    .select-approver {
        .modal-cont {
            min-width: 100%;
            max-width: 100%;
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
