import { ref } from 'vue';
import { skapi } from '@/main';
import { user } from '@/user';
import { getUserInfo } from '@/employee';

export const auditList = ref([]);
export const auditListRunning = ref(false);

export async function getAuditList() {
  let audits, auditDocs;
  auditListRunning.value = true;

  try {
    // 내가 받은 결재 요청건 가져오기
    audits = await skapi.getRecords(
      {
        table: {
          name: 'audit_request',
          access_group: 'authorized',
        },
        reference: `audit:${user.user_id}`,
      },
      {
        ascending: false, // 최신순
      }
    );
  } catch (err) {
    auditListRunning.value = false;
    console.error({ err });
  }

  try {
    if (!audits.list.length) {
      auditListRunning.value = false;
      return;
    }

    // 내가 받은 결재 요청건의 결재 서류 가져오기
    auditDocs = await Promise.all(
      audits.list.map(async (list) => {
        if (!list.data.audit_id) return;

        // 결재 서류 가져오기
        const audit_doc = (
          await skapi.getRecords({
            record_id: list.data.audit_id,
          })
        ).list[0];

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

        // 결재요청자가 직접 회수 or 결재자 중 반려자가 있을 경우 회수로 처리
        const auditCanceled = isCanceled || isRejected;
        

        // 결재자 목록에서 각 결재자 ID 가져오기
        const auditors = audit_doc.tags.map((a) => a.replaceAll('_', '-'));
        

        const auditors_type = auditors.reduce((acc, item) => {
          const [key, value] = item.split(':');

          if (!acc[key]) acc[key] = [];
          acc[key].push(value);

          return acc;
        }, {});
        

        let has_approved_data = true;

        auditors.forEach((auditor) => {
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
            audit_doc.my_state = auditCanceled ? '회수됨' : '대기중';
          }
        });

        return {
          ...audit_doc,
          approved: has_approved_data,
          draftUserId: list.user_id,
          isCanceled: auditCanceled, // 회수 여부 추가
        };
      })
    );
  } catch (err) {
    auditListRunning.value = false;
    console.error({ err });
  }

  try {
    const userList = await Promise.all(auditDocs.map(async (auditor) => await getUserInfo(auditor.draftUserId)));
    const userInfoList = userList.map((user) => user.list[0]).filter((user) => user);

    const newAuditUserList = auditDocs.map((auditor) => ({
      ...auditor,
      user_info: userInfoList.find((user) => user.user_id === auditor.draftUserId),
    }));
    console.log('newAuditUserList : ', newAuditUserList);

    auditList.value = newAuditUserList;

    
  } catch (err) {
    auditListRunning.value = false;
    console.error({ err });
  }

  auditListRunning.value = false;
}

export const sendAuditList = ref([]);
export const sendAuditListRunning = ref(false);

export async function getSendAuditList() {
  sendAuditListRunning.value = true;

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
      {
        ascending: false, // 최신순
      }
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

        return {
          ...audit,
          isCanceled: isCanceled || isRejected, // 회수 여부 저장
        };
      })
    );

    sendAuditList.value = auditDocs;
  } catch (err) {
    sendAuditListRunning.value = false;
    console.error({ err });
  }

  sendAuditListRunning.value = false;
}

export const goToAuditDetail = (e, auditId, router) => {
  // if(e.target.classList.contains('label-checkbox')) return;
  router.push({ name: 'audit-detail', params: { auditId } });

  // 수신참조 경우
  if (router.currentRoute.value.name === 'audit-reference') {
    router.push({ name: 'audit-detail-reference', params: { auditId } });
  }
};
