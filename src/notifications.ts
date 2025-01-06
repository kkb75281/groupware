import { request } from "http";
// import { useRoute, useRouter } from 'vue-router';
import { skapi } from "./main";
import { user } from "./user";
import { Reactive, reactive, ref } from "vue";
import { kMaxLength } from "buffer";

// const router = useRouter();

export const notifications:Reactive<{messages: {fromUserId:string; msg: any }[], audits: {fromUserId:string; msg: any }[]}> = reactive({
    audits: [],
    messages: []
});

export let isCalculating = ref(false);
export const sendAuditList = ref([]);
export const auditList = ref([]);
export const readList = ref(JSON.parse(localStorage.getItem('read_noti_list')) || []);

const getUserInfo = async (userId: string) => {
    const params = {
        searchFor: 'user_id',
        value: userId
    }

    return await skapi.getUsers(params);
}

export async function getAuditList() {
	let audits, auditDocs;
	isCalculating.value = true;

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
		console.error({err});
	}

	// console.log({audits});

	try {
		auditDocs = await Promise.all(audits.list.map(async (list) => {
			if(!list.data.audit_id) return;
			// console.log({list});
			// 결재 서류 가져오기
			const audit_doc = (await skapi.getRecords({ 
				record_id: list.data.audit_id 
			})).list[0];
			// console.log({audit_doc});
	
			// 다른 사람 결재 여부 확인
			const approvals = (await skapi.getRecords({
				table: {
					name: 'audit_approval',
					access_group: 'authorized'
				},
				reference: list.data.audit_id
			})).list;
			// console.log({approvals});
	
			// 결재자 목록에서 각 결재자 ID 가져오기
			const auditors = audit_doc.tags.map(a => a.replaceAll('_', '-'));
	
			auditors.forEach((auditor) => {
				let oa_has_audited_str = null;
	
				approvals.forEach((approval) => {
					if (approval.user_id === user.user_id) {
						oa_has_audited_str = approval.data.approved === 'approve' ? '결재함' : '반려함';
	
						audit_doc.approved = oa_has_audited_str;
						audit_doc.user_id = auditor;
						
						return;
					}
				})
	
				if (!oa_has_audited_str) {
					audit_doc.approved = '대기중';
					audit_doc.user_id = auditor;
				}
			})
			
			return {
				...audit_doc,
				draftUserId: list.user_id
			};
		}));
	} catch (err) {
		console.error({err});
	}

	try {
		const userList = await Promise.all(auditDocs.map(async (auditor) => await getUserInfo(auditor.draftUserId)))
		const userInfoList = userList.map(user => user.list[0]).filter((user) => user)
	
		const newAuditUserList = auditDocs.map((auditor) => ({
			...auditor,
			user_info: userInfoList.find((user) => user.user_id === auditor.draftUserId),
			audit_type: '받은 결재'
		}))
	
		auditList.value = newAuditUserList;        
		isCalculating.value = false;

		console.log({auditList: auditList.value});
	} catch (err) {
		console.error({err});
	}
}

// export async function getSendAuditList() {
// 	if(sendAuditList.value.length) return;

// 	let audits, auditDocs;

// 	try {
// 		audits = await skapi.getRecords({
// 			table: {
// 				name: 'audit_doc',
// 				access_group: 'private',
// 			},
// 			reference: user.user_id // 본인 아이디 참조해야 가지고 와짐
// 		})
// 	} catch (err) {
// 		console.error({err});
// 	}

// 	sendAuditList.value = audits.list;
// 	console.log({sendAuditList: sendAuditList.value});

// 	auditDocs = await Promise.all(audits.list.map(async (list) => {
// 		console.log({list: list})
// 		// 결재 서류 가져오기
// 		const audit_doc = (await skapi.getRecords({ 
// 			record_id: list.data.audit_id 
// 		})).list[0];
// 		console.log({audit_doc});

// 		// 다른 사람 결재 여부 확인
// 		const approvals = (await skapi.getRecords({
// 			table: {
// 				name: 'audit_approval',
// 				access_group: 'authorized'
// 			},
// 			reference: list.data.audit_id
// 		})).list;
// 		console.log({approvals});
// 	}))

// 	console.log({auditDocs});

// 	// try {
// 	// 	auditDocs = await Promise.all(audits.list.map(async (list) => {
// 	// 		if(!list.data.audit_id) return;
// 	// 		console.log({list});
// 	// 		// 결재 서류 가져오기
// 	// 		const audit_doc = (await skapi.getRecords({ 
// 	// 			record_id: list.data.audit_id 
// 	// 		})).list[0];
// 	// 		console.log({audit_doc});
	
// 	// 		// 다른 사람 결재 여부 확인
// 	// 		const approvals = (await skapi.getRecords({
// 	// 			table: {
// 	// 				name: 'audit_approval',
// 	// 				access_group: 'authorized'
// 	// 			},
// 	// 			reference: list.data.audit_id
// 	// 		})).list;
// 	// 		console.log({approvals});
	
// 	// 		// 결재자 목록에서 각 결재자 ID 가져오기
// 	// 		const auditors = audit_doc.tags.map(a => a.replaceAll('_', '-'));
	
// 	// 		auditors.forEach((auditor) => {
// 	// 			let oa_has_audited_str = null;
	
// 	// 			approvals.forEach((approval) => {
// 	// 				if (approval.user_id === user.user_id) {
// 	// 					oa_has_audited_str = approval.data.approved === 'approve' ? '결재함' : '반려함';
	
// 	// 					audit_doc.approved = oa_has_audited_str;
// 	// 					audit_doc.user_id = auditor;
						
// 	// 					return;
// 	// 				}
// 	// 			})
	
// 	// 			if (!oa_has_audited_str) {
// 	// 				audit_doc.approved = '대기중';
// 	// 				audit_doc.user_id = auditor;
// 	// 			}
// 	// 		})
			
// 	// 		return {
// 	// 			...audit_doc,
// 	// 			draftUserId: list.user_id
// 	// 		};
// 	// 	}));
// 	// } catch (err) {
// 	// 	console.error({err});
// 	// }

// 	// try {
// 	// 	const userList = await Promise.all(auditDocs.map(async (auditor) => await getUserInfo(auditor.draftUserId)))
// 	// 	const userInfoList = userList.map(user => user.list[0]).filter((user) => user)
	
// 	// 	const newAuditUserList = auditDocs.map((auditor) => ({
// 	// 		...auditor,
// 	// 		user_info: userInfoList.find((user) => user.user_id === auditor.draftUserId),
// 	// 		read_noti: false
// 	// 	}))
	
// 	// 	sendAuditList.value = newAuditUserList;        
// 	// 	isCalculating.value = false;

// 	// 	console.log({sendAuditList: sendAuditList.value});
// 	// } catch (err) {
// 	// 	console.error({err});
// 	// }
// }

export const goToAuditDetail = (e, auditId, router) => {
    // if(e.target.classList.contains('label-checkbox')) return;
    router.push({ name: 'audit-detail', params: { auditId } });
};