<template lang="pug">
#changePassword
    template(v-if="step < 4")
        router-link.logo(to="/")
            svg
                use(xlink:href="@/assets/icon/material-icon.svg#icon-password")
            
    template(v-if="step === 3")
        h2.title 비밀번호 변경 완료
        p.desc 
            | 비밀번호가 성공적으로 변경되었습니다.
            br
            | 마이페이지로 이동하여 서비스를 이용해주세요.

        button.btn.btn-go-login(@click="router.push('/')") 홈으로

    template(v-if="step === 1")
        h2.title 비밀번호 변경
        p.desc 현재 비밀번호를 입력해 주세요.

        form(@submit.prevent="login")
            input(:value="user.email" name="email" type="email" required hidden)
            .input-wrap
                p.label 현재 비밀번호
                .input
                    input(name="password" :type='showPassword ? "text" : "password"' :disabled="promiseRunning" @input="e=>currPassword = e.target.value" placeholder="현재 비밀번호를 입력해주세요." required)
                    button.icon.icon-eye(type="button" @click="showPassword = !showPassword")
                        template(v-if="showPassword")
                            svg
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-visibility-fill")
                        template(v-else)
                            svg
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-visibility-off-fill")

            .button-wrap
                button.btn.bg-gray.btn-back(type="button" @click="router.push('/mypage')" :disabled="promiseRunning") 이전
                button.btn.btn-next(type="submit" :disabled="promiseRunning") 다음

    template(v-if="step === 2")
        h2.title 비밀번호 변경
        p.desc 최소 6자리 이상의 새로운 비밀번호를 입력해주세요.

        form(@submit.prevent="changePassword")
            .input-wrap
                p.label 새 비밀번호
                .input
                    input(:type='showPassword ? "text" : "password"' name="new_password" ref="newPasswordField"
                    :value="newPassword"
                    :disabled="promiseRunning"
                    @input="e => {newPassword = e.target.value; e.target.setCustomValidity('');}" 
                    @change="validateNewPassword" placeholder="새로운 비밀번호를 입력해주세요." required)
                    button.icon.icon-eye(type="button" @click="showPassword = !showPassword")
                        template(v-if="showPassword")
                            svg
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-visibility-fill")
                        template(v-else)
                            svg
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-visibility-off-fill")

            .input-wrap
                p.label 새 비밀번호 확인
                .input
                    input(:type='showPassword ? "text" : "password"' name="confirm_new_password" ref="confirmNewPasswordField" 
                    :value="newPasswordConfirm"
                    :disabled="promiseRunning"
                    @input="e => {newPasswordConfirm = e.target.value; e.target.setCustomValidity('');}" 
                    @change="validateNewPassword" placeholder="입력하신 비밀번호를 확인해주세요." required)
                    button.icon.icon-eye(type="button" @click="showPassword = !showPassword")
                        template(v-if="showPassword")
                            svg
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-visibility-fill")
                        template(v-else)
                            svg
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-visibility-off-fill")
            
            .button-wrap
                button.btn.bg-gray.btn-back(type="button" @click="step--" :disabled="promiseRunning") 이전
                button.btn.btn-reset-password(type="submit" value="Reset Password" :disabled="promiseRunning") 변경

</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { skapi } from "@/main.ts";
import { user } from "@/user.ts";
import { ref } from 'vue';

const router = useRouter();
const route = useRoute();

let step = ref(1);
let promiseRunning = ref(false);
let showPassword = ref(false);
let confirmNewPasswordField = ref(null);

let currPassword = '';
let newPassword = '';
let newPasswordConfirm = '';

let login = async(e) => {
    promiseRunning.value = true;
    try {
        await skapi.login(e);
        step.value++;
    }
    catch (err) {
        alert(err.message);
    }
    finally {
        promiseRunning.value = false;
    }
}

let validateNewPassword = () => {
    if (newPasswordConfirm !== newPassword) {
        confirmNewPasswordField.value.setCustomValidity('Password does not match');
        confirmNewPasswordField.value.reportValidity();
    }
}

let changePassword = async () => {
    promiseRunning.value = true;
    try {
        await skapi.changePassword({ current_password: currPassword, new_password: newPassword });
        step.value++;
    }
    catch (err) {
        alert(err.message);
    }
    finally {
        promiseRunning.value = false;
    }
}
</script>

<style scoped lang="less">
#changePassword {
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
        margin-bottom: 1rem;

        svg {
			width: 2rem;
			height: 2rem;
		}
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
        margin-top: 3rem;
        margin-left: auto;
    }

    .btn-resend {
        font-size: 0.8rem;
    }
}
</style>