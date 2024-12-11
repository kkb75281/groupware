<template lang="pug">
.title
    h1 직원 등록
    span 직원을 등록하면 초대 이메일이 발송됩니다.

hr

.form-wrap
    form#profPic
        .image
            img#profile-img(:src="uploadSrc.init_profile_pic" alt="profile image")
            label(for="init_profile_pic")
                .icon.white
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-camera")
            input#init_profile_pic(ref="init_profile_pic_input" type="file" name="init_profile_pic" accept="image/*" @change="openCropImageDialog" style="opacity: 0;width: 0;height: 0;position: absolute;")

    br

    form#_el_emp_form(@submit.prevent="registerEmp")
        .input-wrap
            p.label.essential 부서
            select(name="division" required disabled)
                option(value="" disabled selected) 부서 선택
        
        br
        
        .input-wrap
            p.label.essential 권한
            select(name="access_group" required)
                option(value="" disabled selected) 권한선택
                option(value="1") 직원
                option(value="98") 관리자
                option(value="99") 마스터

        br

        .input-wrap
            p.label.essential 직책(직급)
            input#_el_position(type="text" name="position" placeholder="직책(직급)을 입력해주세요." required)

        br

        input(type="text" name="picture" id='_el_picture_input' hidden)

        .input-wrap
            p.label.essential 이름
            input(type="text" name="name" placeholder="이름을 입력해주세요." required)
        
        br

        .input-wrap
            p.label.essential 이메일
            input(type="email" name="email" placeholder="예) user@email.com" required)

        br

        .input-wrap
            p.label 생년월일
            input(type="date" name="birthdate")

        br

        .input-wrap
            p.label 전화번호
            input(type="tel" name="phone_number" placeholder="예) +821012345678")

        br

        .input-wrap
            p.label 주소
            input(type="text" name="address"  placeholder="예) 서울시 마포구")

        br

        .input-wrap.upload-file
            p.label 기타자료
            .file-wrap
                //- template(v-if="!disabled")
                .btn-upload-file
                    input#file(type="file" name="additional_data" multiple @change="updateFileList" hidden)
                    label.btn.outline.btn-upload(for="file") 파일 추가
                    ul.upload-file-list
                        li.file-name(v-for="(name, index) in fileNames" :key="index") {{ name }}

        br
        br

        input(type="checkbox" name="email_public" checked hidden)
        input(type="checkbox" name="phone_number_public" checked hidden)
        input(type="checkbox" name="address_public" checked hidden)
        //- input(type="checkbox" name="gender_public" checked hidden)
        input(type="checkbox" name="birthdate_public" checked hidden)

        .button-wrap
            button.btn.bg-gray(type="button" @click="$router.push('/list-employee')") 취소
            button.btn(type="submit") 등록

CropImage(:open="openModal" :imageSrc="currentImageSrc" @cropped="setCroppedImage" @close="closeCropImageDialog")

br  
br  
br  
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import { skapi } from '@/main';
import { openModal, croppedImages, uploadSrc, currentImageSrc, openCropImageDialog, closeCropImageDialog, setCroppedImage } from '@/components/crop_image';

import CropImage from '@/components/crop_image.vue';
import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

let fileNames = ref([]);
let init_profile_pic_input = ref(null);

// let selectedFiles = [];

// let handleFileSelect = (event) => {
//     // 현재 선택된 파일들
//     const files = Array.from(event.target.files);

//     // 기존 파일 리스트에 새 파일 추가 (중복 방지)
//     files.forEach((file) => {
//         if (!this.selectedFiles.find((f) => f.name === file.name)) {
//             this.selectedFiles.push(file);
//         }
//     });

//     // 파일 입력 초기화 (같은 파일 선택 가능)
//     event.target.value = null;
// }

// let removeFile = (file) => {
//     // 선택된 파일 삭제
//     this.selectedFiles = this.selectedFiles.filter((f) => f !== file);
// }

skapi.getRecords({
    unique_id: '[division_name_list]',
    table: {
        name: 'divisionNames',
        access_group: 1
    }
}).then(r => {
    if(!r.list.length) {
        alert('부서가 등록되어 있지 않습니다. 부서를 먼저 등록해주세요.');
        router.push('/list-employee');
    } else {
        let divisionNames = r.list[0].data;
    
        for(let key in divisionNames) {
            if(divisionNames[key] !== '') {
                const option = document.createElement('option');
                option.value = key;
                option.innerText = divisionNames[key];
                document.querySelector('select[name="division"]').appendChild(option);
            }
        }
    
        document.querySelector('select[name="division"]').disabled = false;
    }
});

