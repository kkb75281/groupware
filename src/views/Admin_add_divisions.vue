<template lang="pug">
.title
    h1 부서 등록
    //- span 직원을 등록하면 초대 이메일이 발송됩니다.

hr

.form-wrap
    form#_el_comp_form(@submit.prevent="resigterComp")
        div(style="text-align:center;")
            .image
                img#profile-img(:src="uploadSrc.division_logo" alt="Company Logo")
                label(for="division_logo")
                    .icon.white
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-camera")
                input#division_logo(ref="division_logo_input" type="file" name="division_logo" accept="image/*" @change="openCropImageDialog" style="opacity: 0;width: 0;height: 0;position: absolute;")

        br

        .input-wrap
            p.label.essential 부서명
            input(type="text" name="division_name" placeholder="부서명을 입력해주세요." required)
        
        br

        .input-wrap
            p.label 설명
            input(type="text" name="division_description" placeholder="부서 설명을 입력해주세요.")

        br

        .input-wrap
            p.label 대표자명
            input(type="text" name="division_ceo_name" placeholder="대표자명을 입력해주세요.")

        br

        .input-wrap
            p.label 주소
            input(type="text" name="division_address" placeholder="예) 서울시 마포구")

        br

        .input-wrap
            p.label 사업자번호
            input(type="text" name="division_business_code" placeholder="사업자번호를 입력해주세요.")

        br

        .input-wrap
            p.label 법인번호
            input(type="text" name="division_corporate_number" placeholder="법인번호를 입력해주세요.")

        br

        .input-wrap
            p.label 업태
            input(type="text" name="division_business_type" placeholder="업태를 입력해주세요.")

        br

        .input-wrap
            p.label 종목
            input(type="text" name="division_business_item" placeholder="종목을 입력해주세요.")

        br

        .input-wrap
            p.label 설립일
            input(type="text" name="division_establishment_date" placeholder="예) 2024. 01. 01")

        br

        .input-wrap
            p.label 전화번호
            input(type="text" name="division_phone_number" placeholder="예) +821012345678")

        br

        .input-wrap
            p.label 이메일
            input(type="text" name="division_email" placeholder="예) user@email.com")

        br

        .input-wrap
            p.label 팩스번호
            input(type="text" name="division_fax" placeholder="팩스번호를 입력해주세요.")

        br

        .input-wrap
            p.label 홈페이지
            input(type="text" name="division_homepage" placeholder="예) https://www.sitename.com/")

        br

        p(style="margin-bottom: 0.5rem") 도장
        .image-wrap(style="text-align:center;")
            .image.seal
                img#used-img(:src="uploadSrc.division_used_seal" alt="Company Used Seal")
                label(for="division_used_seal")
                    .icon.white
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-camera")
                input#division_used_seal(ref="division_used_seal_input" type="file" name="division_used_seal" accept="image/*" @change="openCropImageDialog" style="opacity: 0;width: 0;height: 0;position: absolute;")

            .image.seal
                img#official-img(:src="uploadSrc.division_official_seal" alt="Company Used Seal")
                label(for="division_official_seal")
                    .icon.white
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-camera")
                input#division_official_seal(ref="division_official_seal_input" type="file" name="division_official_seal" accept="image/*" @change="openCropImageDialog" style="opacity: 0;width: 0;height: 0;position: absolute;")

        br

        .button-wrap
            button.btn.bg-gray(type="button" @click="$router.push('/admin/list-divisions')") 취소
            button.btn(type="submit") 등록

CropImage(:open="openModal" :imageSrc="currnetImageSrc" @cropped="setCroppedImage" @close="closeCropImageDialog")

br  
br  
br  
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import { skapi } from '@/main';

import CropImage from '@/components/crop_image.vue';

const router = useRouter();
const route = useRoute();

let openModal = ref(false);
let croppedImages = ref({});
let currentTargetId = ref('');
let currnetImageSrc = ref('');
let uploadSrc = ref({
    division_logo: '',
    division_used_seal: '',
    division_official_seal: ''
});
let division_logo_input = ref(null);
let division_used_seal_input = ref(null);
let division_official_seal_input = ref(null);
let imgInputs = {
    division_logo_input,
    division_used_seal_input,
    division_official_seal_input
}

let openCropImageDialog = (e) => {
    const file = e.target.files[0];
    let targetInput = imgInputs[`${e.target.id}_input`];

    if (file) {
        const fileURL = URL.createObjectURL(file);
        currnetImageSrc.value = fileURL;
        currentTargetId.value = e.target.id;
        uploadSrc.value[currentTargetId.value] = fileURL;
        openModal.value = true;
    }
    if(targetInput) {
        targetInput.value.value = ''; // 초기화
    }
}

