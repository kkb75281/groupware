<template lang="pug">
.title
	h1 결재 문서

hr

Loading#loading(v-if="getAuditDetailRunning")

.form-wrap(v-if="!getAuditDetailRunning")
	form#_el_request_form(@submit.prevent="requestAudit")
		#printArea
			.title
				h2 {{ auditDoContent?.index?.value }}

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
								td {{ formatTimestampToDate(auditDoContent?.uploaded) }}
								th 기안자
								td
									span.drafter {{ senderUser.name }}

							//- 모바일 경우 레이아웃
							tr.mo(v-show="!isDesktop")
								th 작성 일자
								td(colspan="3") {{ formatTimestampToDate(auditDoContent?.uploaded) }}
							tr.mo(v-show="!isDesktop")
								th 기안자
								td(colspan="3" style="text-align: left")
									span.drafter {{ senderUser.name }}
							//- 작성일자 기안사 :: e

							tr.approval(v-if="approverList.length > 0")
								th 결재
								td.left(colspan="3" style="padding: 0; height: 119px;")
									ul.approver-wrap
										li.approver-list(v-for="(approver, index) in approverList" :key="approver.user_id")
											template(v-if="approver.approved_type === 'approver'")
												span.num {{ index + 1 }}
												span.sign
													template(v-if="approver.approved === 'approve'")
														img(v-if="approver?.stamp" :src="approver.stamp" alt="도장 이미지")
														span.approved(v-else) 승인
													template(v-else-if="approver.approved === 'reject'")
														span.rejected 반려
													template(v-else="!approver.approved || approver.approved === null")
														template(v-if="approver.user_id === user.user_id")
															button.btn.sm.outline.btn-approve(type="button" @click="openModal(approver)") 결재
														template(v-else)
															span.waitting 대기
												span.approver {{ approver.user_info?.name }}

							tr.approval(v-if="agreerList.length > 0")
								th 합의
								td.left(colspan="3" style="padding: 0; height: 119px;")
									ul.approver-wrap
										li.approver-list(v-for="(agreer, index) in agreerList" :key="agreer.user_id")
											template(v-if="agreer.approved_type === 'agreer'")
												span.num {{ index + 1 }}
												span.sign
													template(v-if="agreer.approved === 'approve'")
														img(v-if="agreer?.stamp" :src="agreer.stamp" alt="도장 이미지")
														span.approved(v-else) 승인
													template(v-else-if="agreer.approved === 'reject'")
														span.rejected 반려
													template(v-else="!agreer.approved || agreer.approved === null")
														template(v-if="agreer.user_id === user.user_id")
															button.btn.sm.outline.btn-approve(type="button" @click="openModal(agreer)") 합의
														template(v-else)
															span.waitting 대기
												span.approver {{ agreer.user_info?.name }}
									//- span.empty(v-else) -

							tr.reference(v-if="selectedAuditors.receivers.length > 0")
								th 수신 참조
								td.left(colspan="3") {{ selectedAuditors.receivers.map(receiver => receiver.name).join(', ') }}

							tr
								th 제목
								td.left(colspan="3") {{ auditDoContent?.data?.to_audit }}

							tr
								th 결재 내용
								td.left(colspan="3")
									._wysiwyg4all(v-html="auditDoContent?.data?.to_audit_content")

							tr
								th 첨부 파일
								td.left(colspan="3")
									.input-wrap.upload-file
										.file-wrap(style="margin: 0")
											ul.file-list(style="margin: 0")
												template(v-if="uploadedFile.length > 0")
													li.file-item(v-for="(file, index) in uploadedFile" :key="index")
														//- a.file-name(:href="file.url" download) {{ file.filename }} {{ "___" + file.record_id }}
														a.file-name(:href="file.url" target="_blank") {{ file.filename }}
												template(v-if="uploadedFile.length === 0")
													li(style="color:var(--gray-color-300);") 등록된 파일이 없습니다.

		br
		br
		br

		.button-wrap
			button.btn.bg-gray.btn-cancel(type="button" @click="senderUser.user_id === user.user_id ? $router.push('/approval/request-list') : $router.push('/approval/audit-list')") 이전


