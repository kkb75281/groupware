import './assets/less/main.less';

import { createApp, nextTick, ref, watch } from 'vue';
import { Skapi } from 'skapi-js';
import { user, profileImage } from './user';
import { fetchGmailEmails } from "@/utils/mail";
import App from './App.vue';
import router from './router';
import { notifications, realtimes, unreadCount, readList, mailList } from './notifications';
import { getUserInfo, employeeDict, getEmpDivisionPosition } from './employee';
import { getAuditList, getSendAuditList } from './audit';

const app = createApp(App);

export let iwaslogged = ref(false);
export let loaded = ref(false);
export let mainPageLoading = ref(false);
export let realtimeTestingMsg = ref('');
let isConnected = false;
let isTabVisible = ref(true); // 현재 탭을 보고 있는지 여부
let currentBadgeCount = 0; // 현재 뱃지 값을 저장할 변수

watch(isTabVisible, (nv) => {
	if (nv) {
		navigator.setAppBadge(0).catch((error) => {
			console.error('Failed to set app badge:', error);
		  });
	}
})

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
        } else {
            console.log('탭이 비활성화되었습니다.');
            isTabVisible.value = false;
        }
    });
}

// main.js

// async function checkSubscriptionStatus() {
//     try {
//         const registration = await navigator.serviceWorker.ready;
//         const subscription = await registration.pushManager.getSubscription();

//         if (!subscription) {
//             console.log("User is not subscribed to push notifications.");
//             // 사용자에게 재구독 요청 로직 추가 가능
//             requestNotificationPermission();
//         } else {
//             console.log("User is still subscribed:", subscription);
//         }
//     } catch (error) {
//         console.error("Error checking subscription status:", error);
//     }
// }

// function requestNotificationPermission() {
//     Notification.requestPermission().then((permission) => {
//         if (permission === "granted") {
//             console.log("Notification permission granted.");
//             // 여기서 새로운 구독 요청 가능
//         } else {
//             console.warn("Notification permission denied.");
//         }
//     });
// }

// // 주기적으로 구독 상태 체크 (예: 하루에 한 번)
// setInterval(checkSubscriptionStatus, 24 * 60 * 60 * 1000);

// // 초기 체크
// checkSubscriptionStatus();

// 알림 표시 함수
function showNotification(message) {
	// Service Worker 등록
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('/sw.js')
			.then(registration => {
				console.log('Service Worker 등록 성공:', registration);

				// Service Worker의 상태 확인
				if (!registration.active) {
					console.warn('Service Worker가 아직 활성화되지 않았습니다.');
					return;
				}

				// 알림 권한 요청
				if (Notification.permission === 'granted') {
					console.log('알림 권한이 허용되었습니다.');

					// showNotification 메서드 확인
					if (typeof registration.showNotification === 'function') {
						registration.showNotification('서비스 워커 알림', {
							body: message,
							icon: 'favicon-icon.png'
						});
					} else {
						console.error('showNotification 메서드를 사용할 수 없습니다.');
					}
				} else {
					console.warn('알림 권한이 거부되었습니다.');
				}
			})
			.catch(error => {
				console.error('Service Worker 등록 실패:', error);
			});
	} else {
		console.error('Service Worker를 지원하지 않는 브라우저입니다.');
	}

    // if (Notification.permission === 'granted') {
    //     new Notification('새로운 메시지', {
    //         body: message,
    //         icon: '/favicon-icon.png' // 아이콘 경로 (옵션)
    //     });
	// 	console.log('알림이 표시되었습니다.');
    // } else {
    //     console.error('알림 권한이 없습니다.');
    // }
}

// if ('serviceWorker' in navigator) {
// 	navigator.serviceWorker.ready.then((registration) => {
// 	  // Service Worker로부터 메시지 수신
// 	  navigator.serviceWorker.addEventListener('message', (event) => {
// 		if (event.data && event.data.type === 'clear-badge') {
// 		  // 뱃지 카운트를 0으로 초기화
// 		  currentBadgeCount = 0;
// 		  console.log('Badge count cleared:', currentBadgeCount);
// 		}
// 	  });
// 	});
//   }

