import { ref } from 'vue';
import { skapi } from '@/main.ts';
import { user } from '@/user.ts';
import { getUserInfo } from '@/employee.ts';

export const auditList = ref([]); // 결재 수신함
export const auditListRunning = ref(false);
export const auditReferenceList = ref([]); // 수신참조
export const auditReferenceListRunning = ref(false);
export const reRequestData = ref({});

let auditListCached = false;
let auditReferenceListCached = false;
let sendAuditListCached = false;

// 결재 수신함 가져오기 (결재자, 합의자)
export async function getAuditList(fetchOptions: {}) {
    // console.log('fetchOptions : ', fetchOptions);

    // // 이미 캐시된 데이터가 있고 fetchMore가 false인 경우 서버 호출 안함
    // if (auditListCached && !fetchOptions.fetchMore) {
    //     return { list: auditList.value, endOfList: true };
    // }

    auditListRunning.value = true;

    try {
        // 내가 결재자(approver)로 지정된 결재 요청건 가져오기
        const approverAudits = await skapi.getRecords(
            {
                table: {
                    name: 'audit_request_approver',
                    access_group: 'authorized'
                },
                reference: `audit:${user.user_id}`
            },
            fetchOptions
        );
        // console.log('approverAudits : ', approverAudits);

        // 내가 합의자(agreer)로 지정된 결재 요청건 가져오기
        const agreerAudits = await skapi.getRecords(
            {
                table: {
                    name: 'audit_request_agreer',
                    access_group: 'authorized'
                },
                reference: `audit:${user.user_id}`
            },
            fetchOptions
        );
        // console.log('agreerAudits : ', agreerAudits);

        // 결재자와 합의자 목록 합치기 (endOfList 체크 필요)
        const combinedAudits = {
            list: [...approverAudits.list, ...agreerAudits.list],
            endOfList: approverAudits.endOfList || agreerAudits.endOfList
        };

        // 날짜 내림차순 정렬 후 최대 n개만 선택
        combinedAudits.list.sort((a, b) => {
            return (b.uploaded || 0) - (a.uploaded || 0);
        });
        combinedAudits.list = combinedAudits.list;
        // console.log('combinedAudits : ', combinedAudits);

        // 공통 처리 함수 호출 (isReference = false는 결재 수신함)
        const res = await processAuditData(combinedAudits, false);
        combinedAudits.list = res;
        // auditListCached = true;

        return {
            list: Object.values(combinedAudits.list),
            endOfList: combinedAudits.endOfList
        };
    } catch (err) {
        auditListRunning.value = false;
        console.error({ err });
    }
}

// 수신참조 목록 가져오기
export async function getAuditReferenceList(fetchOptions: {}) {
    // 이미 캐시된 데이터가 있고 fetchMore가 false인 경우 서버 호출 안함
    // if (auditReferenceListCached && !fetchOptions.fetchMore) {
    //     return { list: auditReferenceList.value, endOfList: true };
    // }

    auditReferenceListRunning.value = true;

    try {
        // 내가 수신참조자로 지정된 결재 요청건 가져오기
        const receiverAudits = await skapi.getRecords(
            {
                table: {
                    name: 'audit_request_receiver',
                    access_group: 'authorized'
                },
                reference: `audit:${user.user_id}`
            },
            fetchOptions
        );
        // console.log('receiverAudits : ', receiverAudits);

        // 공통 처리 함수 호출 (isReference = true는 수신참조)
        const res = await processAuditData(receiverAudits, true);
        receiverAudits.list = res;
        // auditReferenceListCached = true;

        return {
            list: Object.values(receiverAudits.list),
            endOfList: receiverAudits.endOfList
        };
    } catch (err) {
        auditReferenceListRunning.value = false;
        console.error({ err });
    }
}

