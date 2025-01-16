<template lang="pug">
template(v-if="mails")
    ul.card-wrap.gmail
        //- li.card
        //-     router-link.router(to="/")
        //-         .icon.img
        //-             svg
        //-                 use(xlink:href="@/assets/icon/material-icon.svg#icon-mail")
        //-         h4.name 메일
        //-         .btn-wrap
        //-             p.btn-go 바로가기
        //-             .icon
        //-                 svg
        //-                     use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

        li.card
            .title-wrap
                h3.title 
                    .icon.img
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-mail")
                    | 안읽은 메일
                a.go-detail(:href="'https://mail.google.com/mail/u/0/#inbox'" target="_blank") 메일 더보기
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
            ul.unread-mail
                li.mail(v-for="mail in mails" :key="mail.id")
                    a.link(:href="mail.link" target="_blank")
                        span.from {{ mail.from }}
                        span.mail-title {{ mail.subject }}
                        p.mail-cont {{ mail.snippet }}
                        span.attachment(v-if="mail.hasAttachment")
                            .icon
                                svg
                                    use(xlink:href="@/assets/icon/material-icon.svg#icon-attach-file")
                        span.mail-date {{ mail.date }}

ul.card-wrap
    li.card
        router-link.router(to="/approval")
            .icon.img
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-approval")
            h4.name 전자결재
            .btn-wrap
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
    li.card
        router-link.router(to="/mypage")
            .icon.img
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-account-circle-fill")
            h4.name 마이페이지
            .btn-wrap
                p.btn-go 바로가기
                .icon
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
    li.card
        template(v-if="user.access_group > 98")
            router-link.router(to="/admin")
                .icon.img
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-settings")
                h4.name 마스터 페이지
                .btn-wrap
                    p.btn-go 바로가기
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

        template(v-else)
            router-link.router(to="/list-employee")
                .icon.img
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-groups")
                h4.name 직원 목록
                .btn-wrap
                    p.btn-go 바로가기
                    .icon
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { skapi } from "@/main";
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { user } from "@/user";
import { fetchGmailEmails } from "@/utils/mail";
import { notifications, addEmailNotification } from "@/notifications";

const router = useRouter();
const route = useRoute();

const mails = ref(null);
let emailCheckInterval;  // interval 저장용 변수

// 이메일 업데이트
async function updateEmails() {
    const accessToken = sessionStorage.getItem('accessToken');
    
    if (accessToken) {
        try {
            const res = await fetchGmailEmails(accessToken);
            mails.value = res;

            // console.log('=== updateEmails === res : ', res);
        } catch (error) {
            console.error('=== updateEmails === error : ', {error});
        }
    }
}

onMounted(async () => {
    await updateEmails();
    
    // 30초마다 이메일 업데이트
    emailCheckInterval = setInterval(() => {
        updateEmails();
    }, 10000);
});

// 컴포넌트 언마운트 시 인터벌 정리
onUnmounted(() => {
    if (emailCheckInterval) {
        clearInterval(emailCheckInterval);
    }
});

// 컴포넌트 마운트 시 이메일 업데이트 되는 거에 따른 mails.value 변경 감지
watch(mails, (newVal, oldVal) => {
    console.log('=== watch === newVal : ', newVal);
    console.log('=== watch === oldVal : ', oldVal);
    console.log('========== 확인 !! ==========')

    if(!newVal || !oldVal) {
        return;
    }

    if(newVal[0].dateTimeStamp > oldVal[0].dateTimeStamp) {
        console.log('=== watch === new email');
        addEmailNotification(newVal[0]);
    } else {
        console.log('=== watch === no new email');
    }
});
</script>

<style scoped lang="less">
.wrap {
    padding: 3rem 2.4rem 0;
}

.fold {
    .wrap {
        padding: 3rem 2.4rem 0;
    }
}

.card-wrap {
    &.gmail {
        display: flex;

        .card {
            padding: 1.5rem;
            transition: none;
            width: 100%;

            &:hover {
                transform: none;
                box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.05);
            }
        }

        .title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .go-detail {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.875rem;
            color: var(--gray-color-500);
        }

        .icon.img {
            svg {
                width: 1.5rem;
                height: 1.5rem;
                margin: 0;
            }
        }

        .mail {
            border-top: 1px solid var(--gray-color-200);
            padding: 0.75rem 0.5rem;

            &:hover {
                background-color: var(--primary-color-25);
            }
        }

        .link {
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 0.875rem;
            line-height: 1.2;
            color: var(--gray-color-500);

            > * {
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 1;
                -webkit-box-orient: vertical;
            }
        }

        .from {
            font-weight: 600;
            color: var(--gray-color-900);
            flex: none;
            width: 100px;
        }

        .mail-title {
            font-weight: 600;
            color: var(--gray-color-900);
        }

        .mail-cont {
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

        .mail-date {
            font-size: 0.75rem;
            margin-left: auto;
            flex: none;
        }
    }

    .title-wrap {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
    }
}

@media (max-width: 1200px) {
    .wrap {
        padding-top: 3rem;
    }
}

@media (max-width: 768px) {
    .card-wrap {
        &.gmail {
            .from,
            .mail-cont {
                display: none;
            }
        }
    }
}
</style>