<template lang="pug">
header#header
    router-link.img-logo(to="/")
        img(src="/img_fgworks_logo.png")

    .btn-wrap
        .icon.btn-noti(:data-count="unreadCount" ref="btnNoti" @click="openNotification" style="padding:0 16px")
            svg
                use(xlink:href="@/assets/icon/material-icon.svg#icon-bell")
        .icon
            a(:href="`https://mail.google.com/mail/u/${encodedEmail}/?authuser=${encodedEmail}&login_hint=${encodedEmail}`" target="_blank")
                Tooltip(tip-background-color="black" text-color="white")
                    template(v-slot:tool)
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-mail")
                    template(v-slot:tip) 이메일
        .icon(:class="{'active': route.path.split('/')[1] === 'approval'}" @click="router.push('/approval/request-audit')")
            Tooltip(tip-background-color="black" text-color="white")
                template(v-slot:tool)
                    svg(style="margin-bottom:6px")
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-approval")
                template(v-slot:tip) 전자결재
        .icon(:class="{'active': route.path.split('/')[1] === 'newsletter'}" @click="router.push('/newsletter-category')")
            Tooltip(tip-background-color="black" text-color="white")
                template(v-slot:tool)
                    svg(style="width:26px; height:26px")
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-campaign")
                template(v-slot:tip) 공지사항
        .icon(v-if="user.access_group < 99" :class="{'active': route.path.split('/')[1] === 'list-employee'}" @click="router.push('/list-employee')")
            Tooltip(tip-background-color="black" text-color="white")
                template(v-slot:tool)
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-groups")
                template(v-slot:tip) 직원목록
        .icon(:class="{'active': route.path.split('/')[1] === 'organigram'}" @click="router.push('/organigram')")
            Tooltip(tip-background-color="black" text-color="white")
                template(v-slot:tool)
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-account-tree")
                template(v-slot:tip) 조직도
        .icon(:class="{'active': route.path.split('/')[1] === 'commute'}" @click="router.push('/commute/commute-record')")
            Tooltip(tip-background-color="black" text-color="white")
                template(v-slot:tool)
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-work-history")
                template(v-slot:tip) 근태관리
        .icon(v-if="user.access_group > 98" :class="{'active': route.path.split('/')[1] === 'admin'}" @click="router.push('/admin/list-divisions')")
            Tooltip(tip-background-color="black" text-color="white")
                template(v-slot:tool)
                    svg(style="width:27px;height:27px")
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-manage-accounts")
                template(v-slot:tip) 마스터 페이지

        //- button.btn-profile(type="button" ref="btnProfile" @click="openProfile")
            span.user-name {{ user.name }}
            span.hello
        .thumbnail(ref="btnProfile" @click="isProfileOpen = !isProfileOpen")
            template(v-if="profileImage")
                img(:src="profileImage" alt="img-profile")
            template(v-else)
                .icon.nohover
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-person")

        button.btn-mo-navbar(ref="btnMobileMenu" v-if="route.name !== 'home'" @click="isMobileMenuOpen = !isMobileMenuOpen")
            .icon(:class="{'active': isMobileMenuOpen}" style="padding:0")
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-apps")

    //- button.btn-noti(type="button" :data-count="unreadCount" ref="btnNoti" @click="openNotification")
        .icon.icon-bell
            svg
                use(xlink:href="@/assets/icon/material-icon.svg#icon-bell")


