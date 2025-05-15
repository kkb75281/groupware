<template lang="pug">
//- .title
//- 	h1 결재 문서
span(v-if="isCanceled" style="color:var(--warning-color-400)") 현재 문서는 회수된 문서입니다.

//- hr

Loading#loading(v-if="getAuditDetailRunning")

.form-wrap(v-if="!getAuditDetailRunning")
	form#_el_request_form(@submit.prevent="requestAudit")
		#printArea
			.title
				h2 {{ auditDoContent?.index?.value }}

			.reject-setting
				template(v-if="senderUser.user_id === user.user_id")
					p.text(v-if="!rejectSetting") ※ 결재 도중 반려시 해당 결재서류 회수합니다.
					p.text(v-else) ※ 결재 도중 반려와 상관없이 모든 결재자의 결재를 진행합니다.

			.table-wrap
				.tb-overflow
					table.table#tb-auditRequest
						colgroup
							col(style="width: 13%")
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
											template(v-if="approver.approved_type === 'approvers'")
												span.num {{ approver.order }}
												span.sign
													template(v-if="approver.approved === 'approve'")
														img(v-if="approver?.stamp" :src="approver.stamp" alt="도장 이미지")
														span.approved(v-else) 승인
													template(v-else-if="approver.approved === 'reject'")
														span.rejected 반려
													template(v-else="!approver.approved || approver.approved === null")
														template(v-if="approver.user_id === user.user_id")
															button.btn.sm.outline.btn-approve(type="button" :disabled="!isApprovalOrder || isCanceled" @click="openModal(approver)") 결재
														template(v-else)
															span.waitting 대기
												span.approver {{ approver.user_info?.name || '알 수 없음' }}

							tr.approval(v-if="agreerList.length > 0")
								th 합의
								td.left(colspan="3" style="padding: 0; height: 119px;")
									ul.approver-wrap
										li.approver-list(v-for="(agreer, index) in agreerList" :key="agreer.user_id")
											template(v-if="agreer.approved_type === 'agreers'")
												span.num {{ agreer.order }}
												span.sign
													template(v-if="agreer.approved === 'approve'")
														img(v-if="agreer?.stamp" :src="agreer.stamp" alt="도장 이미지")
														span.approved(v-else) 승인
													template(v-else-if="agreer.approved === 'reject'")
														span.rejected 반려
													template(v-else="!agreer.approved || agreer.approved === null")
														template(v-if="agreer.user_id === user.user_id")
															button.btn.sm.outline.btn-approve(type="button" :disabled="!isApprovalOrder || isCanceled" @click="openModal(agreer)") 합의
														template(v-else)
															span.waitting 대기
												span.approver {{ agreer.user_info?.name }}

							tr.reference(v-if="selectedAuditors.receivers.length > 0")
								th 수신 참조
								td.left(colspan="3") {{ selectedAuditors.receivers.map(receiver => receiver.name).join(', ') }}

							tr(v-for="(row, index) in customRows" :key="'custom_' + index")
								th {{ row.title }}
								td.left(colspan="3") {{ row.value }}

							tr
								th 제목
								td.left(colspan="3") {{ auditDoContent?.data?.to_audit }}

							tr
								th 결재 내용
								td.left(colspan="3")
									._wysiwyg4all(v-html="disableContentEditable(auditDoContent?.data?.to_audit_content)")
									

							tr
								th 첨부 파일
								td.left(colspan="3")
									.input-wrap.upload-file
										.file-wrap(style="margin: 0")
											ul.file-list(style="margin: 0")
												template(v-if="uploadedFile.length > 0")
													li.file-item(v-for="(file, index) in uploadedFile" :key="index")
														a.file-name(:href="file.url" download target="_blank") {{ file.filename }}
												template(v-if="uploadedFile.length === 0")
													li(style="color:var(--gray-color-300);") 등록된 파일이 없습니다.

							tr
								th 참조 문서
								td(colspan="3")
									.refer-doc-wrap
										ul.refer-doc-list
											template(v-if="referDoc.length > 0")
												li.refer-doc-item(v-for="(doc, index) in referDoc" :key="index")
													span.refer-doc-name(@click="showReferDetail(doc)") {{ doc.data.to_audit }}

			h4.sub-title 의견

			.input-wrap.input-comment
				input(type="text" placeholder="의견을 입력해주세요." v-model="comment" style="width: 100%;")
				button.btn(type="button" @click="writeComment") 등록

			//- 댓글
			ul.comment-list(v-if="commentList.length > 0")
				li.comment-item(v-for="(comment, index) in commentList" :key="index")
					.auditor-info
						.name {{ comment.data.writer_name }}
						.approved(:class="{ 'reject': comment.data.approval_type === 'reject', 'draft': !comment.data.approval_type || comment.data.approval_type === 'undefined' }") {{ comment.data.approval_type === 'approve' ? '승인자' : comment.data.approval_type === 'reject' ? '반려자' : '기안자' }}
					template(v-if="isEditMode[comment.record_id]")
						.input-wrap.input-edit
							input(type="text" placeholder="의견을 입력해주세요." v-model="editComment[comment.record_id]" style="width: 100%;")
							.btn-wrap
								button.btn.sm.outline.btn-update(type="button" @click="editReply('reply', index)") 등록
								button.btn.sm.outline.btn-cancel(type="button" @click="toggleEditMode('reply', index)") 취소
					template(v-else)
						.text {{ comment.data.comment || '-' }}
					.etc
						template(v-if="comment.data.edited")
							span.date(v-if="comment.data.edited" style="margin-left: 0.5rem;") {{ formatTimestampToDate(comment?.data.edit_date) }}
								span.text 수정됨
						template(v-else)
							.date {{ formatTimestampToDate(comment?.data.date) }}
						button.btn-reply(type="button" @click="toggleReplyInput('reply', index)") 댓글 쓰기
						.btn-wrap(v-if="comment.data.writer === user.user_id")
							button.btn-edit(type="button" @click="toggleEditMode('reply', index)") 수정
							button.btn-delete(type="button" @click="deleteReply('reply', index)") 삭제

					//- 대댓글 :: s
					ul.reply-list(v-if="getFilteredReplies(comment.record_id).length > 0")
						li.reply-item(v-for="(reply, index) in getFilteredReplies(comment.record_id)" :key="index")
							.icon
								svg
									use(xlink:href="@/assets/icon/material-icon.svg#icon-reply")
							.reply
								.auditor-info
									.name {{ reply.data.writer_name }}
									.approved(:class="{ 'reject': comment.data.approval_type === 'reject', 'draft': !reply.data.approval_type || reply.data.approval_type === 'undefined' }") {{ reply.data.approval_type === 'approve' ? '승인자' : reply.data.approval_type === 'reject' ? '반려자' : '기안자' }}
								template(v-if="isEditMode[reply.record_id]")
									.input-wrap.input-edit
										input(type="text" placeholder="의견을 입력해주세요." v-model="editComment[reply.record_id]" style="width: 100%;")
										.btn-wrap
											button.btn.sm.outline.btn-update(type="button" @click="editReply('subReply', index)") 등록
											button.btn.sm.outline.btn-cancel(type="button" @click="toggleEditMode('subReply', index)") 취소
								template(v-else)
									.text {{ reply.data.comment || '-' }}
								.etc
									template(v-if="reply.data.edited")
										span.date(v-if="reply.data.edited" style="margin-left: 0.5rem;") {{ formatTimestampToDate(reply?.data.edit_date) }}
											span.text 수정됨
									template(v-else)
										.date {{ formatTimestampToDate(reply?.data.date) }}
									//- button.btn-reply(type="button" @click="toggleReplyInput('subReply', index)") 댓글 쓰기
									.btn-wrap(v-if="reply.data.writer === user.user_id")
										button.btn-edit(type="button" @click="toggleEditMode('subReply', index)") 수정
										button.btn-delete(type="button" @click="deleteReply('subReply', index)") 삭제

						template(v-if="commentList[index]?.record_id && isSubReplyOpen[commentList[index]?.record_id]")
							.input-wrap.input-reply(style="padding-left: 2.5rem; margin-top: 1rem;")
								input(type="text" placeholder="댓글을 입력해주세요." v-model="subReply[commentList[index]?.record_id]" style="width: 100%;")
								.btn-wrap
									button.btn(type="button" @click="writeReply('subReply', index)") 등록
									button.btn.bg-gray(type="button" @click="toggleReplyInput('subReply', index)") 취소
					//- 대댓글 :: e

					template(v-if="isReplyOpen[comment.record_id]")
						.input-wrap.input-reply
							input(type="text" placeholder="댓글을 입력해주세요." v-model="reply[comment.record_id]" style="width: 100%;")
							.btn-wrap
								button.btn(type="button" @click="writeReply('reply', index)") 등록
								button.btn.bg-gray(type="button" @click="toggleReplyInput('reply', index)") 취소
			.empty(v-else style="margin-top: 3rem;") 결재 의견이 없습니다.


		.button-wrap
			button.btn.outline.bg-gray.btn-print(type="button" @click="previewAudit")
				.icon(style="padding: 0")
					svg
						use(xlink:href="@/assets/icon/material-icon.svg#icon-print")
			button.btn.outline.warning.btn-cancel(type="button" v-if="senderUser.user_id === user.user_id && isCancelPossible" @click="canceledAudit" :disabled="isCanceled") 회수
			button.btn.outline.btn-re-request(type="button" v-if="senderUser.user_id === user.user_id" @click="reRequestAudit") 재요청
			button.btn.bg-gray.btn-cancel(type="button" @click="goToPrev") 목록

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

			template(v-if="approvalStep === 2")
				.tab-menu
					ul(:class="{ 'stamp': stempType === 'stamp', 'sign': stempType === 'sign' }")
						//- li(:class="{ 'active': stempType === 'stamp' }" @click="stempType = 'stamp'; previewStamp = null; selectedStamp = null; selectedStampComplete = false") 도장/서명 선택
						li(:class="{ 'active': stempType === 'stamp' }" @click="stempType = 'stamp'; getMainStamp()") 도장/서명 선택
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
								.previewStamp(v-else-if="previewStamp" :class="{'selected' : selectedStamp === previewStamp.split('?')[0]}" @click="selectStamp(previewStamp)")
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
		.modal-footer(style="margin: 0")
			template(v-if="approvalStep === 1")
				//- button.btn.warning.btn-edit(type="button" @click="rejectAudit") 반려하기
				button.btn.warning.btn-edit(type="button" @click="rejectAudit" :disabled="auditorList.some(a => a.approved === 'approve' && a.order === Math.max(...auditorList.filter(auditor => auditor.approved_type === 'approvers' || auditor.approved_type === 'agreers').map(auditor => auditor.order)))") 반려하기
				button.btn.btn-edit(type="button" @click="approveAudit = true; approvalStep++; getMainStamp()") 승인하기
			template(v-if="approvalStep === 2")
				button.btn.bg-gray.btn-edit(v-if="stempType === 'sign' ? handleStampBlobComplete : true" type="button" @click="approvalStep--") 이전
				button.btn.btn-edit(v-if="selectedStampComplete" type="button" @click="postApproval") 결재승인

