import './assets/less/main.less';

import { createApp, ref } from 'vue';
import { Skapi } from 'skapi-js';
import { user, profileImage } from './user.ts';
import App from './App.vue';
import router from './router';
import {
    realtimes,
    unreadCount,
    readList,
    getRealtime,
    updateEmails,
    subscribeNotification,
    unsubscribeNotification,
    unreadEmailNotiMsg
} from './notifications.ts';
import { getUserInfo, employeeDict, getEmpDivisionPosition } from './employee.ts';
import { getAuditList } from './audit.ts';

const app = createApp(App);

let serviceID = import.meta.env.VITE_SERVICE_ID;
let newWorker: ServiceWorker | null = null; // 새로 설치 중인 서비스 워커
let emailCheckInterval: any = null;

export let currentVersion: string | null = null; // 현재 활성화된 서비스 워커의 버전
export let newVersionAvailable = ref(false); // 새로운 버전이 있는지 여부
export let newVersion = ref(''); // 새로운 버전이 있는지 여부
export let isUpdateLoading = ref(false); // 업데이트 로딩 상태
export let workerRegistered = ref(false); // 서비스 워커 등록 상태

export let iwaslogged = ref(false);
export let loaded = ref(false);
export let mainPageLoading = ref(false);

export let realtimeTestingMsg = ref('');
export let realtimeIsConnected = false;
export let currentBadgeCount = 0; // 현재 뱃지 값을 저장할 변수
export let buildTime = import.meta.env.VITE_BUILD_TIME;
export let getSystemBannerId = ref(null);
export let getSystemBannerRunning: Promise<any> | null = null;
export let system_banner = ref(null);
export let system_banner_style = ref('contain'); // object-fill (contain, cover, fill, none)

console.log('바뀐 버전 입니다. 0516 18:00');

window.addEventListener('load', () => {
    isUpdateLoading.value = false;
});

if (localStorage.getItem('updateAvailable') === 'true') {
    newVersionAvailable.value = true;
} else {
    newVersionAvailable.value = false;
}

// 앱 시작 시 버전 정보 로드
fetch('/version.json')
    .then((response) => response.json())
    .then((data) => {
        currentVersion = data.version;

        let lastUpdatedVersion = localStorage.getItem('lastUpdatedVersion');

        // 유효하지 않은 lastUpdatedVersion 처리
        if (!lastUpdatedVersion || lastUpdatedVersion.trim() === '') {
            lastUpdatedVersion = currentVersion; // 기본값으로 현재 버전 설정
            localStorage.setItem('lastUpdatedVersion', lastUpdatedVersion);
        }

        // 버전 비교 로직 개선
        if (lastUpdatedVersion !== currentVersion) {
            newVersion.value = currentVersion;
            newVersionAvailable.value = true;
            localStorage.setItem('updateAvailable', 'true');
        } else {
            newVersion.value = '';
            newVersionAvailable.value = false;
            localStorage.removeItem('updateAvailable');
        }

        console.log('Current version:', currentVersion);
        console.log('Last updated version:', lastUpdatedVersion);
    });

if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register(`/wrk.${serviceID}.js`)
        .then((registration) => {
            console.log('Service Worker registered:', registration);
            if (registration.active) {
                workerRegistered.value = true;
            } else {
                workerRegistered.value = false;
            }

            registration.addEventListener('updatefound', () => {
                newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed') {
                            newVersionAvailable.value = true;
                            localStorage.setItem('updateAvailable', 'true');
                        }
                    });
                }
            });
        })
        .catch((error) => {
            console.error('Service Worker registration failed:', error);
        });

    // 앱 실행 시점에 항상 실행 - 현재 활성화된 SW에게 버전 요청
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_VERSION' });
    } else {
        // SW가 아직 설치되지 않았다면, 등록 후에도 한 번 더 체크
        navigator.serviceWorker.ready.then((registration) => {
            registration.active?.postMessage({ type: 'CHECK_VERSION' });
        });
    }

    // Service Worker로부터 메시지 수신
    navigator.serviceWorker.addEventListener('message', (event) => {
        // 뱃지 업데이트 처리
        if (event.data && event.data.type === 'BADGE_UPDATED') {
            const newBadgeCount = event.data.badgeCount;
            currentBadgeCount = newBadgeCount;
        }

        if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
            const receivedVersion = event.data.version;
            console.log(`[Main] New version available: ${receivedVersion}`);

            if (currentVersion !== receivedVersion) {
                newVersion.value = receivedVersion;

                const lastUpdatedVersion = localStorage.getItem('lastUpdatedVersion');

                console.log(
                    `[Main] Last updated version: ${lastUpdatedVersion}, Current version: ${currentVersion}, Received version: ${receivedVersion}`
                );

                if (lastUpdatedVersion !== receivedVersion) {
                    newVersionAvailable.value = true;
                    localStorage.setItem('updateAvailable', 'true');
                    localStorage.removeItem('userDismissedUpdate');
                }
            }
        }
    });
}

