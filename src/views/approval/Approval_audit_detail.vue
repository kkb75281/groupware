<template lang="pug">
.title
	h1 결재 문서
	span(v-if="isCanceled" style="color:var(--warning-color-400)") 현재 문서는 회수된 문서입니다.

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
							tr.mo(v-show="!isDesktop" style="border-top: 1px solid var(--gray-color-300);")
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
										li.approver-list(v-for="(approver, index) in approverList" :key="approver.user_id" :class="{ 'noexist' : !approver.user_info }")
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
															button.btn.sm.outline.btn-approve(type="button" :disabled="isCanceled" @click="openModal(approver)") 결재
														template(v-else)
															span.waitting 대기
												span.approver {{ approver.user_info?.name || '알 수 없음' }}

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
															button.btn.sm.outline.btn-approve(type="button" :disabled="isCanceled" @click="openModal(agreer)") 합의
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
														a.file-name(:href="file.url" download target="_blank") {{ file.filename }}
												template(v-if="uploadedFile.length === 0")
													li(style="color:var(--gray-color-300);") 등록된 파일이 없습니다.

			//- 결재 승인/반려에 대한 의견 영역
			//- template(v-if="senderUser.user_id === user.user_id")
			h4.sub-title 의견

			hr

			ul.reply-list(v-if="auditorList.filter(auditor => auditor.comment && auditor.comment.trim() !== '').length > 0")
				li.reply-item(v-for="(auditor, index) in auditorList.filter(auditor => auditor.comment && auditor.comment.trim() !== '')")
					//- .icon
					//- 	svg
					//- 		use(xlink:href="@/assets/icon/material-icon.svg#icon-reply")
					//- .reply-cont-wrap
					//- 	span.approver {{ auditor.user_info?.name }}
					//- 	span.reply-cont(:class="{ 'reject': auditor.approved === 'reject' }") {{ auditor.comment || '-' }}
					.auditor
						.info
							.name {{ auditor.user_info?.name }}
							.approved(:class="{ 'reject': auditor.approved === 'reject' }")
								template(v-if="auditor.approved === 'approve'") 승인자
								template(v-else) 반려자
						.date(v-if="auditor?.date") {{ formatTimestampToDate(auditor?.date) }}
					.comment {{ auditor.comment || '-' }}
			.empty(v-else) 결재 의견이 없습니다.


		.button-wrap
			button.btn.outline.bg-gray.btn-print(type="button" @click="previewAudit")
				.icon(style="padding: 0")
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-print")
			button.btn.outline.warning.btn-cancel(type="button" v-if="senderUser.user_id === user.user_id && isCancelPossible" @click="canceledAudit" :disabled="isCanceled") 회수
			button.btn.bg-gray.btn-cancel(type="button" @click="goToPrev") 이전