//- Modal - 참조문서 상세
#modal.modal.modal-refer-detail(v-if="isReferDetailModal" @click="closeReferDetail")
	.modal-cont(@click.stop)
		.modal-header
			h2.title 문서 상세보기
			button.btn-close(type="button" @click="closeReferDetail")
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
									td {{ formatTimestampToDate(referDetail.uploaded) }}
									th 기안자
									td
										span.drafter {{ referDetail.drafter  }}

								//- 모바일 경우 레이아웃
								tr.mo(v-show="!isDesktop" style="border-top: 1px solid var(--gray-color-300);")
									th 작성 일자
									td(colspan="3") {{ formatTimestampToDate(referDetail.uploaded) }}
								tr.mo(v-show="!isDesktop")
									th 기안자
									td(colspan="3" style="text-align: left")
										span.drafter {{ referDetail.drafter}}
								//- 작성일자 기안사 :: e

								tr.approval(v-if="referDetail?.approvers?.length > 0")
									th 결재
									td.left(colspan="3" style="padding: 0; height: 119px;")
										ul.approver-wrap
											li.approver-list(v-for="(approver, index) in referDetail.approvers" :key="index")
												span.num {{ approver.order }}
												span.sign
													span.approved(v-if="approver.approved === 'approve'") 승인
													span.rejected(v-else-if="approver.approved === 'reject'") 반려
													span.waitting(v-else) 대기
												span.approver {{ approver.name }}

								tr.approval(v-if="referDetail?.agreers?.length > 0")
									th 합의
									td.left(colspan="3" style="padding: 0; height: 119px;")
										ul.approver-wrap
											li.approver-list(v-for="(agreer, index) in referDetail.agreers" :key="index")
												span.num {{ agreer.order }}
												span.sign
													span.approved(v-if="agreer.approved === 'approve'") 승인
													span.rejected(v-else-if="agreer.approved === 'reject'") 반려
													span.waitting(v-else) 대기
												span.approver {{ agreer.name }}

								tr.reference(v-if="referDetail?.receivers?.length > 0")
									th 수신 참조
									td.left(colspan="3") {{ referDetail.receivers.map(receiver => receiver.name).join(', ') }}

								tr
									th 제목
									td.left(colspan="3") {{ referDetail.data?.to_audit }}

								tr
									th 결재 내용
									td.left(colspan="3")
										._wysiwyg4all(v-html="referDetail.data?.to_audit_content")

								tr
									th 첨부 파일
									td.left(colspan="3")
										.input-wrap.upload-file
											.file-wrap
												ul.file-list
													template(v-if="referDetail?.bin?.form_data?.length > 0")
														li.file-item(v-for="(file, index) in referDetail.bin.form_data" :key="index")
															a.file-name(v-if="file.url" :href="file.url" download target="_blank") {{ file.filename }}
															span.only-text(v-else) {{ file.name || file.filename }}
													template(v-else)
														li(style="color:var(--gray-color-300);") 등록된 파일이 없습니다.

								tr
									th 참조 문서
									td.left(colspan="3")
										.refer-doc-wrap
											ul.refer-doc-list
												template(v-if="modalReferDoc.length > 0")
													li.refer-doc-item(v-for="(doc, index) in modalReferDoc" :key="index")
														span.refer-doc-name {{ doc.data.to_audit }}
												template(v-else)
													li(style="color:var(--gray-color-300);") 등록된 참조 문서가 없습니다.

		.modal-footer(style="padding-top: 0; border-top: none;")
			button.btn.bg-gray.btn-cancel(type="button" @click="closeReferDetail") 닫기


