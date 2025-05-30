import { type Reactive, reactive, type Ref, ref, watch } from 'vue';
import { skapi } from '@/main.ts';
import { user } from '@/user.ts';
import { getUserInfo } from '@/employee.ts';
import { fetchGmailEmails } from '@/utils/mail.ts';

export const notifications: Reactive<{
    messages: { fromUserId: string; msg: any }[];
    audits: { fromUserId: string; msg: any }[];
}> = reactive({
    audits: [],
    messages: [],
    emails: []
});

export let serviceWorkerRegistMsg = ref('');
export let notificationNotWorkingMsg = ref('');
export let onlyUserGesture = ref(false);

export async function setNotificationPermission() {
    await Notification.requestPermission().then((permission) => {
        console.log('setNotificationPermission ==== Notification permission:', permission);
        onlyUserGesture.value = false;
        return permission;
    });
    //   return checkNotificationPermission();
}

function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function isIOS() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
}

export async function checkNotificationPermission() {
    onlyUserGesture.value = false;
    notificationNotWorkingMsg.value = '';

    // Notification API를 지원하지 않는 경우
    if (typeof window === 'undefined' || !('Notification' in window)) {
        notificationNotWorkingMsg.value = '현재 환경은 알림 기능을 지원하지 않습니다.';
        onlyUserGesture.value = false; // 알림을 지원하지 않으므로 사용자 인터랙션 불필요
        return 'unsupported'; // 또는 null, undefined 등 적절한 값을 반환
    }

    if (isIOS() || isSafari()) {
        console.log('현재 기기는 iOS 이거나 Safari 입니다.');
        onlyUserGesture.value = true;
    }

    if (Notification.permission === 'granted') {
        console.log('알림이 허용되어 있습니다.');
        onlyUserGesture.value = false;
    } else if (Notification.permission === 'denied') {
        console.log('알림이 차단되어 있습니다.');
        onlyUserGesture.value = false;
    } else if (Notification.permission === 'default') {
        console.log('알림 권한이 아직 설정되지 않았습니다.');

        if (!isSafari()) {
            try {
                await setNotificationPermission(); // 권한 요청
            } catch (error) {
                console.error('알림 권한 요청 중 오류가 발생했습니다:', error);
            }
        }
    }

    return Notification.permission;
}

export const readAudit: Ref<
    {
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
        };
        news_info?: {
            news_title: string;
            news_id: string;
            news_refer: string;
            news_noti_id?: string;
            send_newsUser?: [];
        };
    } & Record<string, any>
> = ref({
    noti_id: '',
    noti_type: '',
    send_date: 0, // 결재 알람 보낸 시간
    send_user: ''
});

export const realtimes = ref([]);
export let getRealtimeRunning: Promise<any> | null = null;

export const getRealtime = (refresh = false) => {
    if (getRealtimeRunning instanceof Promise) {
        // 이미 실행중인 경우
        return getRealtimeRunning;
    }

    if (Object.keys(realtimes.value).length && !refresh) {
        // 기존 데이터가 있고 새로고침이 필요 없는 경우
        return realtimes.value;
    }

    getRealtimeRunning = (async () => {
        try {
            const realtime = await skapi.getRecords(
                {
                    table: {
                        name: `realtime:${user.user_id.replaceAll('-', '_')}`,
                        access_group: 'authorized'
                    }
                },
                {
                    ascending: false
                }
            );

            const realtime_list = await Promise.all(
                realtime.list.map(async (request) => {
                    // console.log({request});
                    try {
                        const senderInfo = await getUserInfo(request?.data?.send_user);
                        // console.log({senderInfo});

                        return {
                            ...request?.data,
                            send_name: senderInfo.list[0]?.name
                        };
                    } catch (err) {
                        console.error({ err });
                    }
                })
            );

            realtimes.value = realtime_list;

            return realtimes.value;
        } catch (err) {
            console.error('Error fetching realtime data:', err);
            throw err;
        } finally {
            // 실행 완료 후 getRealtimeRunning 초기화
            getRealtimeRunning = null;
        }
    })();

    return getRealtimeRunning;
};

// export const readList = ref([]);
export const readList: Ref<{ [key: string]: {} }> = ref({});
export const unreadCount = ref(0);
export let getReadListRunning: Promise<any> | null = null;