#popup.notification(v-if="isNotiOpen" @click.stop)
    .popup-header
        h3.title 알림

    template(v-if="unreadEmailNotiMsg || realtimes.length > 0")
        .popup-main
            ul
                li(v-if="unreadEmailNotiMsg" @click.stop="(e) => showRealtimeNoti(e, 'gmail')")
                    .router(@click="closePopup")
                        h4.noti-type [Gmail]
                        h5.noti-title 읽지 않은 이메일이 있습니다.
                li(v-for="rt in realtimes" @click.stop="(e) => showRealtimeNoti(e, 'realtime', rt)")
                    .router(@click="closePopup" :class="{'read' : Object.keys(readList).includes(rt?.noti_id)}")
                        template(v-if="rt.audit_info && rt.audit_info?.audit_type === 'comment'")
                            h4.noti-type [결재의견]
                            h5.noti-title {{ rt.send_name + '님이 [' + rt.audit_info?.to_audit + '] 문서에 의견을 남겼습니다.' }}
                            //- p.noti-comment {{ rt.audit_info?.comment }}
                            p.upload-time {{ formatTimeAgo(rt.send_date) }}
                    
                        template(v-else-if="rt.audit_info && rt.audit_info?.audit_type === 'reply'")
                            h4.noti-type [댓글답변]
                            h5.noti-title {{ rt.send_name + '님이 [' + rt.audit_info?.to_audit + '] 문서의 댓글에 답변을 남겼습니다.' }}
                            p.noti-comment {{ rt.audit_info?.reply }}
                            p.upload-time {{ formatTimeAgo(rt.send_date) }}

                        template(v-else-if="rt.audit_info && rt.audit_info?.audit_type === 'request'")
                            h4.noti-type [{{(rt.audit_info?.send_auditors || []).includes(`receiver:${user.user_id.replaceAll('-', '_')}`) ? '수신참조' : '결재요청'}}]
                            h5.noti-title {{ rt.audit_info.to_audit }}
                            p.noti-sender {{ rt.send_name }}
                            p.upload-time {{ formatTimeAgo(rt.send_date) }}

                        template(v-else-if="rt.audit_info && rt.audit_info?.audit_type === 'email'")
                            h4.noti-type [새이메일]
                            h5.noti-title 읽지 않은 메일이 있습니다.
                            //- h5.noti-title {{ rt.subject }}
                            //- //- .noti-info
                            //- p.noti-sender {{ rt.from }}
                            span.upload-time {{ formatTimeAgo(rt.dateTimeStamp) }}

                        template(v-else-if="rt.audit_info && rt.audit_info?.audit_type === 'canceled'")
                            h4.noti-type [결재회수]
                            h5.noti-title {{ rt.send_name + '님이 [' + rt.audit_info?.to_audit + '] 문서를 회수하였습니다.' }}
                            p.upload-time {{ formatTimeAgo(rt.send_date) }}

                        template(v-else-if="rt?.noti_type === 'notice'")
                            h4.noti-type [공지]
                            h5.noti-title {{ rt.news_info?.news_title }}
                            p.noti-sender {{ rt.send_name }}
                            p.upload-time {{ formatTimeAgo(rt.send_date) }}

                        template(v-else)
                            h4.noti-type [알림]
                            h5.noti-title 
                                template(v-if="rt.audit_info?.approval === 'approve'") {{ rt.send_name + '님이 [' + rt.audit_info?.to_audit + '] 문서를 승인하였습니다.' }}
                                template(v-else) {{ rt.send_name + '님이 [' + rt.audit_info?.to_audit + '] 문서를 반려하였습니다.' }}
                            p.upload-time {{ formatTimeAgo(rt.send_date) }}

    template(v-else)
        .popup-main.no-noti
            h4.title
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-error-outline")
                | 새로운 알림이 없습니다.

    //- .popup-bottom
        router-link.router.view-all(to="/approval/audit-list" @click="closePopup")
            p 전체보기
            .icon
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

#popup.profile(v-show="isProfileOpen" @click.stop)
    .popup-header
        //- h4 {{ user.name }}
        //- span {{ user.access_group === 99 ? '마스터' : user.access_group === 98 ? '관리자' : '직원' }}
        //- p {{ user.email }}
        //- .image
            template(v-if="profileImage")
                img(:src="profileImage" alt="img-profile")
            template(v-else)
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-person")
        .content
            .user
                h4 {{ user.name }}
                span {{ user.access_group === 99 ? '마스터' : user.access_group === 98 ? '관리자' : '직원' }}
            p {{ user.email }}
    .popup-main
        ul
            //- li
                router-link.router(to="/" @click="closePopup")
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-home")
                    p 홈

            //- li
                router-link.router(to="/approval" @click="closePopup")
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-approval")
                    p 전자결재

            li
                router-link.router(to="/mypage/edit-myinfo" @click="closePopup")
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-account-circle-fill")
                    p 마이페이지
            
            //- li(v-if="user.access_group > 98")
                router-link.router(to="/admin" @click="closePopup")
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-settings")
                    p 마스터 페이지

            //- li(v-if="user.access_group < 99")
                router-link.router(to="/list-employee" @click="closePopup")
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-groups")
                    p 직원 목록
            
            //- li
                router-link.router(to="/organigram" @click="closePopup")
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-account-tree")
                    p 조직도

            li(@click="logout")
                .router
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-logout")
                    p 로그아웃

