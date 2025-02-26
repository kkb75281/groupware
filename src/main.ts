import './assets/less/main.less';

import { createApp, nextTick, ref, watch } from 'vue';
import { Skapi } from 'skapi-js';
import { user, profileImage } from './user';
import { fetchGmailEmails } from "@/utils/mail";
import App from './App.vue';
import router from './router';
import { realtimes, unreadCount, readList, getRealtime, subscribeNotification } from './notifications';
import { getUserInfo, employeeDict, getEmpDivisionPosition } from './employee';
import { getAuditList, getSendAuditList } from './audit';

const app = createApp(App);

export let iwaslogged = ref(false);
export let loaded = ref(false);
export let mainPageLoading = ref(false);
export let realtimeTestingMsg = ref('');
let isConnected = ref(false);
let isTabVisible = ref(document.visibilityState === 'visible'); // 현재 탭을 보고 있는지 여부
export let currentBadgeCount = ref(0); // 현재 뱃지 값을 저장할 변수
let connectRunning:Promise<any> | null = null;

// watch(isConnected, (nv, ov) => {
// 	if(nv !== ov && nv === false) {
// 		if(!isConnected.value && connectRunning === null) {
// 			console.log('다시 연결합니다. isConnected Watcher');
// 			connectRunning = skapi.connectRealtime(RealtimeCallback).finally(()=>{
// 				connectRunning = null
// 				console.log({isConnected: isConnected.value});
// 			});
// 		}
// 	}
// }, { immediate: true });

// watch(isTabVisible, (nv) => {
// 	if (nv) {
// 		currentBadgeCount.value = 0;
// 		navigator.setAppBadge(0).catch((error) => {
// 			console.error('Failed to set app badge:', error);
// 		});
// 	}
// }, { immediate: true });

// function getChanges(before:any, after:any) {
//   const beforeKeys = new Set(Object.keys(before));
//   const afterKeys = new Set(Object.keys(after));

//   const addedKeys = [...afterKeys].filter((key) => !beforeKeys.has(key));
//   const removedKeys = [...beforeKeys].filter((key) => !afterKeys.has(key));
//   const modifiedKeys = [...afterKeys].filter((key) => beforeKeys.has(key) && before[key] !== after[key]);

//   return { added: addedKeys, removed: removedKeys, modified: modifiedKeys };
// }

// 가시성 상태 감지
function setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('탭이 활성화되었습니다.');
            isTabVisible.value = true;

			// 뱃지 초기화
			if ('clearAppBadge' in navigator) {
				navigator.clearAppBadge().then(() => {
					currentBadgeCount.value = 0;
					console.log('뱃지 초기화 완료');
				}).catch((error) => {
					console.error('Failed to clear app badge:', error);
				});
			}

			console.log('탭 활성화 여부 함수 isConnected.value', isConnected.value);
			if(!isConnected.value && connectRunning === null) {
				console.log('다시 연결합니다.');
				connectRunning = skapi.connectRealtime(RealtimeCallback).finally(()=>{
					connectRunning = null
					console.log({isConnected: isConnected.value});
				});
			}
        } else {
            console.log('탭이 비활성화되었습니다.');
            isTabVisible.value = false;
        }
    });
}
setupVisibilityListener();

function showNotification(message) {
	console.log('showNotification')
	// 알림 권한 확인
	if (Notification.permission !== 'granted') {
		Notification.requestPermission().then(permission => {
			if (permission === 'granted') {
			handleNotification(message);
			} else {
			console.log('알림 권한이 거부되었습니다.');
			}
		});
		return;
	}

	// 알림 처리
	handleNotification(message);
}

