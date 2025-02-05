import { ref } from "vue";
import { skapi } from "@/main";
import { user } from "@/user";
import { getUserInfo } from "@/employee";

export const auditList = ref([]);
export const auditListRunning = ref(false);

export async function getAuditList() {
	let audits, auditDocs;
	auditListRunning.value = true;

	try {
		// 내가 받은 결재 요청건 가져오기
		audits = await skapi.getRecords({
			table: {
				name: 'audit_request',
				access_group: 'authorized'
			},
			reference: `audit:${user.user_id}`
		}, {
			ascending: false,   // 최신순
		});
	} catch (err) {
		auditListRunning.value = false;
		console.error({err});
	}

	console.log({audits});

	try {
		if (!audits.list.length) {
			auditListRunning.value = false;
			return;
		}
		
		// 내가 받은 결재 요청건의 결재 서류 가져오기
		auditDocs = await Promise.all(audits.list.map(async (list) => {
			if(!list.data.audit_id) return;
			
			// 결재 서류 가져오기
			const audit_doc = (await skapi.getRecords({ 
				record_id: list.data.audit_id 
			})).list[0];
	
			// 다른 사람 결재 여부 확인
			const approvals = (await skapi.getRecords({
				table: {
					name: 'audit_approval',
					access_group: 'authorized'
				},
				reference: list.data.audit_id
			})).list;
			console.log({approvals});
	
			// 결재자 목록에서 각 결재자 ID 가져오기
			const auditors = audit_doc.tags.map(a => a.replaceAll('_', '-'));
			console.log({auditors});

			const auditors_type = auditors.reduce((acc, item) => {
				const [key, value] = item.split(":");

				if (!acc[key]) acc[key] = [];
				acc[key].push(value);

				return acc;
			}, {});
			console.log({auditors_type});

			let has_approved_data = true;
	
			auditors.forEach((auditor) => {
				let oa_has_audited_str = null;
				console.log({auditor});
	
				approvals.forEach((approval) => {
					if (approval.user_id !== auditor.split(':')[1]) {
						has_approved_data = false;
					}

					if (approval.user_id === user.user_id) {
						oa_has_audited_str = approval.data.approved === 'approve' ? '결재함' : '반려함';
	
						// audit_doc.approved = oa_has_audited_str;
						audit_doc.my_state = oa_has_audited_str;
						// audit_doc.user_id = auditor;
					}
				})
	
				if (!oa_has_audited_str) {
					// audit_doc.approved = '대기중';
					audit_doc.my_state = '대기중';
					// audit_doc.user_id = auditor;
				}
			})
			
			return {
				...audit_doc,
				approved: has_approved_data,
				draftUserId: list.user_id
			};
		}));
	} catch (err) {
		auditListRunning.value = false;
		console.error({err});
	}

	try {
		const userList = await Promise.all(auditDocs.map(async (auditor) => await getUserInfo(auditor.draftUserId)))
		const userInfoList = userList.map(user => user.list[0]).filter((user) => user)
	
		const newAuditUserList = auditDocs.map((auditor) => ({
			...auditor,
			user_info: userInfoList.find((user) => user.user_id === auditor.draftUserId)
		}))
	
		auditList.value = newAuditUserList;        

		console.log({auditList: auditList.value});
	} catch (err) {
		auditListRunning.value = false;
		console.error({err});
	}

	auditListRunning.value = false;
}

export const sendAuditList = ref([]);
export const sendAuditListRunning = ref(false);

export async function getSendAuditList() {
	sendAuditListRunning.value = true;

	try {
		// 내가 올린 결재 서류 가져오기
		const audits = await skapi.getRecords({
			table: {
				name: 'audit_doc',
				access_group: 'private',
			},
			reference: user.user_id // 본인 아이디 참조해야 가지고 와짐
		}, {
			ascending: false,   // 최신순
		});

		sendAuditList.value = audits.list;

		console.log('내가 올린 결재 서류 가져오기', sendAuditList.value);
	} catch (err) {
		sendAuditListRunning.value = false;
		console.error({err});
	}

	sendAuditListRunning.value = false;
}

export const goToAuditDetail = (e, auditId, router) => {
    // if(e.target.classList.contains('label-checkbox')) return;
    router.push({ name: 'audit-detail', params: { auditId } });
};

