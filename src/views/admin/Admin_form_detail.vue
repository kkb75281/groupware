<template lang="pug">
//- .title
//- 	h1 결재 양식 상세

//- hr

.form-wrap
	.title
		h2 {{ docFormCont?.data?.docform_title || docFormCont?.data?.form_title }}

	.table-wrap
		.tb-overflow
			table.table#tb-docFormDetail
				colgroup
					col(style="width: 13%")
					col
					//- col(style="width: 15%")
					//- col(style="width: 20%")

				tbody
					//- 작성일자 기안사 :: s
					//- tr.pc(v-show="isDesktop")
					//- 	th 작성 일자
					//- 	td
					//- 		.input-wrap
					//- 			input#inp_date(type="text" name="inp_date" readonly)
					//- 	th 기안자
					//- 	td
					//- 		span.drafter
					//- //- 모바일 경우 레이아웃
					//- tr.mo(v-show="!isDesktop" style="border-top: 1px solid var(--gray-color-300);")
					//- 	th 작성 일자
					//- 	td(colspan="3")
					//- 		.input-wrap
					//- 			input#inp_date(type="text" name="inp_date" readonly)
					//- tr.mo(v-show="!isDesktop")
					//- 	th 기안자
					//- 	td(colspan="3" style="text-align: left")
					//- 		span.drafter
					//- 작성일자 기안사 :: e

					tr(v-if="selectedAuditors.approvers.length === 0 && selectedAuditors.agreers.length === 0 && selectedAuditors.receivers.length === 0" style="height: 119px;")
						th 결재 라인
						td.left(colspan="3")
							span.empty(style="cursor: default;") 선택된 결재자가 없습니다.

					tr.approval(v-if="selectedAuditors.approvers.length > 0")
						th 결재
						td.left(colspan="3" style="padding: 0; height: 119px;")
							ul.approver-wrap
								li.approver-list(v-for="(approver, index) in selectedAuditors.approvers" :key="approver.data.user_id")
									span.num {{ approver.order }}
									span.approver {{ approver.user_info?.name || '알 수 없음' }}

					tr.approval(v-if="selectedAuditors.agreers.length > 0")
						th 합의
						td.left(colspan="3" style="padding: 0; height: 119px;")
							ul.approver-wrap
								li.approver-list(v-for="(agreer, index) in selectedAuditors.agreers" :key="agreer.data.user_id")
									span.num {{ agreer.order }}
									span.approver {{ agreer.user_info?.name || '알 수 없음' }}

					tr.reference(v-if="selectedAuditors.receivers.length > 0")
						th 수신 참조
						td.left(colspan="3")
							ul.reference-wrap
								li.reference-list(v-for="(receiver, index) in selectedAuditors.receivers" :key="receiver.data.user_id")
									span.referencer {{ receiver.user_info?.name || '알 수 없음' }}

					tr
						th.essential 제목
							//- .add-btn
								.icon
									svg
										use(xlink:href="@/assets/icon/material-icon.svg#icon-add")
						td.left(colspan="3") {{ docFormCont?.data?.form_title }}

					tr
						th.essential 결재 내용
						td.left(colspan="3" style="height: 10rem;")
							._wysiwyg4all(v-html="disableContentEditable(docFormCont?.data?.form_content)" style="padding: 0;")

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
						td.left(colspan="3")
							.refer-doc-wrap
								ul.refer-doc-list
									template(v-if="referDoc.length > 0")
										li.refer-doc-item(v-for="(doc, index) in referDoc" :key="index" :class="{ 'no-access': doc?.data?.to_audit === undefined || doc?.data?.to_audit === null }")
											span.refer-doc-name(@click="showReferDetail(doc)") {{ doc?.data?.to_audit || '참조문서에 대한 권한이 없습니다.' }}
									template(v-else)
										li(style="color:var(--gray-color-300); text-align: left;") 등록된 참조 문서가 없습니다.

	.button-wrap
		button.btn.bg-gray.btn-cancel(type="button" @click="router.push('/admin/list-form')") 목록

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
										span.drafter {{ referDetail.data?.drafter || referDetail.drafter }}

								//- 모바일 경우 레이아웃
								tr.mo(v-show="!isDesktop" style="border-top: 1px solid var(--gray-color-300);")
									th 작성 일자
									td(colspan="3") {{ formatTimestampToDate(referDetail.uploaded) }}
								tr.mo(v-show="!isDesktop")
									th 기안자
									td(colspan="3" style="text-align: left")
										span.drafter {{ referDetail.data?.drafter || referDetail.drafter }}
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
													li.refer-doc-item(v-for="(doc, index) in modalReferDoc" :key="index" :class="{ 'no-access': doc?.data?.to_audit === undefined || doc?.data?.to_audit === null }")
														span.refer-doc-name {{ doc?.data?.to_audit || '참조문서에 대한 권한이 없습니다.' }}
												template(v-else)
													li(style="color:var(--gray-color-300); text-align: left;") 등록된 참조 문서가 없습니다.

		.modal-footer(style="padding-top: 0; border-top: none;")
			button.btn.bg-gray.btn-cancel(type="button" @click="closeReferDetail") 닫기
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import { skapi } from '@/main.ts';
import Loading from '@/components/loading.vue';
import Wysiwyg from '@/components/wysiwyg.vue';
import { getUserInfo } from '@/employee.ts';
import { formatTimestampToDate } from '@/utils/time.ts';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const isDesktop = ref(window.innerWidth > 768); // 반응형
const docFormCont = ref({}); // 결재 양식 내용
const formRecordId = ref(''); // 결재 양식 record_id
const uploadedFile = ref([]); // 첨부 파일 목록
const addRows = ref([]);
const rejectSetting = ref(false); // 반려 설정 관련 체크박스