function handleNotification(message) {
	console.log('handleNotification');
	console.log({message})
	if (isTabVisible.value) {
		// 포그라운드 상태: 즉각적인 알림 표시
		new Notification('새로운 메시지', {
			body: message,
			icon: '/favicon-icon.png'
		});
		console.log('포그라운드 알림이 표시되었습니다.');
	} else {
		// 백그라운드 상태: Service Worker를 통한 알림 표시
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.ready.then(registration => {
			registration.showNotification('서비스 워커 알림', {
				body: message,
				icon: '/favicon-icon.png',
				// badge: '/badge-icon.png'
			});
			console.log('백그라운드 알림이 표시되었습니다.');
			}).catch(error => {
			console.error('Service Worker 준비 실패:', error);
			});
		} else {
			console.error('Service Worker를 지원하지 않는 브라우저입니다.');
		}
	}
}

async function handleNotificationClick() {
	console.log('알림 클릭 감지됨');
	console.log('getRealtime 실행');
	await getRealtime(true);
	console.log('getRealtime 완료');

	// // 뱃지 초기화
	// if ('clearAppBadge' in navigator) {
	// 	navigator.clearAppBadge().then(() => {
	// 		currentBadgeCount.value = 0;
	// 		console.log('뱃지 초기화 완료');
	// 	}).catch((error) => {
	// 		console.error('Failed to clear app badge:', error);
	// 	});
	// }
}

// 뱃지 값을 증가시키는 함수
function incrementBadge() {
	if ('setAppBadge' in navigator) {
		// 현재 값에 +1
		currentBadgeCount.value ++;

		// 새로운 뱃지 값 설정
		// 기존 뱃지 초기화 후 새로운 값 설정
		navigator.clearAppBadge()
		.then(() => {
			return navigator.setAppBadge(currentBadgeCount.value);
			})
		.catch((error) => {
			console.error('Failed to update app badge:', error);
		});
	} else {
		console.warn('setAppBadge is not supported in this browser.');
	}
}

export function checkNotificationPermission() {
    if (Notification.permission === "granted") {
        console.log("알림이 이미 허용되어 있습니다.");
    } else if (Notification.permission === "denied") {
        console.log("알림이 차단되어 있습니다.");
        // 사용자에게 수동으로 권한 재요청을 유도
        showPermissionRequestPrompt();
    } else if (Notification.permission === "default") {
        console.log("알림 권한이 아직 설정되지 않았습니다.");
        requestNotificationPermission();
    }
}

function requestNotificationPermission() {
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            console.log("사용자가 알림을 허용했습니다.");
        } else if (permission === "denied") {
            console.log("사용자가 알림을 차단했습니다.");
        }
    });
}

function showPermissionRequestPrompt() {
    const isConfirmed = confirm(
        "알림이 차단되어 있습니다. 알림을 활성화하려면 브라우저 설정에서 권한을 변경해주세요."
    );
    if (isConfirmed) {
        // 브라우저 설정 페이지로 이동
        if (navigator.userAgent.includes("Chrome")) {
            window.open("chrome://settings/content/notifications", "_blank");
        } else if (navigator.userAgent.includes("Firefox")) {
            window.open("about:preferences#privacy", "_blank");
        } else {
            alert("브라우저 설정에서 알림 권한을 확인해주세요.");
        }
    }
}

function updateAuditsAndApprovals(audits, approvals) {
  if (audits.list.length > 0 || approvals.list.length > 0) {
    const mergedList = [...Object.values(getAuditsList), ...audits.list, ...approvals.list];

    const sortedList = mergedList.sort((a, b) => a.updated - b.updated);

    // 기존 데이터 초기화
    Object.keys(getAuditsList).forEach((key) => delete getAuditsList[key]);

    // 정렬된 데이터를 다시 저장
    for (let item of sortedList) {
      getAuditsList[item.updated] = item;
    }
  }
}


// 페이지 로드 시 알림 권한 요청
// document.addEventListener('DOMContentLoaded', () => {
// 	console.log('DOMContentLoaded');
// 	checkNotificationPermission();
// 	console.log('DOMContentLoaded - checkNotificationPermission - complete');
// 	if (Object.keys(user).length && !isConnected) {
// 		skapi.connectRealtime(RealtimeCallback);
// 		console.log('DOMContentLoaded - isConnected - connectRealtime - complete');
// 	}
// });