// 파일 추가시 파일명 표시
let updateFileList = (e) => {
  let target = e.target;
  if (target.files) {
    fileNames.value = Array.from(target.files).map(file => file.name);
  }
};

function makeSafe(str) {
    return str.replaceAll('.', '_').replaceAll('+', '_').replaceAll('@', '_').replaceAll('-', '_');
}

// let registerEmp = (e) => {
//     // 입력창을 비활성화한다.
//     document.querySelectorAll('form input').forEach(el => el.disabled = true);
//     document.querySelectorAll('form button').forEach(el => el.disabled = true);

//     async function post() {
//         // 사용자를 등록(초대)한다. try catch는 아래와는 달리 작게 만들도록 한다.
//         try {
//             if(init_profile_pic.files.length > 0) {
//                 let initPicParams = {
//                     table: {
//                         name: 'init_profile_pic' + makeSafe(document.querySelector('input[name=email]').value), // 관리자가 올리는 초기 프로필 사진을 저장하는 테이블
//                         // name: 'init_profile_pic' + makeSafe(uploadSrc.value.init_profile_pic), // 관리자가 올리는 초기 프로필 사진을 저장하는 테이블
//                         access_group: 1
//                     },
//                 };

//                 const croppedFile = new File([croppedImages.value['init_profile_pic']], 'init_profile_pic.png', {
//                     type: croppedImages.value['init_profile_pic'].type,
//                 });

//                 const imgFormData = new FormData();
//                 imgFormData.append('init_profile_pic', croppedFile);

//                 let userInitProfilePic = await skapi.postRecord(imgFormData, initPicParams);
//                 _el_picture_input.value = userInitProfilePic.bin.init_profile_pic[0].url.split('?')[0];
//             }

//             // 직원을 초대한다.
//             let added = await skapi.inviteUser(e, {confirmation_url: '/mailing'}).catch(err => {
//                 throw new err;
//             });
//             // SUCCESS: Invitation has been sent. (User ID: 41d92250-bc3a-45c9-a399-1985a41d762f)

//             // extract user id
//             let user_id = added.split(' ').pop().slice(0, -1); // user_id 추출
//             let user_id_safe = makeSafe(user_id); // tag 및 index는 특수문자를 사용할 수 없다. (_ 는 사용할수있다)

//             let user_name = document.querySelector('input[name=name]').value;
//             let user_division_name = document.querySelector('select[name=division]').value;

//             // 직원의 부서를 등록한다. 직책(직급) 은 여러개일수 있으니 tag로 사용한다. user_id는 index로 사용하여 직원의 직책을 찾을수 있다.
//             skapi.postRecord(
//                 null,
//                 {
//                     unique_id: "[emp_division]" + user_id_safe,
//                     table: {
//                         name: 'emp_division',
//                         access_group: 1
//                     },
//                     tags: ["[emp_pst]" + _el_position.value, "[emp_id]" + user_id_safe, "[emp_dvs]" + user_division_name] // 여러개의 태그를 사용할 수 있다. 태그를 사용하면 태그된 레코드의 갯수를 알수있다.
//                 }
//             )

//             // 현재 직원 부서 등록 (current용)
//             skapi.postRecord({
//                 user_id: user_id,
//             }, {
//                 unique_id: "[emp_position_current]" + user_id_safe,
//                 table: {
//                     name: 'emp_position_current',
//                     access_group: 1
//                 },
//                 index: {
//                     name: user_division_name + '.' + _el_position.value,
//                     value: user_name
//                 }
//             }).then(r => {
//                 console.log('current부서직책업데이트', r);
//             })
            
//             // 직원과 마스터만 볼수 있는 자료방 reference 레코드를 마련한다.
//             await skapi.postRecord(null, {
//                 unique_id: "[emp_additional_data]" + user_id_safe,
//                 table: {
//                     name: 'emp_access_ref',
//                     access_group: 99
//                 },
//                 index: {
//                     name: 'user_id',
//                     value: user_id_safe
//                 },
//                 reference: {
//                     can_remove_reference: true // 마스터가 삭제 해당 레코드 삭제시, reference된 모든 레코드들도 지워지도록 한다.
//                 }
//             }).then(async(res) => {
//                 let access_group_value = document.querySelector('select[name=access_group]').value;