//- 결재 모달
#modal.modal.modal-approve(v-if="isModalOpen")
	.modal-cont(@click.stop)
		.modal-header(style="margin: 0")
			h2.modal-title(v-if="approvalStep === 1") 결재
			h2.modal-title(v-if="approvalStep === 2") 서명하기
			button.btn-close(@click="closeModal")
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
		.modal-body
			template(v-if="approvalStep === 1")
				.input-wrap(style="margin: 0")
					p.label 결재의견
					textarea(name="comment" rows="5" placeholder="결재의견을 추가하고 싶다면 입력해주세요." v-model="approvedComment" style="width: 100%;resize: none;")
			//- .table-wrap(v-if="approvalStep === 1")
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
										span.label-radio 승인
									label.radio-button
										input(type="radio" name="approved" value="reject" :checked="!approveAudit")
										span.label-radio 반려
							
							tr
								th 추가의견
								td
									.input-wrap(style="margin: 0")
										textarea(name="comment" rows="5" placeholder="결재의견을 입력해주세요." v-model="approvedComment" style="width: 100%;resize: none;")

			template(v-if="approvalStep === 2")
				.tab-menu
					ul(:class="{ 'stamp': stempType === 'stamp', 'sign': stempType === 'sign' }")
						li(:class="{ 'active': stempType === 'stamp' }" @click="stempType = 'stamp'; previewStamp = null; selectedStamp = null; selectedStampComplete = false") 도장/서명 선택
						li(:class="{ 'active': stempType === 'sign', 'disabled' : makeStampComplete || makeSignComplete }" @click="stempType = 'sign'; openStampModal = true; previewStamp = null; selectedStamp = null; selectedStampComplete = false") 직접 서명
				br
				.tab-cont
					template(v-if="stempType === 'stamp'")
						.my-stamp-wrap
							template(v-if="gettingStampList")
								Loading#loading
							template(v-else)
								.stamp-wrap(v-if="uploadedStamp && uploadedStamp.length")
									.stamp-grid(v-for="stamp in uploadedStamp" :key="stamp.url" @click="selectStamp(stamp.url)")
										.stamp(:class="{'selected' : selectedStamp === stamp.url.split('?')[0]}")
											img#stamp-img(:src="stamp.url" alt="도장 이미지")
								.previewStamp(v-else-if="previewStamp" :class="{'selected' : selectedStamp === previewStamp}" @click="selectStamp(previewStamp)")
									img(:src="previewStamp" style="display: block;margin: 0 auto;" alt="도장 미리보기")
								.no-stamp(v-else style="text-align: center;border: 1px solid var(--gray-color-100);padding: 3rem 1rem;border-radius: 8px;color: var(--gray-color-400); font-size:0.9rem") 
									template(v-if="makeStampRunning")
										Loading#loading
									template(v-else)
										span 현재 등록된 도장이 없습니다.
										br
										br
										button.btn.outline(type="button" @click="createStamp" :disabled="previewStamp" style="margin:0 auto") 도장 생성
						canvas#stampCanvas(width="100" height="100" style="display: none;")
					template(v-if="stempType === 'sign'")
						MakeStamp(v-if="openStampModal" :onlySign="true" @upload="uploadStampImage" @save="handleStampBlob" @close="closeStampDialog")
						div(v-if="makeStampRunning")
							Loading#loading
						//- .previewStamp(v-else-if="previewStamp" :class="{'selected' : selectedStamp === previewStamp}" @click="selectStamp(previewStamp)")
						//- 	img(:src="previewStamp" style="display: block;margin: 0 auto;" alt="도장 미리보기")
		.modal-footer(style="margin: 0")
			template(v-if="approvalStep === 1")
				button.btn.warning.btn-edit(type="button" @click="rejectAudit") 반려하기
				button.btn.btn-edit(type="button" @click="approveAudit = true; approvalStep++; getStampList(true)") 승인하기
			template(v-if="approvalStep === 2")
				button.btn.bg-gray.btn-edit(v-if="stempType === 'sign' ? handleStampBlobComplete : true" type="button" @click="approvalStep--") 이전
				button.btn.btn-edit(v-if="selectedStampComplete" type="button" @click="postApproval") 결재승인

</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { skapi, isConnected, RealtimeCallback } from '@/main';
import { user, makeSafe } from '@/user';
import { getUserInfo } from '@/employee';
import { auditList } from '@/audit';
import { getStampList, uploadedStamp, uploadedRecordId, uploadGeneratedStamp } from '@/stamp';
import {
  openStampModal,
  closeStampDialog,
  handleStampBlob,
  uploadingStamp,
  onlyStampFile,
  handleStampBlobComplete
} from '@/components/make_stamp';

import Loading from '@/components/loading.vue';
import MakeStamp from '@/components/make_stamp.vue';

const router = useRouter();
const route = useRoute();
const auditId = ref('');

const isDesktop = ref(window.innerWidth > 768);

const disabled = ref(false);
const auditDoContent = ref([]); // 결재 서류 내용
const approverList = ref([]);
const agreerList = ref([]);
const auditorList = ref([]); // 전체 결재자 리스트
const isModalOpen = ref(false);
const isStampModalOpen = ref(false);
const senderUser = ref({});
const uploadedFile = ref([]);
const previewStamp = ref(null);
const approveAudit = ref(false);
const approvedComment = ref('');
const approvalStep = ref(1);
const stempType = ref('stamp');
const makeStampComplete = ref(false);
const makeSignComplete = ref(false);
const isCanceled = ref(false); // 결재 회수 여부
const getAuditDetailRunning = ref(false);