export function applyUpdate() {
    isUpdateLoading.value = true;

    if (newWorker) {
        console.log('start');
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        startLoadingAndReload();
        return;
    }

    //   navigator.serviceWorker
    //     .getRegistration()
    //     .then((registration) => {
    //       if (registration?.waiting) {
    //         registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    //         startLoadingAndReload();
    //       } else {
    //         // newVersionAvailable.value = false;
    //         // localStorage.removeItem('updateAvailable');
    //         // isUpdateLoading.value = false;

    //         // alert('업데이트 가능한 서비스 워커가 없습니다.');
    //       }
    //     })
    //     .catch((err) => {
    //       console.error('Failed to get registration:', err);
    //       newVersionAvailable.value = false;
    //       localStorage.removeItem('updateAvailable');
    //       isUpdateLoading.value = false;

    //       alert('서비스 워커 업데이트 실패');
    //     });
}

function startLoadingAndReload() {
    isUpdateLoading.value = true;

    const controllerChangeHandler = () => {
        // clearTimeout(timeout); // 타임아웃 제거
        console.log('controllerChangeHandler: entered');
        navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeHandler);
        console.log('controllerChangeHandler: removeEventListener');

        if (navigator.serviceWorker.controller) {
            console.log('controllerChangeHandler: controller exists');
            newVersionAvailable.value = false;
            localStorage.removeItem('updateAvailable');

            // newVersion.value가 존재할 때만 저장
            if (newVersion.value && newVersion.value.trim() !== '') {
                localStorage.setItem('lastUpdatedVersion', newVersion.value);
            } else if (currentVersion) {
                localStorage.setItem('lastUpdatedVersion', currentVersion);
            }
            console.log(
                newVersion.value,
                currentVersion,
                localStorage.getItem('lastUpdatedVersion')
            );
            console.log('controllerChangeHandler: reload start');

            window.location.reload();

            console.log('controllerChangeHandler: reload end');
        }
    };

    // controllerchange 감지 시작
    navigator.serviceWorker.addEventListener('controllerchange', controllerChangeHandler);

    // 타임아웃은 최후의 수단으로만 남기기
    //   const timeout = setTimeout(() => {
    //     console.warn(
    //       "[Fallback] Controllerchange event didn't fire within 5 seconds. Reloading anyway."
    //     );
    //     window.location.reload(); // 강제 리로드
    //   }, 10000);
}

const skapi = new Skapi(import.meta.env.VITE_SERVICE_ID, import.meta.env.VITE_OWNER_ID, {
    autoLogin: window.localStorage.getItem('remember') === 'true',
    eventListener: { onLogin: loginCheck }
});

export let getSystemBanner = async (refresh = false) => {
    if (getSystemBannerRunning instanceof Promise) {
        await getSystemBannerRunning;
        return system_banner.value;
    }

    if (system_banner.value && Object.keys(system_banner.value).length && !refresh) {
        return system_banner.value;
    }

    getSystemBannerRunning = skapi
        .getRecords({
            table: {
                name: 'system_banner',
                access_group: 1
            }
        })
        .finally(() => {
            getSystemBannerRunning = null;
        });

    let res = await getSystemBannerRunning;

    if (res && res.list && res.list.length) {
        getSystemBannerId.value = res.list[0].record_id;

        if (res.list[0].data) {
            system_banner.value = res.list[0]?.bin?.banner_pic[0];
            system_banner_style.value = res.list[0]?.data?.banner_style;
        }
    }

    console.log('system_banner', system_banner.value);

    return system_banner.value;
};