//                 // 마스터가 아니면 직원이므로 직원에게 접근권한을 부여한다. (마스터는 모든 레코드를 볼수 있으므로)
//                 if(access_group_value !== '99') {
//                     // 생성된 레코드에 대한 접근권한을 부여한다. (레코드를 reference해서 올리면 직원과 마스터만 볼수 있다)
//                     skapi.grantPrivateRecordAccess({
//                         record_id: res.record_id,
//                         user_id: user_id
//                     });
//                 }

//                 const files = document.querySelector('input[name=additional_data]').files;

//                 if (files.length) {
//                     for(let file of files) {
//                         const formData = new FormData();

//                         formData.append('additional_data', file);
                        
//                         await skapi.postRecord(formData, {
//                             table: {
//                                 name: 'emp_additional_data',
//                                 access_group: 99
//                             },
//                             reference: {
//                                 unique_id: "[emp_additional_data]" + user_id_safe,
//                             }
//                         });
//                     }
//                 }
//             });

//             await skapi.getInvitations().then(res => {
//                 // let result = res.list;
//                 // for(let r of result) {
//                 //     if(r.user_id === user_id) {
//                 //         r.position = _el_position.value;
//                 //         r.division = user_division_name;
//                 //     }
//                 // }
//                 window.sessionStorage.setItem('inviteEmployee', JSON.stringify(res.list));
//             });

//             window.alert('등록완료');
//         }
//         catch (error) {
//             window.alert('직원 등록에 실패하였습니다. 다시 시도해주세요.' + error.message);
//             document.querySelector('form #profile-img').src = '';
//             document.querySelectorAll('form select').forEach(el => {
//                 el.selectedIndex = 0;
//             });
//             document.querySelectorAll('form input').forEach(el => {
//                 el.disabled = false;
//                 el.value = '';
//             });
//             document.querySelectorAll('form button').forEach(el => {
//                 el.disabled = false;
//             });
            
//             throw error;
//         }

//         router.push({
//             path: '/list-employee',
//             query: { empListType: '초청여부' }
//         });
//     }

//     post();
// }

const inviteUserMail = async (e) => {
  return await skapi.inviteUser(e, {confirmation_url: '/mailing'});
}

const getInvitations = async () => {
  return await skapi.getInvitations();
}

const postRecord = async (data, params) => {
  return await skapi.postRecord(data, params);
}

const empProfileUpload = async () => {
  if (init_profile_pic.files.length === 0) return;

  try {
    const email = document.querySelector('input[name=email]').value;
    const makeSafeEmail = makeSafe(email);
    const tableName = 'init_profile_pic' + makeSafeEmail;

    let initPicParams = {
        table: {
            name: tableName,
            access_group: 1
        },
    };

    const croppedImage = croppedImages.value['init_profile_pic']
    const profileName = 'init_profile_pic.png';
    const fileType = croppedImage.type

    const croppedFile = new File([croppedImage], profileName, {
        type: fileType,
    });

    const imgFormData = new FormData();
    imgFormData.append('init_profile_pic', croppedFile);

    const userInitProfilePic = await postRecord(imgFormData, initPicParams)
    _el_picture_input.value = userInitProfilePic.bin.init_profile_pic[0].url.split('?')[0];
  } catch (error) {
    console.log('== empProfileUpload : error == : ', error)
  }
}

// 직원의 부서를 등록한다. 직책(직급) 은 여러개일수 있으니 tag로 사용한다. user_id는 index로 사용하여 직원의 직책을 찾을수 있다.
const registerEmpDivision = async (data) => {
  if (!data) return;

  try {
    const { user_id_safe, user_division_name } = data;

    const params = {
      unique_id: "[emp_division]" + user_id_safe,
      table: {
          name: 'emp_division',
          access_group: 1
      },
      tags: ["[emp_pst]" + _el_position.value, "[emp_id]" + user_id_safe, "[emp_dvs]" + user_division_name] 
    }


    return await postRecord(null, params);
  } catch (error) {
    console.log('== registerEmpDivision : error == : ', error)
  }
} 

// 현재 직원 부서 등록 (current용)
const currentEmpDivision = async (data) => {
  if (!data) return;

  try {
    const { user_id, user_id_safe, user_division_name, user_name } = data;

    const params = {
      unique_id: "[emp_position_current]" + user_id_safe,
      table: {
          name: 'emp_position_current',
          access_group: 1
      },
      index: {
          name: user_division_name + '.' + _el_position.value,
          value: user_name
      }
    }

    return await postRecord({ user_id }, params)
  } catch (error) {
    console.log('== currentEmpDivision : error == : ', error)
  }
}