// Service Worker로부터 메시지 수신
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'notification-clicked') {
            handleNotificationClick();
        }
    });
}

// Service Worker 등록
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
            console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
            console.error('Service Worker registration failed:', error);
        });
}

export let RealtimeCallback = async (rt: any) => {
	// if (!isConnected) {
	//   // console.log('Realtime 연결이 이미 활성화되어 있습니다.');
	//   return;
	// }

	// console.log('=== RealtimeCallback === rt : ', rt);

	// 실시간 통신 (노티피케이션 / 체팅 등등)
	// Callback executed when there is data transfer between the users.
	/**
		rt = {
			type: 'message' | 'private' | 'error' | 'success' | 'close' | 'notice',
			message: '...',
			...
		}
		*/

	if (rt.type === 'error' || rt.type === 'close') {
		const errorTime = new Date().toLocaleString();
		console.log({rt})
    	console.error({ errorTime });
		isConnected.value = false;
		if(isTabVisible.value) {
			console.log('탭이 활성화되어 있습니다.');
			// await skapi.connectRealtime(RealtimeCallback).catch((err) => console.error({ err }));
			if(!isConnected.value && connectRunning === null) {
				console.log('RealtimeCallback 안에서 다시 연결 시도')
				connectRunning = skapi.connectRealtime(RealtimeCallback).finally(()=>{
					connectRunning = null
					console.log({isConnected: isConnected.value});
				});
			}
		}
		getRealtime();
		console.log('다시 연결합니다.');
		console.log({isConnected});
	}

	if (rt.type === 'success') {
		console.log({rt})
		console.log({type: rt.type});
		if (rt.message === 'Connected to WebSocket server.') {
		// 실시간 통신 연결 성공
		// 과거 결재 요청 목록 가져오기
		let getAudits, getApprovals;

		isConnected.value = true; // 연결 상태 플래그 업데이트

		// window.localStorage.setItem(`notification_count:${user.user_id}`, '0');

		nextTick(() => {
			getAuditList();
			// getSendAuditList();
		});

		// await skapi.getRecords({
		// 	table: {
		// 		name: 'audit_request',
		// 		access_group: 'authorized',
		// 	},
		// 	reference: `audit:${user.user_id}`,
		// },{
		// 	ascending: false, // 최신순
		// }).then((audits) => {
		// 	// console.log('=== RealtimeCallback === audits : ', audits); // 들어온 결재 요청
		// }).catch(err => err);

		// await skapi.getRecords({
		// 	// 결재 완료된 목록 가져오기
		// 	table: {
		// 		name: 'audit_approval',
		// 		access_group: 'authorized',
		// 	},
		// 	tag: user.user_id.replaceAll('-', '_'),
		// }).then((approvals) => {
		// 	// console.log('=== RealtimeCallback === approvals : ', approvals);
		// }).catch(err => err);
		}
	}

	if (rt.type === 'private') {
		const errorTime = new Date().toLocaleString();
		console.error({ errorTime });
		console.log({rt})
		console.log({type: rt.type});

		// console.log('sender', rt.sender, user.user_id);
		// console.log('msgg', rt.message);

		if (rt.sender !== user.user_id) { // 다른 사람이 나에게 보낸 메시지
			// 개인 메시지

			const handleAuditRequest = async (audit_msg: any) => {
				try {
					// senderInfo 가져오기
					const senderInfo = await getUserInfo(audit_msg.send_user);
			
					// console.log({ senderInfo });
			
					// audit_request에 이름 추가
					const enrichedAuditRequest = {
						...audit_msg,
						send_name: senderInfo.list[0].name, // 사용자 이름 추가
					};
			
					// 리스트에 추가
					realtimes.value.push(enrichedAuditRequest);
					realtimes.value = [...realtimes.value].sort((a, b) => b.send_date - a.send_date); // 최신 날짜 순
					// realtimes.value = [...realtimes.value, enrichedAuditRequest];
					// console.log('Updated realtimes:', realtimes.value);
				} catch (error) {
					console.error('Failed to process audit request:', error);
				}
			};

			realtimeTestingMsg.value = rt.message;
			console.log('=== RealtimeCallback === realtimeTestingMsg : ', realtimeTestingMsg.value);

			let realtimeMsg = rt.message;
			let realtimeSender = null;
			let realtimeBody = ''

			console.log({realtimeMsg})

			// 결재 요청이 들어옴
			if (rt.message?.audit_request) {
				handleAuditRequest(rt.message.audit_request);

				let sendUserInfo = await getUserInfo(rt.message.audit_request.send_user);
				realtimeSender = sendUserInfo?.list[0];
				realtimeBody = `${realtimeSender.name}님께서 결재를 올렸습니다.`
			}

			// 결재 완료 알림
			if (rt.message?.audit_approval) {
				handleAuditRequest(rt.message.audit_approval);
				
				let sendUserInfo = await getUserInfo(rt.message.audit_approval.send_user);
				realtimeSender = sendUserInfo?.list[0];
				realtimeBody = `${realtimeSender.name}님께서 결재를 ${rt.message.audit_approval.audit_info.approval === 'approve' ? '승인' : '반려'}했습니다.`
			}	

			// 결재 취소 알림 audit_canceled
			if (rt.message?.audit_canceled) {
				handleAuditRequest(rt.message.audit_canceled);
				
				let sendUserInfo = await getUserInfo(rt.message.audit_canceled.send_user);
				realtimeSender = sendUserInfo?.list[0];
				realtimeBody = `${realtimeSender.name}님께서 결재를 취소했습니다.`
			}

			console.log({isTabVisible: isTabVisible.value})
			console.log({realtimeSender})
			if(realtimeSender === null) {
				realtimeSender = { name: 'dev' };
				realtimeBody = `${realtimeSender.name}님께서 보낸 테스트 메세지 입니다.`
			}

			// 탭이 비활성화된 경우에만 알림 표시
			setTimeout(() => {
				if (!isTabVisible.value) {
					console.log('비활성화됨: 알림 표시');
					incrementBadge();
					showNotification(realtimeBody);
				} else {
					console.log('활성화됨: 알림 표시 안 함');
				}
			}, 0); // 비동기 처리를 위해 setTimeout 사용

			// 탭이 비활성화된 경우에만 알림 표시
			// if (!isTabVisible.value) {
			// 	console.log('비활성화')
			// 	showNotification(realtimeBody);
			// 	// 실시간 알림 보내기
			// 	// skapi
			// 	// .postRealtime(
			// 	// 	{
			// 	// 		realtimeMsg
			// 	// 	},
			// 	// 	user.user_id,
			// 	// 	{
			// 	// 		title: '[그룹웨어]',
			// 	// 		body: realtimeBody
			// 	// 	}
			// 	// )
			// 	// .then((res) => {
			// 	// 	console.log("탭 비활성화일때 결재 요청 날리기", res);
			// 	// }).catch((err) => {
			// 	// 	console.log({err})
			// 	// });
			// }

			unreadCount.value = realtimes.value.filter((audit) => !Object.keys(readList.value).includes(audit.noti_id)).length;
		}

		// // console.log(notification_count.dataset.count)
		// window.localStorage.setItem(`notification_count:${user.user_id}`, notification_count.dataset.count); // notification count 가져오기
	}
};