//- button.btn.outline.btn-new(type="button" @click="testDelete") delete
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { skapi, RealtimeCallback } from '@/main.ts';
import { user, makeSafe } from '@/user.ts';
import { getUserInfo } from '@/employee.ts';
import { auditList, reRequestData } from '@/audit.ts';
import { getStampList, uploadedStamp, uploadedRecordId, uploadGeneratedStamp } from '@/stamp.ts';
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
import Wysiwyg from '@/components/wysiwyg.vue';

const testDelete = () => {
  skapi
    .deleteRecords({
      record_id: 'Ukgb7K1Yzn4oBQRG'
    })
    .then((res) => {
      console.log('삭제완');
    });
};

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
const customRows = ref([]);
const rejectSetting = ref(true); // 반려 설정 관련 체크박스

const cmtRecord = ref({}); // 결재 의견 관련 레퍼런스 레코드
const commentList = ref([]); // 결재 의견 리스트
const comment = ref(''); // 결재 의견 (댓글)
const isReplyOpen = ref({}); // 댓글 입력창 열기
const isSubReplyOpen = ref({}); // 대댓글 입력창 열기
const replyList = ref([]); // 결재 의견의 댓글 리스트
const reply = ref({}); // 결재 의견의 댓글 (대댓글)
const subReply = ref({}); // 대대댓글
const isEditMode = ref({}); // 댓글 수정 모드
const editComment = ref({}); // 댓글 수정 내용

const isReferDetailModal = ref(false); // 참조 문서 상세 모달
const referDoc = ref([]); // 참조 문서
const referDetail = ref({}); // 참조 문서 상세 내용
const modalReferDoc = ref([]);

// 에디터 상태 관리
const editorContent = ref('');
const editorIsReady = ref(false);

// 반려됨 상태 확인
const isRejected = computed(() => {
  // 모든 결재자가 결재를 완료했고, 그 중 반려자가 있는 경우
  const allAudited = auditorList.value.every((auditor) => auditor.approved);
  const hasRejector = auditorList.value.some((auditor) => auditor.approved === 'reject');

  return allAudited && hasRejector;
});

// 결재 완료 여부 확인
const isApprovalOrder = computed(() => {
  if (isCanceled.value) return false;

  // 결재자 목록이 비어있으면 false 반환
  if (auditorList.value.length === 0) return false;

  // 현재 사용자가 결재자 목록에 없으면 false 반환
  const currentUser = auditorList.value.find((auditor) => auditor.user_id === user.user_id);
  if (!currentUser) return false;

  // 가장 마지막 결재자의 order
  const lastOrder = Math.max(
    ...auditorList.value
      .filter(
        (auditor) => auditor.approved_type === 'approvers' || auditor.approved_type === 'agreers'
      )
      .map((auditor) => auditor.order)
  );

  // lastOrder는 항상 결재 가능
  if (currentUser.order === lastOrder) return true;

  // 결재 완료한 사람들 목록을 가져와서 order 순서가 낮은 사람들이 모두 결재했는지 확인
  const lowerOrderAuditors = auditorList.value.filter(
    (auditor) =>
      auditor.order < currentUser.order &&
      (auditor.approved_type === 'approvers' || auditor.approved_type === 'agreers')
  );

  // 자신보다 낮은 순서의 결재자가 없으면 결재 가능
  if (lowerOrderAuditors.length === 0) return true;

  // 자신보다 낮은 순서의 모든 결재자가 결재를 완료했는지 확인
  return lowerOrderAuditors.every((auditor) => auditor.approved !== null);
});