const grantPrivateRecordAccess = (data) => {
  if (!data) return;

  return skapi.grantPrivateRecordAccess(data);
}

// 직원과 마스터만 볼수 있는 자료방 reference 레코드를 마련한다.
const createReference = async (data) => {
  if (!data) return;

  try {
    const { user_id_safe, user_division_name, user_id } = data;

    const params = {
      unique_id: "[emp_additional_data]" + user_id_safe,
      table: {
          name: 'emp_access_ref',
          access_group: 99
      },
      index: {
          name: 'user_id',
          value: user_id_safe
      },
      reference: {
          can_remove_reference: true // 마스터가 삭제 해당 레코드 삭제시, reference된 모든 레코드들도 지워지도록 한다.
      }
    }

    const res = await postRecord(null, params);

    const access_group_value = document.querySelector('select[name=access_group]').value;
    const files = document.querySelector('input[name=additional_data]').files;

    // 마스터가 아니면 직원이므로 직원에게 접근권한을 부여한다. (마스터는 모든 레코드를 볼수 있으므로)
    if(access_group_value !== '99') {
      // 생성된 레코드에 대한 접근권한을 부여한다. (레코드를 reference해서 올리면 직원과 마스터만 볼수 있다)
      grantPrivateRecordAccess({
          record_id: res.record_id,
          user_id
      });
    }

    if (files.length) {
      for(let file of files) {
        const formData = new FormData();

        formData.append('additional_data', file);
          
        const params = {
          table: {
              name: 'emp_additional_data',
              access_group: 99
          },
          reference: {
              unique_id: "[emp_additional_data]" + user_id_safe,
          }
        }

        await postRecord(formData, params);
      }
    }
  } catch (error) {
    console.log('== createReference : error == : ', error)
  }
}

// 직원등록 함수
const registerEmp = async (e) => {  
  try {
    // 입력창을 비활성화한다.
    document.querySelectorAll('form input').forEach(el => el.disabled = true);
    document.querySelectorAll('form button').forEach(el => el.disabled = true);

    if(init_profile_pic.files.length > 0) {
      empProfileUpload()
    }

    // 직원을 초대한다.
    const added = await inviteUserMail(e);
    // SUCCESS: Invitation has been sent. (User ID: 41d92250-bc3a-45c9-a399-1985a41d762f)

    if (!added) {
      console.log('직원 초대에 실패하였습니다.');
    }

    // extract user id
    const user_id = added.split(' ').pop().slice(0, -1); // user_id 추출
    const user_id_safe = makeSafe(user_id); // tag 및 index는 특수문자를 사용할 수 없다. (_ 는 사용할수있다)

    const user_name = document.querySelector('input[name=name]').value;
    const user_division_name = document.querySelector('select[name=division]').value;

    
    // 직원의 부서를 등록한다.
    await registerEmpDivision({ user_id_safe, user_division_name });
    
    // 현재 직원 부서 등록
    await currentEmpDivision({ user_id, user_id_safe, user_division_name, user_name });
    
    // 직원과 마스터만 볼수 있는 자료방 reference 레코드를 마련한다.
    await createReference({ user_id_safe, user_division_name, user_id });

    const res = getInvitations();

    if (!res) {
      return console.log('실패');
    }

    window.sessionStorage.setItem('inviteEmployee', JSON.stringify(res.list));
    window.alert('직원 등록이 완료되었습니다.');
  } catch (error) {
    window.alert('직원 등록에 실패하였습니다. 다시 시도해주세요.' + error.message);
    document.querySelector('form #profile-img').src = '';
    document.querySelectorAll('form select').forEach(el => el.selectedIndex = 0);
    document.querySelectorAll('form button').forEach(el => el.disabled = false);
    document.querySelectorAll('form input').forEach(el => {
        el.disabled = false;
        el.value = '';
    });
    
    throw error;
  } finally {
    router.push({
      path: '/list-employee',
      query: { empListType: '초청여부' }
    });
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

.form-wrap {
    max-width: 650px;
    margin: 0 auto;
}

#profPic {
    text-align: center;

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

.button-wrap {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 8px;
}

.btn-upload-file {
    .btn {
        max-width: 100px;
        height: 36px;
        font-size: 0.8rem;
    }
}

.file-list {
    margin-top: 12px;
}
</style>