<template lang="pug">
.wrap
    .title
        h1 마이페이지

    hr

    .form-wrap
        form#_el_pictureForm
            .image
                img#profile-img(:src="uploadProfileSrc" alt="profile image")
                .label(ref="optionsBtn" :class="{'disabled': disabled}" @click="showOptions = !showOptions")
                    .icon.white
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-camera")
                ul.options(v-if="showOptions" @click.stop)
                    li(@click="selectFile") 사진 변경
                    li(@click="setToDefault" :class="{'disabled': uploadProfileSrc === null}") 기본 이미지로 변경
                input#_el_file_input(ref="_el_file_input" type="file" name="profile_pic" @change="changeProfileImg" style="display:none")

        br

        form#_el_mypage_form(@submit.prevent="registerMypage")
            input(type="text" name="picture" id='_el_picture_input' hidden)
            #position
                .input-wrap
                    p.label 직책
                    input(v-model="userPosition" type="text" name="position" disabled)
                
                br

                .input-wrap
                    p.label 권한
                    input(v-model="access_group[user.access_group]" type="text" name="authority" disabled)

            br

            .input-wrap
                p.label.essential 이름
                input(:value="user.name" type="text" name="name" placeholder="이름을 입력해주세요." :disabled="disabled" required)
            
            br

            .input-wrap
                p.label.essential 이메일
                input(v-model="user.email" type="email" name="email" placeholder="이메일을 입력해주세요." :disabled="disabled && !onlyEmail" required)

            template(v-if="verifiedEmail && !onlyEmail")
                button.btn.outline.warning(type="button" style="width: 100%; margin-top:8px" :disabled="onlyEmail" @click="onlyEmail = true") 이메일만 변경
                button.btn.warning(type="button" style="width: 100%; margin-top:8px" :disabled="onlyEmail" @click="sendEmail") 이메일 인증

            br

            .input-wrap
                p.label 비밀번호
                button.btn.outline(type="button" style="width: 100%" :disabled="verifiedEmail || !disabled" @click="router.push('change-password')") 비밀번호 변경

            br

            .input-wrap
                p.label 생년월일
                input(v-model="user.birthdate" type="date" name="birthdate" :disabled="disabled")
                label.checkbox.public(:class="{'disabled': disabled}")
                    input(v-model="user.birthdate_public" type="checkbox" name="birthdate_public" checked hidden :disabled="disabled")
                    span.label-checkbox 공개여부

            br

            .input-wrap
                p.label 전화번호
                input(v-model="user.phone_number" type="tel" name="phone_number" placeholder="+82000000000" :disabled="disabled")
                //- label.checkbox.public(:class="{'disabled': disabled}")
                //- 	input(v-model="user.phone_number_public" type="checkbox" name="phone_number_public" checked hidden :disabled="disabled")
                //- 	span.label-checkbox 공개여부

            br

            .input-wrap
                p.label 주소
                input(v-model="user.address" type="text" name="address" placeholder="주소를 입력해주세요." :disabled="disabled")
                label.checkbox.public(:class="{'disabled': disabled}")
                    input(v-model="user.address_public" type="checkbox" name="address_public" checked hidden :disabled="disabled")
                    span.label-checkbox 공개여부

            br

            .input-wrap.upload-file
                p.label 기타자료
                .file-wrap
                    template(v-if="disabled")

                    template(v-else)
                        .btn-upload-file
                            input(type="file" name="additional_data" multiple :disabled="disabled")
                            //- input(type="file" id="file" name="additional_data" multiple :disabled="disabled" @change="updateFileList" hidden)
                            //- label.btn.outline(for="file") 파일 업로드
                    
                    ul.file-list
                        template(v-if="uploadFile.length > 0")
                            li.file-item(v-for="(file, index) in uploadFile" :key="index")
                                a.file-name(:href="file.url" download) {{ file.filename }}
                                button.btn-remove(type="button" @click="removeFile(file)")
                                    template(v-if="file.user_id !== user.user_id")
                                        
                                    template(v-else)
                                        svg
                                            use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")
                        
                        template(v-if="uploadFile.length === 0")
                            p.text 업로드 된 자료가 없습니다.

            br

            .button-wrap
                template(v-if="disabled && !onlyEmail")
                    button#startEdit.btn(type="button" :disabled="verifiedEmail" @click="startEdit") 수정
                template(v-else)
                    button.btn.bg-gray(type="button" @click="cancelEdit") 취소
                    button.btn(type="submit") 등록

    br  
    br  
    br  
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { skapi } from '@/main';
import { user, profileImage, verifiedEmail } from '@/user';
import { convertToObject } from 'typescript';

const router = useRouter();
const route = useRoute();