let closeCropImageDialog = () => {
    uploadSrc.value[currentTargetId.value] = null;
    openModal.value = false;
}

let setCroppedImage = async(croppedImage) => {
    if(currentTargetId.value) {
        try {
            // 미리보기 이미지 경로 업데이트
            uploadSrc.value[currentTargetId.value] = croppedImage;

            // Blob URL에서 Blob 객체를 가져오기
            const response = await fetch(croppedImage);
            const blob = await response.blob();

            // Blob 객체를 저장 (서버 전송용)
            croppedImages.value[currentTargetId.value] = blob;

            openModal.value = false;
            currnetImageSrc.value = '';
            currentTargetId.value = '';
        } catch (error) {
            console.error('Error processing Blob URL:', error);
        }
    }
}

let resigterComp = (e) => {
    document.querySelectorAll('form input').forEach(el => el.disabled = true);
    document.querySelectorAll('form button').forEach(el => el.disabled = true);

    let ext = skapi.util.extractFormData(e); // { data: {}, files: {} }

    const formData = new FormData();

    // 기존 form data 추가
    for(let key in ext.data) {
        formData.append(key, ext.data[key]);
    }

    // 이미지 파일을 form data에 추가
    if(Object.keys(croppedImages.value).length > 0) {
        Object.keys(croppedImages.value).forEach((key) => {
            formData.append(key, croppedImages.value[key], `${key}.jpg`);
        });
    }
    
    let currentData = {};

    let deleteDivisionName = async() => {
        await skapi.deleteRecords({
            unique_id: '[division_name_list]'
        }).then(r => {
            createDivisionName();
        })
    }

    let createDivisionName = async() => {
        if(Object.keys(currentData).length) {
            let keys = Object.keys(currentData);
            let numbers = keys.map(key => parseInt(key.split("_")[1], 10));
            // let newNumber = 1;
            
            // while (numbers.includes(newNumber)) {
            //     newNumber++; // 겹치지 않는 숫자를 찾을 때까지 증가
            // }
            let maxNumber = Math.max(...numbers);
            let newNumber = maxNumber + 1; // 가장 큰 번호 다음 숫자 지정
            
            let newKey = `DVS_${newNumber}`;

            currentData[newKey] = ext.data.division_name;
        } else {
            currentData = {
                'DVS_0': ext.data.division_name
            }
        }

        skapi.postRecord(currentData, {
            unique_id: '[division_name_list]',
            table: {
                name: 'divisionNames',
                access_group: 1
            }
        })
    }

    // 부서명 저장
    skapi.getRecords({
        unique_id: '[division_name_list]'
    }).then(r => {
        if(r.list.length) {
            let data = r.list[0].data;
            if(data) {
                currentData = data;
            }
            deleteDivisionName();
        }
    }).catch(e => {
        if(e.message === 'Unique ID does not exists.') {
            createDivisionName();
        }
    })

    // skapi.getRecords({
    //     unique_id: '[division_name_list]',
    //     table: {
    //         name: 'divisionNames',
    //         access_group: 1
    //     }
    // }).then(r => {
    //     if(r.list.length === 0) {
    //         skapi.postRecord({
    //             'DVS_0': ext.data.division_name,
    //         }, {
    //             table: {
    //                 name: 'divisionNames',
    //                 access_group: 1
    //             }
    //         })
    //     } else {
    //         let currentData = r.list[0].data;
    //         let keys = Object.keys(currentData);
    //         let numbers = keys.map(key => parseInt(key.split("_")[1], 10));
    //         let newNumber = 1;
    //         while (numbers.includes(newNumber)) {
    //             newNumber++; // 겹치지 않는 숫자를 찾을 때까지 증가
    //         }
    //         let newKey = `DVS_${newNumber}`;

    //         currentData[newKey] = ext.data.division_name;

    //         skapi.postRecord(currentData, {
    //             record_id: r.list[0].record_id,
    //             table: {
    //                 name: 'divisionNames',
    //                 access_group: 1
    //             }
    //         })
    //     }
    // })

    //form data에 이미지 파일 추가
    skapi.postRecord(formData, {
        table: {
            name: 'divisions',
            access_group: 99
        }
    }).then((r) => {

        let sessionDivisions = window.sessionStorage.getItem('divisions');

        if(sessionDivisions == 'no data' || !JSON.parse(sessionDivisions)) {
            sessionDivisions = {};
        } else {
            sessionDivisions = JSON.parse(sessionDivisions);
        }
        
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