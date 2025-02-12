<template lang="pug">
.title
    h1 회원 정보 수정

hr

.form-wrap
    form#_el_pictureForm
        .image
            img#profile-img(:src="uploadSrc.profile_pic" alt="profile image")
            .label(ref="optionsBtn" :class="{'disabled': verifiedEmail || disabled}" @click="showOptions = !showOptions")
                .icon.white
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-camera")
            ul.options(v-if="showOptions" @click.stop)
                li(@click="selectFile") 사진 변경
                li(@click="setToDefault" :class="{'disabled': uploadSrc.profile_pic === null}") 기본 이미지로 변경
            input#profile_pic(ref="profile_pic_input" type="file" name="profile_pic" accept="image/*" @change="openCropImageDialog" style="opacity: 0;width: 0;height: 0;position: absolute;")
            //- input#_el_file_input(ref="_el_file_input" type="file" name="profile_pic" @change="changeProfileImg" style="display:none")

    br

    form#_el_myinfoForm(@submit.prevent="registerMypage")
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
            input(:value="user.name" type="text" name="name" placeholder="이름을 입력해주세요." :disabled="verifiedEmail || disabled" required)
        
        br

        .input-wrap
            p.label.essential 이메일
            input(v-model="user.email" type="email" name="email" placeholder="예) user@email.com" :disabled="(verifiedEmail || disabled) && !onlyEmail" required)

        template(v-if="verifiedEmail && !onlyEmail")
            button.btn.outline.warning(type="button" style="width: 100%; margin-top:8px" :disabled="onlyEmail" @click="onlyEmail = true") 이메일만 변경
            button.btn.warning(type="button" style="width: 100%; margin-top:8px" :disabled="onlyEmail" @click="sendEmail") 이메일 인증

        br
        
        //- .input-wrap
        //-     p.label 비밀번호
        //-     button.btn.outline(type="button" style="width: 100%" :disabled="verifiedEmail || disabled" @click="router.push('change-password')") 비밀번호 변경

        //- br

        .input-wrap
            p.label 생년월일
            input(v-model="user.birthdate" type="date" name="birthdate" :disabled="verifiedEmail || disabled")
            label.checkbox.public(:class="{'disabled': verifiedEmail || disabled}")
                input(v-model="user.birthdate_public" type="checkbox" name="birthdate_public" checked hidden :disabled="verifiedEmail || disabled")
                span.label-checkbox 공개여부

        br

        .input-wrap
            p.label 전화번호
            input(v-model="user.phone_number" type="tel" name="phone_number" placeholder="예) +821012345678" :disabled="verifiedEmail || disabled")
            //- label.checkbox.public(:class="{'disabled': disabled}")
            //- 	input(v-model="user.phone_number_public" type="checkbox" name="phone_number_public" checked hidden :disabled="disabled")
            //- 	span.label-checkbox 공개여부

        br

        .input-wrap
            p.label 주소
            input(v-model="user.address" type="text" name="address" placeholder="예) 서울시 마포구" :disabled="verifiedEmail || disabled")
            label.checkbox.public(:class="{'disabled': verifiedEmail || disabled}")
                input(v-model="user.address_public" type="checkbox" name="address_public" checked hidden :disabled="verifiedEmail || disabled")
                span.label-checkbox 공개여부

        br

        .input-wrap.upload-file
            p.label 자료 관리
            .file-wrap
                //- template(v-if="!disabled")
                .btn-upload-file
                    input#file(type="file" name="additional_data" multiple :disabled="verifiedEmail || disabled" @change="updateFileList" hidden)
                    label.btn.outline.btn-upload(for="file") 파일 올리기

                ul.upload-file-list
                    li.file-name(v-for="(name, index) in fileNames" :key="index") {{ name }}
                
                ul.file-list
                    template(v-if="uploadedFile.length > 0")
                        li.file-item(v-for="(file, index) in uploadedFile" :key="index" :class="{'remove': removeFileList.includes(file.record_id), 'disabled': disabled}")
                            //- a.file-name(:href="file.url" download) {{ file.filename }} {{ "___" + file.record_id }}
                            a.file-name(:href="file.url" target="_blank") {{ file.filename }}
                            template(v-if="(!verifiedEmail && !disabled) && file.user_id === user.user_id")
                                button.btn-cancel(v-if="removeFileList.includes(file.record_id)" type="button" @click="cancelRemoveFile(file)")
                                    svg
                                        use(xlink:href="@/assets/icon/material-icon.svg#icon-undo")
                                button.btn-remove(v-else type="button" @click="removeFile(file)")
                                    svg
                                        use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")
                    template(v-if="uploadedFile.length === 0")
                        li.file-item(style="height: 36px;") 등록된 파일이 없습니다.

        //- br
        //- 
        //- .input-wrap.upload-file
            p.label 도장 관리
            .file-wrap
                //- .btn-upload-file
                    input#stamp(type="file" name="stamp_data" :disabled="verifiedEmail || disabled" hidden)
                    label.btn.outline.btn-upload(for="stamp") 파일 올리기
                    button.btn.outline.btn-upload(type="button" :disabled="verifiedEmail || disabled" @click="openStampDialog") 서명 올리기

                //- ul.upload-stamp-list
                    li.stamp-item(v-for="(stamp, index) of uploadingStamp" :key="index")
                        img(:id="'stamp' + index" :src="stamp.url")
                        .stamp-name {{ stamp.name }}

                ul.stamp-list
                    template(v-if="uploadedStamp.length > 0")
                        //- li.file-name(v-for="(file, index) in uploadedStamp" :key="index") {{ file.filename }}
                    template(v-else)
                        li.stamp-item
                            img#upload-stamp-img(:src="uploadingSrc.url" alt="stamp image")

        br
        br

        .button-wrap(v-if="(verifiedEmail && !onlyEmail) ? false : true")
            //- template(v-if="disabled && !onlyEmail")
            //-     button#startEdit.btn(type="button" :disabled="verifiedEmail" @click="startEdit") 수정
            //- template(v-else)
            button.btn.bg-gray(type="button" :disabled="disabled" @click="cancelEdit") 취소
            button.btn(type="submit" :disabled="disabled") 저장