//- 결재 모달
#modal.modal.modal-approve(v-if="isModalOpen")
	.modal-cont(@click.stop)
		.modal-header(style="border:0;padding:0")
			h2.modal-title 결재
			button.btn-close(@click="closeModal")
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
		.modal-body
			.table-wrap
				.tb-overflow
					table.table
						colgroup
							col(style="width: 25%")
							col
						tbody
							tr
								th 결재문서
								td {{ '[' + senderUser.name + '] ' + auditDoContent.data.to_audit }}

							tr
								th 결재자
								td {{ user.name }}

							tr
								th.essential 결재여부
								td
									label.radio-button(style="width: 50%")
										input(type="radio" name="approved" value="approve" :checked="approveAudit")
										span.label-radio 결재
									label.radio-button
										input(type="radio" name="approved" value="reject" :checked="!approveAudit")
										span.label-radio 반려
							
							tr
								th 추가의견
								td
									.input-wrap(style="margin: 0")
										textarea(name="comment" rows="5" placeholder="결재의견을 입력해주세요." v-model="approvedComment" style="width: 100%;resize: none;")

		.modal-footer(style="border:0;padding:0")
			button.btn.bg-gray.btn-edit(type="button" @click="isModalOpen=false") 취소
			button.btn.btn-edit(type="submit" @click="approvalState") 확인

//- 도장 입력 모달
#modal.modal.modal-stamp(v-if="isStampModalOpen")
	form.modal-cont(@click.stop @submit.prevent="postApproval")
		.modal-header
			h2.modal-title 도장/서명 선택하기
			button.btn-close(@click="isStampModalOpen=false")
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
		
		.modal-body
			p(v-if="myStamps.length || previewStamp") 도장을 선택해주세요.
			p(v-else) 현재 등록된 도장이 없습니다. 새로운 도장을 생성해주세요.

			.my-stamp-wrap
				template(v-if="gettingStampList")
					Loading#loading
				template(v-else)
					.stamp-wrap(v-if="myStamps.length")
						.stamp-grid(v-for="stamp in myStamps" :key="stamp.url" @click="selectStamp(stamp.url)")
							//- label.checkbox
								input(type="checkbox" name="checkbox")
								span.label-checkbox
							.stamp(:class="{'selected' : selectedStamp === stamp.url}")
								img#stamp-img(:src="stamp.url" alt="도장 이미지")
					.previewStamp(v-else-if="previewStamp" :class="{'selected' : selectedStamp === previewStamp}" @click="selectStamp(previewStamp)")
						img(:src="previewStamp" style="display: block;margin: 0 auto;" alt="도장 미리보기")
					.no-stamp(v-else style="text-align: center;border: 1px solid var(--gray-color-100);padding: 3rem 1rem;border-radius: 8px;color: var(--gray-color-400); font-size:0.9rem") 
						//- span 현재 등록된 도장이 없습니다.
						button.btn.outline(type="button" v-if="!myStamps.length && !previewStamp" @click="createStamp" :disabled="previewStamp" style="margin:0 auto") 도장 생성
						//- button.btn 기본 도장 생성하기

			canvas#stampCanvas(width="100" height="100" style="display: none;")
			input(type="radio" name="approved" value="approve" :checked="approveAudit" style="display: none;")
			input(type="radio" name="approved" value="reject" :checked="!approveAudit" style="display: none;")
			
			br

			//- .upload-stamp-btn(style="display: flex;align-items: center;justify-content: center;gap: 1rem;")

		.modal-footer(style="border:0;padding-top:10px;margin:0")
			button.btn.bg-gray.btn-edit(type="button" @click="isStampModalOpen=false") 취소
			button.btn.btn-edit(type="submit" :disabled="(!myStamps.length && !previewStamp) || !selectedStamp") 서명하기
			//- button.btn.bg-gray.btn-edit(type="button" @click="isModalOpen=false") 이전
			//- button.btn.btn-edit(type="button" @click="isModalOpen=false") 결재 승인

</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { skapi } from '@/main';
import { user, makeSafe } from '@/user';
import { getUserInfo } from '@/employee';

import Loading from '@/components/Loading.vue';

const router = useRouter();
const route = useRoute();
const auditId = ref('');

const isDesktop = ref(window.innerWidth > 768);

