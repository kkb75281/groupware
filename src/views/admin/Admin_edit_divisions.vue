<template lang="pug">
.title
    h1 부서 수정

hr

.form-wrap(v-if="!loading")
    form#_el_comp_form(@submit.prevent="editDivision")
        div(style="text-align:center;")
            .image
                img#profile-img(:src="uploadSrc.division_logo" alt="Company Logo")
                label(v-if="isMyRecord" for="division_logo")
                    .icon.white
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-camera")
                input#division_logo(ref="division_logo_input" type="file" name="division_logo" accept="image/*" :disabled="!isMyRecord" @change="openCropImageDialog" style="opacity: 0;width: 0;height: 0;position: absolute;")

        br

        .input-wrap
            p.label.essential 부서명
            input(v-model="record.data.division_name" :disabled="!isMyRecord" type="text" name="division_name" :placeholder="isMyRecord ? '부서명을 입력해주세요.' : ''" required)
        
        br

        .input-wrap
            p.label 설명
            input(v-model="record.data.division_description" :disabled="!isMyRecord" type="text" name="division_description" :placeholder="isMyRecord ? '부서 설명을 입력해주세요.' : ''")

        br

        .input-wrap
            p.label 대표자명
            input(v-model="record.data.division_ceo_name" :disabled="!isMyRecord" type="text" name="division_ceo_name" :placeholder="isMyRecord ? '대표자명을 입력해주세요.' : ''")

        br

        .input-wrap
            p.label 주소
            input(v-model="record.data.division_address" :disabled="!isMyRecord" type="text" name="division_address" :placeholder="isMyRecord ? '예) 서울시 마포구' : ''")

        br

        .input-wrap
            p.label 사업자번호
            input(v-model="record.data.division_business_code" :disabled="!isMyRecord" type="text" name="division_business_code" :placeholder="isMyRecord ? '예) 012-34-56789' : ''")

        br

        .input-wrap
            p.label 법인번호
            input(v-model="record.data.division_corporate_number" :disabled="!isMyRecord" type="text" name="division_corporate_number" :placeholder="isMyRecord ? '예) 012345-6789012' : ''")

        br

        .input-wrap
            p.label 업태
            input(v-model="record.data.division_business_type" :disabled="!isMyRecord" type="text" name="division_business_type" :placeholder="isMyRecord ? '예) 업태를 입력해주세요.' : ''")

        br

        .input-wrap
            p.label 종목
            input(v-model="record.data.division_business_item" :disabled="!isMyRecord" type="text" name="division_business_item" :placeholder="isMyRecord ? '예) 종목을 입력해주세요.' : ''")

        br

        .input-wrap
            p.label 설립일
            input(v-model="record.data.division_establishment_date" :disabled="!isMyRecord" type="text" name="division_establishment_date" :placeholder="isMyRecord ? '예) 2024. 01. 01' : ''")

        br

        .input-wrap
            p.label 전화번호
            input(v-model="record.data.division_phone_number" :disabled="!isMyRecord" type="text" name="division_phone_number" :placeholder="isMyRecord ? '예) +821012345678' : ''")

        br

        .input-wrap
            p.label 이메일
            input(v-model="record.data.division_email" :disabled="!isMyRecord" type="text" name="division_email" :placeholder="isMyRecord ? '예) user@email.com' : ''")

        br

        .input-wrap
            p.label 팩스번호
            input(v-model="record.data.division_fax" :disabled="!isMyRecord" type="text" name="division_fax" :placeholder="isMyRecord ? '예) 070-1234-5678' : ''")

        br

        .input-wrap
            p.label 홈페이지
            input(v-model="record.data.division_homepage" :disabled="!isMyRecord" type="text" name="division_homepage" :placeholder="isMyRecord ? '예) https://www.sitename.com/' : ''")

        br

        p(style="margin-bottom: 0.5rem") 도장
        .image-wrap(style="text-align:center;")
            .image.seal
                img#used-img(:src="uploadSrc.division_used_seal" alt="Company Used Seal")
                label(v-if="isMyRecord" for="division_used_seal")
                    .icon.white
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-camera")
                input#division_used_seal(ref="division_used_seal_input" type="file" name="division_used_seal" accept="image/*" :disabled="!isMyRecord" @change="openCropImageDialog" style="opacity: 0;width: 0;height: 0;position: absolute;")

            .image.seal
                img#official-img(:src="uploadSrc.division_official_seal" alt="Company Used Seal")
                label(v-if="isMyRecord" for="division_official_seal")
                    .icon.white
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-camera")
                input#division_official_seal(ref="division_official_seal_input" type="file" name="division_official_seal" accept="image/*" :disabled="!isMyRecord" @change="openCropImageDialog" style="opacity: 0;width: 0;height: 0;position: absolute;")

        br

        .button-wrap
            button.btn.bg-gray(type="button" @click="$router.push('/admin/list-divisions')") {{ isMyRecord ? '취소' : '이전' }}
            template(v-if="isMyRecord")
                button.btn(type="submit") 저장