export const getReadList = async () => {
    if (getReadListRunning instanceof Promise) {
        // 이미 실행중인 경우
        await getReadListRunning;
        return readList.value;
    }

    if (readList.value && Object.keys(readList.value).length) {
        // 받아온적 있거나, 데이터가 없는경우
        return readList.value; // 이미 데이터가 존재하면 불러오지 않음
    }

    getReadListRunning = skapi
        .getRecords({
            unique_id: '[notification_read_list]' + user.user_id
        })
        .catch(async (err) => {
            if (err.code === 'NOT_EXISTS') {
                // readList.value = [];
                readList.value = {};
                await createReadListRecord();
            }
        })
        .finally(() => {
            getReadListRunning = null;
        });

    let res = await getReadListRunning;

    // 레코드가 없으면 빈 배열 생성
    if (!res.list.length) {
        await createReadListRecord(); // 초기 빈 레코드 생성
    }

    if (res.list.length && res.list[0].data && res.list[0].data.list) {
        readList.value = res.list[0].data.list;
    }

    return readList.value;
};
export const createReadListRecord = (read = false) => {
    // let updateData = readList.value || [];
    let updateData: { [key: string]: {} } = readList.value || {};

    // if(read && !updateData.includes(readAudit.value.noti_id)) {
    // 	updateData.push(readAudit.value.noti_id);	// 읽지 않은 알람일 경우 추가
    // 	unreadCount.value = realtimes.value.filter((audit) => !updateData.includes(audit.noti_id)).length;
    // }

    if (read && !Object.keys(updateData).includes(readAudit.value.noti_id)) {
        // updateData.push(readAudit.value.noti_id);	// 읽지 않은 알람일 경우 추가
        updateData[readAudit.value.noti_id] = readAudit.value;
        unreadCount.value = realtimes.value.filter(
            (audit) => !Object.keys(updateData).includes(audit.noti_id)
        ).length;
    }

    function removeOldReadList(data: {}) {
        const currentDate = new Date(); // 현재 날짜 가져오기
        const fourteenDaysAgo = currentDate.setDate(currentDate.getDate() - 14); // 14일 전 날짜 계산

        // 새로운 객체 생성 (원본 데이터 수정 방지)
        const filteredData = { ...updateData };

        // 객체를 순회하며 timestamp가 14일 지난 항목 제거
        Object.keys(filteredData).forEach((key) => {
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
    );
};
export const readNoti = async (rt: any) => {
    // 기존 readAudit 초기화
    for (let key in readAudit.value) {
        delete readAudit.value[key];
    }

    // 현재 읽은 알람 저장
    for (let key in rt) {
        readAudit.value[key] = rt[key];
    }

    const auditType =
        rt.audit_info?.audit_type ||
        rt.comment_notification?.audit_type ||
        rt.reply_notification?.audit_type ||
        '';

    // 읽은 알람 리스트를 업데이트
    // updateReadList(rt.audit_info.audit_type);
    updateReadList(auditType);
};

async function updateReadList(type: string) {
    let id;

    if (type === 'email') {
        id = readAudit.value.id;
    } else if (type === 'news') {
        id = readAudit.value.news_info.news_id;
    } else if (type === 'comment' || type === 'reply') {
        id = readAudit.value.noti_id;
    } else {
        id = readAudit.value.noti_id;
    }

    if (!Object.keys(readList.value).includes(id)) {
        await skapi.deleteRecords({
            unique_id: '[notification_read_list]' + user.user_id
        });
        createReadListRecord(true); // 새로 읽은 알람 추가
    }
}

export const mailList = ref([]);
export let unreadEmailNotiMsg = ref(false);
export let googleEmailUpdate = ref(false);
export let mailRefresh = ref(false);

// 이메일 업데이트
export async function updateEmails(refresh = false) {
    const accessToken = localStorage.getItem('accessToken');

    if (refresh) {
        mailRefresh.value = true;
    }

    if (accessToken) {
        try {
            googleEmailUpdate.value = true;

            const res = await fetchGmailEmails(accessToken);
            mailList.value = res;

            // 현재 시간과 일주일 전 시간 계산
            const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

            // 일주일 이내에 온 이메일만 필터링
            const recentEmails = mailList.value.filter((email) => {
                // email.dateTimeStamp가 일주일 이내인지 확인
                return email.dateTimeStamp > oneWeekAgo;
            });

            if (recentEmails.length > 0) {
                unreadEmailNotiMsg.value = true;
            } else {
                unreadEmailNotiMsg.value = false;
            }
            googleEmailUpdate.value = false;
        } catch (error) {
            googleEmailUpdate.value = false;
            console.error('=== updateEmails === error : ', { error });
        }
    }
}

// 이메일 알림
export const addEmailNotification = (emailData: any) => {
    let checkOrigin = realtimes.value.find((audit) => audit.id === emailData.id);

    if (checkOrigin) return;

    // // "읽지 않은 메일이 있습니다" 알림이 이미 있는지 확인
    // let unreadEmailNotification = realtimes.value.find((audit) => audit.audit_info?.audit_type === 'email' && audit.subject === '읽지 않은 메일이 있습니다');

    // if (unreadEmailNotification) return;

    const addEmailData = {
        ...emailData,
        noti_id: emailData.id,
        send_date: emailData.dateTimeStamp,
        audit_info: {
            audit_type: 'email'
        },
        subject: '읽지 않은 메일이 있습니다', // 안내 문구로 대체
        from: '' // 발신자 정보 제거
    };

    realtimes.value.push(addEmailData);
    realtimes.value = [...realtimes.value].sort((a, b) => b.send_date - a.send_date); // 최신 날짜 순

    unreadCount.value++;
};

export const newsletterList = ref([]);
export let getNewsletterListRunning: Promise<any> | null = null;

// 카테고리 해당 게시글 리스트
export const getNewsletterList = async (tag, fetchOptions = {}) => {
    const query = {
        table: {
            name: 'newsletter',
            access_group: 99
        },
        reference: tag
    };

    const options = {
        ascending: false,
        limit: 10,
        ...fetchOptions
    };

    const getNews = await skapi.getRecords(query, options);

    const writer = await Promise.all(newsletterList.value.map((item) => getUserInfo(item.user_id)));
    newsletterList.value = getNews.list.map((item, index) => {
        return {
            ...item,
            writer: writer[index]?.list?.[0]?.name || '-'
        };
    });

    return {
        list: newsletterList.value,
        endOfList: getNews.endOfList
    };
};

export async function subscribeNotification() {
    let vapid = localStorage.getItem(skapi.service + '-vapid');

    if (!vapid) {
        const vapidResponse = await skapi.vapidPublicKey();
        vapid = vapidResponse.VAPIDPublicKey;
        localStorage.setItem(skapi.service + '-vapid', vapid);
    }

    function urlBase64ToUint8Array(base64String: any) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    if (!('serviceWorker' in navigator)) {
        console.error('Service workers are not supported in this browser.');
        serviceWorkerRegistMsg.value = '배너, 배지 기능을 지원하지 않는 브라우저입니다.';
        return;
    } else {
        serviceWorkerRegistMsg.value = '';
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((registration) => {
                console.log('Service Worker Script URL:', registration.active?.scriptURL);
            });
        });
    }

    const permission = await checkNotificationPermission();

    if (permission !== 'granted') {
        console.error('Permission not granted for notifications');
        onlyUserGesture.value = false;
        return;
    } else {
        let hasSub = window.localStorage.getItem(`${import.meta.env.VITE_SERVICE_ID}.loggedInUser`);

        if (hasSub === user?.user_id) {
            console.error('Already subscribed');
            return;
        }
    }

    let serviceID = import.meta.env.VITE_SERVICE_ID;

    const registration = await navigator.serviceWorker.register(`/wrk.${serviceID}.js`);
    await navigator.serviceWorker.ready;

    let subscription;

    try {
        subscription = await registration.pushManager
            .subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapid)
            })
            .then((sub) => sub.toJSON()); // Convert to plain object

        console.log('Subscription object:', subscription); // Debugging
    } catch (err) {
        // console.error("Error subscribing:", err);
        await unsubscribeNotification();
        return subscribeNotification();
    }

    // window.localStorage.setItem("skapi_subscription_obj", JSON.stringify(subscription));
    const response = await skapi.subscribeNotification(subscription.endpoint, subscription.keys);

    let user_local_data = {
        user_id: user.user_id,
        subscribeNotification: false
    };

    if (response && response.includes('SUCCESS')) {
        user_local_data.subscribeNotification = true;
    }

    // localStorage에 subscribeNotification 저장
    window.localStorage.setItem(`${import.meta.env.VITE_SERVICE_ID}.loggedInUser`, user.user_id);
    return response;
}