// 결재 회수 가능 여부 확인
const isCancelPossible = computed(() => {
  // console.log('결재자 리스트 === isCancelPossible === auditorList : ', auditorList.value);

  // 모든 결재자가 결재를 완료한 경우에는 회수 불가능
  if (auditorList.value.every((auditor) => auditor.approved)) {
    console.log('모두 결재 완료!!');
    return false;
  } else {
    console.log('결재 진행중!!');
    return true;
  }
});

// 결재자 정보 저장
const selectedAuditors = ref({
  approvers: [], // 결재
  agreers: [], // 합의
  receivers: [] // 수신참조
});

watch(
  () => route.params.auditId as string,
  async (nv, ov) => {
    if (nv !== ov) {
      auditId.value = nv;
      await getAuditDetail();
    }
  }
);

watch(auditDoContent, () => {
  console.log({ auditList });
  console.log({ auditDoContent });
  let userId = auditDoContent.value?.user_id;

  if (userId) {
    getUserInfo(userId)
      .then((res) => {
        senderUser.value = res.list[0] || {};
      })
      .catch((err) => {
        console.error('Failed to fetch user info:', err);
        senderUser.value = {};
      });
  } else {
    senderUser.value = {};
  }
});

let isPosting = false;

const openModal = (target) => {
	// 초기화
	approveAudit.value = false;
	approvedComment.value = '';
	approvalStep.value = 1;
  stempType.value === 'stamp';

  if (target && target.user_id !== user.user_id) return;

  isModalOpen.value = true;
  document.body.classList.add('modal-open');
};

const closeModal = () => {
  isModalOpen.value = false;
  isStampModalOpen.value = false;
  document.body.classList.remove('modal-open');
};

const goToPrev = () => {
  // 결재 발신함
  if (senderUser.value.user_id === user.user_id) {
    router.push('/approval/request-list');

    // 수신참조
  } else if (route.path.includes('audit-detail-reference')) {
    router.push('/approval/audit-reference');

    // 결재 수신함
  } else {
    router.push('/approval/audit-list');
  }
};

function formatTimestampToDate(timestamp: number) {
  const date = new Date(timestamp); // timestamp를 Date 객체로 변환

  const year = date.getFullYear(); // 연도 가져오기
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 월 가져오기 (0부터 시작하므로 +1)
  const day = String(date.getDate()).padStart(2, '0'); // 일 가져오기

  return `${year}-${month}-${day}`; // 형식화된 문자열 반환
}

let rejectAudit = () => {
  isModalOpen.value = false;
  approveAudit.value = false;
  postApproval();
};

let gettingStampList = ref(false);
let makeStampRunning = ref(false);
let selectedStamp = ref(null);
let selectedStampComplete = ref(false);

let uploadCreatedStamp = async (file) => {
  let stamp_postParams = {
    table: {
      name: 'stamp_images',
      access_group: 1
    }
  };

  if (uploadedRecordId.value) {
    stamp_postParams.record_id = uploadedRecordId.value;
  } else {
    stamp_postParams.unique_id = '[stamp_images]' + makeSafe(user.user_id);
  }

  let stampImageData = new FormData();
  stampImageData.append('stamp_data', file);
  console.log({ stampImageData });
  console.log({ stamp_postParams });

  const res = await skapi.postRecord(stampImageData, stamp_postParams);
  console.log({ res });

  return res;
};