function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        // console.log('탭이 활성화되었습니다.');
        // isTabVisible = true;

        // 뱃지 초기화
        if ('clearAppBadge' in navigator) {
            navigator
                .clearAppBadge()
                .then(() => {
                    resetBadgeCount();
                    // console.log('뱃지 초기화 완료');
                })
                .catch((error) => {
                    console.error('Failed to clear app badge:', error);
                });
        }

        // console.log('탭 활성화 여부 함수 realtimeIsConnected.value', realtimeIsConnected);

        if (!realtimeIsConnected && user.user_id) {
            // 실시간 연결이 끊어진 경우 + 유저 로그인이 있는 경우 다시 연결
            // console.log('다시 연결합니다.');
            skapi.connectRealtime(RealtimeCallback);
        }
        if (user.user_id && !emailCheckInterval && localStorage.getItem('refreshToken')) {
            emailCheckInterval = setInterval(() => {
                // console.log('10초마다 이메일 업데이트');
                updateEmails();
            }, 10000);
        }
    } else {
        // console.log('탭이 비활성화되었습니다.');
        // isTabVisible = false;
        skapi.closeRealtime();
        if (emailCheckInterval) {
            clearInterval(emailCheckInterval);
            emailCheckInterval = null;
        }
    }
}

// 가시성 상태 감지
document.addEventListener('visibilitychange', handleVisibilityChange);

// 뱃지 값을 초기화하는 함수
export function resetBadgeCount() {
    // 상태 관리 로직에서 뱃지 숫자를 0으로 초기화
    currentBadgeCount = 0;

    // 서비스 워커로 초기화된 뱃지 숫자 전송
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.active?.postMessage({
                type: 'RESET_BADGE',
                badgeCount: currentBadgeCount
            });
        });
    }

    // console.log(`[Main App] Badge count reset to ${currentBadgeCount}`);
}

export let RealtimeCallback = async (rt: any) => {
    if (rt.type === 'error' || rt.type === 'close') {
        const errorTime = new Date().toLocaleString();
        // console.log({ rt })
        console.error({ errorTime });
        realtimeIsConnected = false;
    }

    if (rt.type === 'success') {
        console.log({ rt });
        console.log({ type: rt.type });
        // console.log('리얼타임 연결 성공 후 getRealtime 실행시작');
        await getRealtime(true);
        await updateEmails(true);
        // console.log('리얼타임 연결 성공 후 getRealtime 실행완료');

        if (rt.message === 'Connected to WebSocket server.') {
            // 실시간 통신 연결 성공
            // 과거 결재 요청 목록 가져오기

            realtimeIsConnected = true; // 연결 상태 플래그 업데이트
            getAuditList({});
        }
    }

    if (rt.type === 'private') {
        console.log('=== RealtimeCallback === rt : ', rt);

        if (rt.sender !== user.user_id) {
            // 다른 사람이 나에게 보낸 메시지
            // 개인 메시지

            const handleAuditRequest = async (audit_msg: any) => {
                try {
                    // senderInfo 가져오기
                    const senderInfo = await getUserInfo(audit_msg.send_user);

                    // // console.log({ senderInfo });

                    // audit_request에 이름 추가
                    const enrichedAuditRequest = {
                        ...audit_msg,
                        send_name: senderInfo.list[0].name // 사용자 이름 추가
                    };

                    // 리스트에 추가
                    realtimes.value.push(enrichedAuditRequest);
                    realtimes.value = [...realtimes.value].sort(
                        (a, b) => b.send_date - a.send_date
                    ); // 최신 날짜 순
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
            let realtimeBody = '';

            console.log({ realtimeMsg });

            // 결재 요청이 들어옴
            if (rt.message?.audit_request) {
                handleAuditRequest(rt.message.audit_request);

                let sendUserInfo = await getUserInfo(rt.message.audit_request.send_user);
                realtimeSender = sendUserInfo?.list[0];
                realtimeBody = `${realtimeSender.name}님께서 결재를 올렸습니다.`;
            }

            // 결재 완료 알림
            if (rt.message?.audit_approval) {
                handleAuditRequest(rt.message.audit_approval);

                let sendUserInfo = await getUserInfo(rt.message.audit_approval.send_user);
                realtimeSender = sendUserInfo?.list[0];
                realtimeBody = `${realtimeSender.name}님께서 결재를 ${rt.message.audit_approval.audit_info.approval === 'approve' ? '승인' : '반려'}했습니다.`;
            }

            // 결재 취소 알림 audit_canceled
            if (rt.message?.audit_canceled) {
                handleAuditRequest(rt.message.audit_canceled);

                let sendUserInfo = await getUserInfo(rt.message.audit_canceled.send_user);
                realtimeSender = sendUserInfo?.list[0];
                realtimeBody = `${realtimeSender.name}님께서 결재를 취소했습니다.`;
            }

            // // console.log({ isTabVisible })
            // console.log({ realtimeSender })
            if (realtimeSender === null) {
                realtimeSender = { name: 'dev' };
                realtimeBody = `${realtimeSender.name}님께서 보낸 테스트 메세지 입니다.`;
            }

            unreadCount.value = realtimes.value.filter(
                (audit) => !Object.keys(readList.value).includes(audit.noti_id)
            ).length;
            console.log('unreadCount.value', unreadCount.value);
        }
    }
};

export async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        console.error('Refresh Token이 없습니다.');
        return;
    }
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = {
        client_id: GOOGLE_CLIENT_ID,
        client_secret: '$CLIENT_SECRET',
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
    };

    try {
        const data = await skapi.clientSecretRequest({
            clientSecretName: 'ggltoken',
            url: tokenUrl,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: params
        });

        // console.log({ data })

        if (data.error === 'invalid_grant') {
            console.error('Refresh Token이 무효화되었습니다. 사용자에게 재인증을 요청하세요.');
            skapi.logout().then(() => {
                router.push({ path: '/login' });
            });
        }

        const { access_token, expires_in } = data;
        localStorage.setItem('accessToken', access_token);
        // console.log('새로운 Access Token:', access_token);
        // console.log('Expires In:', expires_in); // 초 단위 (예: 3600)
        return data;
    } catch (error) {
        console.error('Access Token 갱신 중 오류 발생:', error);
    }
}