#popup.menu(v-show="isMobileMenuOpen" @click.stop)
    .popup-main
        .icon-menu-wrap
            router-link.icon-menu(to="/")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-home")
                p 홈

            a.icon-menu(:href="`https://mail.google.com/mail/u/${encodedEmail}/?authuser=${encodedEmail}&login_hint=${encodedEmail}`" target="_blank")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-mail")
                p 이메일

            router-link.icon-menu(to="/approval/request-audit" @click="closePopup")
                .icon(style="padding-bottom:6px")
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-approval")
                p 전자결재

            router-link.icon-menu(to="/newsletter-category" @click="closePopup")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-campaign")
                p 공지사항

            router-link.icon-menu(to="/mypage/edit-myinfo" @click="closePopup")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-account-circle-fill")
                p 마이페이지

            router-link.icon-menu(v-if="user.access_group < 99" to="/commute/commute-record" @click="closePopup")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-work-history")
                p 근태 관리

            router-link.icon-menu(v-if="user.access_group < 99" to="/list-employee" @click="closePopup")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-groups")
                p 직원 목록

            router-link.icon-menu(to="/organigram" @click="closePopup")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-account-tree")
                p 조직도

            router-link.icon-menu(v-if="user.access_group > 98" to="/admin/list-divisions" @click="closePopup")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-settings")
                p 마스터 페이지

            .icon-menu(@click="logout")
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-logout")
                p 로그아웃
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { onUnmounted, onMounted, ref, watch } from 'vue';
import { user, profileImage, encodedEmail } from '@/user.ts';
import { skapi, resetBadgeCount } from '@/main.ts';
import { toggleOpen } from '@/components/navbar.ts';
import { realtimes, readList, unreadCount, readNoti, unreadEmailNotiMsg } from '@/notifications.ts';
import { openGmailAppOrWeb } from '@/utils/mail.ts';
import { goToAuditDetail } from '@/audit.ts';

import Tooltip from '@/components/tooltip.vue';

const router = useRouter();
const route = useRoute();

let btnNoti = ref(null);
let btnProfile = ref(null);
let btnMobileMenu = ref(null);
let isNotiOpen = ref(false);
let isProfileOpen = ref(false);
let isMobileMenuOpen = ref(false);

function formatTimeAgo(timestamp) {
    const now = Date.now(); // 현재 시간 (밀리초)
    const difference = now - timestamp; // 시간 차이 (밀리초)

    const seconds = Math.floor(difference / 1000); // 초 단위로 변환
    const minutes = Math.floor(seconds / 60); // 분 단위로 변환
    const hours = Math.floor(minutes / 60); // 시간 단위로 변환
    const days = Math.floor(hours / 24); // 일 단위로 변환

    if (seconds < 60) {
        return `${seconds}초 전`;
    } else if (minutes < 60) {
        return `${minutes}분 전`;
    } else if (hours < 24) {
        return `${hours}시간 전`;
    } else {
        return `${days}일 전`;
    }
}

let openNotification = () => {
    console.log(realtimes.value);
    isNotiOpen.value = !isNotiOpen.value;
    resetBadgeCount();
};

let closeNotificatiRouter = () => {
    isNotiOpen.value = false;
};

let closePopupOutside = (event) => {
    if (isNotiOpen.value && !btnNoti.value.contains(event.target)) {
        isNotiOpen.value = false;
    } else if (isProfileOpen.value && !btnProfile.value.contains(event.target)) {
        isProfileOpen.value = false;
    } else if (isMobileMenuOpen.value && !btnMobileMenu.value.contains(event.target)) {
        isMobileMenuOpen.value = false;
    }
};

let closeProfileRouter = () => {
    isProfileOpen.value = false;
};