// 결재 회수 가능 여부 확인
const isCancelPossible = computed(() => {
  // 모든 결재자가 결재를 완료한 경우
  if (auditorList.value.every((auditor) => auditor.approved)) {
    // 모든 결재자가 결재를 완료했고 반려자가 있는 경우 회수 불가
    if (auditorList.value.some((auditor) => auditor.approved === 'reject')) {
      return false;
    }
    return false;
  } else {
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
  () => route.params.auditId,
  async (nv, ov) => {
    if (nv !== ov) {
      auditId.value = nv;
      await getAuditDetail();
    }
  }
);

watch(auditDoContent, () => {
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

function disableContentEditable(htmlString) {
  // 임시 div 생성
  const tempDiv = document.createElement('div');

  // HTML 문자열 삽입
  tempDiv.innerHTML = htmlString;

  // 모든 contenteditable="true" 태그 찾아 false로 변경
  tempDiv.querySelectorAll('[contenteditable="true"]').forEach((el) => {
    el.setAttribute('contenteditable', 'false');
  });

  // 변경된 HTML 문자열 반환
  return tempDiv.innerHTML;
}

// 에디터 준비
const handleEditorReady = (status) => {
  editorIsReady.value = status;
};

// 에디터 내보내기
const exportWysiwygData = (content) => {
  editorContent.value = content;
};

const goToPrev = () => {
  // 결재 발신함
  if (senderUser.value.user_id === user.user_id) {
    router.push('/approval/request-list');

    // 수신참조
  } else if (route.path.includes('audit-detail-reference')) {
    router.push('/approval/audit-reference');

    // 중요 결재함
  } else if (route.path.includes('audit-detail-favorite')) {
    router.push('/approval/audit-list-favorite');

    // 결재 수신함
  } else {
    router.push('/approval/audit-list');
  }
};

function formatTimestampToDate(timestamp) {
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

  const res = await skapi.postRecord(stampImageData, stamp_postParams);

  return res;
};

// 직접 서명
let uploadStampImage = async (imageUrl) => {
  makeStampRunning.value = true;

  await handleStampBlob(imageUrl);

  if (!onlyStampFile.value) return;

  let uploadGeneratedStampUrl = null;

  try {
    uploadGeneratedStamp.value = await uploadCreatedStamp(onlyStampFile.value);
  } catch (e) {
    alert('도장 등록 중 오류가 발생했습니다.');
    throw e;
  }

  if (
    uploadGeneratedStamp.value?.bin &&
    Object.keys(uploadGeneratedStamp.value?.bin).length &&
    uploadGeneratedStamp.value?.bin?.stamp_data?.length
  ) {
    let searchStamp = uploadGeneratedStamp.value.bin.stamp_data.filter(
      (stamp) => stamp.filename === uploadingStamp.value.name
    );
    if (searchStamp && searchStamp.length) {
      uploadGeneratedStampUrl = searchStamp[0].url;
    }
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
  function drawStamp(name) {
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
      const generatedStamp = stampNames.filter((name) => name.includes('generated-stamp-'));

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

// 대표 도장 가져오기
const getMainStamp = async () => {
  try {
    const res = await skapi.getRecords({
      table: {
        name: 'main_stamp_' + user.user_id.replaceAll('-', '_'),
        access_group: 1
      }
    });

    if (res.list && res.list.length) {
      const stampUrl = await skapi.getFile(res.list[0].data, {
        dataType: 'endpoint'
      });

      previewStamp.value = stampUrl;
      selectedStamp.value = stampUrl;
      selectedStampComplete.value = true;
      gettingStampList.value = false;
    } else {
      gettingStampList.value = false;
    }
  } catch (err) {
    console.error(err);
  }
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
  customRows.value = [];
  selectedAuditors.value = {
    approvers: [],
    agreers: [],
    receivers: []
  };
  isCanceled.value = false;
  rejectSetting.value = false;

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

      if (auditDoc.data.custom_rows) {
        try {
          customRows.value = JSON.parse(auditDoc.data.custom_rows);
        } catch (e) {
          console.error('Custom rows parsing error:', e);
          customRows.value = [];
        }
      }

      // 반려 설정 관련 체크박스
      if (auditDoc.data.reject_setting !== undefined) {
        rejectSetting.value =
          auditDoc.data.reject_setting === 'true' || auditDoc.data.reject_setting === true;
      } else {
        rejectSetting.value = false;
      }
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
          // 수동 회수 또는 자동 회수 중 rejectSetting이 false인 경우만 실제 회수 상태로 설정
          const cancelRecord = res.list[0];
          const isAutoCancel = cancelRecord.data?.auto_cancel === true;

          if (!isAutoCancel || (isAutoCancel && !rejectSetting.value)) {
            isCanceled.value = true;
          } else {
            isCanceled.value = false;
          }
        } else {
          isCanceled.value = false;
        }
      })
      .catch((err) => {
        isCanceled.value = false;
      });

    const auditors = JSON.parse(auditDoc.data.auditors);

    let getAuditorInfo = async (uid) => {
      let user_id = uid.user_id.replaceAll('_', '-');
      let userInfo = await getUserInfo(user_id);

      return userInfo.list[0];
    };

    let processAuditors = async (role) => {
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

    if (Object.keys(auditDoc.bin).length && auditDoc.bin.form_data.length) {
      let fileList = [];
      let form_data = auditDoc.bin.form_data;

      function getFileUserId(str) {
        if (!str) return '';
        return str.split('/')[3];
      }

      const result = form_data.map((el) => ({
        ...el,
        user_id: getFileUserId(el.path)
      }));

      fileList.push(...result);

      uploadedFile.value = fileList;
    } else {
      console.log('CC');
      uploadedFile.value = [];
    }

    // 참조 문서
    // console.log('auditDoc : ', auditDoc);
    const referDocIds = auditDoc.data.reference_docs;
    const parseReferDocId = JSON.parse(auditDoc.data.reference_docs).referDocId;
    // console.log('parseReferDocId : ', parseReferDocId);

    if (referDocIds) {
      const fetchPromises = parseReferDocId.map((recordId) =>
        skapi
          .getRecords({ record_id: recordId })
          .then((res) => res.list?.[0] || null)
          .catch((err) => {
            console.error(`record_id ${recordId} 호출 실패:`, err);
            return null;
          })
      );

      referDoc.value = await Promise.all(fetchPromises);
      // console.log('referDoc.value : ', referDoc.value);
    } else {
      referDoc.value = [];
    }

    getAuditDetailRunning.value = false;

    const approvals = await approvedAudit();

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

        // 최종결재자의 결재 정보 확인
        const finalApproval = approvals.find((a) => a.user_id === finalApproverId);

        // 최종결재자의 결재 상태 확인 (또는 문서 상태 필드가 있는 경우)
        const statusApproval = approvals.find((a) => a.data.documentStatus);

        if (statusApproval && statusApproval.data.documentStatus) {
          // 문서 상태 필드가 있는 경우
          auditDoContent.value.documentStatus = statusApproval.data.documentStatus;
        } else if (finalApproval && finalApproval.data.approved) {
          // 최종결재자가 결재했으면 문서 상태 설정
          auditDoContent.value.documentStatus =
            finalApproval.data.approved === 'approve' ? '완료됨' : '반려됨';
          console.log('최종결재자 결재 상태 : ', auditDoContent.value.documentStatus);
        }
      }
    }

    const approvalUserList = [];
    const newTags = auditDoc.tags.map((a) => a.replaceAll('_', '-')); // 모든 결재자

    await Promise.all(
      newTags.map(async (auditor, index) => {
        if (auditor.includes('receivers')) return;

        const [approvedType, userId] = auditor.split(':');
        const approval = approvals.find((approval) => approval.user_id === userId);

        const curentOrder =
          auditors[approvedType]?.find((user) => user.user_id.replaceAll('_', '-') === userId)
            ?.order || index + 1;

        if (approval) {
          const approvedStr = approval.data.approved ? '결재함' : '반려함';

          let stampFile;

          // 도장 파일 가져오기
          if (approval.data.approved === 'approve') {
            stampFile = await skapi.getFile(approval.data.stamp, {
              dataType: 'endpoint'
            });
          } else {
            stampFile = null;
          }

          approvalUserList.push({
            user_id: userId,
            approved_type: approvedType,
            approved: approval.data.approved,
            stamp: stampFile,
            approved_str: approvedStr,
            order: curentOrder
          });
        } else {
          approvalUserList.push({
            user_id: userId,
            approved_type: approvedType,
            approved: null,
            stamp: null,
            approved_str: '결재대기중',
            order: curentOrder
          });
        }
      })
    );

    const userIds = approvalUserList.map((auditor) => auditor.user_id);
    const userList = await Promise.all(userIds.map(async (auditor) => await getUserInfo(auditor)));
    const userInfoList = userList.map((user) => (user.list.length ? user.list[0] : null));

    // 결재자 정보와 결재 결과 합치기
    const newAuditUserList = approvalUserList
      .map((auditor) => ({
        ...auditor,
        user_info: userInfoList.find((user) => user?.user_id === auditor.user_id),
        comment: approvals.find((user) => user?.user_id === auditor.user_id)?.data.comment,
        date: approvals.find((user) => user?.user_id === auditor.user_id)?.data.date
      }))
      .sort((a, b) => a.order - b.order);

    // 전체 결재자 리스트
    auditorList.value = newAuditUserList;

    // auditorList 결재, 합의 순서대로
    auditorList.value.sort((a, b) => {
      if (a.approved_type === 'approvers' && b.approved_type === 'agreers') return -1;
      if (a.approved_type === 'agreers' && b.approved_type === 'approvers') return 1;
      return 0;
    });

    // newAuditUserList 에 유저 정보중에 approved_type 이 approver 인것만 approverList 에 넣어주기
    approverList.value = newAuditUserList.filter(
      (auditor) => auditor.approved_type === 'approvers'
    );
    agreerList.value = newAuditUserList.filter((auditor) => auditor.approved_type === 'agreers');

    // 모든 결재자가 결재를 완료했는지 확인
    const allAudited = auditorList.value.every((auditor) => auditor.approved);

    // 반려자가 있는지 확인
    const hasRejector = auditorList.value.some((auditor) => auditor.approved === 'reject');

    //마지막 결재자가 반려했는지 확인 (가장 마지막으로 결재한 사람)
    let isLastRejector = false;

    if (hasRejector && allAudited && auditorList.value.length > 0) {
      // 결재 시간 기준으로 정렬
      const sortedAuditors = [...auditorList.value].sort((a, b) => {
        return (b.date || 0) - (a.date || 0);
      });

      // 가장 마지막에 결재한 사람 찾기
      const lastAuditor = sortedAuditors[0];

      // 마지막 결재자가 반려했는지 확인
      if (lastAuditor && lastAuditor.approved === 'reject') {
        isLastRejector = true;
      }
    }

    // 자동 회수 관련 로직 업데이트
    if (hasRejector && !allAudited && !rejectSetting.value) {
      // rejectSetting이 false이고 반려된 결재가 있는 경우 회수 상태로 설정
      isCanceled.value = true;
    } else if (hasRejector && allAudited && !isLastRejector && !rejectSetting.value) {
      // 마지막 결재자가 아닌 사람이 반려하고 rejectSetting이 false인 경우 회수 처리
      isCanceled.value = true;
    } else if (rejectSetting.value) {
      // rejectSetting이 true이면 반려가 있어도 회수 처리하지 않음 (기존 회수 상태만 유지)
    }
  } catch (error) {
    getAuditDetailRunning.value = false;
    console.error(error);
  }
};

// 결재 하기
const postApproval = async () => {
  if (isPosting || isCanceled.value) return; // 중복 호출 방지
  isPosting = true;

  try {
    if (!auditId.value) return;

    const userId = user.user_id;
    const approved = approveAudit.value ? 'approve' : 'reject';
    const approvedDate = new Date().getTime();

    // 반려 시 체크박스 설정에 따른 자동 회수 처리
    if (approved === 'reject') {
      // 체크 해제된 경우(rejectSetting이 false)에만 자동 회수 진행
      if (!rejectSetting.value) {
        try {
          // 반려로 인한 자동 회수 처리 (reason, isAutoCancel 파라미터 전달)
          await canceledAudit('반려', true);
        } catch (error) {
          console.error('자동 회수 처리 중 오류:', error);
        }
      }
      // 체크된 경우(rejectSetting이 true)에는 회수하지 않고 계속 진행
    }

    if (approved === 'approve' && (!selectedStamp.value || !selectedStampComplete.value)) {
      alert('도장을 선택해주세요.');
      isPosting = false;
      return;
    }

    // 최종결재자 여부 확인
    const approverAgreesList = auditorList.value.filter(
      (auditor) => auditor.approved_type === 'approvers' || auditor.approved_type === 'agreers'
    );

    const maxOrder = Math.max(...approverAgreesList.map((auditor) => auditor.order));
    console.log('maxOrder : ', maxOrder);

    const currentUser = auditorList.value.find((auditor) => auditor.user_id === user.user_id);
    const isFinalApprover =
      currentUser &&
      currentUser.order === maxOrder &&
      (currentUser.approved_type === 'approvers' || currentUser.approved_type === 'agreers');
    console.log('isFinalApprover : ', isFinalApprover);

    // 이미 '완료됨' 상태인 문서에 대한 반려 방지 (최종결재자가 승인했는지 확인)
    const finalApprover = approverAgreesList.find((auditor) => auditor.order === maxOrder);
    console.log('finalApprover : ', finalApprover);
    if (finalApprover && finalApprover.approved === 'approve' && approved === 'reject') {
      alert('이미 최종 승인된 문서는 반려할 수 없습니다.');
      isPosting = false;
      return;
    }

    const data = {
      approved: approved,
      comment: approvedComment.value,
      stamp: selectedStamp.value,
      date: approvedDate
    };

    // 최종결재자인 경우 문서 상태 필드 추가
    if (isFinalApprover) {
      data.isFinalApprover = true;
      data.documentStatus = approved === 'approve' ? '완료됨' : '반려됨';
      console.log('data : ', data);
    }

    // 결재 하는 요청
    const res = await skapi.postRecord(data, {
      table: {
        name: 'audit_approval',
        access_group: 'authorized'
      },
      reference: auditId.value,
      tags: [userId.replaceAll('-', '_')]
    });
    console.log('=== postApproval === res : ', res);

    // 기안자에게 결재 알림
    let postRealtimeBody = {
      text: `${user.name}님께서 결재를 ${approveAudit.value ? '승인' : '반려'}했습니다.`,
      type: 'audit',
      id: auditId.value
    };

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
          config: {
            always: true // 무조건 알림 받기
          }
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

    // 결재 완료 후 다음 결재자 알림 처리
    if (approved === 'approve' && !isCanceled.value) {
      if (auditDoContent.value) {
        const doc = auditDoContent.value;
        const auditors = JSON.parse(doc.data.auditors);
        console.log('doc : ', doc);

        // 결재자/합의자 목록 합치기
        const allAuditors = [
          ...(auditors.approvers || []).map((a) => ({ ...a, type: 'approvers' })),
          ...(auditors.agreers || []).map((a) => ({ ...a, type: 'agreers' }))
        ].sort((a, b) => a.order - b.order);

        // 결재자 ID만 추출
        const allAuditorIds = allAuditors.map((a) => a.user_id.replaceAll('_', '-'));

        // 다음 결재자
        const currentUser = allAuditors.find(
          (a) => a.user_id.replaceAll('_', '-') === user.user_id
        );
        const currentOrder = currentUser ? currentUser.order : 0;
        const nextAuditor = allAuditors.find((a) => a.order === currentOrder + 1);

        if (nextAuditor) {
          const nextAuditorId = nextAuditor.user_id.replaceAll('_', '-');

          // 실시간 알림 보내기
          skapi
            .postRealtime(
              {
                audit_request: {
                  noti_id: res.record_id,
                  noti_type: 'audit',
                  send_date: new Date().getTime(),
                  send_user: senderUser.value.user_id,
                  audit_info: {
                    audit_type: 'request',
                    to_audit: doc.data.to_audit,
                    audit_doc_id: auditId.value,
                    audit_request_id: res.record_id,
                    send_auditors: allAuditorIds
                  }
                }
              },
              nextAuditorId, // 다음 결재자에게 알림
              {
                title: '[그룹웨어]',
                // body: `${doc.data.to_audit} 문서의 결재가 귀하의 차례입니다.`,
                body: `${senderUser.value.name}님께서 결재를 완료했습니다.`,
                config: {
                  always: true
                }
              }
            )
            .then((res) => {
              console.log('결재알림 === postRealtime === res : ', res);
            });

          // 알림 기록 저장
          skapi
            .postRecord(
              {
                noti_id: res.record_id,
                noti_type: 'audit',
                send_date: new Date().getTime(),
                send_user: senderUser.value.user_id,
                audit_info: {
                  audit_type: 'request',
                  to_audit: doc.data.to_audit,
                  audit_doc_id: auditId.value,
                  audit_request_id: res.record_id,
                  send_auditors: allAuditorIds
                }
              },
              {
                readonly: true,
                table: {
                  name: `realtime:${nextAuditorId.replaceAll('-', '_')}`,
                  access_group: 'authorized'
                }
              }
            )
            .then((res) => {
              console.log('결재알림기록 === postRecord === res : ', res);
            });
        }
      }
    }

    // 결과 메시지 표시
    let resultMessage = '';

    if (approved === 'reject') {
      if (!rejectSetting.value) {
        resultMessage = '반려 처리되었으며, 결재가 자동으로 회수되었습니다.';
      } else {
        resultMessage = '반려 처리되었습니다.';
      }
    } else {
      resultMessage = isFinalApprover ? '최종 결재가 완료되었습니다.' : '결재가 완료되었습니다.';
    }

    window.alert(resultMessage);
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
const canceledAudit = async (reason = '회수', isAutoCancel = false) => {
  const auditors = auditDoContent.value.data.auditors;
  const parsedAuditors = JSON.parse(auditors);

  // 각 배열에서 ID만 추출
  const approverIds = parsedAuditors.approvers;
  const agreerIds = parsedAuditors.agreers;
  const receiverIds = parsedAuditors.receivers;

  // 결재자 ID 배열 생성
  // const allAuditors = [...approverIds, ...agreerIds, ...receiverIds];

  // 이미 결재한 사람들 정보 가져오기
  const approvalRes = await skapi.getRecords({
    table: {
      name: 'audit_approval',
      access_group: 'authorized'
    },
    reference: auditId.value
  });

  const approvedUserIds = approvalRes.list.map((a) => a.user_id);

  // 알림을 받을 사람들 목록 작성
  const auditorsToBeSent = [];

  // 이미 결재한 사람들 추가
  approvedUserIds.forEach((auditorId) => {
    auditorsToBeSent.push(auditorId.replaceAll('_', '-'));
  });

  // 수신참조자 추가
  receiverIds.forEach((receiver) => {
    auditorsToBeSent.push(receiver.user_id.replaceAll('_', '-'));
  });

  // 기안자 추가
  if (auditDoContent.value.user_id && !auditorsToBeSent.includes(auditDoContent.value.user_id)) {
    auditorsToBeSent.push(auditDoContent.value.user_id);
  }

  // 중복 제거
  const uniqueAuditorsToBeSent = [...new Set(auditorsToBeSent)];

  // 결재 회수 알림 메시지
  const alertMessage = isAutoCancel
    ? rejectSetting.value
      ? `반려 처리되었습니다.`
      : `결재가 반려되어 자동으로 회수되었습니다.`
    : `${user.name}님께서 결재를 회수했습니다.`;

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
    text: alertMessage,
    type: 'audit',
    id: auditId.value
  };

  // 결재 회수 알림 기록 data
  const postRecordData = {
    noti_id: auditId.value,
    noti_type: 'audit',
    send_date: new Date().getTime(),
    send_user: user.user_id,
    audit_info: {
      audit_type: 'canceled',
      to_audit: auditDoContent.value?.data?.to_audit,
      audit_doc_id: auditId.value,
      reason: reason // 회수 사유
    }
  };

  // 각 그룹별 알림 전송 Promise.all로 동시에 처리
  try {
    const results = await Promise.all(
      uniqueAuditorsToBeSent.map(async (auditor) => {
        // 자기 자신에게는 알림을 보내지 않음 (반려자가 알림을 자기 자신에게 보내는 경우 방지)
        if (isAutoCancel && auditor.replaceAll('_', '-') === user.user_id) {
          return { auditor, skipped: true };
        }

        // // 자기 자신에게는 알림을 보내지 않음
        // if (isAutoCancel && auditorId === user.user_id) {
        //   return { auditorId, skipped: true };
        // }

        // 실시간 알림 전송
        let realtimeResult;

        try {
          realtimeResult = await skapi.postRealtime(
            postRealtimeData,
            auditor.replaceAll('_', '-'),
            {
              title: '알림',
              body: alertMessage,
              config: {
                always: true // 무조건 알림 받기
              }
            }
          );
        } catch (error) {
          await skapi.closeRealtime();
          skapi.connectRealtime(RealtimeCallback).finally(async () => {
            realtimeResult = await skapi.postRealtime(
              postRealtimeData,
              auditor.replaceAll('_', '-'),
              {
                title: '알림',
                body: alertMessage,
                config: {
                  always: true // 무조건 알림 받기
                }
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

  // 자동 회수 경우 결재요청자한테도 알림 전송
  if (isAutoCancel) {
    try {
      const senderUserId = auditDoContent.value?.user_id;
      // 결재 요청자가 현재 사용자(반려자)와 다른 경우에만 알림 전송
      if (senderUserId && senderUserId !== user.user_id) {
        // 실시간 알림 전송
        const realtimeResult = await skapi.postRealtime(postRealtimeData, senderUserId, {
          title: '알림',
          body: `${user.name}님이 결재를 반려하여 문서가 자동으로 회수되었습니다.`,
          config: {
            always: true // 무조건 알림 받기
          }
        });

        // 알림 기록 저장
        const recordResult = await skapi.postRecord(postRecordData, {
          readonly: true,
          table: {
            name: `realtime:${senderUserId.replaceAll('-', '_')}`,
            access_group: 'authorized'
          }
        });

        console.log('요청자 자동 회수 알림 전송 완료:', {
          senderUserId,
          realtimeResult,
          recordResult
        });
      }
    } catch (error) {
      console.error('요청자 자동 회수 알림 전송 중 오류:', error);
    }
  }

  // 수동 회수가 아닌 자동 회수이고, rejectSetting이 true인 경우에는 알림만 보내고 실제 회수 상태로 변경하지 않음
  if (isAutoCancel && rejectSetting.value) {
    return;
  }

  // 수동 회수 or rejectSetting이 false인 자동 회수 (실제 회수 처리됨)
  if (!isAutoCancel || (isAutoCancel && !rejectSetting.value)) {
    if (!isAutoCancel) {
      // 수동 회수인 경우에만 알림 표시
      window.alert('결재가 회수되었습니다.');
    }

    disabled.value = true; // 회수 버튼 비활성화
    isCanceled.value = true; // 회수 여부 변경
  }

  await nextTick();
};

// 기안자의 재요청
const reRequestAudit = () => {
  reRequestData.value = auditDoContent.value;

  router.push({
    path: '/approval/request-audit',
    query: {
      mode: 'reRequest',
      isReRequest: true
    }
  });
};

// 결재 의견 레코드 불러오기
const getCmtRecord = async () => {
  const res = await skapi.getRecords({
    table: {
      name: `audit_comment_${auditId.value}`,
      access_group: 'authorized'
    },
    reference: auditId.value
  });

  if (res.list.length > 0) {
    cmtRecord.value = res.list[0];
  } else {
    cmtRecord.value = [];
  }
};

// 댓글 (결재 의견) 작성
const writeComment = async () => {
  console.log('댓글 작성');
  console.log('user : ', user);
  console.log('auditId : ', auditId.value);
  console.log('auditorList : ', auditorList.value);
  console.log('comment : ', comment.value);
  console.log('cmtRecord.value : ', cmtRecord.value);

  if (!comment.value) {
    alert('댓글을 입력해주세요.');
    return;
  }

  // 결재 의견 작성자 찾기
  const writer = auditorList.value.find(
    (auditor) => auditor.user_id.replaceAll('-', '_') === user.user_id.replaceAll('-', '_')
  );
  console.log('writer : ', writer);

  try {
    const data = {
      comment: comment.value, // 결재 의견 내용
      writer: user.user_id, // 작성자 ID
      writer_name: user.name, // 작성자 이름
      approval_type: writer?.approved, // 결재 결과
      date: new Date().getTime() // 작성일
    };

    const config = {
      table: {
        name: 'audit_comment',
        access_group: 'private'
      },
      reference: cmtRecord.value.record_id
    };

    console.log('data : ', data);
    console.log('config : ', config);

    const res = await skapi.postRecord(data, config);
    console.log('== writeComment == res : ', res);
  } catch (error) {
    console.error('Error writing comment:', error);
  }

  // 등록 후 초기화
  comment.value = '';

  // 댓글 목록 갱신
  getComment();
};

// 댓글 가져오기
const getComment = async () => {
  const params = {
    table: {
      name: 'audit_comment',
      access_group: 'private'
    },
    reference: cmtRecord.value.record_id
  };

  if (!cmtRecord.value.record_id) return;
  const res = await skapi.getRecords(params);

  if (res.list.length > 0) {
    commentList.value = res.list;
  } else {
    commentList.value = [];
  }
};

// 필터링된 대댓글 목록을 가져오는 함수
const getFilteredReplies = (commentId) => {
  return replyList.value.filter((reply) => String(reply.reference) === String(commentId));
};

// 댓글 입력 영역 toggle
const toggleReplyInput = (type, index) => {
  console.log('type : ', type);
  console.log('index : ', index);

  const commentItem = type === 'reply' ? commentList.value[index] : replyList.value[index];

  if (!commentItem) {
    console.error('댓글을 찾을 수 없습니다:', type, index);
    return;
  }

  const commentId = String(commentItem.record_id);

  if (type === 'reply') {
    isReplyOpen.value[commentId] = !isReplyOpen.value[commentId];
  } else if (type === 'subReply') {
    // subReply의 경우 부모 댓글의 ID를 저장
    const parentId = commentItem.reference || commentId;
    isSubReplyOpen.value[parentId] = !isSubReplyOpen.value[parentId];
    console.log('isSubReplyOpen.value : ', isSubReplyOpen.value);
  }
};

// 대댓글 작성
const writeReply = async (type, index) => {
  console.log('type : ', type);
  console.log('index : ', index);
  console.log('reply.value : ', reply.value);
  console.log('commentList.value[index] : ', commentList.value[index]);

  // 댓글 ID -> 문자열 변환
  const commentId = String(commentList.value[index].record_id);
  console.log('commentId : ', commentId);

  const replyContent = type === 'subReply' ? subReply.value[commentId] : reply.value[commentId];

  if (!replyContent) {
    alert('댓글을 입력해주세요.');
    return;
  }

  // 대댓글 작성자 찾기
  const writer = auditorList.value.find(
    (auditor) => auditor.user_id.replaceAll('-', '_') === user.user_id.replaceAll('-', '_')
  );
  console.log('writer : ', writer);

  try {
    const data = {
      comment: replyContent, // 대댓글 내용
      writer: user.user_id, // 작성자 ID
      writer_name: user.name, // 작성자 이름
      approval_type: writer?.approved, // 결재 결과
      date: new Date().getTime() // 작성일
    };

    const config = {
      table: {
        name: 'comment_reply',
        access_group: 'private'
      },
      reference: commentList.value[index].record_id
    };
    console.log('data : ', data);
    console.log('config : ', config);

    const res = await skapi.postRecord(data, config);
    console.log('== writeReply == res : ', res);
  } catch (error) {
    console.log('error : ', error);
  } finally {
    console.log('완료');
    // 등록 후 해당 댓글에 대한 대댓글 내용만 초기화
    if (type === 'subReply') {
      subReply.value[commentId] = '';
      isSubReplyOpen.value[commentId] = false;
    } else {
      reply.value[commentId] = '';
      isReplyOpen.value[commentId] = false;
    }

    // 댓글 목록 갱신
    getComment();

    // 대댓글 목록 갱신 - 해당 댓글의 대댓글만 갱신
    getReply(index);
  }
};

// 대댓글 가져오기
const getReply = async (index) => {
  const res = await skapi.getRecords({
    table: {
      name: 'comment_reply',
      access_group: 'private'
    }
    // reference: commentList.value[index].record_id
  });

  if (res.list.length > 0) {
    replyList.value = res.list;
  } else {
    replyList.value = [];
  }
};

// 댓글 수정 모드 전환
const toggleEditMode = (type, index) => {
  const commentId =
    type === 'reply'
      ? String(commentList.value[index].record_id)
      : String(replyList.value[index].record_id);

  isEditMode.value[commentId] = !isEditMode.value[commentId];

  // 수정 모드 활성화시 기존 내용 복사
  if (isEditMode.value[commentId]) {
    editComment.value[commentId] =
      type === 'reply'
        ? commentList.value[index].data.comment
        : replyList.value[index].data.comment;
  }
};

// 댓글 수정
const editReply = async (type, index) => {
  console.log('댓글 수정', type, index);

  // 원본 댓글 데이터 및 ID 가져오기
  const originalData = type === 'reply' ? commentList.value[index] : replyList.value[index];
  const commentId = String(originalData.record_id);
  console.log('originalData : ', originalData);

  if (!editComment.value[commentId]) {
    alert('수정할 내용을 입력해주세요.');
    return;
  }

  try {
    // 원본 데이터 복사 후 내용만 수정
    const data = {
      ...originalData.data,
      comment: editComment.value[commentId],
      edited: true, // 수정 여부
      edit_date: new Date().getTime() // 수정 시간
    };

    const config = {
      table: {
        name: type === 'reply' ? 'audit_comment' : 'comment_reply',
        access_group: 'private'
      },
      record_id: originalData.record_id
    };

    // 대댓글인 경우 참조 추가
    if (type !== 'reply') {
      config.reference = originalData.reference;
    }

    console.log('data : ', data);
    console.log('config : ', config);

    const res = await skapi.postRecord(data, config);
    console.log('== editReply == res:', res);

    originalData.data.comment = res.data.comment; // 댓글 내용 업데이트
    isEditMode.value[commentId] = false;

    // 목록 갱신
    if (type === 'reply') {
      getComment();
    } else {
      getReply(index);
    }
  } catch (error) {
    console.error('댓글 수정 오류:', error);
  }
};

// 댓글 삭제
const deleteReply = async (type, index) => {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return;
  }

  // 댓글 또는 대댓글 객체 선택
  const targetData = type === 'reply' ? commentList.value[index] : replyList.value[index];
  const parentId = targetData.record_id;

  try {
    // 삭제할 record_id
    let delRecords = [];

    if (type === 'reply') {
      // 댓글 삭제 (대댓글 포함)
      const subReply = replyList.value.filter((reply) => reply.reference === parentId);

      // 댓글 + 대댓글
      delRecords = [
        { id: parentId, table: 'audit_comment' },
        ...subReply.map((reply) => ({
          id: reply.record_id,
          table: 'comment_reply'
        }))
      ];
    } else {
      // 대댓글 삭제
      delRecords = [{ id: parentId, table: 'comment_reply' }];
    }

    await Promise.all(
      delRecords.map(({ id, table }) =>
        skapi.deleteRecords({
          table: {
            name: table,
            access_group: 'private'
          },
          record_id: id
        })
      )
    );

    // 목록 갱신
    if (type === 'reply') {
      await getComment(); // 댓글 + 대댓글 전체 갱신
    } else {
      await getReply(index); // 대댓글만 갱신
    }
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
  }
};

// 참조문서 상세 모달 open
const showReferDetail = async (doc) => {
  isReferDetailModal.value = true;
  referDetail.value = doc;
  console.log('모달 = referDetail.value : ', referDetail.value);

  try {
    // 이미 처리된 결재자 정보 사용
    const auditors = referDetail.value.data?.auditors
      ? JSON.parse(referDetail.value.data.auditors)
      : { approvers: [], agreers: [], receivers: [] };

    // 결재자 이름 가져오기
    const userInfo = await getUserInfo(
      auditors.approvers.map((a) => a.user_id.replaceAll('_', '-')),
      auditors.agreers.map((a) => a.user_id.replaceAll('_', '-')),
      auditors.receivers.map((a) => a.user_id.replaceAll('_', '-'))
    );
    console.log('userInfo : ', userInfo);

    auditors.approvers.forEach((a) => {
      const user = userInfo.list.find((user) => user.user_id === a.user_id.replaceAll('_', '-'));
      if (user) {
        a.name = user.name;
      }
    });

    auditors.agreers.forEach((a) => {
      const user = userInfo.list.find((user) => user.user_id === a.user_id.replaceAll('_', '-'));
      if (user) {
        a.name = user.name;
      }
    });

    auditors.receivers.forEach((a) => {
      const user = userInfo.list.find((user) => user.user_id === a.user_id.replaceAll('_', '-'));
      if (user) {
        a.name = user.name;
      }
    });

    // 결재자 정보를 UI에 표시하기 위한 형태로 변환
    referDetail.value.approvers = (auditors.approvers || []).map((a) => ({
      userId: a.user_id.replaceAll('_', '-'),
      name: a.name || '알 수 없음',
      order: a.order || 0,
      approved: a.approved || null
    }));

    referDetail.value.agreers = (auditors.agreers || []).map((a) => ({
      userId: a.user_id.replaceAll('_', '-'),
      name: a.name || '알 수 없음',
      order: a.order || 0,
      approved: a.approved || null
    }));

    referDetail.value.receivers = (auditors.receivers || []).map((r) => ({
      userId: r.user_id.replaceAll('_', '-'),
      name: r.name || '알 수 없음'
    }));

    // 참조 문서
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
      console.log('모달 = modalReferDoc.value : ', modalReferDoc.value);
    } else {
      modalReferDoc.value = [];
    }
  } catch (error) {
    console.error('문서 상세정보 처리 오류 : ', error);
  }
};

// 참조문서 상세 모달 close
const closeReferDetail = () => {
  isReferDetailModal.value = false;
};

onMounted(async () => {
  window.addEventListener('resize', updateScreenSize);

  auditId.value = route.params.auditId;
  getAuditDetail();
  loadStylesheet();
  await getCmtRecord();
  await getComment();
  await getReply();
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
  margin: 4rem 0 1rem;
}

.comment-list {
  margin-top: 2rem;

  .comment-item {
    gap: 0.5rem;
    margin-bottom: 2rem;
    border-top: 1px solid var(--gray-color-200);
    padding-top: 2rem;

    &:first-of-type {
      padding-top: 0;
      border-top: none;
    }

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

  .text {
    background-color: var(--gray-color-50);
    padding: 0.8rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    margin-bottom: 0.35rem;

    &.reject {
      color: var(--warning-color-400);
    }
  }

  .btn-cancel {
    border-color: var(--gray-color-500);
    color: var(--gray-color-500);

    &:hover {
      background-color: var(--gray-color-200);
    }
  }
}

.reply-list {
  margin-top: 1.25rem;

  .reply-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1.25rem;
    padding: 0 0 0 0.875rem;
  }

  .icon {
    svg {
      fill: var(--gray-color-400);
    }
  }

  .reply {
    flex: 1;
  }
}

.auditor-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-left: 0.2rem;

  .info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .name {
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

    &.draft {
      color: var(--gray-color-400);
      border-color: var(--gray-color-400);
    }
  }
}

.etc {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-left: 1rem;

  .date {
    font-size: 0.75rem;
    color: var(--gray-color-500);
  }

  .text {
    font-size: 12px;
    color: var(--gray-color-500);
    background-color: var(--gray-color-300);
    border-radius: 8px;
    padding: 2px 4px;
    margin-left: 0.25rem;
  }

  button {
    font-size: 0.75rem;
    color: var(--gray-color-500);
  }

  .btn-wrap {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
  }

  .btn-edit {
    margin-left: auto;
    color: var(--primary-color-400);
  }

  .btn-delete {
    margin-left: auto;
    color: var(--warning-color-400);
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
      // transform: translateX(-50% + 50px) translateY(-50% + 25px);
      transform: translateX(11%) translateY(-16%);
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
        padding: 8px 12px;
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

.reject-setting {
  margin-bottom: 0.5rem;
  text-align: right;
  font-size: 0.9rem;
  color: var(--warning-color-500);
}

.input-comment,
.input-reply,
.input-edit {
  display: flex;
  gap: 0.25rem;
}

.input-reply {
  margin-top: 1.5rem;

  input {
    height: 2rem;
  }

  .btn-wrap {
    display: flex;
    flex: none;
    gap: 0.125rem;
  }

  .btn {
    height: 2rem;
  }
}

.input-edit {
  margin-bottom: 0.35rem;

  .btn-wrap {
    display: flex;
    flex: none;
    gap: 0.125rem;
  }

  .btn {
    height: 100%;
  }
}

// 참조문서 :: s
.refer-doc-item {
  border: 1px dashed var(--gray-color-300);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.75rem;
  color: var(--gray-color-500);
  text-align: left;
  margin-bottom: 0.5rem;
  cursor: pointer;

  &:last-of-type {
    margin-bottom: 0;
  }

  &:hover {
    text-decoration: underline;
  }
}

// 참조문서상세 모달
.modal-refer-detail {
  .modal-cont {
    max-width: 992px;
  }

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
    margin-top: 0;

    .file-wrap {
      margin-top: 0;
    }

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
    &:hover {
      text-decoration: none;
      cursor: default;
    }
  }
}
// 참조문서 :: e

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

  #tb-auditRequest {
    font-size: 0.75rem;
  }

  .sub-title {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--gray-color-300);
  }

  .comment-list {
    .auditor-info {
      margin-bottom: 0.75rem;
    }

    .text {
      border: 1px solid var(--gray-color-300);
      font-size: 0.75rem;
      padding: 0.75rem 1rem;
    }
  }

  .input-wrap.upload-file .file-item,
  .selected-wrap.upload-file .file-item {
    border-color: var(--gray-color-400);
  }

  .approver-wrap {
    grid-template-columns: repeat(6, 1fr) !important;

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
      height: 3.5rem;

      img {
        width: 3rem;
        height: 3rem;
      }
    }
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

@media (max-width: 768px) {
  .approver-wrap {
    grid-template-columns: repeat(5, 1fr);
  }

  .stamp-wrap {
    .stamp-grid {
      .upload-options {
        transform: translateX(10%) translateY(-12%);

        li {
          font-size: 1rem;
          padding: 10px 14px;
        }
      }
    }
  }

  .reject-setting {
    text-align: left;
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
