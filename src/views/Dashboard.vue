<template lang="pug">
    #dashboard
        .warning-msg(v-if="serviceWorkerRegistMsg")
            .icon
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-error-outline")
            p {{ serviceWorkerRegistMsg }}
    
    
        .warning-msg(v-if="notificationNotWorkingMsg")
            .icon
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-error-outline")
            p {{ notificationNotWorkingMsg }}
    
        template(v-if="onlyUserGesture")
            button.btn(@click="setNotificationPermission") 그룹웨어 알림 허용하기

            br
    
        .profComp-wrap
            .box-shadow-card.profile-wrap
                .thumbnail(ref="btnProfile" @click="openProfile")
                    template(v-if="profileImage")
                        img(:src="profileImage" alt="img-profile")
                    template(v-else)
                        .icon
                            svg
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-person")
                .name {{ user.name }}
                .division {{ userPositionCurrent.length > 0 ? divisionNameList[userPositionCurrent[0].divisionId] + ' / ' + userPositionCurrent[0].position + ' 외 ' + (userPositionCurrent.length - 1) + '개'  : userPositionCurrent[0] }}
                br
                .buttons(v-if="system_worktime")
                    button.btn.sm.bg-gray(v-if="todayWorkStarting && todayWorkEnding" type="button" :disabled="todayWorkStarting && todayWorkEnding" style="display:inline-block;font-size:0.7rem;") 내일 봬요 :)
                    button.btn.sm(v-else-if="!todayWorkStarting" type="button" :disabled="todayWorkStarting && todayWorkEnding" style="display:inline-block;font-size:0.7rem;" @click="checkCommuteRecord") 출근
                    button.btn.sm.bg-gray(v-else type="button" style="display:inline-block;font-size:0.7rem" @click="checkCommuteRecord") 퇴근
    
            .box-shadow-card.company-wrap(:class="{master: user.access_group > 98, edit: editMode}")
                img.banner-img(v-if="system_banner" :src="system_banner?.url" :style="{objectFit: system_banner_style}" alt="회사사진")
                p.desc(v-else)
                    | 안녕하세요. FGWORKS 입니다.
                    br
                    | 오늘도 좋은 하루 되세요.
                button.btn.master(type="button" @click.stop="openModal") 배너 설정
    
        .mo-btn-wrap
            .icon
                a(:href="`https://mail.google.com/mail/u/${encodedEmail}/?authuser=${encodedEmail}&login_hint=${encodedEmail}`" target="_blank")
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-mail")
                p 이메일
            .icon(:class="{'active': route.path.split('/')[1] === 'approval'}" @click="router.push('/approval/request-audit')" style="padding-bottom:6px")
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-approval")
                p 전자결재
            .icon(:class="{'active': route.path.split('/')[1] === 'newsletter'}" @click="router.push('/newsletter-category')")
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-campaign")
                p 공지사항
            .icon(v-if="user.access_group < 99" :class="{'active': route.path.split('/')[1] === 'commute'}" @click="router.push('/commute/commute-record')")
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-work-history")
                p 근태관리
            .icon(v-if="user.access_group < 99" :class="{'active': route.path.split('/')[1] === 'list-employee'}" @click="router.push('/list-employee')")
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-groups")
                p 직원목록
            .icon(:class="{'active': route.path.split('/')[1] === 'organigram'}" @click="router.push('/organigram')")
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-account-tree")
                p 조직도
            .icon(:class="{'active': route.path.split('/')[1] === 'mypage'}" @click="router.push('/mypage/edit-myinfo')")
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-person")
                p 마이페이지
            .icon.master(v-if="user.access_group > 98" :class="{'active': route.path.split('/')[1] === 'admin'}" @click="router.push('/admin/list-divisions')")
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-settings")
                p 마스터 페이지
    
        .box-shadow-card.gmail(v-if="googleAccountCheck")
            a.title-with-icon.alink(:href="`https://mail.google.com/mail/u/${encodedEmail}/?authuser=${encodedEmail}&login_hint=${encodedEmail}`" target="_blank")
                h3.title 이메일
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
    
            ul.list-wrap.mail-warp(v-if="mailList && mailList.length")
                li.list.mail(v-for="mail in mailList" :key="mail.id" @click="(e) => showMailDoc(e, mail)")
                    span.from {{ mail.from }}
                    span.title {{ mail.subject }}
                    p.cont {{ mail.snippet }}
                    span.attachment(v-if="mail.hasAttachment")
                        .icon
                            svg
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-attach-file")
                    span.date {{ mail.date }}
    
            .empty(v-else)
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-error-outline")
                | 현재 메일이 없습니다.

        //- button.btn(@click="router.push('/test')") 테스트 페이지로 이동

    #modal.modal(v-if="isModalOpen" @click="cancelBanner")
        .modal-cont(@click.stop style="min-width:unset; max-width:unset;")
            .modal-header
                h2.modal-title 배너 설정
                button.btn-close(@click="cancelBanner")
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
            .modal-body
                .style-wrap(:class="{disabled: !uploadSrc.banner_pic || bannerUploading}")
                    .style(:class="{selected: bannerStyle === 'contain'}" @click="bannerStyle = 'contain'")
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-expand")
                    .style(:class="{selected: bannerStyle === 'cover'}" @click="bannerStyle = 'cover'")
                        svg(style="transform:rotate(90deg)")
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-expand")
                    .style(:class="{selected: bannerStyle === 'fill'}" @click="bannerStyle = 'fill'")
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-zoom-out-map")
                    .style(:class="{selected: bannerStyle === 'none'}" @click="bannerStyle = 'none'")
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-aspect-ratio")
                input#banner_pic(ref="banner_pic_input" type="file" name="banner_pic" accept="image/*" @change="openCropImageDialog" style="opacity: 0;width: 0;height: 0;position: absolute;")
                .image-wrap(:class="{opacity: bannerUploading}" :style="{width: `${modalWidth}px`}" style="display: inline-block")
                    img#banner_img(v-if="uploadSrc.banner_pic && !openCropModal" :src="uploadSrc.banner_pic" :style="{objectFit: bannerStyle}" alt="배너 이미지")
                    .upload(v-if="bannerUploading")
                        Loading
                    button.btn.upload(v-else :class="{'bg-gray': uploadSrc.banner_pic}" @click="uploadFile") 
                        template(v-if="!uploadSrc.banner_pic") 사진 등록
                        template(v-else) 사진 변경
                CropImage(:open="openCropModal" :imageSrc="currentImageSrc" :aspectRatio="'NaN'" @cropped="setCroppedImage" @close="closeCropImageDialog")
            .modal-footer
                button.btn.bg-gray.btn-cancel(type="button" :disabled="bannerUploading" @click="cancelBanner") 취소
                button.btn.btn-register(type="submit" :disabled="!uploadSrc.banner_pic || bannerUploading" @click="uploadBanner") 등록
    </template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { computed, onMounted, ref } from 'vue';
