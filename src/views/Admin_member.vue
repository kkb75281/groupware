<template lang="pug">
.wrap
    .title
        h1 직원 등록
        span 직원을 등록하면 초대 이메일이 발송됩니다.

    br

    form#profPic
        .image
            img#profile-img(:src="uploadProfileSrc" alt="profile image")
            label(for="_el_file_input")
                .icon.white
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-camera")
            input(type="file" name="init_profile_pic" id="_el_file_input" @change="changeProfileImg" style="display:none")

    form#_el_emp_form(@submit="resigterEmp")
        select(name="division" required disabled)
            option(disabled selected) 부서(회사) 선택
</template>

<script setup>
import { ref } from 'vue';
import { skapi } from '@/main';

let uploadProfileSrc = ref('');

let changeProfileImg = (e) => {
    let file = e.target.files[0];

    if (file) {
        let reader = new FileReader();
        reader.onload = (e) => {
            uploadProfileSrc.value = e.target.result; // ref 값 업데이트
        };
        reader.readAsDataURL(file);
    }
}

let divisions = skapi.getRecords({
        table: {
            name: 'divisions',
            access_group: 99
        }
}).then(response => response.list);

divisions.then(divisions => {
    divisions.forEach(division => {
        const option = document.createElement('option');
        option.value = division.record_id;
        option.innerText = division.data.division_name;
        document.querySelector('select[name="division"]').appendChild(option);
    });
    document.querySelector('select[name="division"]').disabled = false;
});
</script>

<style scoped lang="less">
.title {
    h1 {
        display: inline-block;
        margin-right: 1rem;
    }

    span {
        color: var(--gray-color-400);
    }
}

form {
    &#profPic {
        .image {
            position: relative;
            display: inline-block;

            label {
                position: absolute;
                right: 0;
                bottom: 0;
                background-color: var(--primary-color-400);
                border-radius: 50%;
                cursor: pointer;

                .icon {
                    padding: 4px;
                }
            }
        }

        #profile-img {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            display: block;
            object-fit: cover;
            position: relative;
            background-color: var(--gray-color-100);

            &::before {
                content: "No Image";
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                background-color: var(--gray-color-100);
                color: #888;
                font-size: 14px;
                text-align: center;
                position: absolute;
                top: 0;
                left: 0;
            }
        }
    }
}
</style>