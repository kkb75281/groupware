import { ref } from 'vue';
import { skapi } from '@/main';
import { user } from '@/user';
import { getUserInfo } from '@/employee';

export const auditList = ref([]); // 결재 수신함
export const auditListRunning = ref(false);
export const auditReferenceList = ref([]); // 수신참조
export const auditReferenceListRunning = ref(false);

// 결재 수신함 가져오기 (결재자, 합의자)
export async function getAuditList(fetchOptions: {}) {
  auditListRunning.value = true;

  try {
    // 내가 결재자(approver)로 지정된 결재 요청건 가져오기
    const approverAudits = await skapi.getRecords(
      {
        table: {
          name: 'audit_request',
          access_group: 'authorized',
        },
        reference: `audit:${user.user_id}`,
        index: {
          name: 'type',
          value: 'approver'
        }
      },
      fetchOptions
    );

    // 내가 합의자(agreer)로 지정된 결재 요청건 가져오기
    const agreerAudits = await skapi.getRecords(
      {
        table: {
          name: 'audit_request',
          access_group: 'authorized',
        },
        reference: `audit:${user.user_id}`,
        index: {
          name: 'type',
          value: 'agreer'
        }
      },
      fetchOptions
    );

    // 결재자와 합의자 목록 합치기
    const combinedAudits = {
      list: [...approverAudits.list, ...agreerAudits.list]
    };
    
    // 날짜 내림차순 정렬 후 최대 n개만 선택
    combinedAudits.list.sort((a, b) => {
      return (b.uploaded || 0) - (a.uploaded || 0);
    });
    combinedAudits.list = combinedAudits.list;
    console.log('combinedAudits', combinedAudits.list);
    
    // 공통 처리 함수 호출 (isReference = false는 결재 수신함)
    await processAuditData(combinedAudits, false);

  } catch (err) {
    auditListRunning.value = false;
    console.error({ err });
  }
}