CropImage(:open="openCropModal" :imageSrc="currentImageSrc" @cropped="setCroppedImage" @close="closeCropImageDialog")

</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { skapi, mainPageLoading } from "@/main";
import { user, profileImage, verifiedEmail } from "@/user";
import { divisionNameList } from "@/division";
import {
    openCropModal,
    croppedImages,
    uploadSrc,
    currentImageSrc,
    resetCropImage,
    openCropImageDialog,
    closeCropImageDialog,
    setCroppedImage,
} from "@/components/crop_image";

import CropImage from "@/components/crop_image.vue";

const router = useRouter();
const route = useRoute();

let optionsBtn = ref(null);
let getFileInfo = ref(null);
let userPosition = ref(null);
let uploadedFile = ref([]);
let uploadedStamp = ref([]);
let backupUploadFile = ref([]);
let removeFileList = ref([]);
let originUserProfile = {};
let access_group = {
    1: "직원",
    98: "관리자",
    99: "마스터",
};
let disabled = ref(false);
let onlyEmail = ref(false);
let showOptions = ref(false);
let fileNames = ref([]);
let stampNames = ref([]);

function makeSafe(str) {
    return str
        .replaceAll(".", "_")
        .replaceAll("+", "_")
        .replaceAll("@", "_")
        .replaceAll("-", "_");
}

let getUserDivision = async () => {
    // // 부서 이름 가져오기
    // await skapi.getRecords({
    //     unique_id: '[division_name_list]',
    //     table: {
    //         name: 'divisionNames',
    //         access_group: 1
    //     },
    // }).then(r => {
    //     divisionNameList.value = r.list[0].data;
    // })

    // user position 가져오기
    skapi
        .getRecords(
            {
                table: {
                    name: "emp_division",
                    access_group: 1,
                },
                tag: "[emp_id]" + makeSafe(user.user_id),
            },
            {
                limit: 1,
                ascending: false,
            }
        )
        .then((r) => {
            let result = r.list[0];

            if (result) {
                let emp_dvs = result.tags
                    .filter((t) => t.includes("[emp_dvs]"))[0]
                    .replace("[emp_dvs]", "");
                let emp_id = result.tags
                    .filter((t) => t.includes("[emp_id]"))[0]
                    .replace("[emp_id]", "")
                    .replaceAll("_", "-");
                let emp_pst = result.tags
                    .filter((t) => t.includes("[emp_pst]"))[0]
                    .replace("[emp_pst]", "");

                userPosition.value = divisionNameList.value[emp_dvs];
            }
        });
};
getUserDivision();