// 직접 서명
let uploadStampImage = async (imageUrl) => {
  makeStampRunning.value = true;

  console.log({ imageUrl });

  await handleStampBlob(imageUrl);

  if (!onlyStampFile.value) return;

  let uploadGeneratedStampUrl = null;

  try {
    uploadGeneratedStamp.value = await uploadCreatedStamp(onlyStampFile.value);
    console.log('uploadGeneratedStamp.value : ', uploadGeneratedStamp.value);
  } catch (e) {
    alert('도장 등록 중 오류가 발생했습니다.');
    throw e;
  }

  // if(uploadGeneratedStamp.value?.bin && Object.keys(uploadGeneratedStamp.value?.bin).length && uploadGeneratedStamp.value?.bin?.stamp_data?.length) {
  // 	uploadGeneratedStampUrl = uploadGeneratedStamp.value.bin.stamp_data.filter((stamp) => stamp.filename === uploadingStamp.value.name)[0].url;
  // 	console.log('uploadGeneratedStampUrl : ', uploadGeneratedStampUrl);
  // }

  if (
    uploadGeneratedStamp.value?.bin &&
    Object.keys(uploadGeneratedStamp.value?.bin).length &&
    uploadGeneratedStamp.value?.bin?.stamp_data?.length
  ) {
    // console.log({onlyStampFile: onlyStampFile.value})
    // console.log({name: uploadingStamp.value.name})
    let searchStamp = uploadGeneratedStamp.value.bin.stamp_data.filter(
      (stamp) => stamp.filename === uploadingStamp.value.name
    );
    // console.log({searchStamp})
    if (searchStamp && searchStamp.length) {
      uploadGeneratedStampUrl = searchStamp[0].url;
    }
    console.log('uploadGeneratedStampUrl : ', uploadGeneratedStampUrl);
  }

  stempType.value = 'stamp';

  await getStampList(true);

  if (uploadGeneratedStampUrl) {
    selectStamp(uploadGeneratedStampUrl);
  }

  makeStampRunning.value = false;
  makeSignComplete.value = true;
};