// 수신참조 목록 가져오기
export async function getAuditReferenceList(fetchOptions: {}) {
  auditReferenceListRunning.value = true;

  try {
    // 내가 수신참조자로 지정된 결재 요청건 가져오기
    const receiverAudits = await skapi.getRecords(
      {
        table: {
          name: 'audit_request',
          access_group: 'authorized',
        },
        reference: `audit:${user.user_id}`,
        index: {
          name: 'type',
          value: 'receiver'
        }
      },
      {
        ascending: false, // 최신순
      }
    );
    console.log('수신참조 목록 : ', receiverAudits.list);

    // 공통 처리 함수 호출 (isReference = true는 수신참조)
    await processAuditData(receiverAudits, true);

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
        if (!list.data.audit_id) return;

        // 결재 서류 가져오기
        const audit_doc = (
          await skapi.getRecords({
            record_id: list.data.audit_id,
          })
        ).list[0];

        if (!audit_doc) return;

        // 회수된 결재 서류 가져오기
        const canceledAudit = await skapi.getRecords({
          table: {
            name: 'audit_canceled:' + list.data.audit_id,
            access_group: 'authorized',
          },
        });

        // 회수 여부 체크
        const isCanceled = canceledAudit.list && canceledAudit.list.length > 0;

        // 다른 사람 결재 여부 확인
        const approvals = (
          await skapi.getRecords({
            table: {
              name: 'audit_approval',
              access_group: 'authorized',
            },
            reference: list.data.audit_id,
          })
        ).list;

        // 반려 여부 확인
        const isRejected = approvals.find((approval) => approval.data.approved === 'reject');

        // 모든 결재자가 결재를 완료했는지 확인
        const auditors = JSON.parse(audit_doc.data.auditors);
        const allApprovers = [...(auditors.approvers || []), ...(auditors.agreers || [])];
        const allApproved = allApprovers.length > 0 && allApprovers.length === approvals.length;

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

        if (isCanceled) {
          documentStatus = '회수됨'; // 결재요청자가 직접 회수한 경우
        } else if (isRejected && !allApproved) {
          documentStatus = '회수됨'; // 결재 진행 중에 반려자가 있는 경우
        } else if (allApproved && isLastRejector) {
          documentStatus = '반려됨'; // 모든 결재자가 결재를 완료하고 마지막 결재자가 반려한 경우
        } else if (allApproved) {
          documentStatus = '완료됨';
        } else {
          documentStatus = '진행중';
        }
        
        // 결재자가 반려했지만 마지막 결재자가 아닌 경우에만 자동 회수
        const shouldAutoCancel = isRejected && !allApproved;
        
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
              oa_has_audited_str = approval.data.approved === 'approve' ? '결재함' : '반려함';
              audit_doc.my_state = oa_has_audited_str;
            }
          });

          if (!oa_has_audited_str) {
            audit_doc.my_state = auditCanceled ? '회수됨' : (allApproved && isLastRejector ? '반려됨' : '대기중');
          }
        });

        return {
          ...audit_doc,
          approved: has_approved_data,
          draftUserId: list.user_id,
          isCanceled: auditCanceled, // 회수 여부
          isRejected: allApproved && isLastRejector, // 반려 여부
          shouldAutoCancel: shouldAutoCancel, // 자동 회수 여부
          documentStatus: documentStatus, // 문서 상태
        };
      })
    );

    // null/undefined 값 제거
    const filteredDocs = auditDocs.filter(doc => doc !== undefined);
    
    // 사용자 정보 추가
    const userList = await Promise.all(
      filteredDocs.map(async (auditor) => await getUserInfo(auditor.draftUserId))
    );
    
    const userInfoList = userList.map((user) => user.list[0]).filter((user) => user);

    const newAuditUserList = filteredDocs.map((auditor) => ({
      ...auditor,
      user_info: userInfoList.find((user) => user.user_id === auditor.draftUserId),
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
  // sendAuditListRunning.value = true;

  try {
    // 내가 올린 결재 서류 가져오기
    const audits = await skapi.getRecords(
      {
        table: {
          name: 'audit_doc',
          access_group: 'private',
        },
        reference: user.user_id, // 본인 아이디 참조해야 가지고 와짐
      },
      fetchOptions
    );

    const auditDocs = await Promise.all(
      audits.list.map(async (audit) => {
        // 회수 여부 확인
        const canceledAudit = await skapi.getRecords({
          table: {
            name: `audit_canceled:${audit.record_id}`, // 결재 ID 기준 회수 내역 조회
            access_group: 'authorized',
          },
        });

        const isCanceled = canceledAudit.list.length > 0; // 회수된 문서가 있는지 체크

        // 반려 여부 확인
        const approvals = (
          await skapi.getRecords({
            table: {
              name: 'audit_approval',
              access_group: 'authorized',
            },
            reference: audit.record_id,
          })
        ).list;

        const isRejected = approvals.some((approval) => approval.data.approved === 'reject');

        // 모든 결재자가 결재를 완료했는지 확인
        const auditors = JSON.parse(audit.data.auditors);
        const allApprovers = [...(auditors.approvers || []), ...(auditors.agreers || [])];
        const allApproved = allApprovers.length > 0 && allApprovers.length === approvals.length;
        
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
        if (isCanceled) {
          documentStatus = '회수됨';
        } else if (isRejected && !allApproved) {
          documentStatus = '회수됨'; // 결재 진행 중에 반려자가 있는 경우
        } else if (allApproved && isLastRejector) {
          documentStatus = '반려됨'; // 모든 결재자가 결재를 완료하고 마지막 결재자가 반려한 경우
        } else if (allApproved) {
          documentStatus = '완료됨';
        } else {
          documentStatus = '진행중';
        }

        return {
          ...audit,
          isCanceled: isCanceled, // 회수 여부
          isRejected: allApproved && isRejected, // 반려 여부 (마지막 결재자가 반려한 경우)
          shouldAutoCancel: shouldAutoCancel, // 자동 회수 여부
          documentStatus: documentStatus, // 문서 상태
        };
      })
    );

    // sendAuditList.value = auditDocs;

    return {
      list: Object.values(auditDocs),
      endOfList: audits.endOfList,
    };
  } catch (err) {
    // sendAuditListRunning.value = false;
    console.error({ err });
  }

  // sendAuditListRunning.value = false;
}

export const goToAuditDetail = (e: any, auditId: any, router: any) => {
  // if(e.target.classList.contains('label-checkbox')) return;
  router.push({ name: 'audit-detail', params: { auditId } });

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