let closePopup = () => {
    isNotiOpen.value = false;
    isProfileOpen.value = false;
    isMobileMenuOpen.value = false;
};

onMounted(() => {
    document.addEventListener('click', closePopupOutside);
    router.beforeEach((to, from, next) => {
        closeNotificatiRouter();
        closeProfileRouter();
        closePopup();
        next();
    });
});

onUnmounted(() => {
    document.removeEventListener('click', closePopupOutside);
});

let showRealtimeNoti = (e, type, rt) => {
    console.log('rt : ', rt);

    if (type === 'gmail') {
        openGmailAppOrWeb(null);
    } else if (type === 'realtime' && rt.audit_info) {
        if (rt.audit_info.audit_type === 'comment' || rt.audit_info.audit_type === 'reply') {
            goToAuditDetail(e, rt.audit_info.audit_doc_id, router);
            readNoti(rt);
        } else {
            goToAuditDetail(e, rt.audit_info.audit_doc_id, router);
            readNoti(rt);
        }
    } else if (type === 'realtime' && rt.news_info) {
        if (rt.news_info.news_id && rt.news_info.news_refer) {
            router.push({
                path: `/newsletter-detail/${rt.news_info.news_id}`,
                query: {
                    category: rt.news_info.news_refer
                }
            });

            // 알림을 읽음 처리 (readNoti 함수가 존재한다면)
            if (typeof readNoti === 'function') {
                readNoti(rt);
            }
        } else {
            console.error('필요한 정보가 부족합니다:', {
                newsId: rt.news_info.news_id,
                category: rt.news_info.news_refer
            });
        }
    }
};

let logout = () => {
    skapi.logout().then(() => {
        router.push({ path: '/login' });
    });
};

watch(
    () => route.path,
    (newPath, oldPath) => {
        if (newPath) {
            if (isProfileOpen.value) {
                isProfileOpen.value = !isProfileOpen.value;
            }
        }
    }
);
</script>