// user additional data 가져오기
// 추가자료 업로드 한 것 가져오기
const getAdditionalData = () => {
    skapi
        .getRecords({
            table: {
                name: "emp_additional_data",
                access_group: 99,
            },
            reference: "[emp_additional_data]" + makeSafe(user.user_id),
        })
        .then((res) => {
            let fileList = [];

            if (res.list.length === 0) {
                fileList = [];
                uploadedFile.value = fileList;
            } else {
                res.list.forEach((item) => {
                    if (item.bin.additional_data && item.bin.additional_data.length > 0) {
                        function getFileUserId(str) {
                            if (!str) return "";
                            return str.split("/")[3];
                        }

                        const result = item.bin.additional_data.map((el) => ({
                            ...el,
                            user_id: getFileUserId(el.path),
                            record_id: item.record_id,
                        }));

                        fileList.push(...result);
                    }
                });
                uploadedFile.value = fileList;
            }
        })
        .catch((err) => {
            console.log("== getRecords == err : ", err);
        });
};

if (user && !user.approved.includes("by_master")) {
    getAdditionalData();
}

let getProfileImage = async () => {
    try {
        let res = await skapi.getFile(user.picture, {
            dataType: "endpoint",
        });

        profileImage.value = res;
        uploadSrc.value.profile_pic = res;
    } catch (err) {
        window.alert("프로필 사진을 불러오는데 실패했습니다.");
        throw err;
    }
};

let sendEmail = async () => {
    try {
        await skapi.verifyEmail();
    } catch (err) {
        window.alert(err.message);
    }
    router.push("/verification");
};

let profile_pic_input = ref(null);

let selectFile = () => {
    showOptions.value = false;
    profile_pic_input.value.click();
};

let setToDefault = () => {
    showOptions.value = false;
    uploadSrc.value.profile_pic = null;
    profile_pic.value = "";
};

let closeOptions = (e) => {
    if (showOptions.value && !optionsBtn.value.contains(e.target)) {
        showOptions.value = false;
    }
};

// let startEdit = () => {
//     for (let k in originUserProfile) {
//         delete originUserProfile[k];
//     }

//     for (let k in user) {
//         originUserProfile[k] = user[k];
//     }

//     fileNames.value = [];
//     backupUploadFile.value = [...uploadedFile.value];
// }

let cancelEdit = () => {
    // for (let k in user) {
    //     delete user[k];
    // }

    // for (let k in originUserProfile) {
    //     user[k] = originUserProfile[k];
    // }

    if (verifiedEmail.value && onlyEmail.value) {
        onlyEmail.value = false;
        return;
    }

    removeFileList.value = [];
    uploadedFile.value = [...backupUploadFile.value];
    router.push("/mypage");
};