export let loginCheck = async (profile: any) => {
	console.log('=== loginCheck === profile : ', profile);

	if (!profile) {
		if(!isConnected.value) {
			skapi.closeRealtime();
		}

		if (iwaslogged.value) {
			// Object.assign(user, {}); // 이렇게 하면 지워지지 않음
			for (let key in user) {
				delete user[key];
			}

			iwaslogged.value = false;
		}
	}

	else if (profile) {
		checkNotificationPermission();

		// console.log('=== loginCheck === profile : ', profile);
		
		let originalUser = { ...user };
		
		profile = await getEmpDivisionPosition(profile); // user profile에 현재 유저 부서, 직책을 추가 (없으면 추가 안하고 다시 user profile return)
		employeeDict[profile.user_id] = profile;
		
		Object.assign(user, profile);

		for (const key in originalUser) {
			if (!profile.hasOwnProperty(key)) {
				delete user[key];
			}
		}

		if (user.picture) {
			skapi.getFile((user.picture as string), {
				dataType: 'endpoint',
			}).then((res) => {
				profileImage.value = res;
			}).catch((err) => {
				// window.alert('프로필 사진을 불러오는데 실패했습니다.');
				// throw err; // 의도적으로 에러 전달
				profileImage.value = null; // 에러 발생 시 이미지 없음
			});
		} else {
			profileImage.value = null;
		}

		// 구독 키 확인
		// let subscription_key = window.localStorage.getItem('skapi_subscription_obj') ? JSON.parse(window.localStorage.getItem('skapi_subscription_obj')) : null;

		// if (!subscription_key) {
		// 	await 
		// }

		await subscribeNotification();

		let misc = JSON.parse(user.misc || '{}');

		// 결재 창구 만들기
		if (!misc.logged) {
			skapi.postRecord(null, {
				unique_id: `audit:${user.user_id}`,
				table: {
					name: 'audit',
					access_group: 'authorized',
				},
				source: {
					can_remove_referencing_records: true,
				},
			})
			.catch((err) => console.error({ err }));

			misc.logged = true; // 로그인 후 한번만 실행
			skapi.updateProfile({ misc: JSON.stringify(misc) }).catch((err) => console.error({ err }));
		}

		// 공지사항 구독
		if (!misc.subscribed) {
			skapi.subscribeNewsletter({
				group: 'public',
			})
			.catch((err) => console.error({ err }));

			misc.subscribed = true; // 로그인 후 한번만 실행
			skapi.updateProfile({ misc: JSON.stringify(misc) }).catch((err) => console.error({ err }));
		}

		if (!isConnected.value && connectRunning === null) {
			connectRunning = skapi.connectRealtime(RealtimeCallback).finally(()=>{
				connectRunning = null
			});
		}
	}

	if(!loaded.value) {
		app.use(router);

		app.mount('#app');
	}

	loaded.value = true;
};