// 결재 문서 처리 (공통)
async function processAuditData(auditRequests, isReference = false) {
    const resultList = ref([]);
    const loadingState = isReference ? auditReferenceListRunning : auditListRunning;

    try {
        if (!auditRequests.list || auditRequests.list.length === 0) {
            loadingState.value = false;
            return [];
        }

        // 내가 받은 결재 요청건의 결재 서류 가져오기
        const auditDocs = await Promise.all(
            auditRequests.list.map(async (list) => {
                if (!list || !list.data || !list.data.audit_id) {
                    // console.log('유효하지 않음 : ', list);
                    return null;
                }

                // 결재 서류 가져오기
                const audit_doc = (
                    await skapi.getRecords({
                        record_id: list.data.audit_id
                    })
                ).list[0];

                if (!audit_doc) return null;

                // 회수된 결재 서류 가져오기
                const canceledAudit = await skapi.getRecords({
                    table: {
                        name: 'audit_canceled:' + list.data.audit_id,
                        access_group: 'authorized'
                    }
                });

                // 회수 여부 체크
                const isCanceled = canceledAudit.list && canceledAudit.list.length > 0;

                // 다른 사람 결재 여부 확인
                const approvals = (
                    await skapi.getRecords({
                        table: {
                            name: 'audit_approval',
                            access_group: 'authorized'
                        },
                        reference: list.data.audit_id
                    })
                ).list;

                // 반려 여부 확인
                const isRejected = approvals.find(
                    (approval) => approval.data.approved === 'reject'
                );

                // 모든 결재자가 결재를 완료했는지 확인
                const auditors = JSON.parse(audit_doc.data.auditors);
                const allApprovers = [...(auditors.approvers || []), ...(auditors.agreers || [])];
                const allApproved =
                    allApprovers.length > 0 && allApprovers.length === approvals.length;

                // 최종 결재자(가장 높은 order를 가진 결재자) 찾기
                const sortedApprovers = [...allApprovers].sort((a, b) => b.order - a.order);
                const finalApprover = sortedApprovers.length > 0 ? sortedApprovers[0] : null;

                // 최종 결재자의 결재 상태 확인
                let finalApproverStatus = 'none'; // 'none', 'approve', 'reject'
                if (finalApprover) {
                    const finalApproverApproval = approvals.find(
                        (approval) =>
                            approval.user_id.replaceAll('-', '_') === finalApprover.user_id
                    );

                    if (finalApproverApproval) {
                        finalApproverStatus = finalApproverApproval.data.approved; // 'approve' 또는 'reject'
                    }
                }

                // 최종 결재자가 결재했는지 여부 (승인 또는 반려)
                const finalApproverActed = finalApproverStatus !== 'none';
                // 최종 결재자가 승인했는지 여부
                const finalApproverApproved = finalApproverStatus === 'approve';
                // 최종 결재자가 반려했는지 여부
                const finalApproverRejected = finalApproverStatus === 'reject';

                // 모든 결재자가 결재를 완료한 상태에서 가장 마지막에 결재한 사람이 반려했는지 확인
                let isLastRejector = false;

                if (isRejected && allApproved) {
                    const sortedApprovals = [...approvals].sort((a, b) => {
                        return (b.data.date || 0) - (a.data.date || 0);
                    });

                    // 가장 마지막에 결재한 사람 찾기
                    const lastApproval = sortedApprovals[0];

                    if (lastApproval && lastApproval.data.approved === 'reject') {
                        isLastRejector = true;
                    }
                }

                // 반려 or 회수 구분
                let documentStatus = '';

                // reject_setting 값 확인 (true면 반려와 상관없이 계속 진행)
                const rejectSetting =
                    audit_doc.data.reject_setting === 'true' ||
                    audit_doc.data.reject_setting === true;

                // 자동 회수인지 확인
                const cancelRecord = canceledAudit.list[0];
                const isAutoCancel = cancelRecord?.data?.auto_cancel === true;

                if (finalApproverRejected) {
                    documentStatus = '반려됨'; // 최종 결재자가 반려한 경우
                } else if (finalApproverApproved) {
                    documentStatus = '완료됨'; // 최종 결재자가 승인한 경우
                } else if (isCanceled) {
                    // 수동 회수이거나 (자동 회수이면서 rejectSetting이 false인 경우)만 회수됨으로 표시
                    if (!isAutoCancel || (isAutoCancel && !rejectSetting)) {
                        documentStatus = '회수됨';
                    } else {
                        // 자동 회수이지만 rejectSetting이 true인 경우 진행중으로 표시
                        documentStatus = '진행중';
                    }
                } else if (isRejected && !allApproved) {
                    // 결재 진행 중 반려자가 있는 경우
                    if (!rejectSetting) {
                        documentStatus = '회수됨'; // rejectSetting이 false일 때만 회수됨으로 표시
                    } else {
                        documentStatus = '진행중'; // rejectSetting이 true이면 진행중으로 표시
                    }
                } else {
                    documentStatus = '진행중';
                }

                // 결재자가 반려했지만 마지막 결재자가 아닌 경우에만 자동 회수
                const shouldAutoCancel = isRejected && !allApproved;

                // 실제 회수 상태 결정
                const effectivelyCanceled = isCanceled
                    ? !isAutoCancel || (isAutoCancel && !rejectSetting)
                    : shouldAutoCancel && !rejectSetting;

                // 회수된 문서인지 체크
                const auditCanceled = isCanceled || shouldAutoCancel;

                // 결재자 목록에서 각 결재자 ID 가져오기
                const auditorTags = audit_doc.tags.map((a) => a.replaceAll('_', '-'));

                const auditors_type = auditorTags.reduce((acc, item) => {
                    const [key, value] = item.split(':');

                    if (!acc[key]) acc[key] = [];
                    acc[key].push(value);

                    return acc;
                }, {});

                let has_approved_data = true;

                auditorTags.forEach((auditor) => {
                    let oa_has_audited_str = null;

                    approvals.forEach((approval) => {
                        if (approval.user_id !== auditor.split(':')[1]) {
                            has_approved_data = false;
                        }

                        if (approval.user_id === user.user_id) {
                            oa_has_audited_str =
                                approval.data.approved === 'approve' ? '결재함' : '반려함';
                            audit_doc.my_state = oa_has_audited_str;
                        }
                    });

                    if (!oa_has_audited_str) {
                        audit_doc.my_state = effectivelyCanceled
                            ? '회수됨'
                            : allApproved && isLastRejector
                              ? '반려됨'
                              : '대기중';
                    }
                });

                return {
                    ...audit_doc,
                    approved: has_approved_data,
                    draftUserId: list.user_id,
                    isCanceled: effectivelyCanceled, // 회수 여부
                    isRejected: allApproved && isLastRejector, // 반려 여부
                    shouldAutoCancel: shouldAutoCancel, // 자동 회수 여부
                    documentStatus: documentStatus // 문서 상태
                };
            })
        );

        // null/undefined 값 제거
        const filteredDocs = auditDocs.filter((doc) => doc !== undefined && doc !== null);

        // 사용자 정보 추가
        const userList = await Promise.all(
            filteredDocs.map(async (auditor) => await getUserInfo(auditor.draftUserId))
        );

        const userInfoList = userList.map((user) => user.list[0]).filter((user) => user);

        const newAuditUserList = filteredDocs.map((auditor) => ({
            ...auditor,
            user_info: userInfoList.find((user) => user.user_id === auditor.draftUserId)
        }));

        // 결과를 수신참조 여부에 따라 다른 변수에 저장
        if (isReference) {
            auditReferenceList.value = newAuditUserList;
        } else {
            auditList.value = newAuditUserList;
        }

        return newAuditUserList;
    } catch (err) {
        console.error({ err });
        return [];
    } finally {
        loadingState.value = false;
    }
}