export async function loginCheck(profile: any) {
    console.log('=== loginCheck === profile : ', profile);

    for (let key in user) {
        delete user[key];
    }

    if (!profile) {
        // console.log('로그아웃 처리');
        unsubscribeNotification();
        skapi.closeRealtime();

        realtimes.value = [];
        unreadEmailNotiMsg.value = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        if (emailCheckInterval) {
            clearInterval(emailCheckInterval);
            emailCheckInterval = null;
        }
    } else if (profile) {
        Object.assign(user, profile);

        refreshAccessToken();
        getSystemBanner(); // 대시보드 배너 사진

        // console.log('메인 페이지 onMounted');

        if (localStorage.getItem('refreshToken')) {
            updateEmails();

            // 10초마다 이메일 업데이트
            if (!emailCheckInterval) {
                emailCheckInterval = setInterval(() => {
                    // console.log('10초마다 이메일 업데이트');
                    updateEmails();
                }, 10000);
            }
        }

        profile = await getEmpDivisionPosition(profile); // user profile에 현재 유저 부서, 직책을 추가 (없으면 추가 안하고 다시 user profile return)
        // console.log({ profile })
        employeeDict[profile.user_id] = profile;

        if (user.picture) {
            skapi
                .getFile(user.picture as string, {
                    dataType: 'endpoint'
                })
                .then((res) => {
                    profileImage.value = res;
                })
                .catch((err) => {
                    profileImage.value = null; // 에러 발생 시 이미지 없음
                });
        } else {
            profileImage.value = null;
        }

        let misc = JSON.parse(user.misc || '{}');

        // 결재 창구 만들기
        if (!misc.logged) {
            skapi
                .postRecord(null, {
                    unique_id: `audit:${user.user_id}`,
                    table: {
                        name: 'audit',
                        access_group: 'authorized'
                    },
                    source: {
                        can_remove_referencing_records: true
                    }
                })
                .catch((err) => err);

            misc.logged = true; // 로그인 후 한번만 실행
            skapi.updateProfile({ misc: JSON.stringify(misc) }).catch((err) => err);
        }

        // 공지사항 구독
        if (!misc.subscribed) {
            skapi
                .subscribeNewsletter({
                    group: 'public'
                })
                .catch((err) => console.error({ err }));

            misc.subscribed = true; // 로그인 후 한번만 실행
            skapi.updateProfile({ misc: JSON.stringify(misc) }).catch((err) => err);
        }

        skapi.connectRealtime(RealtimeCallback);

        // 이전에 로그인 한 유저가 있는지 localStorage 확인
        let hasLoggedInUser = window.localStorage.getItem(
            `${import.meta.env.VITE_SERVICE_ID}.loggedInUser`
        );
        if (hasLoggedInUser && hasLoggedInUser !== profile.user_id) {
            await unsubscribeNotification();
        }

        await subscribeNotification();
    }

    if (!loaded.value) {
        app.use(router);
        app.mount('#app');
    }

    loaded.value = true;
}

skapi.version();

export { skapi };