import { user, profileImage, getUserPositionCurrent, userPositionCurrent } from '@/user.ts';
import {
    skapi,
    newVersionAvailable,
    newVersion,
    applyUpdate,
    getSystemBanner,
    system_banner,
    isUpdateLoading,
    getSystemBannerId,
    system_banner_style
} from '@/main.ts';
import { convertTimestampToDateMillis } from '@/utils/time.ts';
import { openGmailAppOrWeb } from '@/utils/mail.ts';
import { divisionNameList } from '@/division.ts';
import {
    mailList,
    serviceWorkerRegistMsg,
    notificationNotWorkingMsg,
    onlyUserGesture,
    setNotificationPermission
} from '@/notifications.ts';
import {
    openCropModal,
    croppedImages,
    uploadSrc,
    currentImageSrc,
    resetCropImage,
    openCropImageDialog,
    closeCropImageDialog,
    setCroppedImage,
    currentTargetId
} from '@/components/crop_image.ts';
import {
    system_worktime,
    getSystemWorktime,
    getMyWorktimeStorage,
    todayWorkStarting,
    todayWorkEnding,
    startWork,
    endWork
} from '@/views/commute/worktime.ts';

import Loading from '@/components/loading.vue';
import CropImage from '@/components/crop_image.vue';

const router = useRouter();
const route = useRoute();