let createStamp = () => {
  makeStampRunning.value = true;

  // 캔버스와 컨텍스트 가져오기
  const canvas = document.getElementById('stampCanvas');
  const ctx = canvas.getContext('2d');

  // 도장 생성 함수
  function drawStamp(name: string) {
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

  let settingStampName = async () => {
    await getStampList();

    if (uploadedStamp.value && uploadedStamp.value.length) {
      // 도장 이미지가 있을때 각각의 도장 이름 중 generated-stamp-가 있는지 확인
      const stampNames = uploadedStamp.value.map((stamp) => stamp.filename);
      console.log(stampNames);
      const generatedStamp = stampNames.filter((name) => name.includes('generated-stamp-'));
      console.log(generatedStamp);

      // generatedStamp가 있으면 그 다음 숫자를 찾아서 도장 이름을 만들어줌
      if (generatedStamp.length) {
        const lastStampNumber = generatedStamp
          .map((stamp) => parseInt(stamp.split('-')[2]))
          .sort((a, b) => b - a)[0];
        return `generated-stamp-${lastStampNumber + 1}`;
      } else {
        return 'generated-stamp-1';
      }
    } else {
      return 'generated-stamp-1';
    }
  };

  // 캔버스에서 Blob 생성 후 서버로 업로드
  canvas.toBlob(async (blob) => {
    let stampName = await settingStampName();
    let file = new File([blob], stampName, { type: 'image/png' });

    try {
      uploadGeneratedStamp.value = await uploadCreatedStamp(file);
      console.log('uploadGeneratedStamp.value : ', uploadGeneratedStamp.value);
    } catch (e) {
      alert('도장 등록 중 오류가 발생했습니다.');
      throw e;
    }

    if (
      uploadGeneratedStamp.value?.bin &&
      Object.keys(uploadGeneratedStamp.value?.bin).length &&
      uploadGeneratedStamp.value?.bin?.stamp_data?.length
    ) {
      previewStamp.value = uploadGeneratedStamp.value.bin.stamp_data.filter(
        (stamp) => stamp.filename === stampName
      )[0].url;
    } else {
      getStampList(true);
    }

    if (previewStamp.value) {
      selectStamp(previewStamp.value);
    }

    makeStampRunning.value = false;
    makeStampComplete.value = true;
  }, 'image/png');
};

let selectStamp = (url) => {
  if (url.includes('?')) {
    selectedStamp.value = url.split('?')[0];
  }
  selectedStampComplete.value = true;
};

// 다른 사람 결재 여부 확인
const approvedAudit = async () => {
  try {
    const res = await skapi.getRecords({
      table: {
        name: 'audit_approval',
        access_group: 'authorized'
      },
      reference: auditId.value
    });

    return res.list;
  } catch (error) {
    console.error(error);
  }

  isModalOpen.value = false;
};

// 결재 서류 가져오기
const getAuditDetail = async () => {
  getAuditDetailRunning.value = true;

  // 초기화
  auditDoContent.value = [];
  approverList.value = [];
  agreerList.value = [];
  auditorList.value = [];
  uploadedFile.value = [];
  selectedAuditors.value = {
    approvers: [],
    agreers: [],
    receivers: []
  };
  isCanceled.value = false;

  if (!auditId.value) {
    getAuditDetailRunning.value = false;
    return;
  }

  try {
    const auditDoc = (
      await skapi.getRecords({
        record_id: auditId.value
      })
    ).list[0];

    console.log('결재서류 === getAuditDetail === auditDoc : ', auditDoc);

    if (auditDoc) {
      auditDoContent.value = auditDoc;
    }

    skapi
      .getRecords({
        table: {
          name: 'audit_canceled:' + auditId.value,
          access_group: 'authorized'
        }
      })
      .then((res) => {
        if (res.list && res.list.length) {
          isCanceled.value = true;
        } else {
          isCanceled.value = false;
        }
      })
      .catch((err) => {
        isCanceled.value = false;
      });

    const auditors = JSON.parse(auditDoc.data.auditors);
    console.log('결재자 === auditors : ', auditors);

    let getAuditorInfo = async (uid) => {
      let user_id = uid.replaceAll('_', '-');
      let userInfo = await getUserInfo(user_id);

      return userInfo.list[0];
    };

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
      processAuditors('receivers')
    ]);

    if (Object.keys(auditDoc.bin).length && auditDoc.bin.additional_data.length) {
      let fileList = [];
      let additional_data = auditDoc.bin.additional_data;

      function getFileUserId(str) {
        if (!str) return '';
        return str.split('/')[3];
      }

      const result = additional_data.map((el) => ({
        ...el,
        user_id: getFileUserId(el.path)
      }));

      fileList.push(...result);

      uploadedFile.value = fileList;
      // for(let f of fileList) {
      // 	skapi.getFile(f.url, {dataType: 'endpoint'}).then(r=>console.log({r}));
      // }
      // console.log('uploadedFile : ', uploadedFile.value);
    } else {
      uploadedFile.value = [];
    }

    getAuditDetailRunning.value = false;

    const approvals = await approvedAudit();
    // console.log('결재완료자 === getAuditDetail === approvals : ', approvals);

    const approvalUserList = [];
    const newTags = auditDoc.tags.map((a) => a.replaceAll('_', '-')); // 모든 결재자

    await Promise.all(
      newTags.map(async (auditor) => {
        if (auditor.includes('receiver')) return;

        const [approvedType, userId] = auditor.split(':');
        const approval = approvals.find((approval) => approval.user_id === userId);

        if (approval) {
          const approvedStr = approval.data.approved ? '결재함' : '반려함';

		  console.log({approval})

		  let stampFile;

		  // 도장 파일 가져오기
		  if(approval.data.approved === 'approve') {
			stampFile = await skapi.getFile(approval.data.stamp, {
				dataType: 'endpoint'
			});
		  } else {
			stampFile = null;
		  }

		  console.log({stampFile})

          approvalUserList.push({
            user_id: userId,
            approved_type: approvedType,
            approved: approval.data.approved,
            stamp: stampFile,
            approved_str: approvedStr
          });
        } else {
          approvalUserList.push({
            user_id: userId,
            approved_type: approvedType,
            approved: null,
            stamp: null,
            approved_str: '결재대기중'
          });
        }
      })
    );
    // console.log('결재 결과 === getAuditDetail === approvalUserList : ', approvalUserList);

    const userIds = approvalUserList.map((auditor) => auditor.user_id);
    const userList = await Promise.all(userIds.map(async (auditor) => await getUserInfo(auditor)));
    const userInfoList = userList.map((user) => (user.list.length ? user.list[0] : null));

    // 결재자 정보와 결재 결과 합치기
    const newAuditUserList = approvalUserList.map((auditor) => ({
      ...auditor,
      user_info: userInfoList.find((user) => user?.user_id === auditor.user_id),
      comment: approvals.find((user) => user?.user_id === auditor.user_id)?.data.comment,
      date: approvals.find((user) => user?.user_id === auditor.user_id)?.data.date
    }));

    // 전체 결재자 리스트
    auditorList.value = newAuditUserList;

    // auditorList 결재, 합의 순서대로
    auditorList.value.sort((a, b) => {
      if (a.approved_type === 'approver' && b.approved_type === 'agreer') return -1;
      if (a.approved_type === 'agreer' && b.approved_type === 'approver') return 1;
      return 0;
    });

    // newAuditUserList 에 유저 정보중에 approved_type 이 approver 인것만 approverList 에 넣어주기
    approverList.value = newAuditUserList.filter((auditor) => auditor.approved_type === 'approver');
    agreerList.value = newAuditUserList.filter((auditor) => auditor.approved_type === 'agreer');
  } catch (error) {
    getAuditDetailRunning.value = false;
    console.error(error);
  }
};

