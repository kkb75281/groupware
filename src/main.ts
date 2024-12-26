import './assets/less/main.less';

import { createApp, ref } from 'vue';
import { Skapi } from 'skapi-js';
import { user, profileImage } from './user';
import App from './App.vue';
import router from './router';
import { notifications } from './notifications';
const app = createApp(App);

export let iwaslogged = ref(false);
export let loaded = ref(false);
let isConnected = false;

// function getChanges(before:any, after:any) {
//   const beforeKeys = new Set(Object.keys(before));
//   const afterKeys = new Set(Object.keys(after));

//   const addedKeys = [...afterKeys].filter((key) => !beforeKeys.has(key));
//   const removedKeys = [...beforeKeys].filter((key) => !afterKeys.has(key));
//   const modifiedKeys = [...afterKeys].filter((key) => beforeKeys.has(key) && before[key] !== after[key]);

//   return { added: addedKeys, removed: removedKeys, modified: modifiedKeys };
// }

export let RealtimeCallback = (rt: any) => {
  // if (!isConnected) {
  //   console.log('Realtime 연결이 이미 활성화되어 있습니다.');
  //   return;
  // }

  console.log('=== RealtimeCallback === rt : ', rt);

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

      isConnected = true; // 연결 상태 플래그 업데이트

      skapi
        .getRecords(
          {
            table: {
              name: 'audit_request',
              access_group: 'authorized',
            },
            reference: `audit:${user.user_id}`,
          },
          {
            ascending: false, // 최신순
          }
        )
        .then((audits) => {
          console.log('=== RealtimeCallback === audits : ', audits); // 들어온 결재 요청
        })
        .catch(err => err);

      skapi
        .getRecords({
          // 결재 완료된 목록 가져오기
          table: {
            name: 'audit_approval',
            access_group: 'authorized',
          },
          tag: user.user_id.replaceAll('-', '_'),
        })
        .then((approvals) => {
          console.log('=== RealtimeCallback === approvals : ', approvals);
        })
        .catch(err => err);
    }
  }

  if (rt.type === 'close') {
    // 실시간 통신 연결 종료
    isConnected = false; // 연결 상태 플래그 업데이트
  }

  if (rt.type === 'private') {
    let notification_count: any = document.querySelector('button.btn-noti');
    if (rt.sender !== user.user_id) { // 다른 사람이 나에게 보낸 메시지
      // 개인 메시지
      if (rt.message?.audit_request) {
        // 결재 요청이 들어옴
        let audit_request = rt.message.audit_request;

        notifications.audits.push({ fromUserId: rt.sender, msg: audit_request }); // 결재 요청 알림

        console.log('audit_request:', audit_request);
      }
      if (rt.message?.audit_approval) {
        // 결재 완료 알림
        let audit_approval = rt.message.audit_approval;
        console.log('audit_approval:', audit_approval);
        
        notifications.audits.push({ fromUserId: rt.sender, msg: audit_approval }); // 결재 완료 알림

        console.log('notification_count:', notification_count.dataset.count);
        notification_count.dataset.count = (parseInt(notification_count.dataset.count) - 1).toString();
        window.localStorage.setItem(`notification_count:${user.user_id}`, notification_count.dataset.count); // notification count 가져오기
      }
    }
  }
};

export let loginCheck = async (profile: object | null) => {
  if (profile) {
    console.log(profile);
    let originalUser = { ...user };

    Object.assign(user, profile);

    // sessionStorage.setItem('userId', profile['user_id']); // 사용되고 있지 않음

    for (const key in originalUser) {
      if (!profile.hasOwnProperty(key)) {
        delete user[key];
      }
    }

    if (user.picture) {
      skapi
        .getFile(user.picture, {
          dataType: 'endpoint',
        })
        .then((res) => {
          profileImage.value = res;
        })
        .catch((err) => {
          // window.alert('프로필 사진을 불러오는데 실패했습니다.');
          // throw err; // 의도적으로 에러 전달
          profileImage.value = null; // 에러 발생 시 이미지 없음
        });
    } else {
      profileImage.value = null;
    }

    let misc = JSON.parse(user.misc || '{}');

    if (!misc.logged) {
      skapi
        .postRecord(null, {
          // 결재 창구 만들기
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

    if (!isConnected) {
      skapi.connectRealtime(RealtimeCallback);
    }

    // skapi.connectRealtime(RealtimeCallback);

    iwaslogged.value = true;
  } else {
    if (iwaslogged.value) {
      // Object.assign(user, {}); // 이렇게 하면 지워지지 않음
      for (let key in user) {
        delete user[key];
      }

      iwaslogged.value = false;
    }
  }
  // console.log('profile', profile)
  // console.log('iwaslogged', iwaslogged.value)
  loaded.value = true;
};

const skapi = new Skapi(
  // 'ap21UAo9MdRQtaQ8CmGr',
  // '5750ee2c-f7f7-43ff-b6a5-cce599d30101',
  // 'ap21T837jUF8IFyfR98Z',
  // 'f498d188-1fa5-43e5-a32d-904d3e125983',
  'ap21WQQ42ZUVa3GYCmGr',
  '5750ee2c-f7f7-43ff-b6a5-cce599d30101',
  // 'ap22SqnnCxZxkisPeFEc',
  // 'f8e16604-69e4-451c-9d90-4410f801c006',
  { autoLogin: window.localStorage.getItem('remember') === 'true', eventListener: { onLogin: loginCheck } },
  { hostDomain: 'skapi.app', target_cdn: 'd1wrj5ymxrt2ir', network_logs: true }
); // pb

// const skapi = new Skapi(
//   'ap21T837jUF8IFyfR98Z',
//   'f498d188-1fa5-43e5-a32d-904d3e125983',
//   { autoLogin: false },
//   { hostDomain: 'skapi.app', target_cdn: 'd1wrj5ymxrt2ir' }
// );

app.use(router);

app.mount('#app');

export { skapi };
