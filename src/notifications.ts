import { Reactive, reactive, type Ref, ref, watch } from "vue";
import { skapi } from "@/main";
import { user } from "@/user";
import { getUserInfo } from "@/employee";
import { fetchGmailEmails } from "@/utils/mail";

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
		return getRealtimeRunning;
	}
	
	if (Object.keys(realtimes.value).length && !refresh) {	// 기존 데이터가 있고 새로고침이 필요 없는 경우
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
                        console.log({senderInfo});

						return {
							...request.data,
							send_name: senderInfo.list[0]?.name,
						};
					} catch (err) {
						console.error({ err });
					}
				})
			);

			realtimes.value = realtime_list;

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

// export const readList = ref([]);
export const readList: Ref<{ [key:string]: {} }> = ref({});
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
			// readList.value = [];
			readList.value = {};
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

	return readList.value;
}
export const createReadListRecord = (read = false) => {
	// let updateData = readList.value || [];
	let updateData: { [key:string]: {} } = readList.value || {};

	// if(read && !updateData.includes(readAudit.value.noti_id)) {
	// 	updateData.push(readAudit.value.noti_id);	// 읽지 않은 알람일 경우 추가
	// 	unreadCount.value = realtimes.value.filter((audit) => !updateData.includes(audit.noti_id)).length;
	// }

	if(read && !Object.keys(updateData).includes(readAudit.value.noti_id)) {
		// updateData.push(readAudit.value.noti_id);	// 읽지 않은 알람일 경우 추가
		updateData[readAudit.value.noti_id] = readAudit.value;
		unreadCount.value = realtimes.value.filter((audit) => !Object.keys(updateData).includes(audit.noti_id)).length;
	}

	function removeOldReadList(data: {}) {
		const currentDate = new Date(); // 현재 날짜 가져오기
		const fourteenDaysAgo = currentDate.setDate(currentDate.getDate() - 14); // 14일 전 날짜 계산

		// 새로운 객체 생성 (원본 데이터 수정 방지)
		const filteredData = { ...updateData };

		// 객체를 순회하며 timestamp가 14일 지난 항목 제거
		Object.keys(filteredData).forEach(key => {
			const item = filteredData[key];
			if (item.timestamp) {
				const itemDate = new Date(item.timestamp);
				if (itemDate < fourteenDaysAgo) {
					delete filteredData[key]; // 14일 지난 항목 삭제
				}
			}
		});

		return filteredData;
	}

	// 오래된 알람 데이터 삭제
	updateData = removeOldReadList(updateData);

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
export const readNoti = async(rt) => {
	// 기존 readAudit 초기화
	for (let key in readAudit.value) {
		delete readAudit.value[key];
	}

	// 현재 읽은 알람 저장
	for (let key in rt) {
		readAudit.value[key] = rt[key];
	}

	// 읽은 알람 리스트를 업데이트
	updateReadList(rt.audit_info.audit_type);
}
async function updateReadList (type: string) {
	let id;

	if(type === 'email') {
		id = readAudit.value.id;
	} else {
		id = readAudit.value.audit_info.audit_doc_id;
	}

	if (!Object.keys(readList.value).includes(id)) {
		await skapi.deleteRecords({
			unique_id: '[notification_read_list]' + user.user_id
		});
		createReadListRecord(true); // 새로 읽은 알람 추가
	}
}

export const mailList = ref([]);
export let googleEmailUpdate = ref(false);

// 이메일 업데이트
export async function updateEmails() {
	const accessToken = sessionStorage.getItem('accessToken');
	
	if (accessToken) {
		try {
			googleEmailUpdate.value = true;
			const res = await fetchGmailEmails(accessToken);
			// console.log('=== updateEmails === res : ', res);
			mailList.value = res;
			googleEmailUpdate.value = false;

			// // console.log('=== updateEmails === res : ', res);
		} catch (error) {
			googleEmailUpdate.value = false;
			console.error('=== updateEmails === error : ', {error});
		}
	}
}
// 이메일 알림
export const addEmailNotification = (emailData) => {
	// // console.log('=== addEmailNotification === emailData : ', emailData);
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

	// console.log('Updated realtimes:', realtimes.value);

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

export const newsletterList = ref([]);
export let getNewsletterListRunning: Promise<any> | null = null;

export const getNewsletterList = async(refresh = false) => {
	if(getNewsletterListRunning instanceof Promise) {	// 이미 실행중인 경우
		await getNewsletterListRunning;
		return newsletterList.value;
	}
	
	if (newsletterList.value && newsletterList.value.length && !refresh) {	// 기존 데이터가 있는 경우
		return newsletterList.value;
	}

	getNewsletterListRunning = skapi.getNewsletters().catch(err => 
		console.log(err)
	).finally(() => {
		getNewsletterListRunning = null;
	});

	let res = await getNewsletterListRunning;

	if (res && res.list) {
		newsletterList.value = res.list;
		console.log('newsletterList.value : ', newsletterList.value);
	}

	return newsletterList.value;
}

export async function subscribeNotification() {
	const vapidResponse = await skapi.vapidPublicKey();
	const vapid = vapidResponse.VAPIDPublicKey;

	function urlBase64ToUint8Array(base64String) {
		const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding)
			.replace(/\-/g, "+")
			.replace(/_/g, "/");
		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);
		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	if (!("serviceWorker" in navigator)) {
		console.error("Service workers are not supported in this browser.");
		return;
	} else {
		navigator.serviceWorker.getRegistrations().then(registrations => {
			registrations.forEach(registration => {
				console.log('Service Worker Script URL:', registration.active?.scriptURL);
			});
		});
	}

	const permission = await Notification.requestPermission();
	console.log({ permission });
	if (permission !== "granted") {
		console.error("Permission not granted for notifications");
		return;
	}

	const registration = await navigator.serviceWorker.register("/sw.js");
	await navigator.serviceWorker.ready;

	const subscription = await registration.pushManager
		.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(vapid),
		})
		.then((sub) => sub.toJSON()); // Convert to plain object

	console.log("Subscription object:", subscription); // Debugging
	window.localStorage.setItem("skapi_subscription_obj", JSON.stringify(subscription));

	const response = await skapi.subscribeNotification(subscription.endpoint, subscription.keys);
	console.log({response})
	return response;
}