// 결재 하기
const postApproval = async () => {
  if (isPosting) return; // 중복 호출 방지
  isPosting = true;

  // if (e) {
  // 	e.preventDefault();
  // }

  try {
    if (!auditId.value) return;

    const userId = user.user_id;
    // const approved = (document.querySelector('input[name="approved"]:checked') as HTMLInputElement)?.value;
    const approved = approveAudit.value ? 'approve' : 'reject';
    const approvedDate = new Date().getTime();

    console.log('=== postApproval === approved : ', approved);

    if (approved === 'approve' && (!selectedStamp.value || !selectedStampComplete.value)) {
      alert('도장을 선택해주세요.');
      isPosting = false;
      return;
    }

    const data = {
      approved: approved,
      comment: approvedComment.value,
      stamp: selectedStamp.value,
      date: approvedDate
    };

    // 결재 하는 요청
    const res = await skapi.postRecord(data, {
      table: {
        name: 'audit_approval',
        access_group: 'authorized'
      },
      reference: auditId.value,
      tags: [(userId as string).replaceAll('-', '_')]
    });
    console.log('결재 === postApproval === res : ', res);

	let postRealtimeBody = {
		text: `${user.name}님께서 결재를 ${approveAudit.value ? '승인' : '반려'}했습니다.`,
		type: 'audit',
		id: auditId.value
	}

    // 실시간 알림 보내기
    skapi
      .postRealtime(
        {
          audit_approval: {
            noti_id: res.record_id,
            noti_type: 'audit',
            send_date: approvedDate,
            send_user: user.user_id,
            audit_info: {
              audit_type: 'approved',
              to_audit: auditDoContent.value?.data?.to_audit,
              audit_doc_id: auditId.value,
              approval: res.data.approved
            }
          }
        },
        auditDoContent.value.user_id,
		{
			title: '알림',
			// body: JSON.stringify(postRealtimeBody)
			body: `${user.name}님께서 결재를 완료했습니다.`,
		}
      )
      .then((res) => {
        console.log('결재알림 === postRealtime === res : ', res);
      });

    // 실시간 못 받을 경우 알림 기록 저장
    skapi
      .postRecord(
        {
          noti_id: res.record_id,
          noti_type: 'audit',
          send_date: approvedDate,
          send_user: user.user_id,
          audit_info: {
            audit_type: 'approved',
            to_audit: auditDoContent.value?.data?.to_audit,
            audit_doc_id: auditId.value,
            approval: res.data.approved
          }
        },
        {
          readonly: true,
          table: {
            name: `realtime:${senderUser.value.user_id.replaceAll('-', '_')}`,
            access_group: 'authorized'
          }
        }
      )
      .then((res) => {
        console.log('결재알림기록 === postRecord === res : ', res);
      });

    window.alert('결재가 완료되었습니다.');
    closeModal();
    getAuditDetail();
  } catch (error) {
    console.error(error);
  } finally {
    isPosting = false;
  }
};

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

