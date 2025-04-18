<template lang="pug">
//- .title
//-     h1 부서 등록
//-     //- span 직원을 등록하면 초대 이메일이 발송됩니다.

//- hr

.form-wrap
    form#_el_comp_form(@submit.prevent="resigterComp")
        div(style="text-align:center;")
            .image
                img#profile-img(:src="uploadSrc.division_logo" alt="Company Logo")
                label(for="division_logo")
                    .icon.white
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-camera")
                input#division_logo(type="file" name="division_logo" accept="image/*" @change="openCropImageDialog" style="opacity: 0;width: 0;height: 0;position: absolute;")

        br

        .input-wrap
            p.label.essential 부서명
            input(type="text" name="division_name" placeholder="부서명을 입력해주세요." required)
            p.desc 부서명 등록시 / 를 사용하여 하위 부서를 등록할 수 있습니다. (예. 스카피/개발팀)
        
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
            input(type="text" name="division_business_code" placeholder="예) 012-34-56789")

        br

        .input-wrap
            p.label 법인번호
            input(type="text" name="division_corporate_number" placeholder="예) 012345-6789012")

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
            input(type="text" name="division_fax" placeholder="예) 070-1234-5678")

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
                input#division_used_seal(type="file" name="division_used_seal" accept="image/*" @change="openCropImageDialog" style="opacity: 0;width: 0;height: 0;position: absolute;")

            .image.seal
                img#official-img(:src="uploadSrc.division_official_seal" alt="Company Used Seal")
                label(for="division_official_seal")
                    .icon.white
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-camera")
                input#division_official_seal(type="file" name="division_official_seal" accept="image/*" @change="openCropImageDialog" style="opacity: 0;width: 0;height: 0;position: absolute;")

        br

        .button-wrap
            button.btn.bg-gray(type="button" @click="$router.push('/admin/list-divisions')") 취소
            button.btn(type="submit") 등록

CropImage(:open="openCropModal" :imageSrc="currentImageSrc" @cropped="setCroppedImage" @close="closeCropImageDialog")
 
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { onMounted } from 'vue';
import { skapi, mainPageLoading } from '@/main.ts';
import { openCropModal, croppedImages, uploadSrc, currentImageSrc, resetCropImage, openCropImageDialog, closeCropImageDialog, setCroppedImage } from '@/components/crop_image.ts';
import { getDivisionNames, divisionNameList } from '@/division.ts';
import { divisions } from '@/division.ts';
import { makeSafe } from '@/user.ts';

import CropImage from '@/components/crop_image.vue';

const router = useRouter();
const route = useRoute();

let resigterComp = async(e) => {
	mainPageLoading.value = true;

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
    
    let currentData = divisionNameList.value;

    let createDivisionName = async() => {
        if(Object.keys(currentData).length) {
            let keys = Object.keys(currentData);
            let numbers = keys.map(key => parseInt(key.split("_")[1], 10));
            let maxNumber = Math.max(...numbers);
            let newNumber = maxNumber + 1; // 가장 큰 번호 다음 숫자 지정
            let newKey = `DVS_${newNumber}`;

            currentData[newKey] = ext.data.division_name;
        } else {
            currentData = {
                'DVS_0': ext.data.division_name
            }
        }

        return await skapi.postRecord(currentData, {
            unique_id: '[division_name_list]',
            table: {
                name: 'divisionNames',
                access_group: 1
            }
        })
    }

    await getDivisionNames().then(async ()=>{
        return await skapi.deleteRecords({
                unique_id: '[division_name_list]'
        });
    }).catch(err =>{
		console.log({err});
	}).finally(createDivisionName);

    //form data에 이미지 파일 추가
    skapi.postRecord(formData, {
        table: {
            name: 'divisions',
            access_group: 99
        },
        index: {
            name: 'divisionName',
            value: ext.data.division_name.replace(/\//g, '_')
        }
    }).then((r) => {
        divisions.value[r.record_id] = r; // divisions.value에 추가

		const divisionId = makeSafe(r.record_id);
		const uniqueId = `dvs_workTime_${divisionId}`;
		const findDivisionKey = Object.entries(divisionNameList.value).find(([key, value]) => value === r.data.division_name);

		// 출퇴근 레코드 생성
        const workTimeData = {
            division_name: r.data.division_name || '',
            division_key: findDivisionKey?.[0] || '',
            division_startTime: {
                min: `09:00:00`,
                max: `09:59:59`
            },
            division_endTime: {
                min: `18:00:00`,
                max: `18:59:59`
            }
        };

        const config = {
            table: {
                name: 'dvs_workTime_setting',
                access_group: 1
            },
            unique_id: uniqueId
        };

        skapi.postRecord(workTimeData, config);

        window.alert('등록되었습니다.');
        router.push('/admin/list-divisions');
	}).catch((e) => {
		console.log({e});
		window.alert('등록 중 오류가 발생했습니다.');
    }).finally(() => {
		mainPageLoading.value = false;
	});
}

onMounted(() => {
    resetCropImage();
})
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
</style>