export async function unsubscribeNotification() {
    // 서비스 워커 지원 여부 확인
    if (!('serviceWorker' in navigator)) {
        console.log('Service workers are not supported in this browser');
        window.localStorage.removeItem(`${import.meta.env.VITE_SERVICE_ID}.loggedInUser`);
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
        window.localStorage.removeItem(`${import.meta.env.VITE_SERVICE_ID}.loggedInUser`);
        console.error('No subscription found');
        return;
    }

    // Convert to JSON
    const subscriptionJSON = subscription.toJSON();

    await subscription.unsubscribe();

    const response = await skapi.unsubscribeNotification(
        subscription.endpoint,
        subscriptionJSON.keys
    );

    let user_local_data = {
        user_id: user.user_id,
        subscribeNotification: true
    };

    if (response && response.includes('SUCCESS')) {
        user_local_data.subscribeNotification = false;
    }

    // localStorage에 unsubscribeNotification 저장
    window.localStorage.removeItem(`${import.meta.env.VITE_SERVICE_ID}.loggedInUser`);
}

export function pushNotification(
    content: { title: string; body: string },
    userId: string | string[]
) {
    skapi.pushNotification(content, userId).then((res) => {
        console.log(res);
    });
}

watch(
    user,
    async (u) => {
        // 로딩되고 로그인되면 무조건 실행
        if (u && Object.keys(u).length) {
            const res = await Promise.all([getRealtime(), getReadList()]);

            // console.log('=== watch user === res : ', res);

            return res;
        }
    },
    { immediate: true }
);