const disabled = ref(true);
const auditDoContent = ref([]);
const approverList = ref([]);
const agreerList = ref([]);
const isModalOpen = ref(false);
const isStampModalOpen = ref(false);
const senderUser = ref({});
const uploadedFile = ref([]);
const previewStamp = ref(null);
const approveAudit = ref(true);
const approvedComment = ref('');

// 결재자 정보 저장
const selectedAuditors = ref({
    approvers: [],  // 결재
    agreers: [],    // 합의
    receivers: []   // 수신참조
});

watch(() => (route.params.auditId as string), async(nv, ov) => {
	if(nv !== ov) {
		auditId.value = nv;
		await getAuditDetail();
	}
});

watch(auditDoContent, () => {
	console.log('!!!!!auditDoContent 변경:', auditDoContent.value.data.to_audit);
	let userId = auditDoContent.value?.user_id;

	if (userId) {
		getUserInfo(userId).then((res) => {
			senderUser.value = res.list[0] || {};
		})
		.catch((err) => {
			console.error('Failed to fetch user info:', err);
			senderUser.value = {};
		});
	} else {
		senderUser.value = {};
	}
})

let isPosting = false;

const openModal = (target) => {
	if (target && target.user_id !== user.user_id) return;

	isModalOpen.value = true;
	// disabled.value = false;
};

const closeModal = () => {
	isModalOpen.value = false;
	isStampModalOpen.value = false;
	// disabled.value = true;
};

function formatTimestampToDate(timestamp:number) {
  const date = new Date(timestamp); // timestamp를 Date 객체로 변환

  const year = date.getFullYear(); // 연도 가져오기
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 월 가져오기 (0부터 시작하므로 +1)
  const day = String(date.getDate()).padStart(2, '0'); // 일 가져오기

  return `${year}-${month}-${day}`; // 형식화된 문자열 반환
}

let approvalState = () => {
	const selectedValue = document.querySelector('input[name="approved"]:checked')?.value;

	if(selectedValue === 'approve') {
		console.log('결재함:', selectedValue);
		isModalOpen.value = false;
		isStampModalOpen.value = true;
		// getStampList();
	} else if(selectedValue === 'reject') {
		console.log('반려함:', selectedValue);
	}
}

let gettingStampList = ref(false);
let myStamps = ref([]);
let myStampsRecordId = ref(null);
let selectedStamp = ref(null);

let getStampList = async () => {
    gettingStampList.value = true;

    try {
        let res = await skapi.getRecords({
            unique_id: '[stamp_images]' + makeSafe(user.user_id),
            table: {
                name: 'stamp_images',
                access_group: 1,
            }
        });
        console.log('=== getStampList === res : ', res);

        if(res.list.length) {
            myStamps.value = res.list[0].bin.stamp_data;
            myStampsRecordId.value = res.list[0].record_id;
            gettingStampList.value = false;
        }
    } catch(e) {
        console.log('=== getStampList === err : ', {e});

        if(e.code === "NOT_EXISTS") {
            myStamps.value = [];
            myStampsRecordId.value = null;
        } else {
            alert('도장 정보를 불러오는 중 오류가 발생했습니다.');
        }

        gettingStampList.value = false;
    }
}
getStampList();

let createStamp = () => {
// 캔버스와 컨텍스트 가져오기
	const canvas = document.getElementById('stampCanvas');
    const ctx = canvas.getContext('2d');

    // 도장 생성 함수
    function drawStamp(name:string) {
      const radius = 30; // 원의 반지름
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // 캔버스 초기화
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 원 그리기
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.closePath();

      // 이름 텍스트 그리기
      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = 'red';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    //   ctx.fillText(name, centerX, centerY);
      const textOffsetY = radius * 0.05; // 텍스트를 약간 위로 올림
      ctx.fillText(name, centerX, centerY + textOffsetY);
    }

    // 초기 도장 생성
    drawStamp(user.name);

	const imageData = canvas.toDataURL('image/png'); // 캔버스 데이터를 Base64로 변환
	previewStamp.value = imageData; // 미리보기 이미지로 설정
	// previewDiv.style.display = 'block';

    // 이미지 다운로드
    // const downloadBtn = document.getElementById('downloadBtn');
    // downloadBtn.addEventListener('click', () => {
    //   const link = document.createElement('a');
    //   link.download = 'stamp.png';
    //   link.href = canvas.toDataURL();
    //   link.click();
    // });
}