// 뱃지 값을 증가시키는 함수
function incrementBadge() {
	if ('setAppBadge' in navigator) {
	  // 현재 값에 +1
	  currentBadgeCount += 1;
  
	  // 새로운 뱃지 값 설정
	  navigator.setAppBadge(currentBadgeCount).catch((error) => {
		console.error('Failed to set app badge:', error);
	  });
	} else {
	  console.warn('setAppBadge is not supported in this browser.');
	}
}

function checkNotificationPermission() {
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

	if (rt.type === 'success') {
		if (rt.message === 'Connected to WebSocket server.') {
		// 실시간 통신 연결 성공
		// 과거 결재 요청 목록 가져오기
		let getAudits, getApprovals;

		isConnected = true; // 연결 상태 플래그 업데이트

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

			setupVisibilityListener();
			incrementBadge();

			let realtimeMsg = rt.message;
			let realtimeSender = null;
			let realtimeBody = ''

			// 결재 요청이 들어옴
			if (rt.message?.audit_request) {
				handleAuditRequest(rt.message.audit_request);

				realtimeSender = getUserInfo(rt.message.audit_request.send_user);
				realtimeBody = `${realtimeSender.name}님께서 결재를 올렸습니다.`
			}

			// 결재 완료 알림
			if (rt.message?.audit_approval) {
				handleAuditRequest(rt.message.audit_approval);
				
				realtimeSender = getUserInfo(rt.message.audit_approval.send_user);
				realtimeBody = `${realtimeSender.name}님께서 결재를 ${rt.message.audit_approval.audit_info.approval === 'approve' ? '승인' : '반려'}했습니다.`
			}	

			// 결재 취소 알림 audit_canceled
			if (rt.message?.audit_canceled) {
				handleAuditRequest(rt.message.audit_canceled);
				
				realtimeSender = getUserInfo(rt.message.audit_canceled.send_user);
				realtimeBody = `${realtimeSender.name}님께서 결재를 취소했습니다.`
			}

			console.log({isTabVisible: isTabVisible.value})

			// 탭이 비활성화된 경우에만 알림 표시
			if (!isTabVisible.value) {
				console.log('비활성화')
				// 실시간 알림 보내기
				skapi
				.postRealtime(
					{
						realtimeMsg
					},
					user.user_id,
					{
						title: '[그룹웨어]',
						body: realtimeBody
					}
				)
				.then((res) => {
					console.log("탭 비활성화일때 결재 요청 날리기", res);
				}).catch((err) => {
					console.log({err})
				});
			}

			unreadCount.value = realtimes.value.filter((audit) => !Object.keys(readList.value).includes(audit.noti_id)).length;
		}

		// // console.log(notification_count.dataset.count)
		// window.localStorage.setItem(`notification_count:${user.user_id}`, notification_count.dataset.count); // notification count 가져오기
	}
};

export let loginCheck = async (profile: any) => {
	// // console.log('=== loginCheck === profile : ', profile);

	if (!profile) {
		if(!isConnected) {
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

		// pwa 알림 권한 체크
		checkNotificationPermission();

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

		if (!isConnected) {
			skapi.connectRealtime(RealtimeCallback);
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

  "ap21dOg74mAMPHaDCmGr", "5750ee2c-f7f7-43ff-b6a5-cce599d30101",

  // 'ap22SqnnCxZxkisPeFEc',
  // 'f8e16604-69e4-451c-9d90-4410f801c006',
  { autoLogin: window.localStorage.getItem('remember') === 'true', eventListener: { onLogin: loginCheck } },
  { hostDomain: 'skapi.app', target_cdn: 'd1wrj5ymxrt2ir', network_logs: false }
); // pb

// const skapi = new Skapi(
//   'ap21T837jUF8IFyfR98Z',
//   'f498d188-1fa5-43e5-a32d-904d3e125983',
//   { autoLogin: false },
//   { hostDomain: 'skapi.app', target_cdn: 'd1wrj5ymxrt2ir' }
// );

export { skapi };