watch(
    [realtimes, readList, unreadEmailNotiMsg],
    () => {
        // 기존 알림 개수
        const auditCount = realtimes.value.filter(
            (audit) => !Object.keys(readList.value).includes(audit.noti_id)
        ).length;

        // 읽지 않은 이메일 개수
        // const emailCount = notifications.emails.length;
        const emailCount = unreadEmailNotiMsg.value ? 1 : 0;

        // 이메일 업데이트
        if (emailCount < 1 && googleEmailUpdate.value === false) {
            updateEmails(true);
        }

        // 전체 읽지 않은 알림 개수
        unreadCount.value = auditCount + emailCount;
    },
    { immediate: true, deep: true }
);

// 컴포넌트 마운트 시 이메일 업데이트 되는 거에 따른 mails.value 변경 감지
// watch(mailList, (newVal, oldVal) => {
// 	console.log('=== mailList === newVal : ', newVal);
// 	console.log('=== mailList === oldVal : ', oldVal);

// 	if (!newVal) {
// 		return;
// 	}

// 	if ((newVal.length && !oldVal) || (newVal.length > oldVal.length) || mailRefresh.value) {
// 		console.log('이메일 읽어 알람 추가');
// 		unreadEmailNotiMsg.value = true;
// 		// // "읽지 않은 메일이 있습니다" 알림이 이미 있는지 확인
// 		// let unreadEmailNotification = realtimes.value.find((audit) => audit.audit_info?.audit_type === 'email' && audit.subject === '읽지 않은 메일이 있습니다');

// 		// if (!unreadEmailNotification) {
// 		// 	addEmailNotification(newVal[0]);
// 		// }

// 		// for (let i in newVal) {
// 		// 	addEmailNotification(newVal[i]);
// 		// }

// 		mailRefresh.value = false;
// 	} else {
// 		unreadEmailNotiMsg.value = false;
// 	}
// });

// 알림 데이터 구조 공통화
// export function createNotiData(
//   noti_id: string,
//   noti_type: string,
//   send_date: number,
//   send_user: string,
//   additionalInfo: Record<string, any> = {}
// ) {
//   return {
//     noti_id,
//     noti_type,
//     send_date,
//     send_user,
//     ...additionalInfo
//   };
// }

// {
//     noti_id: '', // audit(결재요청record_id), notice(news_id)
//     noti_type: '', // audit, notice, comment
//     send_date: new Date().getTime(),
//     send_user: '',
//     content: '', // 타이틀이나 내용이나 알람에 떠야하는 내용
//     etc: { // 추가 정보
//         news_refer?: '',
//         audit_type?: '결재요청인지 결재여부인지',
//         audit_doc_id?: '결재문서 record_id',
// }