<style scoped lang="less">
#header {
    width: 100%;
    height: var(--header-height);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
    transition: padding 0.15s linear;
    transition: top 0.3s;
    z-index: 9999;
    border-bottom: 1px solid var(--gray-color-300);

    .img-logo {
        img {
            width: 200px;
        }
    }

    .btn-wrap {
        display: flex;
        align-items: center;
        justify-content: center;

        .icon {
            cursor: pointer;
            padding: 0;

            svg {
                fill: var(--gray-color-300);
            }

            &:hover:not(.nohover) {
                svg {
                    fill: var(--primary-color-400);
                }
            }

            &.active {
                svg {
                    fill: var(--primary-color-400);
                }
            }
        }
    }

    .btn-mo-navbar {
        display: none;
        margin-right: auto;
    }

    .btn-noti {
        // width: 2.75rem;
        // height: 2.75rem;
        // background-color: var(--primary-color-100);
        position: relative;
        // margin-right: 2rem;
        // border-radius: 0.5rem;
        // border-radius: 50%;

        &::after {
            content: attr(data-count);
            display: inline-block;
            position: absolute;
            // top: -0.5rem;
            // right: -14px;
            // min-width: 1.625rem;
            // height: 1.625rem;
            // line-height: 1.625rem;
            top: -8px;
            right: 4px;
            width: 20px;
            height: 20px;
            line-height: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            color: #fff;
            background-color: var(--primary-color-400);
            // padding: 0 0.3125rem;
            // border-radius: 0.75rem;
            // padding: 0 4px;
            border-radius: 50%;
            text-align: center;
        }
    }

    .icon-bell {
        svg {
            fill: var(--primary-color-400);
        }
    }

    .btn-profile {
        flex: none;
        height: 3rem;
        // border-radius: 0.5rem;
        border-radius: 30px;
        background: linear-gradient(90.25deg,
                var(--primary-color-400) 5%,
                var(--primary-color-300) 98%);
        color: #fff;
        font-size: 1rem;
        font-weight: 600;
        padding-left: 1.25rem;
        // padding-right: 2.75rem;
        padding-right: 3.75rem;
        position: relative;
        // margin-right: 1rem;
        user-select: none;
        cursor: pointer;
    }

    .thumbnail {
        width: 2.5rem;
        height: 2.5rem;
        // border: 0.1875rem solid #fff;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        // padding: 0 1rem;
        transition: padding 0.15s linear;
        transition: top 0.3s;
        z-index: 9999;
        // box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.3);
        border-bottom: 1px solid var(--gray-color-300);
        overflow: hidden;

        .img-logo {
            img {
                height: 2.5rem;
            }
        }

        .btn-wrap {
            display: flex;
            align-items: center;
            justify-content: center;

            .icon {
                cursor: pointer;
                padding: 0;

                svg {
                    fill: var(--gray-color-300);
                }

                &:hover:not(.nohover) {
                    svg {
                        fill: var(--primary-color-400);
                    }
                }

                &.active {
                    svg {
                        fill: var(--primary-color-400);
                    }
                }
            }
        }

        .btn-mo-navbar {
            display: none;
            margin-right: auto;
        }

        .btn-noti {
            // width: 2.75rem;
            // height: 2.75rem;
            // background-color: var(--primary-color-100);
            position: relative;
            // margin-right: 2rem;
            // border-radius: 0.5rem;
            // border-radius: 50%;

            &::after {
                content: attr(data-count);
                display: inline-block;
                position: absolute;
                // top: -0.5rem;
                // right: -14px;
                // min-width: 1.625rem;
                // height: 1.625rem;
                // line-height: 1.625rem;
                top: -8px;
                right: 4px;
                width: 20px;
                height: 20px;
                line-height: 20px;
                font-size: 0.75rem;
                font-weight: 700;
                color: #fff;
                background-color: var(--primary-color-400);
                // padding: 0 0.3125rem;
                // border-radius: 0.75rem;
                // padding: 0 4px;
                border-radius: 50%;
                text-align: center;
            }
        }

        .icon-bell {
            svg {
                fill: var(--primary-color-400);
            }
        }

        .btn-profile {
            flex: none;
            height: 3rem;
            // border-radius: 0.5rem;
            border-radius: 30px;
            background: linear-gradient(90.25deg,
                    var(--primary-color-400) 5%,
                    var(--primary-color-300) 98%);
            color: #fff;
            font-size: 1rem;
            font-weight: 600;
            padding-left: 1.25rem;
            // padding-right: 2.75rem;
            padding-right: 3.75rem;
            position: relative;
            // margin-right: 1rem;
            user-select: none;
            cursor: pointer;
        }

        .thumbnail {
            width: 2.5rem;
            height: 2.5rem;
            margin-left: 0.5rem;
            // border: 0.1875rem solid #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            // position: absolute;
            // top: 0;
            // right: -4px;
            // background: var(--primary-color-100) url(../images/header/thumb_profile_default.png)
            // center/cover no-repeat;
            background: #f4f4f5 url(../images/header/thumb_profile_default.png) center/cover no-repeat;
            overflow: hidden;

            img {
                width: 100%;
                height: 100%;
                // object-fit: contain;
                object-fit: cover;
                z-index: 1;
                position: relative;
            }

            svg {
                fill: var(--gray-color-400);
            }
        }
    }
}

