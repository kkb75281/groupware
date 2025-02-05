import { Reactive, reactive, type Ref, ref, watch } from "vue";
import { skapi } from "@/main";
import { user } from "@/user";
import { getUserInfo } from "@/employee";

export const notifications:Reactive<{messages: {fromUserId:string; msg: any }[], audits: {fromUserId:string; msg: any }[]}> = reactive({
    audits: [],
    messages: [],
	emails: [],
});

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

export const realtimes = ref([]);
export let getRealtimeRunning: Promise<any> | null = null;

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

export const readList = ref([]);
export const unreadCount = ref(0);
export let getReadListRunning: Promise<any> | null = null;

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
		readList.value = res.list[0].data.list;
	} 
	// else {
	// 	// 레코드가 없으면 빈 배열 생성
	// 	readList.value = [];
	// 	await createReadListRecord(); // 초기 빈 레코드 생성
	// }

	console.log('readList', readList.value);

	return readList.value;
}
export const createReadListRecord = (read = false) => {
	let updateData = readList.value || [];
	console.log('1updateData', updateData);

	if(read && !updateData.includes(readAudit.value.noti_id)) {
		updateData.push(readAudit.value.noti_id);	// 읽지 않은 알람일 경우 추가
		console.log('2updateData', updateData);
		console.log(readAudit.value.noti_id)
		unreadCount.value = realtimes.value.filter((audit) => !updateData.includes(audit.noti_id)).length;
	}

	return skapi.postRecord(
		{
			list: updateData
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

export const mailList = ref([]);
// 이메일 알림
export const addEmailNotification = (emailData) => {
	// console.log('=== addEmailNotification === emailData : ', emailData);
	let checkOrigin = realtimes.value.find((audit) => audit.id === emailData.id);

	if(checkOrigin) return;

	// const addEmailData = {
	// 	...emailData,
	// 	noti_id: emailData.id,
	// 	send_date: emailData.dateTimeStamp,
	// 	audit_info: {
	// 		audit_type: 'email',
	// 	}
	// };

	realtimes.value.push(emailData);
	realtimes.value = [...realtimes.value].sort((a, b) => b.send_date - a.send_date); // 최신 날짜 순

	console.log('Updated realtimes:', realtimes.value);

    // notifications.emails.unshift({
    //     type: 'email',
    //     title: emailData.subject,
    //     from: emailData.from,
    //     date: emailData.date,
    //     dateTimeStamp: emailData.dateTimeStamp,
    //     link: emailData.link
    // });

    unreadCount.value++;

	// return notifications.emails;
}

watch(user, async(u) => { // 로딩되고 로그인되면 무조건 실행
	if (u && Object.keys(u).length) {
		await Promise.all([
			getRealtime(),
			getReadList()
		])
	}
}, { immediate: true });

// watch([realtimes, readList], () => {
// 	unreadCount.value = realtimes.value.filter((audit) => !readList.value.includes(audit.noti_id)).length;
// }, { immediate: true, deep: true });

watch([realtimes, readList, notifications.emails], () => {
    // 기존 알림 개수
    const auditCount = realtimes.value.filter((audit) => !readList.value.includes(audit.noti_id)).length;
    
    // 읽지 않은 이메일 개수
    const emailCount = notifications.emails.length;
    
    // 전체 읽지 않은 알림 개수
    unreadCount.value = auditCount + emailCount;
}, { immediate: true, deep: true });

// 컴포넌트 마운트 시 이메일 업데이트 되는 거에 따른 mails.value 변경 감지
watch(mailList, (newVal, oldVal) => {
	console.log('=== watch === newVal : ', newVal);
	console.log('=== watch === oldVal : ', oldVal);
	console.log('========== 확인 !! ==========')
	console.log(!oldVal);

	if(!newVal) {
		return;
	}

	if((newVal.length && !oldVal) || (newVal.length > oldVal.length)) {
		// console.log('=== watch === new email');
		console.log('dddd')
		for(let i in newVal) {
			addEmailNotification(newVal[i]);
		}
	} else {
		console.log('wwww');
	}

	// if(newVal[0].dateTimeStamp > oldVal[0].dateTimeStamp) {
	//     console.log('=== watch === new email');
	//     // addEmailNotification(newVal[0]);
	// 	for(let i in newVal) {
	// 		addEmailNotification(newVal[i]);
	// 	}
	// } else {
	//     console.log('=== watch === no new email');
	// }
});