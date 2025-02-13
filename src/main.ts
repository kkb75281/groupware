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
// export let googleEmailUpdate = ref(false);
let isConnected = false;

// function getChanges(before:any, after:any) {
//   const beforeKeys = new Set(Object.keys(before));
//   const afterKeys = new Set(Object.keys(after));

//   const addedKeys = [...afterKeys].filter((key) => !beforeKeys.has(key));
//   const removedKeys = [...beforeKeys].filter((key) => !afterKeys.has(key));
//   const modifiedKeys = [...afterKeys].filter((key) => beforeKeys.has(key) && before[key] !== after[key]);

//   return { added: addedKeys, removed: removedKeys, modified: modifiedKeys };
// }

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
			
			// 결재 요청이 들어옴
			if (rt.message?.audit_request) {
				handleAuditRequest(rt.message.audit_request);
			}

			// 결재 완료 알림
			if (rt.message?.audit_approval) {
				handleAuditRequest(rt.message.audit_approval);
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

  // s :: qb
  'ap21cfWvkAd36OniCmGr',
  '5750ee2c-f7f7-43ff-b6a5-cce599d30101',
  // e :: qb

//   "ap21cZGkmP0COCVxCmGr", "5750ee2c-f7f7-43ff-b6a5-cce599d30101",

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