let registerMypage = async (e) => {
    e.preventDefault();

	mainPageLoading.value = true;
    disabled.value = true;

    // 올린 사람과 수정하는 사람이 같지 않거나 올린 기록이 없으면 table 정보로
    // 같으면 record_id로 사진 수정
    let profile_pic_postParams = {};
    let samePerson = false;

    if (user.user_id === getFileInfo.value?.uploader) {
        samePerson = true;
        profile_pic_postParams.record_id = getFileInfo.value.record_id;
    } else {
        profile_pic_postParams = {
            table: {
                name: "profile_picture",
                access_group: "authorized",
            },
        };
    }

    if (uploadSrc.value.profile_pic) {
        _el_picture_input.value = uploadSrc.value.profile_pic.split("?")[0]; // 사진 수정 안할때 기존 사진을 그대로 넣어줌
    }

    if (croppedImages.value["profile_pic"]) {
        // 사진 수정할때 새로운 사진을 넣어줌
        // 새로 선택한 사진이 있고 본인이 이전에 올린 사진이 있을 경우 레코드에서 이전 사진을 삭제하는 파라미터를 추가한다.
        if (samePerson && getFileInfo.value?.uploader === user.user_id) {
            profile_pic_postParams.remove_bin = null;
        }

        const croppedFile = new File(
            [croppedImages.value["profile_pic"]],
            "profile_pic.png",
            {
                type: croppedImages.value["profile_pic"].type,
            }
        );

        const imgFormData = new FormData();
        imgFormData.append("profile_pic", croppedFile);

        // 새 이미지를 레코드에 업로드하고 보안키를 제외한 이미지 주소를 userprofile의 picture에 넣어준다.
        let picRec = await skapi.postRecord(imgFormData, profile_pic_postParams);
        _el_picture_input.value = picRec.bin.profile_pic.at(-1).url.split("?")[0];
    }

    // 기존 사진을 기본 이미지로 변경했을 경우
    if (uploadSrc.value.profile_pic === null && samePerson) {
        _el_picture_input.value = null;
        await skapi.deleteRecords({ record_id: getFileInfo.value.record_id });
    } else if (uploadSrc.value.profile_pic === null && !samePerson) {
        _el_picture_input.value = null;
        await skapi.postRecord(
            document.getElementById("profile_pic"),
            profile_pic_postParams
        );
    }

    // const files = document.querySelector('input[name="additional_data"]').files;
    let filebox = document.querySelector("input[name=additional_data]");

    if (filebox && filebox.files.length) {
        for (let file of filebox.files) {
            const additionalFormData = new FormData();

            additionalFormData.append("additional_data", file);

            await skapi.postRecord(additionalFormData, {
                table: {
                    name: "emp_additional_data",
                    access_group: 99,
                },
                reference: "[emp_additional_data]" + makeSafe(user.user_id),
            });

            if (uploadedFile.value && uploadedFile.value.length) {
                backupUploadFile.value = [...uploadedFile.value];
            }
        }

        document.querySelector('input[name="additional_data"]').value = "";
        fileNames.value = [];
    } else {
        // console.log(
        //     "false == registerMypage == uploadedFile.value : ",
        //     uploadedFile.value
        // );
    }

    // document.querySelector('input[name="additional_data"]').value = '';
    // fileNames.value = [];

    if (removeFileList.value.length) {
        await skapi.deleteRecords({ record_id: removeFileList.value }).then((r) => {
            removeFileList.value = [];
        });
    }

    // 프로필 정보를 업데이트
    await skapi.updateProfile(e);

    getAdditionalData();

    window.alert("회원정보가 수정되었습니다.");
    onlyEmail.value = false;
    disabled.value = false;
	mainPageLoading.value = false;
};

// 업로드 파일 삭제
let removeFile = (item) => {
    removeFileList.value.push(item.record_id);
};

let cancelRemoveFile = (item) => {
    removeFileList.value = removeFileList.value.filter((id) => id !== item.record_id);
};

// 파일 추가시 파일명 표시
let updateFileList = (e) => {
    let target = e.target;

    if (target.files) {
        fileNames.value = Array.from(target.files).map((file) => file.name);
    }
};

onMounted(async () => {
    document.addEventListener("click", closeOptions);

    resetCropImage();

    if (user.picture) {
        if (profileImage.value) {
            uploadSrc.value.profile_pic = profileImage.value;
        } else {
            getProfileImage();
        }

        // 프로필 사진 정보 가져오기 (사진 올린 사람 찾기)
        skapi
            .getFile(user.picture, {
                dataType: "info",
            })
            .then((res) => {
                getFileInfo.value = res;
            })
            .catch((err) => {
                console.log("== getFile == err : ", err);
            });
    }
});

onUnmounted(() => {
    document.removeEventListener("click", closeOptions);
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
        .btn-upload-file {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.5rem;

            input,
            label,
            button {
                margin: 0;
            }
        }

        .file-item {
            width: 651px;

            &.disabled {
                background-color: var(--gray-color-50);
            }
            &.remove {
                background-color: var(--warning-color-50);
                border: 1px dashed var(--warning-color-400);
                color: var(--warning-color-500);
            }
        }
    }
}

#upload-stamp-img {
    width: 100px;
    height: 100px;
    border-radius: 30%;
    display: block;
    object-fit: contain;
    position: relative;
    background-color: #fff;
    border: 2px dashed var(--gray-color-100);
    margin-bottom: 0.5rem;

    &::before {
        content: "도장 등록";
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: #888;
        background-color: #fff;
        font-size: 14px;
        text-align: center;
        position: absolute;
        top: 0;
        left: 0;
    }
}

#_el_myinfoForm {
    .upload-stamp-list {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem;

        .stamp-item {
            text-align: center;
            margin-top: 8px;
        }
    }
}

@media (max-width: 682px) {
    .input-wrap {
        &.upload-file {
            .btn-upload-file {
                input,
                label,
                button {
                    flex-grow: 1;
                }
            }
            .btn-upload-file + .file-list {
                .file-item {
                    width: 100%;
                }
            }

            .file-item {
                width: 100%;
            }
        }
        &.upload-stamp {
        }
    }
}
</style>