let selectStamp = (url) => {
	selectedStamp.value = url;
	// console.log('stampId:', stampId);
	// previewStamp.value = null;
	// isStampModalOpen.value = false;
}

// 다른 사람 결재 여부 확인
const approvedAudit = async () => {
	try {
		const res = await skapi.getRecords({
			table: {
				name: 'audit_approval',
				access_group: 'authorized'
			},
			reference: auditId.value
		})

		return res.list;
	} catch (error) {
		console.error(error);
	}
	
	isModalOpen.value = false;
}

let getAuditDetailRunning = ref(false);

// 결재 서류 가져오기
const getAuditDetail = async () => {
	getAuditDetailRunning.value = true;

	if(!auditId.value) {
		getAuditDetailRunning.value = false;
		return;
	}

	try {
		const auditDoc = (await skapi.getRecords({
			record_id: auditId.value
		})).list[0];

		console.log('auditDoc : ', auditDoc);

		if (auditDoc) {
			auditDoContent.value = auditDoc;
			console.log('=== getAuditDetail === auditDoContent.value : ', auditDoContent.value);
		}

		const auditors = JSON.parse(auditDoc.data.auditors);

		console.log('=== getAuditDetail === auditors : ', auditors);

		let getAuditorInfo = async (uid) => {
			let user_id = uid.replaceAll('_', '-');
			let userInfo = await getUserInfo(user_id);
			
			return userInfo.list[0];
		}

		let processAuditors = async (role: string) => {
			if (auditors?.[role]) {
				for (let uid of auditors[role]) {
					let user = await getAuditorInfo(uid);
					selectedAuditors.value[role].push(user);
				}
			}
		};

		await Promise.all([
			processAuditors('approvers'),
			processAuditors('agreers'),
			processAuditors('receivers'),
		]);

		if(Object.keys(auditDoc.bin).length && auditDoc.bin.additional_data.length) {
			let fileList = [];
			let additional_data = auditDoc.bin.additional_data;

			function getFileUserId(str) {
				if (!str) return "";
				return str.split("/")[3];
			}

			const result = additional_data.map((el) => ({
				...el,
				user_id: getFileUserId(el.path),
			}));

			fileList.push(...result);

			uploadedFile.value = fileList;
			console.log('uploadedFile : ', uploadedFile.value);
		} else {
			uploadedFile.value = [];
		}

		getAuditDetailRunning.value = false;
		
		const approvals = await approvedAudit();

		console.log('!!!!@!@approvals : ', approvals);

		const approvalUserList = [];
		const newTags = auditDoc.tags.map(a => a.replaceAll('_', '-'))

		newTags.forEach((auditor) => {
			let oa_has_audited_str = null;

			if(auditor.includes('receiver')) return;

			approvals.forEach((approval) => {
				if (approval.user_id === auditor.split(':')[1]) {
					oa_has_audited_str = approval.data.approved ? '결재함' : '반려함';

					const result = {
						user_id: auditor.split(':')[1],
						approved_type: auditor.split(':')[0],
						approved: approval.data.approved,
						stamp: approval.data.stamp,
						approved_str: oa_has_audited_str
					}

					approvalUserList.push(result);
					return;
				}
			})

			if (!oa_has_audited_str) {
				const result = {
					user_id: auditor.split(':')[1],
					approved_type: auditor.split(':')[0],
					approved: null,
					stamp: null,
					approved_str: '결제대기중'
				}
				
				approvalUserList.push(result);
			}
		})

		console.log('!!!!@!@ååapprovalUserList : ', approvalUserList);

		const userList = await Promise.all(approvalUserList.map(async (auditor) => await getUserInfo(auditor.user_id)))
		console.log('!!!@#@#@userList : ', userList);
		const userInfoList = userList.map(user => user.list[0]);                     

		const newAuditUserList = approvalUserList.map((auditor) => ({
			...auditor,
			user_info: userInfoList.find((user) => user.user_id === auditor.user_id)
		}))

		// newAuditUserList 에 유저 정보중에 approved_type 이 approver 인것만 approverList 에 넣어주기
		approverList.value = newAuditUserList.filter((auditor) => auditor.approved_type === 'approver');
		agreerList.value = newAuditUserList.filter((auditor) => auditor.approved_type === 'agreer');

		console.log('approverList : ', approverList.value);
		console.log('agreerList : ', agreerList.value);
	} catch (error) {
		getAuditDetailRunning.value = false;
		console.error(error);
	}
}