export async function unsubscribeNotification() {
	const registration = await navigator.serviceWorker.ready;
	const subscription = await registration.pushManager.getSubscription();
	
	if (!subscription) {
		console.error("No subscription found");
		return;
	}

	// Convert to JSON
	const subscriptionJSON = subscription.toJSON();

	await subscription.unsubscribe();

	const response = await skapi.unsubscribeNotification(subscription.endpoint, subscriptionJSON.keys);
}
 
export function pushNotification(content: { title: string; body: string }, userId: string | string[]) {
	skapi.pushNotification(content, userId).then((res) => {console.log(res)});											
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
	console.log('=== watch === realtimes.value : ', realtimes.value);
    // 기존 알림 개수
    const auditCount = realtimes.value.filter((audit) => !Object.keys(readList.value).includes(audit.noti_id)).length;
    // const auditCount = realtimes.value.filter((audit) => !Object.keys(readList.value).includes(audit.noti_id));

	// 만약 realtimes.value 중 읽은 알람이 audit_type: canceled 인 경우, 같은 레코드의 audit_type: "request"도 읽은 것으로 처리
    
    // 읽지 않은 이메일 개수
    const emailCount = notifications.emails.length;
    
    // 전체 읽지 않은 알림 개수
    unreadCount.value = auditCount + emailCount;

	console.log('=== watch === auditCount : ', auditCount);
}, { immediate: true, deep: true });

// 컴포넌트 마운트 시 이메일 업데이트 되는 거에 따른 mails.value 변경 감지
watch(mailList, (newVal, oldVal) => {
	// console.log('=== watch === newVal : ', newVal);
	// console.log('=== watch === oldVal : ', oldVal);
	// console.log('========== 확인 !! ==========')
	// console.log(!oldVal);

	if(!newVal) {
		return;
	}

	if((newVal.length && !oldVal) || (newVal.length > oldVal.length)) {
		// // console.log('=== watch === new email');
		// console.log('dddd')
		for(let i in newVal) {
			addEmailNotification(newVal[i]);
		}
	} else {
		// console.log('wwww');
	}

	// if(newVal[0].dateTimeStamp > oldVal[0].dateTimeStamp) {
	//     // console.log('=== watch === new email');
	//     // addEmailNotification(newVal[0]);
	// 	for(let i in newVal) {
	// 		addEmailNotification(newVal[i]);
	// 	}
	// } else {
	//     // console.log('=== watch === no new email');
	// }
});