// 참조문서 관련
const referDoc = ref([]); // 참조 문서
const isReferDetailModal = ref(false); // 참조 문서 상세 모달
const referDetail = ref({}); // 참조 문서 상세 내용
const modalReferDoc = ref([]); // 참조문서 모달

// 결재자 정보 저장
const selectedAuditors = ref({
    approvers: [], // 결재
    agreers: [], // 합의
    receivers: [] // 수신참조
});

// 결재자 데이터 변환 함수
const convertAuditorFormatWithOrder = async (auditors) => {
    const result = await Promise.all(
        auditors.map(async (auditor) => {
            let userIdForQuery = auditor.user_id;
            if (auditor.user_id.includes('_')) {
                userIdForQuery = auditor.user_id.replaceAll('_', '-');
            }

            // 사용자 정보 가져오기
            let userInfo;
            try {
                const userInfoResult = await getUserInfo(userIdForQuery);
                userInfo = userInfoResult.list[0];
            } catch (error) {
                console.error('사용자 정보 가져오기 실패:', error);
                userInfo = null;
            }

            return {
                data: { user_id: auditor.user_id },
                index: {
                    value: userInfo?.name || auditor.name || '알 수 없음',
                    name: `${auditor.division}.${auditor.position}`
                },
                user_info: userInfo, // 사용자 정보 추가
                order: auditor.order || 0
            };
        })
    );
    return result;
};

// 에디터 편집 불가 처리
function disableContentEditable(htmlString) {
    // 임시 div 생성
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;

    // 모든 contenteditable="true" 태그 찾아 false로 변경
    tempDiv.querySelectorAll('[contenteditable="true"]').forEach((el) => {
        el.setAttribute('contenteditable', 'false');
    });

    tempDiv.querySelectorAll('.btn-control-wrap').forEach((el) => {
        el.style.display = 'none';
    });

    tempDiv.querySelectorAll('.table-resizer').forEach((el) => {
        el.style.display = 'none';
    });

    // 변경된 HTML 문자열 반환
    return tempDiv.innerHTML;
}