// 결재 하기
const postApproval = async (e: SubmitEvent) => {
	if (isPosting) return; // 중복 호출 방지
	isPosting = true;
  
	e.preventDefault();

	try {
		if (!auditId.value) return;

		const userId = user.user_id;
		const approved = (document.querySelector('input[name="approved"]:checked') as HTMLInputElement)?.value;

		const data = {
			approved: approved,
			comment: approvedComment.value,
			stamp: selectedStamp.value,
		}

		// 결재 하는 요청
		const res = await skapi.postRecord(data, {
			table: {
				name: 'audit_approval',
				access_group: 'authorized'
			},
			reference: auditId.value,
			tags: [(userId as string).replaceAll('-', '_')], 
		});

		console.log('결재 === postRecord === res : ', res);
		
		// 실시간 알림 보내기
		skapi.postRealtime(
			{
				audit_approval: {
					noti_id: res.record_id,
					noti_type: 'audit',
					send_date: new Date().getTime(),
					send_user: user.user_id,
					audit_info: {
						audit_type: 'approved',
						to_audit: auditDoContent.value?.data?.to_audit,
						audit_doc_id: auditId.value,
						approval: res.data.approved,
					}
				}
			},
			auditDoContent.value.user_id
		).then(res => {
			console.log('결재알림 === postRealtime === res : ', res);
		});

		// 실시간 못 받을 경우 알림 기록 저장
		skapi.postRecord(
			{
				noti_id: res.record_id,
				noti_type: 'audit',
				send_date: new Date().getTime(),
				send_user: user.user_id,
				audit_info: {
					audit_type: 'approved',
					to_audit: auditDoContent.value?.data?.to_audit,
					audit_doc_id: auditId.value,
					approval: res.data.approved,
				}
			},
			{
				readonly: true,
				table: {
					name: `realtime:${senderUser.value.user_id.replaceAll('-', '_')}`,
					access_group: "authorized",
				},
			}
		)
		.then((res) => {
			console.log("결재알림기록 === postRecord === res : ", res);
		});

		window.alert('결재가 완료되었습니다.');
		closeModal();
		getAuditDetail();
	} catch (error) {
		console.error(error);
	}
}

const updateScreenSize = () => {
	isDesktop.value = window.innerWidth > 768;
};

const loadStylesheet = () => {
  return new Promise((resolve) => {
    if (document.getElementById('wysiwyg4all-style')) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.id = 'wysiwyg4all-style';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/wysiwyg4all@latest/wysiwyg4all.css';
    
    link.onload = () => resolve();
    document.head.appendChild(link);
  });
};

onMounted(() => {
	window.addEventListener('resize', updateScreenSize);

	auditId.value = (route.params.auditId as string);
	getAuditDetail();
	loadStylesheet();
});

onUnmounted(() => {
	window.removeEventListener('resize', updateScreenSize);
});
</script>

<style scoped lang="less">
.wrap {
	padding: 3rem 2.4rem;
}

// .form-wrap {
// 	max-width: 100%;
// }

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
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0.25rem;
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

.empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    font-size: 0.875rem;
    line-height: 1.2;
    color: var(--gray-color-400);
    // cursor: pointer;
}

.btn {
	margin-top: 0;
}

.modal-stamp {
	.modal-body {
		p {
			font-size: 0.9rem;
			margin-bottom: 0.5rem;
		}
	}
}