export const sendAuditList = ref([]);
export const sendAuditListRunning = ref(false);

export async function getSendAuditList(fetchOptions: {}) {
    // 이미 캐시된 데이터가 있고 fetchMore가 false인 경우 서버 호출 안함
    // if (sendAuditListCached && !fetchOptions.fetchMore) {
    //     return { list: sendAuditList.value, endOfList: true };
    // }

    // sendAuditListRunning.value = true;

    try {
        // 내가 올린 결재 서류 가져오기
        const audits = await skapi.getRecords(
            {
                table: {
                    name: 'audit_doc',
                    access_group: 'private'
                },
                reference: user.user_id // 본인 아이디 참조해야 가지고 와짐
            },
            fetchOptions
        );

        const auditDocs = await Promise.all(
            audits.list.map(async (audit) => {
                // 회수 여부 확인
                const canceledAudit = await skapi.getRecords({
                    table: {
                        name: `audit_canceled:${audit.record_id}`, // 결재 ID 기준 회수 내역 조회
                        access_group: 'authorized'
                    }
                });

                const isCanceled = canceledAudit.list.length > 0; // 회수된 문서가 있는지 체크

                // 반려 여부 확인
                const approvals = (
                    await skapi.getRecords({
                        table: {
                            name: 'audit_approval',
                            access_group: 'authorized'
                        },
                        reference: audit.record_id
                    })
                ).list;

                const isRejected = approvals.some(
                    (approval) => approval.data.approved === 'reject'
                );

                // 모든 결재자가 결재를 완료했는지 확인
                const auditors = JSON.parse(audit.data.auditors);
                const allApprovers = [...(auditors.approvers || []), ...(auditors.agreers || [])];
                const allApproved =
                    allApprovers.length > 0 && allApprovers.length === approvals.length;

                // 최종 결재자(가장 높은 order를 가진 결재자) 찾기
                const sortedApprovers = [...allApprovers].sort((a, b) => b.order - a.order);
                const finalApprover = sortedApprovers.length > 0 ? sortedApprovers[0] : null;

                // 최종 결재자의 결재 상태 확인
                let finalApproverStatus = 'none'; // 'none', 'approve', 'reject'
                if (finalApprover) {
                    const finalApproverApproval = approvals.find(
                        (approval) =>
                            approval.user_id.replaceAll('-', '_') === finalApprover.user_id
                    );

                    if (finalApproverApproval) {
                        finalApproverStatus = finalApproverApproval.data.approved; // 'approve' 또는 'reject'
                    }
                }

                // 최종 결재자가 결재했는지 여부 (승인 또는 반려)
                const finalApproverActed = finalApproverStatus !== 'none';
                // 최종 결재자가 승인했는지 여부
                const finalApproverApproved = finalApproverStatus === 'approve';
                // 최종 결재자가 반려했는지 여부
                const finalApproverRejected = finalApproverStatus === 'reject';

                // 마지막 결재자가 반려했는지 확인
                let isLastRejector = false;

                if (isRejected && allApproved) {
                    // 모든 결재자가 결재를 완료한 상태에서 반려자가 있는지 확인
                    // 마지막 결재자가 반려했는지 확인
                    const lastApprovalIndex = approvals.length - 1;
                    const lastApproval = approvals[lastApprovalIndex];

                    if (lastApproval && lastApproval.data.approved === 'reject') {
                        isLastRejector = true;
                    }
                }

                // 자동 회수 여부 결정
                const shouldAutoCancel = isRejected && !allApproved;

                // 문서 상태 결정
                let documentStatus = '';

                // reject_setting 값 확인
                const rejectSetting =
                    audit.data.reject_setting === 'true' || audit.data.reject_setting === true;

                if (finalApproverRejected) {
                    documentStatus = '반려됨'; // 최종 결재자가 반려한 경우
                } else if (finalApproverApproved) {
                    documentStatus = '완료됨'; // 최종 결재자가 승인한 경우
                } else if (isCanceled) {
                    // 회수 레코드에서 자동 회수 여부 확인
                    const cancelRecord = canceledAudit.list[0];
                    const isAutoCancel = cancelRecord?.data?.auto_cancel === true;

                    if (!isAutoCancel || (isAutoCancel && !rejectSetting)) {
                        documentStatus = '회수됨';
                    } else {
                        documentStatus = '진행중';
                    }
                } else if (isRejected && !allApproved) {
                    if (!rejectSetting) {
                        documentStatus = '회수됨'; // rejectSetting이 false일 때만 회수됨으로 표시
                    } else {
                        documentStatus = '진행중'; // rejectSetting이 true이면 진행중으로 표시
                    }
                } else {
                    documentStatus = '진행중';
                }

                return {
                    ...audit,
                    isCanceled: isCanceled, // 회수 여부
                    isRejected: allApproved && isRejected, // 반려 여부 (마지막 결재자가 반려한 경우)
                    shouldAutoCancel: shouldAutoCancel, // 자동 회수 여부
                    documentStatus: documentStatus // 문서 상태
                };
            })
        );

        // sendAuditList.value = auditDocs;

        // sendAuditListCached = true;

        return {
            list: Object.values(auditDocs),
            endOfList: audits.endOfList
        };
    } catch (err) {
        // sendAuditListRunning.value = false;
        console.error({ err });
    }

    // sendAuditListRunning.value = false;
}

export const goToAuditDetail = (e: any, auditId: any, router: any, isSending?: false) => {
    // if(e.target.classList.contains('label-checkbox')) return;
    router.push({ name: 'audit-detail', params: { auditId }, query: { isSending: isSending } });

    // 수신참조 경우
    if (router.currentRoute.value.name === 'audit-reference') {
        router.push({ name: 'audit-detail-reference', params: { auditId } });
    } else if (router.currentRoute.value.name === 'audit-list-favorite') {
        router.push({ name: 'audit-detail-favorite', params: { auditId } });
    }

    if (e.target.closest('.icon-favorite') || e.target.closest('.icon-read')) {
        return;
    }
};