let optionsBtn = ref(null);
let getFileInfo = ref(null);
let userPosition = ref(null);
let uploadProfileSrc = ref(null);
let uploadFile = ref({});
let originUserProfile = {};
let access_group = {
    1: '직원',
    98: '관리자',
    99: '마스터',
};
let disabled = ref(true);
let onlyEmail = ref(false);
let showOptions = ref(false);


// user position 가져오기
// skapi.getRecords(
//     {
//         table: {
//             name: 'emp_division',
//             access_group: 'authorized',
//         },
//     }).then(r => {
//         console.log(r.list, user.access_group);
//         if(r.list.length === 0 && user.access_group === 99) {
//             userPosition.value = '마스터';
//         } else {
//             userPosition.value = r?.list[0]?.data?.position;
//         }
//     }).catch(err => {
//         console.log('== getRecords == err : ', err);
// });

function makeSafe(str) {
    return str.replaceAll('.', '_').replaceAll('+', '_').replaceAll('@', '_').replaceAll('-', '_');
}

function getFileUserId(str) {
    if (!str) return '';

    return str.split('/')[3]
}

// user additional data 가져오기
let misc = JSON.parse(user?.misc || null);

// private_record_id가 없을 경우 ref_ids 테이블에서 가져와서 업데이트
if(!misc?.private_record_id) {
    skapi.getRecords({
        table: {
            name: 'ref_ids',
            access_group: 1
        },
        index: {
            name: 'user_id',
            value: makeSafe(user.user_id)
        },
    }).then(r => {
        if(r.list.length === 0) {
            return;
        }

        skapi.updateProfile({
            misc: JSON.stringify({ private_record_id: r.list[0]?.data?.privateStorageReference })
        });
    });
}

let miscParse = JSON.parse(user.misc);

// console.log('miscParse : ', miscParse);

// 추가자료 업로드 한 것 가져오기
const getAdditionalData = () => {
    skapi.getRecords({
        table: {
            name: 'emp_additional_data',
            access_group: 99
        },
        reference: miscParse.private_record_id
    }).then(res => {
        if(res.list.length === 0) {
            return;
        } else {
            let fileList = [];

            console.log('== getRecords == res : ', res);

            res.list.forEach((item) => {
                if (item.bin.additional_data && item.bin.additional_data.length > 0) {

                    const result = item.bin.additional_data.map((el) => ({
                        ...el,
                        user_id: getFileUserId(el.path),
                        record_id: item.record_id,
                    }));    

                    fileList.push(...result);
                }
            })

            console.log('== getRecords == fileList : ', fileList);

            uploadFile.value = fileList;
        }
    })
}

getAdditionalData()

// 프로필 사진 정보 가져오기 (사진 올린 사람 찾기)
// skapi.getFile(user.picture, {
//     dataType: 'info',
// }).then(res => {
//     getFileInfo.value = res;
// }).catch(err => {
//     console.log('== getFile == err : ', err)
// });

let sendEmail = async() => {
    try {
        await skapi.verifyEmail();
    } catch (err) {
        window.alert(err.message);
    }
    router.push('/verification');
}

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

let selectFile = () => {
    showOptions.value = false;
    document.getElementById('_el_file_input').click();
}

let setToDefault = () => {
    showOptions.value = false;
    uploadProfileSrc.value = null;
    _el_file_input.value = '';
}

let closeOptions = (e) => {
    if (showOptions.value && !optionsBtn.value.contains(e.target)) {
        showOptions.value = false;
    }
};

let startEdit = () => {
    for (let k in originUserProfile) {
        delete originUserProfile[k];
    }

    for (let k in user) {
        originUserProfile[k] = user[k];
    }

    disabled.value = false;
}

let cancelEdit = () => {
    for (let k in user) {
        delete user[k];
    }

    for (let k in originUserProfile) {
        user[k] = originUserProfile[k];
    }

    disabled.value = true;
}