#popup {
    position: fixed;
    // right: 52px;
    right: 20px;
    min-width: 200px;
    border: 1px solid var(--gray-color-400);
    top: var(--header-height);
    background-color: #fff;
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 1px 1px 20px 0px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    z-index: 9999;
    padding: 1rem;

    .popup-header {
        display: flex;
        align-items: center;
        // padding: 0.9rem;
        // gap: 1rem;
        // padding-bottom: 0.9rem;
        // border-bottom: 1px solid var(--gray-color-200);
        // background-color: #f4f4f5;
        // border: 1px solid var(--gray-color-200);
        border-radius: 12px;

        .image {
            width: 64px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--gray-color-100);
            border-radius: 50%;
            overflow: hidden;
            flex: none;
        }

        .content {
            padding: 0.7rem;

            .user {
                display: flex;
                flex-wrap: wrap;
                align-items: end;
                gap: 0.5rem;

                h4 {
                    color: var(--primary-color-400);
                }

                span {
                    color: var(--gray-color-400);
                    font-size: 0.7rem;
                }
            }

            p {
                margin-top: 0.5rem;
                font-size: 0.75rem;
                word-break: break-all;
            }

            .ip {
                color: var(--gray-color-400);
            }
        }
    }

    .popup-main {

        // padding: 0 0.8rem;
        ul {
            li {
                // border-top: 1px solid var(--gray-color-200);
                font-size: 0.8rem;
                cursor: pointer;

                &:first-child {
                    border-top: unset;
                }

                .icon {
                    padding-left: 0;
                }
            }
        }

        .router {
            display: flex;
            align-items: center;
            // justify-content: space-between;
            padding: 0.7rem;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;

            &:hover {
                background-color: var(--primary-color-100);
            }

            &.read {
                opacity: 0.5;
            }

            // .right {
            // 	display: flex;
            // 	align-items: center;
            // 	gap: 10px;
            // }
        }
    }

    &.notification {
        // right: 124px;
        right: 355px;
        max-width: 420px;
        width: calc(100% - 16px);

        .popup-header {
            margin-bottom: 0.5rem;
            padding: 0.5rem 0.5rem 0;

            .title {
                font-size: 1.1rem;
            }
        }

        .popup-main {
            ul {
                max-height: 228px;
                overflow-y: scroll;

                &::-webkit-scrollbar {
                    width: 8px;
                }

                &::-webkit-scrollbar-thumb {
                    background-color: #ccc;
                    /* 스크롤 핸들 색상 */
                    border-radius: 8px;
                }

                &::-webkit-scrollbar-track {
                    background: transparent;
                    /* 스크롤 트랙 배경 */
                    border-radius: 4px;
                }

                &::-webkit-scrollbar-thumb:hover {
                    background-color: #999;
                    /* 마우스 호버 시 색상 */
                }
            }

            a,
            button {
                transition: none;

                &:hover,
                &:active,
                &:focus {
                    transition: none;
                }
            }

            .router {
                // padding-left: 30px;
                // padding-right: 30px;
                gap: 0.8rem;

                &:hover {
                    background-color: var(--primary-color-100);

                    .icon {
                        svg {
                            fill: var(--gray-color-400);
                        }
                    }
                }

                >* {
                    white-space: nowrap;
                }
            }

            .noti-type {
                font-size: 0.8rem;
                // color: var(--gray-color-600);
            }

            .noti-title {
                font-size: 16px;
                font-weight: 500;
                overflow: hidden;
                text-overflow: ellipsis;
                // width: 330px;
            }

            .noti-sender {
                font-size: 0.8rem;
                font-weight: 500;
                overflow: hidden;
                text-overflow: ellipsis;
                color: var(--gray-color-600);
            }

            .upload-time {
                font-size: 0.7rem;
                font-weight: 500;
                color: var(--gray-color-600);
                flex: none;
                margin-left: auto;
            }

            .icon {
                flex: none;

                svg {
                    fill: #fff;
                }
            }
        }

        .popup-bottom {
            border-top: 1px solid var(--gray-color-200);
        }

        .icon {
            padding-left: 0;
        }
    }
}

.router {
    display: flex;
    align-items: center;
    // justify-content: space-between;
    padding: 0.7rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;

    &:hover {
        background-color: var(--primary-color-100);
    }

    &.read {
        opacity: 0.5;
    }
}

