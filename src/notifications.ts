import { get, request } from "http";
import { skapi } from "./main";
import { user } from "./user";
import { Reactive, reactive, type Ref, ref, watch } from "vue";

export const notifications:Reactive<{messages: {fromUserId:string; msg: any }[], audits: {fromUserId:string; msg: any }[]}> = reactive({
    audits: [],
    messages: []
});
export const unreadCount = ref(0);
export const realtimes = ref([]);
export const readList = ref([]);
export const readAudit: Ref<{
	noti_id: string; // 알람 ID
	noti_type: string; // 'audit' | 'message' | 'notice'
	send_date: number; // 결재 알람 보낸 시간
	send_user: string; // 결재 알람 보낸 사람
	audit_info?: {
		audit_type: string;
		to_audit: string;
		audit_doc_id: string;
		audit_request_id?: string;
		send_auditors?: [];
		approval?: string;
	}
}> = ref({
	noti_id: '',
	noti_type: '',
	send_date: 0, // 결재 알람 보낸 시간
	send_user: '',
});

export const auditList = ref([]);
export const sendAuditList = ref([]);

export const getUserInfo = async (userId: string): Promise<object> => {
    const params = {
        searchFor: 'user_id',
        value: userId
    }

    return await skapi.getUsers(params);
}

export let getRealtimeRunning: Promise<any> | null = null;
export let getReadListRunning: Promise<any> | null = null;

export const getRealtime = (refresh = false) => {
	if(getRealtimeRunning instanceof Promise) {	// 이미 실행중인 경우
		console.log('!!!!!실행중')
		return getRealtimeRunning;
	}
	
	if (Object.keys(realtimes.value).length && !refresh) {	// 기존 데이터가 있고 새로고침이 필요 없는 경우
		console.log('!!!!!데이터 있음')
		return realtimes.value;
	}

	getRealtimeRunning = (async () => {
		try {
			const realtime = await skapi.getRecords({
				table: {
					name: `realtime:${user.user_id.replaceAll('-', '_')}`,
					access_group: "authorized",
				},
			}, {
				ascending: false,
			});

			const realtime_list = await Promise.all(
				realtime.list.map(async (request) => {
					try {
						const senderInfo = await getUserInfo(request.data.send_user);

						console.log({ senderInfo });

						return {
							...request.data,
							send_name: senderInfo.list[0].name,
						};
					} catch (err) {
						console.error({ err });
					}
				})
			);

			realtimes.value = realtime_list;
			// realtimes.value = [...realtimes.value].sort((a, b) => b.send_date - a.send_date); // 최신 날짜 순

			console.log('!!!!!realtimes', realtimes.value);
			return realtimes.value;
		} catch (err) {
			console.error("Error fetching realtime data:", err);
			throw err;
		} finally {
			// 실행 완료 후 getRealtimeRunning 초기화
			getRealtimeRunning = null;
		}
	})();

	return getRealtimeRunning;
};

export const createReadListRecord = (read = false) => {
	let updateData = readList.value || [];

	if(read && !updateData.includes(readAudit.value.noti_id)) {
		updateData.push(readAudit.value.noti_id);	// 읽지 않은 알람일 경우 추가
		unreadCount.value = realtimes.value.filter((audit) => !updateData.includes(audit.noti_id)).length;
	}

	return skapi.postRecord(
		{
			list: JSON.stringify(updateData)
		},
		{
			unique_id: '[notification_read_list]' + user.user_id,
			table: {
				name: 'notification_read_list',
				access_group: 'private'
			}
		}
	)
}

export const getReadList = async() => {
	if(getReadListRunning instanceof Promise) { // 이미 실행중인 경우
		await getReadListRunning;
		return readList.value;
	}

	if (readList.value && Object.keys(readList.value).length) { // 받아온적 있거나, 데이터가 없는경우
		return readList.value; // 이미 데이터가 존재하면 불러오지 않음
	}
	
	getReadListRunning = skapi.getRecords({
		unique_id: '[notification_read_list]' + user.user_id
	}).catch(async(err) => {
		if(err.code === 'NOT_EXISTS') {
			readList.value = [];
			await createReadListRecord();
		}
	}).finally(() => {
		getReadListRunning = null;
	})

	let res = await getReadListRunning;

	// 레코드가 없으면 빈 배열 생성
	if (!res.list.length) {
		await createReadListRecord(); // 초기 빈 레코드 생성
	}

	if (res.list.length && res.list[0].data && res.list[0].data.list) {
		readList.value = JSON.parse(res.list[0].data.list);
	} 
	// else {
	// 	// 레코드가 없으면 빈 배열 생성
	// 	readList.value = [];
	// 	await createReadListRecord(); // 초기 빈 레코드 생성
	// }

	console.log('readList', readList.value);

	return readList.value;
}

export async function getAuditList() {
	let audits, auditDocs;

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

	console.log({audits});

	try {
		auditDocs = await Promise.all(audits.list.map(async (list) => {
			if(!list.data.audit_id) return;
			console.log({list});
			// 결재 서류 가져오기
			const audit_doc = (await skapi.getRecords({ 
				record_id: list.data.audit_id 
			})).list[0];
			console.log({audit_doc});
	
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
			user_info: userInfoList.find((user) => user.user_id === auditor.draftUserId)
		}))
	
		auditList.value = newAuditUserList;        

		console.log({auditList: auditList.value});
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

export const goToAuditDetail = (e, auditId, router) => {
    // if(e.target.classList.contains('label-checkbox')) return;
    router.push({ name: 'audit-detail', params: { auditId } });
};

watch(user, async(u) => { // 로딩되고 로그인되면 무조건 실행
	if (u && Object.keys(u).length) {
		await Promise.all([
			getRealtime(),
			getReadList()
		])
	}
}, { immediate: true });

watch([realtimes, readList], () => {
	unreadCount.value = realtimes.value.filter((audit) => !readList.value.includes(audit.noti_id)).length;
}, { immediate: true, deep: true });