let registerMypage = async(e) => {
    e.preventDefault();
    // 입력창을 비활성화한다.
    document.querySelectorAll('form input').forEach(el => el.disabled = true);
    document.querySelectorAll('form button').forEach(el => el.disabled = true);

    // 올린 사람과 수정하는 사람이 같지 않으면 table 정보로
    // 같으면 record_id로 사진 수정
    let profile_pic_postParams = {};
    let samePerson = false;

    if(user.user_id === getFileInfo.value?.uploader) {
        samePerson = true;
        profile_pic_postParams.record_id = getFileInfo.value.record_id;
    } else {
        profile_pic_postParams = {
            table: {
                name: 'profile_picture',
                access_group: 'authorized',
            }
        };
    }

    if(_el_file_input.files.length > 0) {
        // 새로 선택한 사진이 있을시 레코드에서 이전 사진을 삭제하는 파라미터를 추가한다.
        profile_pic_postParams.remove_bin = null;
        
        // 새 이미지를 레코드에 업로드하고 보안키를 제외한 이미지 주소를 userprofile의 picture에 넣어준다.
        let picRec = await skapi.postRecord(_el_pictureForm, profile_pic_postParams);
        _el_picture_input.value = picRec.bin.profile_pic.at(-1).url.split('?')[0];
    }

    if(uploadProfileSrc.value === null && samePerson) {
        _el_picture_input.value = null;
        await skapi.deleteRecords({record_id: getFileInfo.value.record_id});
    } else if(uploadProfileSrc.value === null && !samePerson) {
        _el_picture_input.value = null;
        profile_pic_postParams.remove_bin = null;
        await skapi.postRecord(_el_pictureForm, profile_pic_postParams);
    }

    const filebox = document.querySelector('input[name="additional_data"]');

    if(filebox && filebox.files.length) {
        console.log('파일 있음');

        // 추가 자료를 업로드한다. 직원에게 reference 레코드에 권한을 부여하였으니 reference 된 모든 레코드를 열람 할수 있다.
        const uploadPromises = Array.from(filebox.files).map(file => {
            const formData = new FormData();

            formData.append('additional_data', file);
            
            return skapi.postRecord(formData, {
                table: {
                    name: 'emp_additional_data',
                    access_group: 99
                },
                reference: miscParse.private_record_id,
            });
        });

        const results = await Promise.all(uploadPromises);
        console.log('All files uploaded:', results);
    } else {
        console.log('파일 없음');
    }

    // 프로필 정보를 업데이트한다.
    await skapi.updateProfile(e).then(getAdditionalData)

    // if(user.email !== originUserProfile.email) {
    //     verifiedEmail.value = true;
    // }

    window.alert('등록완료');
    onlyEmail.value = false;
    disabled.value = true;
    // router.push('/');
}

// 업로드 파일 삭제
let removeFile =  (item) => {
    let query = {
        record_id: [item.record_id]
    };

     skapi.deleteRecords(query).then(response => {
        getAdditionalData();
    });
}

onMounted(async() => {
    if(profileImage.value) {
        uploadProfileSrc.value = profileImage.value;
    }

    // skapi.getFile(user.picture, {
    //     dataType: 'endpoint',
    // }).then(res => {
    //     uploadProfileSrc.value = res;
    // }).catch(err => {
    //     console.log('== getFile == err : ', err)
    // });

    document.addEventListener('click', closeOptions);
});

onUnmounted(() => {
    document.removeEventListener('click', closeOptions);
});
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

.checkbox.disabled {
    opacity: 0.5;
}

#_el_pictureForm {
    text-align: center;

    .image {
        position: relative;
        display: inline-block;

        .label {
            position: absolute;
            right: 0;
            bottom: 0;
            background-color: var(--primary-color-400);
            border-radius: 50%;
            cursor: pointer;

            &.disabled {
                pointer-events: none;
                background-color: var(--gray-color-300);
            }

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
        
        .options {
            position: absolute;
            right: -113px;
            bottom: -40px;
            z-index: 9;
            background-color: var(--gray-color-100);
            border: 1px solid var(--gray-color-300);
            padding: 5px;
            border-radius: 4px;
            
            li {
                font-size: 0.8rem;
                text-align: left;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;

                &:first-child {
                    margin-bottom: 4px;
                }
                &:hover {
                    background-color: var(--primary-color-400);
                    color: #fff;

                    &.disabled {
                        background-color: unset;
                        color: unset;
                    }
                }
                &.disabled {
                    opacity: 0.25;
                    cursor: default;
                    pointer-events: none;
                }
            }
        }
    }

    #profile-img {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        display: block;
        // object-fit: contain;
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

.button-wrap {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 8px;
}

// #position {
// 	text-align: center;
// 	font-size: 0.9rem;
// 	font-weight: 500;
// 	color: var(--gray-color-500);
// }

#position {
    input {
        pointer-events: none;
        background-color: var(--gray-color-100);
        color: var(--gray-color-500);
        cursor: default;
    }
}

.checkbox.public {
    position: absolute;
    top: 2px;
    right: 0;

    .label-checkbox {
        font-size: 0.75rem;
        line-height: 1;

        &::before {
            width: 0.8rem;
            height: 0.8rem;
        }
    }
}

.input-wrap {
    &.upload-file {
        .btn-upload-file + .file-list {
            .file-item {
                // width: 444px;
            }
        }
        
        .file-item {
            width: 651px;
        }
    }
}

@media (max-width: 682px) {
    .input-wrap {
        &.upload-file {
            .btn-upload-file + .file-list {
                .file-item {
                    width: 100%;
                }
            }

            .file-item {
                width: 100%;
            }
        }
    }
}
</style>