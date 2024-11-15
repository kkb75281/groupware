<template lang="pug">
.title
    h1 부서(회사) 수정

hr

.form-wrap(v-if="!loading")
    form#_el_comp_form(@submit.prevent="editDivision")
        div(style="text-align:center;")
            .image
                //- img#profile-img(v-if="bin.hasOwnProperty('division_logo')" :src="bin['division_logo'][0].url" alt="Company Logo")
                //- img#profile-img(v-else :src="uploadSrc._el_profile_img" alt="Company Logo")
                img#profile-img(:src="uploadSrc._el_profile_img" alt="Company Logo")
                label(for="_el_profile_img")
                    .icon.white
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-camera")
                input#_el_profile_img(type="file" name="division_logo" @change="uploadImgSrc" style="display:none")

        br

        .input-wrap
            p.label.essential 부서(회사)명
            input(v-model="record.data.division_name" type="text" name="division_name" required)
        
        br

        .input-wrap
            p.label 설명
            input(v-model="record.data.division_description" type="text" name="division_description")

        br

        .input-wrap
            p.label 대표자명
            input(v-model="record.data.division_ceo_name" type="text" name="division_ceo_name")

        br

        .input-wrap
            p.label 주소
            input(v-model="record.data.division_address" type="text" name="division_address")

        br

        .input-wrap
            p.label 사업자번호
            input(v-model="record.data.division_business_code" type="text" name="division_business_code")

        br

        .input-wrap
            p.label 법인번호
            input(v-model="record.data.division_corporate_number" type="text" name="division_corporate_number")

        br

        .input-wrap
            p.label 업태
            input(v-model="record.data.division_business_type" type="text" name="division_business_type")

        br

        .input-wrap
            p.label 종목
            input(v-model="record.data.division_business_item" type="text" name="division_business_item")

        br

        .input-wrap
            p.label 설립일
            input(v-model="record.data.division_establishment_date" type="text" name="division_establishment_date")

        br

        .input-wrap
            p.label 전화번호
            input(v-model="record.data.division_phone_number" type="text" name="division_phone_number")

        br

        .input-wrap
            p.label 이메일
            input(v-model="record.data.division_email" type="text" name="division_email")

        br

        .input-wrap
            p.label 팩스번호
            input(v-model="record.data.division_fax" type="text" name="division_fax")

        br

        .input-wrap
            p.label 홈페이지
            input(v-model="record.data.division_homepage" type="text" name="division_homepage")

        br

        p(style="margin-bottom: 0.5rem") 도장
        .image-wrap(style="text-align:center;")
            .image.seal
                //- img#used-img(v-if="bin.hasOwnProperty('division_used_seal')" :src="bin['division_used_seal'][0].url" alt="Company Used Seal")
                //- img#used-img(v-else :src="uploadSrc._el_used_seal_img" alt="Company Used Seal")
                img#used-img(:src="uploadSrc._el_used_seal_img" alt="Company Used Seal")
                label(for="_el_used_seal_img")
                    .icon.white
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-camera")
                input#_el_used_seal_img(type="file" name="division_used_seal" @change="uploadImgSrc" style="display:none")

            .image.seal
                //- img#official-img(v-if="bin.hasOwnProperty('division_official_seal')" :src="bin['division_official_seal'][0].url" alt="Company Used Seal")
                //- img#official-img(v-else :src="uploadSrc._el_official_seal_img" alt="Company Used Seal")
                img#official-img(:src="uploadSrc._el_official_seal_img" alt="Company Used Seal")
                label(for="_el_official_seal_img")
                    .icon.white
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-camera")
                input#_el_official_seal_img(type="file" name="division_official_seal" @change="uploadImgSrc" style="display:none")

        br

        .button-wrap
            button.btn.bg-gray(type="button" @click="$router.push('/admin/list-divisions')") 취소
            button.btn(type="submit") 등록

br  
br  
br  
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import { skapi } from '@/main';

const router = useRouter();
const route = useRoute();

// get record_id value from url parameter
let urlParams = new URLSearchParams(window.location.search);
let record_id = urlParams.get('record_id');

if (!record_id) {
    // go back to the list if record_id is not found
    router.push('/admin/list-divisions');
}

let sessionDivisions = JSON.parse(window.sessionStorage.getItem('divisions'));
let record = sessionDivisions[record_id];
let loading = ref(true);
let bin = {};

if (!record) {
    // go back to the list if record is not found
    router.push('/admin/list-divisions');
} else {
    if (record?.bin) {
        bin = {};
        for (let k in record?.bin) {
            bin[k] = record?.bin[k];
        }
    }
    loading.value = false;
}

let uploadSrc = ref({
    _el_profile_img: bin?.division_logo?.[0]?.url || '',
    _el_used_seal_img: bin?.division_used_seal?.[0]?.url || '',
    _el_official_seal_img: bin?.division_official_seal?.[0]?.url || ''
});

let uploadImgSrc = (e) => {
    let targetInput = e.target.id;
    let file = e.target.files[0];

    if (file) {
        let reader = new FileReader();
        reader.onload = (e) => {
            uploadSrc.value[targetInput] = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // 이미지 변경시 예전 이미지 모두 삭제
    if(targetInput === '_el_profile_img' && record.bin.division_logo) {
        record.bin.division_logo.forEach(element => {
            post_params.remove_bin.push(element);    
        });
    }
    if(targetInput === '_el_used_seal_img' && record.bin.division_used_seal) {
        record.bin.division_used_seal.forEach(element => {
            post_params.remove_bin.push(element);    
        });
    }
    if(targetInput === '_el_official_seal_img' && record.bin.division_official_seal) {
        record.bin.division_official_seal.forEach(element => {
            post_params.remove_bin.push(element);    
        });
    }
}

let post_params = {
    table: {
        name: 'divisions',
        access_group: 99
    }
    ,
    record_id: record_id,
    remove_bin: []
}

let editDivision = (e) => {
    document.querySelectorAll('form input').forEach(el => el.disabled = true);
    document.querySelectorAll('form button').forEach(el => el.disabled = true);
    
    skapi.postRecord(e, post_params).then((r) => {
        let sessionDivisions = JSON.parse(window.sessionStorage.getItem('divisions'));

        sessionDivisions[r.record_id] = r;
        window.sessionStorage.setItem('divisions', JSON.stringify(sessionDivisions));

        window.alert('등록되었습니다.');
        router.push('/admin/list-divisions');
    });
}
</script>

<style scoped lang="less">
.title {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 1rem;

    span {
        color: var(--gray-color-400);
        line-height: 1.4;
    }
}

.form-wrap {
    max-width: 650px;
    margin: 0 auto;
}

#_el_comp_form {
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
                width: 32px;
                height: 32px;
                position: relative;

                svg {
                    width: 18px;
                    height: 18px;
                    transform: translate(-50%, -50%);
                    top: 50%;
                    left: 50%;
                    position: absolute;
                }
            }
        }
    }

    img {
        width: 100px;
        height: 100px;
        border-radius: 30%;
        display: block;
        object-fit: contain;
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

        &#profile-img {
            border-radius: 50%;

            &::before {
                content: "회사로고등록";
            }
        }

        &#used-img::before {
            content: "사용인감등록";
        }

        &#official-img::before {
            content: "회사직인등록";
        }
    }

    .image-wrap {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        // justify-content: center;
        gap: 1rem;

        .seal {
            img {
                background-color: unset;
                border: 2px dashed var(--gray-color-100);
    
                &::before {
                    background-color: #fff;
                }
            }
        }
    }
}

.button-wrap {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 8px;
}
</style>