// 결재 양식 상세 조회
const getDocFormDetail = async () => {
    loading.value = true;

    try {
        const formDetail = await skapi.getRecords({
            record_id: formRecordId.value
        });

        docFormCont.value = formDetail.list[0];

        // 체크박스 상태 가져오기
        if (docFormCont.value.data.reject_setting !== undefined) {
            rejectSetting.value =
                docFormCont.value.data.reject_setting === 'true' ||
                docFormCont.value.data.reject_setting === true;
        } else {
            rejectSetting.value = false; // 기본값 false
        }

        // 결재자 정보 가져오기
        if (docFormCont.value.data && docFormCont.value.data.auditors) {
            try {
                const auditors = JSON.parse(docFormCont.value.data.auditors);

                // 각 결재 타입별로 변환
                selectedAuditors.value = {
                    approvers: await convertAuditorFormatWithOrder(auditors.approvers || []),
                    agreers: await convertAuditorFormatWithOrder(auditors.agreers || []),
                    receivers: await convertAuditorFormatWithOrder(auditors.receivers || [])
                };

                // 결재자 순서대로 정렬
                selectedAuditors.value.approvers.sort((a, b) => (a.order || 0) - (b.order || 0));
                selectedAuditors.value.agreers.sort((a, b) => (a.order || 0) - (b.order || 0));
            } catch (error) {
                console.error('결재자 정보 파싱 오류:', error);
                selectedAuditors.value = {
                    approvers: [],
                    agreers: [],
                    receivers: []
                };
            }
        } else {
            selectedAuditors.value = {
                approvers: [],
                agreers: [],
                receivers: []
            };
        }

        // 첨부 파일 목록 가져오기
        if (
            Object.keys(docFormCont.value.bin)?.length &&
            docFormCont.value.bin?.form_data?.length
        ) {
            const fileList = [];
            const form_data = docFormCont.value.bin.form_data;

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
            uploadedFile.value = [];
        }

        // 참조 문서 가져오기
        if (docFormCont.value.data?.reference_docs) {
            try {
                const referDocInfo = JSON.parse(docFormCont.value.data.reference_docs);
                const referDocIds = referDocInfo.referDocId || [];

                if (referDocIds.length > 0) {
                    const fetchPromises = referDocIds.map((recordId) =>
                        skapi
                            .getRecords({ record_id: recordId })
                            .then((res) => res.list?.[0] || null)
                            .catch((err) => {
                                console.error(`참조문서 record_id ${recordId} 호출 실패:`, err);
                                return null;
                            })
                    );

                    referDoc.value = (await Promise.all(fetchPromises)).filter(
                        (doc) => doc !== null
                    );
                } else {
                    referDoc.value = [];
                }
            } catch (error) {
                console.error('참조문서 정보 파싱 오류:', error);
                referDoc.value = [];
            }
        } else {
            referDoc.value = [];
        }
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
};

// 참조문서 상세 보기
const showReferDetail = async (doc) => {
    if (!doc?.data?.to_audit) {
        alert('참조문서에 대한 권한이 없습니다.');
        return;
    }

    isReferDetailModal.value = true;
    referDetail.value = doc;

    try {
        // 이미 처리된 결재자 정보 사용
        const auditors = referDetail.value.data?.auditors
            ? JSON.parse(referDetail.value.data.auditors)
            : { approvers: [], agreers: [], receivers: [] };

        const referDocApprovals = await skapi.getRecords({
            table: {
                name: 'audit_approval',
                access_group: 'authorized'
            },
            reference: doc.record_id // 참조문서의 record_id로 결재 정보 조회
        });

        // 결재자 이름 가져오기
        const approverIds = auditors.approvers?.map((a) => a.user_id.replaceAll('_', '-')) || [];
        const agreerIds = auditors.agreers?.map((a) => a.user_id.replaceAll('_', '-')) || [];
        const receiverIds = auditors.receivers?.map((a) => a.user_id.replaceAll('_', '-')) || [];

        const allUserIds = [...approverIds, ...agreerIds, ...receiverIds];

        let userInfo = { list: [] };
        if (allUserIds.length > 0) {
            userInfo = await getUserInfo(allUserIds);
        }

        referDetail.value.approvers = (auditors.approvers || []).map((a) => {
            const userId = a.user_id.replaceAll('_', '-');
            const userInfoData = userInfo.list.find((user) => user.user_id === userId);
            const approvalData = referDocApprovals.list.find(
                (approval) => approval.user_id === userId
            );

            return {
                userId: userId,
                name: userInfoData?.name || a.name || '알 수 없음',
                order: a.order || 0,
                approved: approvalData?.data?.approved || null,
                stamp: approvalData?.data?.stamp || null,
                date: approvalData?.data?.date || null
            };
        });

        referDetail.value.agreers = (auditors.agreers || []).map((a) => {
            const userId = a.user_id.replaceAll('_', '-');
            const userInfoData = userInfo.list.find((user) => user.user_id === userId);
            const approvalData = referDocApprovals.list.find(
                (approval) => approval.user_id === userId
            );

            return {
                userId: userId,
                name: userInfoData?.name || a.name || '알 수 없음',
                order: a.order || 0,
                approved: approvalData?.data?.approved || null,
                stamp: approvalData?.data?.stamp || null,
                date: approvalData?.data?.date || null
            };
        });

        referDetail.value.receivers = (auditors.receivers || []).map((r) => {
            const userId = r.user_id.replaceAll('_', '-');
            const userInfoData = userInfo.list.find((user) => user.user_id === userId);

            return {
                userId: userId,
                name: userInfoData?.name || r.name || '알 수 없음'
            };
        });

        // 참조 문서의 참조 문서
        if (doc.data.reference_docs) {
            try {
                const parseReferDocId = JSON.parse(doc.data.reference_docs).referDocId;
                const fetchPromises = parseReferDocId.map((recordId) =>
                    skapi
                        .getRecords({ record_id: recordId })
                        .then((res) => res.list?.[0] || null)
                        .catch((err) => {
                            console.error(
                                `참조문서의 참조문서 record_id ${recordId} 호출 실패:`,
                                err
                            );
                            return null;
                        })
                );

                modalReferDoc.value = (await Promise.all(fetchPromises)).filter(
                    (doc) => doc !== null
                );
            } catch (error) {
                console.error('참조문서의 참조문서 파싱 오류:', error);
                modalReferDoc.value = [];
            }
        } else {
            modalReferDoc.value = [];
        }
    } catch (error) {
        console.error('참조문서 상세정보 처리 오류:', error);
        alert('참조문서 상세정보를 불러오는 중 오류가 발생했습니다.');
        isReferDetailModal.value = false;
    }
};

// 참조문서 상세 모달 닫기
const closeReferDetail = () => {
    isReferDetailModal.value = false;
    referDetail.value = {};
    modalReferDoc.value = [];
};

onMounted(() => {
    formRecordId.value = route.query.record_id;
    getDocFormDetail();
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
                cursor: default;

                .icon {
                    padding: 0;

                    svg {
                        width: 18px;
                        height: 18px;
                        fill: var(--primary-color-400);
                    }
                }

                &:hover {
                    background-color: #fff;
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
        height: 100%;
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

#inp_date {
    &:active,
    &:focus,
    &:hover {
        border: 1px solid var(--gray-color-200);
        cursor: default;
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

.button-wrap {
    margin-top: 2rem;
}

// 참조문서 관련 스타일
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

    &.no-access {
        color: var(--gray-color-300);
        border: none;
        text-decoration: none;
        cursor: default;
        font-size: 0.9rem;
        padding: 0;

        &:hover {
            text-decoration: none;
        }
    }
}

.refer-doc-name {
    cursor: pointer;

    &:hover {
        text-decoration: underline;
    }
}

// 참조문서 상세 모달
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

@media (max-width: 768px) {
    .approver-wrap {
        grid-template-columns: repeat(5, 1fr);
    }

    .modal-refer-detail {
        .approver-wrap {
            grid-template-columns: repeat(5, 1fr);
        }
    }
}
</style>
