<template lang="pug">
#verification
    template(v-if="step === 1")
        router-link.logo(to="/login")
            //- img(src="@/assets/img/img_logo_symbol.png")
            p 로고영역

        h2.title 이메일 인증
        p.desc 이메일 인증을 위해 #[strong {{ user.email }}] 로 전송된 인증 코드를 입력해주세요.

        form(@submit.prevent="verifyEmail")
            .input-wrap
                p.label 6자리 인증 코드
                .input
                    input(type="text" name="code" ref="codeField" @input="e => {e.target.setCustomValidity('');}" placeholder="6자리 코드" required)
                    button.btn.outline.btn-resend(:disabled="resending" @click="resend") 코드 재전송

            .button-wrap
                button.btn.bg-gray.btn-back(type="button" @click="router.push('/mypage/edit-myinfo')") 이전
                button.btn.btn-request-code(type="submit") 인증하기

    template(v-else)
        h2.title 이메일 인증 완료
        p.desc 
            | 이메일 인증이 완료되었습니다.
            br
            | 메인 화면으로 이동하여 서비스를 이용해주세요.
        
        br
        br
        br
        br

        button.btn.btn-go-login(@click="router.push('/mypage/edit-myinfo')") 마이페이지 화면으로
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { skapi } from "@/main.ts";
import { user } from "@/user.ts";
import { ref } from 'vue';

const router = useRouter();
const route = useRoute();

let step = ref(1);
let error = ref('');
let resending = ref(false);

let resend = () => {
    resending.value = true;
    skapi.verifyEmail();

    setTimeout(() => {
        resending.value = false;
    }, 30000);
}

let verifyEmail = (e) => {
    skapi.verifyEmail(e).then(() => {
        step.value++;
    }).catch(err => error = err.message);
}
</script>

<style scoped lang="less">
#verification {
    max-width: 500px;
    margin: 0 auto;
    padding: 0 1rem;

    height: 100vh;
    min-height: calc(100vh - 4.7244rem);
    display: flex;
    justify-content: center;
    position: relative;
    flex-direction: column;
    // top: 2.3622rem;

    .logo {
        display: block;
        margin-bottom: 1.5rem;
    }

    .title {
        // font-size: 1.5rem;
        margin-bottom: 1.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--gray-color-400);
    }

    .desc {
        font-size: 0.9rem;
        font-weight: 400;
        line-height: 1.4;
        margin-bottom: 3rem;
    }

    .input-wrap {
        margin-bottom: 1.2rem;

        .label {
            font-weight: 600;
        }
    }

    .input {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;

        .icon {
            position: absolute;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
        }
    }

    .check-wrap {
        display: flex;
        justify-content: space-between;
        align-content: center;
        flex-wrap: wrap;
        gap: 0.4rem;
    }

    .forgot {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--primary-color-400);
    }

    .button-wrap {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px 0;
        margin-top: 3rem;
    }

    .btn {
        min-width: 100px;
    }

    .btn-request-code {
        // margin-top: 3rem;
        // margin-left: auto;
    }

    .btn-resend {
        font-size: 0.8rem;
    }
}
</style>