let loading = ref(false);
let editMode = ref(false);
let isModalOpen = ref(false);
let bannerUploading = ref(false);
let banner_pic_input = ref(null);
let bannerStyle = ref('contain');
let modalWidth = ref(0);
let googleAccountCheck = localStorage.getItem('accessToken') ? true : false;

const encodedEmail = encodeURIComponent(user.email);

let uploadFile = () => {
    banner_pic_input.value.click();
};

let cancelBanner = () => {
    resetCropImage();
    bannerStyle.value = system_banner_style.value || 'contain';
    isModalOpen.value = false;
};

let uploadBanner = async () => {
    if (!getSystemBannerId.value && !croppedImages.value['banner_pic']) {
        alert('배너 이미지를 등록해주세요.');
        return;
    }

    if (
        bannerStyle.value !== system_banner_style.value &&
        system_banner.value.url &&
        !croppedImages.value['banner_pic']
    ) {
        currentTargetId.value = 'banner_pic';
        await setCroppedImage(system_banner.value.url);
    }

    bannerUploading.value = true;

    if (getSystemBannerId.value) {
        await skapi
            .deleteRecords({
                record_id: getSystemBannerId.value,
                table: {
                    name: 'system_banner',
                    access_group: 1
                }
            })
            .catch((err) => {
                alert('배너 업로드 중 오류 발생');
                return;
            });
    }

    const croppedFile = new File([croppedImages.value['banner_pic']], 'banner_pic.png', {
        type: croppedImages.value['banner_pic'].type
    });

    const imgFormData = new FormData();
    imgFormData.append('banner_pic', croppedFile);
    imgFormData.append('banner_style', bannerStyle.value);

    await skapi
        .postRecord(imgFormData, {
            table: {
                name: 'system_banner',
                access_group: 1
            }
        })
        .then((res) => {
            alert('배너 업로드 성공');
            getSystemBanner(true);
        })
        .catch((err) => {
            alert('배너 업로드 중 오류 발생');
        })
        .finally(() => {
            bannerUploading.value = false;
            cancelBanner();
        });
};

let openModal = (e) => {
    let parentElement = document.querySelector('.company-wrap');

    // parentNode의 width 값을 가져와서 모달 안에 .image-wrap의 width을 설정
    modalWidth.value = parentElement.offsetWidth;

    if (system_banner.value?.url) {
        uploadSrc.value.banner_pic = system_banner.value?.url;
        bannerStyle.value = system_banner_style.value || 'contain';
    }

    isModalOpen.value = true;
};

let showMailDoc = (e, rt) => {
    openGmailAppOrWeb(rt.link, rt.id);
};

let checkCommuteRecord = async () => {
    if (todayWorkStarting.value) {
        await endWork(router);
    } else {
        await startWork(router);
    }
};

onMounted(async () => {
    await Promise.all([getUserPositionCurrent(), getSystemWorktime(), getMyWorktimeStorage()]);
});
</script>

<style scoped lang="less">
#dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}

#modal {
    .image-wrap {
        position: relative;
        width: 100%;
        height: 250px;
        border-radius: 16px;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);

        &.opacity {
            &::after {
                position: absolute;
                width: 100%;
                height: 100%;
                left: 0;
                top: 0;
                content: '';
                background-color: rgba(255, 255, 255, 0.7);
                transition: all 0.3s;
            }
        }

        #banner_img {
            width: 100%;
            height: 100%;
            border-radius: 16px;
        }

        .upload {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1;
        }
    }

    .style-wrap {
        margin-bottom: 0.5rem;

        &.disabled {
            opacity: 0.5;
            pointer-events: none;
        }

        .style {
            display: inline-block;
            padding: 0 8px;
            cursor: pointer;

            svg {
                width: 24px;
                height: 24px;
                fill: var(--gray-color-300);
            }

            &.selected {
                svg {
                    fill: var(--primary-color-400);
                }
            }
        }
    }
}

.updateLink {
    color: var(--primary-color-400);
    text-decoration: underline;
    cursor: pointer;
}

.box-shadow-card {
    min-height: 250px;
    background-color: #fff;
    border: 1px solid var(--gray-color-300);
    box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.3);
    border-radius: 16px;
    padding: 1.5rem;

    .title-with-icon {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;

        .icon {
            padding: 0;
        }

        &.alink {
            cursor: pointer;

            .icon {
                svg {
                    fill: var(--gray-color-300);
                }
            }

            &:hover {
                .icon {
                    svg {
                        fill: var(--primary-color-400);
                    }
                }
            }
        }
    }
}