&.notification {
    // right: 124px;
    right: 355px;
    max-width: 420px;
    width: calc(100% - 16px);

    .popup-header {
        // padding: 34px 30px 24px;
        // border-bottom: 1px solid var(--gray-color-300);
        margin-bottom: 0.5rem;
        padding: 0.5rem 0.5rem 0;

        .title {
            font-size: 1.1rem;
        }
    }

    .popup-main {
        // padding-bottom: 1.1rem;

        ul {
            max-height: 228px;
            overflow-y: scroll;

            &::-webkit-scrollbar {
                width: 8px;
            }

            &::-webkit-scrollbar-thumb {
                background-color: #ccc;
                /* 스크롤 핸들 색상 */
                border-radius: 8px;
            }

            &::-webkit-scrollbar-track {
                background: transparent;
                /* 스크롤 트랙 배경 */
                border-radius: 4px;
            }

            &::-webkit-scrollbar-thumb:hover {
                background-color: #999;
                /* 마우스 호버 시 색상 */
            }

            li {
                // border-top: none;

                // &:first-child {
                // 	padding-top: 0.5rem;
                // }
            }
        }

        a,
        button {
            transition: none;

            &:hover,
            &:active,
            &:focus {
                transition: none;
            }
        }

        .router {
            // padding-left: 30px;
            // padding-right: 30px;
            gap: 0.8rem;

            &:hover {
                background-color: var(--primary-color-100);

                .icon {
                    svg {
                        fill: var(--gray-color-400);
                    }
                }
            }

            >* {
                white-space: nowrap;
            }
        }

        .noti-type {
            font-size: 0.8rem;
            // color: var(--gray-color-600);
        }

        .noti-title {
            font-size: 16px;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            // width: 330px;
        }

        .noti-sender {
            font-size: 0.8rem;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--gray-color-600);
        }

        .upload-time {
            font-size: 0.7rem;
            font-weight: 500;
            color: var(--gray-color-600);
            flex: none;
        }

        .icon {
            flex: none;

            svg {
                fill: #fff;
            }
        }
    }

    .popup-bottom {
        border-top: 1px solid var(--gray-color-200);
    }

    .icon {
        padding: 0;

        svg {
            width: 16px;
            height: 16px;
        }
    }

    .view-all {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        padding: 24px 0;
        margin: 0 30px;

        p {
            font-size: 14px;
            font-weight: 600;
        }

        .icon {
            svg {
                width: 12px;
                height: 12px;
                fill: var(--gray-color-900);
            }
        }
    }

    .no-noti {
        padding: 0 30px 24px;
        min-height: 200px;

        .title {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 4px;
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--gray-color-500);
            line-height: 200px;
        }

        .icon {
            svg {
                fill: var(--gray-color-500);
            }
        }
    }
}

&.profile {
    padding: 8px;
}

&.menu {
    padding: 0;

    .icon-menu-wrap {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        gap: 0.5rem;

        .icon-menu {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            gap: 0.5rem;
            padding: 0.8rem 0.4rem;
            border-radius: 16px;

            &:hover {
                background-color: var(--primary-color-50);
            }

            .icon {
                height: 2rem;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;

                svg {
                    width: 30px;
                    height: 30px;
                }
            }

            p {
                font-size: 0.9rem;
                text-align: center;
                word-break: keep-all;
            }
        }
    }
}

.noti-comment {
    font-size: 0.8rem;
    color: var(--gray-color-500);
    margin: 0.25rem 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

@media (max-width: 768px) {
    #header {
        padding-left: 16px;
        padding-right: 16px;

        .btn-wrap {
            >*:not(.btn-mo-navbar) {
                display: none;
            }
        }

        .thumbnail {
            display: none;
        }

        .btn-mo-navbar {
            display: block;
        }

        #popup {
            right: 16px;

            &.notification {
                right: 50%;
                transform: translateX(50%);

                .popup-header {
                    padding: 30px 20px 18px;
                }

                .popup-main {
                    .router {
                        padding-left: 20px;
                        padding-right: 20px;
                    }
                }

                .view-all {
                    padding: 24px 0;
                    margin: 0 24px;
                }
            }
        }

        .btn-mo-navbar {
            display: block;
        }
    }

    #popup {
        right: 16px;

        &.notification {
            right: 50%;
            transform: translateX(50%);

            .popup-header {
                padding: 30px 20px 18px;
            }

            .popup-main {
                .router {
                    padding-left: 20px;
                    padding-right: 20px;
                }
            }

            .view-all {
                padding: 24px 0;
                margin: 0 24px;
            }
        }
    }
}

@media (max-width: 576px) {
    #header {
        .btn-noti {
            margin-right: 1.5rem;
        }

        .btn-profile {
            .hello {
                display: none;
            }
        }
    }
}

@media (max-width: 400px) {
    #popup {
        right: 8px;
        width: calc(100% - 16px);

        &.profile {
            right: 50%;
            transform: translateX(50%);
            width: calc(100% - 16px);
        }
    }
}
</style>
