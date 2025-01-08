import { get, request } from "http";
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

// export const allAuditList = ref([]);
export const sendAuditList = ref([]);
export const auditList = ref([]);
export const readList = ref([]);

export let getReadListRunning: Promise<any> | null = null;

export const getReadList = async() => {
	if(getReadListRunning instanceof Promise) { // 이미 실행중인 경우
		await getReadListRunning;
		return readList.value;
	}

	if (readList.value && Object.keys(readList.value).length) { // 받아온적 있거나, 데이터가 없는경우
		console.log('herererere')
		return readList.value; // 이미 데이터가 존재하면 불러오지 않음
	}
	
	getReadListRunning = skapi.getRecords({
		unique_id: '[notification_read_list]' + user.user_id
	}).finally(() => {
		getReadListRunning = null;
	})

	let res = await getReadListRunning;

	if (res.list.length) {
		if (res.list[0].data && res.list[0].data?.list) {
			readList.value = JSON.parse(res.list[0].data.list);
		} else {
			readList.value = [];
		}
	}

	console.log('readList', readList.value);

	return readList.value;
}

const getUserInfo = async (userId: string) => {
    const params = {
        searchFor: 'user_id',
        value: userId
    }

    return await skapi.getUsers(params);
}

export async function getAuditList() {
	try {
        // 내가 받은 결재 요청건 가져오기
        const audits = await skapi.getRecords({
            table: {
                name: 'audit_request',
                access_group: 'authorized'
            },
            reference: `audit:${user.user_id}`
            
        }, {
            ascending: false,   // 최신순
        });

        const auditDocs = await Promise.all(audits.list.map(async (list) => {
            // 결재 서류 가져오기
            const audit_doc = (await skapi.getRecords({ 
                record_id: list.data.audit_id,
                // index: {
                //     name: 'referenced_count',
                //     value: 0,
                //     condition: '=',
                // }
            })).list[0];

            // 다른 사람 결재 여부 확인
            const approvals = (await skapi.getRecords({
                table: {
                    name: 'audit_approval',
                    access_group: 'authorized'
                },
                reference: list.data.audit_id
            })).list;

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

        const userList = await Promise.all(auditDocs.map(async (auditor) => await getUserInfo(auditor.draftUserId)))
        const userInfoList = userList.map(user => user.list[0]).filter((user) => user)

        const newAuditUserList = auditDocs.map((auditor) => ({
            ...auditor,
            user_info: userInfoList.find((user) => user.user_id === auditor.draftUserId)
        }))

        auditList.value = newAuditUserList;  
		console.log('내가 결재할 서류 가져오기', auditList.value);      
    } catch (err) {
        console.error({err});
    }
}

export async function getSendAuditList() {
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
		console.error({err});
	}
}
async function getallList() {
	try {
		await Promise.all([
			getReadList(),
			getAuditList(),
			getSendAuditList(),
		]);
	} catch (error) {
		console.error('Error occurred:', error);
	}
}

// export async function getAuditList() {
// 	getReadList();

// 	let audit_request, audit_doc, audit_all, auditDocs;
	
// 	try {
// 		// 내가 받은 결재 요청건 가져오기
// 		audit_request = await skapi.getRecords({
// 			table: {
// 				name: 'audit_request',
// 				access_group: 'authorized'
// 			},
// 			reference: `audit:${user.user_id}`
// 		}, {
// 			ascending: false,   // 최신순
// 		});

// 		// 내가 요청한 결재 서류 가져오기
// 		audit_doc = await skapi.getRecords({
// 			table: {
// 				name: 'audit_doc',
// 				access_group: 'private',
// 			},
// 			reference: user.user_id // 본인 아이디 참조해야 가지고 와짐
// 		}, {
// 			ascending: false,   // 최신순
// 		});

// 		audit_all = audit_request.list.concat(audit_doc.list);
// 	} catch (err) {
// 		console.error({err});
// 	}

// 	console.log({audit_request});	// data: { audit_id: '', auditor: '' }
// 	console.log({audit_doc});	// data: { auditors: [], to_audit: '', to_audit_content: '' }
// 	console.log({audit_all});

// 	try {
// 		auditDocs = await Promise.all(audit_all.map(async (list) => {
// 			let get_audit_doc, get_approvals, auditors;

// 			if(list.data?.audit_id) {
// 				// 결재 서류 가져오기
// 				get_audit_doc = (await skapi.getRecords({ 
// 					record_id: list.data.audit_id 
// 				})).list[0];

// 				// 다른 사람 결재 여부 확인
// 				get_approvals = (await skapi.getRecords({
// 					table: {
// 						name: 'audit_approval',
// 						access_group: 'authorized'
// 					},
// 					reference: list.data.audit_id
// 				})).list;

// 			} else {
// 				get_audit_doc = list;
				
// 				// console.log({get_approvals});
// 				// get_audit_doc.data.auditors.map(async (auditor) => {
// 				// 	console.log({auditor});
// 				// 	get_approvals = (await skapi.getRecords({
// 				// 		table: {
// 				// 			name: 'audit_approval',
// 				// 			access_group: 'authorized'
// 				// 		},
// 				// 		reference: auditor
// 				// 	})).list;
// 				// })

// 				// get_approvals = await Promise.all(get_audit_doc.data.auditors.map(async (auditor) => {
// 				// 	return (await skapi.getRecords({
// 				// 		table: {
// 				// 			name: 'audit_approval',
// 				// 			access_group: 'authorized'
// 				// 		},
// 				// 		reference: auditor
// 				// 	})).list[0];
// 				// }))
// 			}

// 			auditors = get_audit_doc.tags.map(a => a.replaceAll('_', '-'));

// 			auditors.forEach((auditor) => {
// 				console.log({auditor});
// 				let oa_has_audited_str = null;

// 				if(get_approvals) {
// 					get_approvals.forEach((approval) => {
// 						console.log({approval});
// 						if (approval.user_id === user.user_id) {
// 							oa_has_audited_str = approval.data.approved === 'approve' ? '결재함' : '반려함';
		
// 							get_audit_doc.approved = oa_has_audited_str;
// 							get_audit_doc.user_id = auditor;
							
// 							return;
// 						}
// 					})
// 				}
	
// 				if (!oa_has_audited_str) {
// 					get_audit_doc.approved = '대기중';
// 					get_audit_doc.user_id = auditor;
// 				}
// 			})
			
// 			return {
// 				...get_audit_doc,
// 				draftUserId: get_approvals ? list.user_id : user.user_id,
// 				auditType: get_approvals ? '받은결재' : '보낸결재'
// 			};

// 			// console.log({listData: list.data})
// 			// if(!list.data.audit_id) return;
// 			// // console.log({list});
// 			// // 결재 서류 가져오기
// 			// const audit_doc = (await skapi.getRecords({ 
// 			// 	record_id: list.data.audit_id 
// 			// })).list[0];
// 			// // console.log({audit_doc});
	
// 			// // 다른 사람 결재 여부 확인
// 			// const approvals = (await skapi.getRecords({
// 			// 	table: {
// 			// 		name: 'audit_approval',
// 			// 		access_group: 'authorized'
// 			// 	},
// 			// 	reference: list.data.audit_id
// 			// })).list;
// 			// console.log({approvals});
	
// 			// // 결재자 목록에서 각 결재자 ID 가져오기
// 			// const auditors = audit_doc.tags.map(a => a.replaceAll('_', '-'));
	
// 			// auditors.forEach((auditor) => {
// 			// 	let oa_has_audited_str = null;
	
// 			// 	approvals.forEach((approval) => {
// 			// 		if (approval.user_id === user.user_id) {
// 			// 			oa_has_audited_str = approval.data.approved === 'approve' ? '결재함' : '반려함';
	
// 			// 			audit_doc.approved = oa_has_audited_str;
// 			// 			audit_doc.user_id = auditor;
						
// 			// 			return;
// 			// 		}
// 			// 	})
	
// 			// 	if (!oa_has_audited_str) {
// 			// 		audit_doc.approved = '대기중';
// 			// 		audit_doc.user_id = auditor;
// 			// 	}
// 			// })
			
// 			// return {
// 			// 	...audit_doc,
// 			// 	draftUserId: list.user_id
// 			// };
// 		}));
// 	} catch (err) {
// 		console.error({err});
// 	}

// 	console.log({auditDocs});

// 	try {
// 		const userList = await Promise.all(auditDocs.map(async (auditor) => await getUserInfo(auditor.draftUserId)))
// 		const userInfoList = userList.map(user => user.list[0]).filter((user) => user)
	
// 		const newAuditUserList = auditDocs.map((auditor) => ({
// 			...auditor,
// 			user_info: userInfoList.find((user) => user.user_id === auditor.draftUserId),
// 			audit_type: auditor.auditType
// 		})).sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));
	
// 		auditList.value = newAuditUserList;        

// 		console.log({auditList: auditList.value});
// 	} catch (err) {
// 		console.error({err});
// 	}
// }

// export async function getAuditList() {
// 	getReadList();

// 	let audits, auditDocs;
	
// 	try {
// 		// 내가 받은 결재 요청건 가져오기
// 		audits = await skapi.getRecords({
// 			table: {
// 				name: 'audit_request',
// 				access_group: 'authorized'
// 			},
// 			reference: `audit:${user.user_id}`
// 		}, {
// 			ascending: false,   // 최신순
// 		});
// 	} catch (err) {
// 		console.error({err});
// 	}

// 	// console.log({audits});

// 	try {
// 		auditDocs = await Promise.all(audits.list.map(async (list) => {
// 			if(!list.data.audit_id) return;
// 			// console.log({list});
// 			// 결재 서류 가져오기
// 			const audit_doc = (await skapi.getRecords({ 
// 				record_id: list.data.audit_id 
// 			})).list[0];
// 			// console.log({audit_doc});
	
// 			// 다른 사람 결재 여부 확인
// 			const approvals = (await skapi.getRecords({
// 				table: {
// 					name: 'audit_approval',
// 					access_group: 'authorized'
// 				},
// 				reference: list.data.audit_id
// 			})).list;
// 			// console.log({approvals});
	
// 			// 결재자 목록에서 각 결재자 ID 가져오기
// 			const auditors = audit_doc.tags.map(a => a.replaceAll('_', '-'));
	
// 			auditors.forEach((auditor) => {
// 				let oa_has_audited_str = null;
	
// 				approvals.forEach((approval) => {
// 					if (approval.user_id === user.user_id) {
// 						oa_has_audited_str = approval.data.approved === 'approve' ? '결재함' : '반려함';
	
// 						audit_doc.approved = oa_has_audited_str;
// 						audit_doc.user_id = auditor;
						
// 						return;
// 					}
// 				})
	
// 				if (!oa_has_audited_str) {
// 					audit_doc.approved = '대기중';
// 					audit_doc.user_id = auditor;
// 				}
// 			})
			
// 			return {
// 				...audit_doc,
// 				draftUserId: list.user_id
// 			};
// 		}));
// 	} catch (err) {
// 		console.error({err});
// 	}

// 	try {
// 		const userList = await Promise.all(auditDocs.map(async (auditor) => await getUserInfo(auditor.draftUserId)))
// 		const userInfoList = userList.map(user => user.list[0]).filter((user) => user)
	
// 		const newAuditUserList = auditDocs.map((auditor) => ({
// 			...auditor,
// 			user_info: userInfoList.find((user) => user.user_id === auditor.draftUserId),
// 			audit_type: '받은 결재'
// 		}))
	
// 		auditList.value = newAuditUserList;        

// 		console.log({auditList: auditList.value});
// 	} catch (err) {
// 		console.error({err});
// 	}
// }

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

// 	// 	console.log({sendAuditList: sendAuditList.value});
// 	// } catch (err) {
// 	// 	console.error({err});
// 	// }
// }

export const goToAuditDetail = (e, auditId, router) => {
    // if(e.target.classList.contains('label-checkbox')) return;
    router.push({ name: 'audit-detail', params: { auditId } });
};