// 결재 회수 함수
const canceledAudit = async () => {
  // console.log('결재회수 === canceledAudit === auditId : ', auditId.value);
  // console.log('결재회수 === canceledAudit === auditDoContent : ', auditDoContent.value);

  const auditors = auditDoContent.value.data.auditors;
  const parsedAuditors = JSON.parse(auditors);
  // console.log('결재회수 === canceledAudit === auditors : ', auditors);
  // console.log('결재회수 === canceledAudit === parsedAuditors : ', parsedAuditors);

  // 각 배열에서 ID만 추출
  const approverIds = parsedAuditors.approvers;
  const agreerIds = parsedAuditors.agreers;
  const receiverIds = parsedAuditors.receivers;

  // // 결재자 ID 배열 생성
  const allAuditors = [...approverIds, ...agreerIds, ...receiverIds];
  // console.log('결재회수 === canceledAudit === allAuditors : ', allAuditors);

  // 결재 회수 레코드 저장
  try {
    const option = {
      readonly: true,
      table: {
        name: 'audit_canceled:' + auditId.value,
        access_group: 'authorized'
      }
    };

    const res = await skapi.postRecord(null, option);
    console.log('결재회수 === postRecord === res : ', res);
  } catch (error) {
    console.error(error);
  }

  // 결재 회수 실시간 알림 data
  const postRealtimeData = {
    audit_canceled: {
      noti_id: auditId.value,
      noti_type: 'audit',
      send_date: new Date().getTime(),
      send_user: user.user_id,
      audit_info: {
        audit_type: 'canceled',
        to_audit: auditDoContent.value?.data?.to_audit,
        audit_doc_id: auditId.value
      }
    }
  };

  let postRealtimeBody = {
	text: `${user.name}님께서 결재를 회수했습니다.`,
	type: 'audit',
	id: auditId.value
}

  // 결재 회수 알림 기록 data
  const postRecordData = {
    noti_id: auditId.value,
    noti_type: 'audit',
    send_date: new Date().getTime(),
    send_user: user.user_id,
    audit_info: {
      audit_type: 'canceled',
      to_audit: auditDoContent.value?.data?.to_audit,
      audit_doc_id: auditId.value
    }
  };

  // 각 그룹별 알림 전송 Promise.all로 동시에 처리
  try {
    const results = await Promise.all(
      allAuditors.map(async (auditor) => {

		let realtimeResult;
		// 실시간 알림 전송
		try {
			realtimeResult = await skapi.postRealtime(
			  postRealtimeData,
			  auditor.replaceAll('_', '-'),
			  {
				title: '알림',
				// body: JSON.stringify(postRealtimeBody)
				body: `${user.name}님께서 결재를 회수했습니다.`,
			  }
			);
		} catch (error) {
			await skapi.closeRealtime();
			skapi.connectRealtime(RealtimeCallback).finally(async()=>{
				realtimeResult = await skapi.postRealtime(
				postRealtimeData,
				auditor.replaceAll('_', '-'),
				{
					title: '알림',
					// body: JSON.stringify(postRealtimeBody)
					body: `${user.name}님께서 결재를 회수했습니다.`,
				}
				);
			});
		}

        // 알림 기록 저장
        const recordResult = await skapi.postRecord(postRecordData, {
          readonly: true,
          table: {
            name: `realtime:${auditor.replaceAll('-', '_')}`,
            access_group: 'authorized'
          }
        });

        return {
          auditor: auditor,
          realtimeResult: realtimeResult,
          recordResult: recordResult
        };
      })
    );
    console.log('결재회수 알림 전송 완료:', results);
  } catch (error) {
    console.error('결재회수 알림 전송 중 오류:', error);
  }

  // // 실시간 못 받을 경우 알림 기록 저장
  // skapi.postRecord(
  // 	{
  // 		noti_id: auditId.value,
  // 		noti_type: 'audit',
  // 		send_date: new Date().getTime(),
  // 		send_user: user.user_id,
  // 		audit_info: {
  // 			audit_type: 'canceled',
  // 			to_audit: auditDoContent.value?.data?.to_audit,
  // 			audit_doc_id: auditId.value,
  // 		}
  // 	},
  // 	{
  // 		readonly: true,
  // 		table: {
  // 			name: `realtime:${senderUser.value.user_id.replaceAll('-', '_')}`,
  // 			access_group: "authorized",
  // 		},
  // 	}
  // )
  // .then((res) => {
  // 	console.log("결재회수 알림기록 === postRecord === res : ", res);
  // });

  window.alert('결재가 회수되었습니다.');
  disabled.value = true; // 회수 버튼 비활성화
  isCanceled.value = true; // 회수 여부 변경

  await nextTick();
};