.gmail {
    padding: 0;

    .title-with-icon {
        padding: 1.5rem;
        background-color: unset;
    }
}

.profComp-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;

    >div {
        padding: 1.5rem;
        text-align: center;
    }

    .profile-wrap {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .thumbnail {
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
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

        .division {
            font-size: 0.8rem;
            color: var(--gray-color-500);
            margin-top: 0.5rem;
        }
    }

    .company-wrap {
        position: relative;
        height: 250px;
        flex-grow: 3;
        overflow: hidden;
        padding: 0;

        &::before {
            position: absolute;
            width: 100%;
            height: 100%;
            left: 0;
            top: 0;
            content: '';
            background-color: rgba(0, 0, 0, 0.2);
            transition: all 0.3s;
            opacity: 0;
        }

        .desc {
            margin-top: 95px;
            line-height: 1.5;
            color: var(--gray-color-400);
            font-size: 0.9rem;
        }

        .banner-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 16px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
        }

        .btn,
        .upload-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: max-content;
        }

        .master {
            display: none;
        }

        .edit-icon-wrap {
            position: absolute;
            width: 100%;
            left: 0;
            top: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        &.master {
            &:hover {
                &::before {
                    opacity: 1;
                }

                .btn.master {
                    display: block;
                }
            }
        }

        &.edit {
            &:hover {
                &::before {
                    opacity: 0;
                }
            }
        }
    }
}

.mo-btn-wrap {
    display: none;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    justify-content: center;

    .icon {
        width: 140px;
        height: 140px;
        min-width: 140px;
        flex-grow: 1;
        display: flex;
        flex-wrap: wrap;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--gray-color-300);
        box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.3);
        border-radius: 1rem;
        background-color: #fff;
        cursor: pointer;
        gap: 8px;

        &.master {
            // width: 100%;
        }
    }
}

.warning-msg {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    line-height: 1.2;
    margin-bottom: 1rem;

    .icon {
        padding: 0;
        flex: none;
        position: relative;
        top: 2px;

        svg {
            width: 16px;
            height: 16px;
            fill: var(--warning-color-400);
        }
    }

    p {
        font-size: 0.8rem;
        color: var(--warning-color-500);
    }
}

.list-wrap {
    .list {
        border-bottom: 1px solid var(--gray-color-100);

        &:last-child {
            border-bottom: none;
        }
    }
}

.mail {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    line-height: 1.2;
    color: var(--gray-color-500);

    >* {
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
    }

    &:hover {
        background-color: var(--primary-color-25);
    }

    .from {
        font-weight: 600;
        color: var(--gray-color-900);
        flex: none;
        width: 100px;
    }

    .title {
        font-weight: 600;
        color: var(--gray-color-900);
    }

    .cont {
        font-size: 0.75rem;
        color: var(--gray-color-400);
        margin-right: 1rem;
        flex: 1;
    }

    .attachment {
        .icon {
            svg {
                width: 1rem;
                height: 1rem;
                fill: var(--gray-color-400);
            }
        }
    }

    .date {
        font-size: 0.75rem;
        margin-left: auto;
        flex: none;
    }
}

.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1.5rem;
    font-size: 0.9rem;
    line-height: 1.2;
    color: var(--gray-color-400);

    .icon {
        padding: 0;

        svg {
            width: 20px;
            height: 20px;
            fill: var(--gray-color-400);
        }
    }
}

@media (max-width: 768px) {
    .box-shadow-card {
        min-height: unset;
    }

    .profComp-wrap {
        .profile-wrap {
            position: relative;
            border: 0;
            box-shadow: none;
            height: unset;
            align-items: end;
            padding-right: 4rem;

            .thumbnail {
                position: absolute;
                top: 50%;
                right: 0;
                transform: translateY(-50%);
            }
        }

        .company-wrap {
            display: none;
        }
    }

    .mo-btn-wrap {
        display: flex;
        gap: 0.5rem;
    }

    .gmail {
        display: none !important;
    }
}
</style>