.stamp-wrap {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    // grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    // grid-template-columns: repeat(4, minmax(220px, 1fr));
    gap: 1rem;

    .stamp-grid {
        position: relative;
        width: 100%;

        &::after {
            content: '';
            display: block;
            padding-bottom: 100%;
        }

        &.loading {
            border: 0;
        }

		// .checkbox {
		// 	position: absolute;
		// 	top: 4px;
		// 	left: 4px;
		// 	z-index: 10;
		// }

        .stamp {
            position: absolute;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
			border: 1px solid var(--gray-color-100);
			border-radius: 0.5rem;
			cursor: pointer;

			&.selected {
				border-color: var(--primary-color-400-dark);
				border-width: medium;
				background-color: var(--primary-color-25);
			}

            // .checkbox {
            //     position: absolute;
            //     top: 0.5rem;
            //     left: 0.5rem;
            // }

            .add-icon {
                position: absolute;
                width: 30px;
                height: 30px;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                fill: var(--primary-color-400);
                // transition: all 0.3s;
                // fill: var(--gray-color-300);
            }

            .delete-icon {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                width: 25px;
                height: 25px;
                fill: var(--gray-color-300);
                transition: all 0.3s;
                cursor: pointer;

                &:hover {
                    fill: var(--warning-color-400);
                }
            }

            &.upload-btn {
                cursor: pointer;

                #stamp-img {
                    background-color: unset;
                    // transition: all 0.3s;
                    border-color: var(--primary-color-300);

                    &::before {
                        content: '';
                        background-color: unset;
                    }
                }
                .name {
                    // transition: all 0.3s;
                    // color: var(--gray-color-300);
                    color:var(--primary-color-400);
                }

                &.disabled {
                    cursor: default;
                    pointer-events: none;

                    #stamp-img {
                        border-color: var(--gray-color-300);
                    }
                    .add-icon {
                        fill: var(--gray-color-300);
                    }
                    .name {
                        color:var(--gray-color-300);
                    }
                }

                // &:hover {
                //     #stamp-img {
                //         border-color: var(--primary-color-300);
                //     }
                //     .add-icon {
                //         fill: var(--primary-color-400);
                //     }
                //     .name {
                //         color:var(--primary-color-400);
                //     }
                // }
            }

            &.upload-preview {
                background-color: var(--primary-color-25);

                #stamp-img {
                    background-color: var(--primary-color-25);
                    border-color: var(--gray-color-200);
                    opacity: 0.3;

                    &::before {
                        content: '미리보기';
                        background-color: var(--primary-color-25);
                    }
                }
                .name {
                    opacity: 0.3;
                }
            }
        }

        .upload-options {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translateX(-50% + 50px) translateY(-50% + 25px);
            // right: -113px;
            // bottom: -40px;
            z-index: 9;
            background-color: var(--gray-color-100);
            border: 1px solid var(--gray-color-300);
            padding: 5px;
            border-radius: 4px;
            
            li {
                font-size: 0.8rem;
                text-align: left;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;

                &:first-child {
                    margin-bottom: 4px;
                }
                &:hover {
                    background-color: var(--primary-color-400);
                    color: #fff;

                    &.disabled {
                        background-color: unset;
                        color: unset;
                    }
                }
                &.disabled {
                    opacity: 0.25;
                    cursor: default;
                    pointer-events: none;
                }
            }
        }
    }
}

.previewStamp {
	display: inline-block;
	text-align: center;
	border: 1px solid var(--gray-color-100);
	border-radius: 0.5rem;
	padding: 4px;
	cursor: pointer;

	&.selected {
		border-color: var(--primary-color-400-dark);
		border-width: medium;
		background-color: var(--primary-color-25);
		border-style: solid;
	}
}

#stamp-img, .previewStamp img {
    width: 100px;
    height: 100px;
    border-radius: 30%;
    display: block;
    object-fit: contain;
    position: relative;
    // background-color: #fff;
    border: 2px dashed var(--gray-color-100);
    // margin-bottom: 0.5rem;

    &::before {
        content: "도장 등록";
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: #888;
        background-color: #fff;
        font-size: 14px;
        text-align: center;
        position: absolute;
        top: 0;
        left: 0;
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
        &.upload-stamp {
        }
    }
}
</style>

<style lang="less">
._wysiwyg4all {
	ul {
		list-style: disc !important;
		padding: initial !important;
		padding-inline-start: 40px !important;
	}

	ol {
		list-style: decimal !important;
		padding: initial !important;
		padding-inline-start: 40px !important;
	}

	li {
		list-style: inherit !important;
		padding: initial !important;
	}
}
</style>