const skapi = new Skapi(
  // 'ap21UAo9MdRQtaQ8CmGr',
  // '5750ee2c-f7f7-43ff-b6a5-cce599d30101',

  // s :: mina
//   'ap21T837jUF8IFyfR98Z',
//   'f498d188-1fa5-43e5-a32d-904d3e125983',
  // e :: mina

	// s :: mina 0213
	// 'ap21cemcuW6KhJIDR98Z',
	// 'f498d188-1fa5-43e5-a32d-904d3e125983',
	// e :: mina 0213

  // s :: qb
//   'ap21cfWvkAd36OniCmGr',
//   '5750ee2c-f7f7-43ff-b6a5-cce599d30101',
  // e :: qb

//   "ap21dOg74mAMPHaDCmGr", "5750ee2c-f7f7-43ff-b6a5-cce599d30101", // qb : groupwaretest1
  "ap21dtzcVgliDshfCmGr", "5750ee2c-f7f7-43ff-b6a5-cce599d30101", // qb : groupwaretest2

  // 'ap22SqnnCxZxkisPeFEc',
  // 'f8e16604-69e4-451c-9d90-4410f801c006',
//   { autoLogin: window.localStorage.getItem('remember') === 'true', eventListener: { onLogin: loginCheck } },
{ autoLogin: true, eventListener: { onLogin: loginCheck } },
  { hostDomain: 'skapi.app', target_cdn: 'd1wrj5ymxrt2ir', network_logs: false }
); // pb

// const skapi = new Skapi(
//   'ap21T837jUF8IFyfR98Z',
//   'f498d188-1fa5-43e5-a32d-904d3e125983',
//   { autoLogin: false },
//   { hostDomain: 'skapi.app', target_cdn: 'd1wrj5ymxrt2ir' }
// );

export { skapi };