onMounted(() => {
  window.addEventListener('resize', updateScreenSize);

  auditId.value = route.params.auditId as string;
  getAuditDetail();
  loadStylesheet();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize);
});
</script>

<style scoped lang="less">
.title {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 1rem;

  span {
    color: var(--gray-color-400);
    line-height: 1.4;
  }
}

.wrap {
  padding: 3rem 2.4rem;
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
      line-height: 1.2;
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

// 추가의견 영역
.sub-title {
  margin-top: 4rem;
}

.reply-list {
  // margin-bottom: 3rem;
  // margin-top: 3rem;

  .reply-item {
    // border: 1px dashed var(--gray-color-300);
    // border-radius: 8px;
    // padding: 0.5rem;
    // display: flex;
    // align-items: center;
    gap: 0.5rem;
    // margin-bottom: 0.5rem;
    margin-bottom: 1.5rem;

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  .icon {
    padding: 0;
  }

  .reply-cont-wrap {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .auditor {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    align-items: center;
    margin-bottom: 0.5rem;
    padding-left: 0.2rem;

    .info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .name {
      // display: inline-block;
      font-size: 0.9rem;
    }
    .approved {
      // display: inline-block;
      // margin-right: 4px;
      font-size: 12px;
      border: 1px solid var(--primary-color-300);
      padding: 3px 4px;
      border-radius: 8px;
      color: var(--primary-color-400);

      &.reject {
        color: var(--warning-color-400);
        border-color: var(--warning-color-400);
      }
    }
    .date {
      font-size: 0.8rem;
      color: var(--gray-color-400);
    }
  }

  .comment {
    background-color: var(--gray-color-50);
    padding: 0.8rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;

    &.reject {
      color: var(--warning-color-400);
    }
  }

  .approver {
    font-size: 0.9rem;

    // &::after {
    // 	content: ' : ';
    // 	display: inline-block;
    // 	margin-left: 0.5rem;
    // }
  }

  .reply-cont {
    font-size: 0.9rem;
    color: var(--gray-color-500);
    line-height: 1.2;

    &.reject {
      color: var(--warning-color-400);
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

.button-wrap {
  margin-top: 3rem;
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

.modal-approve {
  .tab-menu {
    display: flex;
    align-items: center;
    justify-content: center;

    ul {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--gray-color-50);
      max-width: 300px;
      border-radius: 30px;

      li {
        cursor: pointer;
        font-size: 0.9rem;
        color: var(--gray-color-400);
        transition: all 0.3s;
        padding: 0.5rem 1rem;
        border-radius: 30px;

        &.active {
          color: #fff;
          background-color: var(--primary-color-400);
        }
        &.disabled {
          opacity: 0.5;
          cursor: default;
          pointer-events: none;
        }
      }
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
          color: var(--primary-color-400);
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
            color: var(--gray-color-300);
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

#stamp-img,
.previewStamp img {
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
    content: '도장 등록';
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

.rejected {
  color: var(--warning-color-400);
}

.waitting {
  color: var(--gray-color-500);
}

._wysiwyg4all {
  padding: 0;
}

@media print {
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
    position: absolute;
    top: 5%;
    left: 0;
    width: 100%;
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