CropImage(:open="openCropModal" :imageSrc="currentImageSrc" @cropped="setCroppedImage" @close="closeCropImageDialog")

br  
br  
br  
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';
import { skapi } from '@/main';
import { user } from '@/user';
import { openCropModal, croppedImages, uploadSrc, currentImageSrc, resetCropImage, openCropImageDialog, closeCropImageDialog, setCroppedImage } from '@/components/crop_image';

import CropImage from '@/components/crop_image.vue';

const router = useRouter();
const route = useRoute();

onMounted(() => {
    resetCropImage();

    if (!record) {
        // go back to the list if record is not found
        router.push('/admin/list-divisions');
    } else {
        if (record?.bin) {
            bin = {};
            for (let k in record?.bin) {
                bin[k] = record?.bin[k];
            }
            uploadSrc.value.division_logo = record?.bin.division_logo ? record?.bin.division_logo[0].url : '';
            uploadSrc.value.division_used_seal = record?.bin.division_used_seal ? record?.bin.division_used_seal[0].url : '';
            uploadSrc.value.division_official_seal = record?.bin.division_official_seal ? record?.bin.division_official_seal[0].url : '';
        }
        console.log(record)
        loading.value = false;
    }
})

// get record_id value from url parameter
let urlParams = new URLSearchParams(window.location.search);
let record_id = urlParams.get('record_id');

if (!record_id) {
    // go back to the list if record_id is not found
    router.push('/admin/list-divisions');
}

let sessionDivisions = JSON.parse(window.sessionStorage.getItem('divisions'));
let record = sessionDivisions[record_id];
let isMyRecord = record.user_id === user.user_id;
let originalDivisionName = record.data.division_name;
let loading = ref(true);
let bin = {};

let post_params = {
    table: {
        name: 'divisions',
        access_group: 99
    }
    ,
    record_id: record_id,
    remove_bin: []
}

let editDivision = async(e) => {
    document.querySelectorAll('form input').forEach(el => el.disabled = true);
    document.querySelectorAll('form button').forEach(el => el.disabled = true);

    // 이미지 변경시 예전 이미지 모두 삭제
    if(deleteList.value.length > 0) {
        deleteList.value.forEach(id => {
            let deleteBinObj = record.bin[id] ? record.bin[id][0] : null;   // 파일 객체 전체

            if(deleteBinObj) {
                post_params.remove_bin.push(deleteBinObj);
            }
        })
    }

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
    
    if(originalDivisionName !== ext.data.division_name) {
        let changeDivisionName = {};

        skapi.getRecords({
            unique_id: '[division_name_list]'
        }).then(r => {
            let data = r.list[0].data;
            let keys = Object.keys(data); // 'DVS_0', 'DVS_1', ...
            let values = Object.values(data); // '부서명1', '부서명2', ...
            let index = 0;

            for(let v of values) {
                if(v === originalDivisionName) {
                    index = values.indexOf(v);
                    break;
                }
            }

            data[keys[index]] = ext.data.division_name;

            changeDivisionName = data;

            skapi.deleteRecords({
                unique_id: '[division_name_list]'
            }).then(r => {
                skapi.postRecord(changeDivisionName, {
                    unique_id: '[division_name_list]',
                    table: {
                        name: 'divisionNames',
                        access_group: 1
                    }
                })
            })
        })
    }

    try {
        let result = await skapi.postRecord(formData, post_params);

        sessionDivisions[result.record_id] = result;
        window.sessionStorage.setItem('divisions', JSON.stringify(sessionDivisions));

        window.alert('부서 수정이 완료되었습니다.');
        router.push('/admin/list-divisions');
    } catch (error) {
        window.alert('부서 수정이 실패하였습니다.');
        throw error;
    }
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
</style>