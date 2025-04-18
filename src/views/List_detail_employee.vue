<template lang="pug">
//- .title
//- 	h1 직원 상세

//- hr

.inner
    .form-wrap(v-if="currentEmp")
        form#_el_empDetail_form
            .imgbtn-wrap
                .image
                    img#profile-img(:src="currentEmp?.picture" alt="profile image")

                //- .util-wrap
                    .util-btn(:class="{'disabled' : !currentEmp?.phone_number}")
                        a.click-btn(:href="'tel:' + currentEmp?.phone_number" style="display: block;")
                            svg
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-phone-call")
                        span 전화걸기
                    .util-btn
                        button.click-btn(type="button" @click="sendMail(currentEmp?.email)" :disanbled="!currentEmp?.email || disabled")
                            svg
                                use(xlink:href="@/assets/icon/material-icon.svg#icon-mail")
                        span 이메일전송

            .input-wrap
                p.label 직책
                input(type="text" name="position" v-model="currentEmpTags.emp_pst" :readonly="disabled" :disabled="disabled && currentEmpTags.emp_pst === ''")
                p.desc(v-if="user.access_group > 98 && currentEmpTags.emp_pst === ''") 직책을 등록해주세요.

            .input-wrap
                p.label 부서
                template(v-if="disabled")
                    input(type="text" name="division" :disabled="!divisionNameList[currentEmp?.division]" :value="divisionNameList[currentEmp?.division]" :placeholder="divisionNameList[currentEmp?.division]" readonly)
                template(v-else)
                    select(name="division" required disabled v-model="currentEmpTags.emp_dvs")
                        option(value="" disabled) 부서 선택
                p.desc(v-if="user.access_group > 98 && currentEmpTags.emp_dvs === ''") 부서를 등록해주세요.
            
            .input-wrap
                p.label 권한
                template(v-if="disabled")
                    input(type="text" name="access_group" :value="access_group[currentEmp?.access_group] || '-' " readonly)
                template(v-else)
                    select(name="access_group" v-model="currentEmp.access_group")
                        option(value="" disabled selected) 권한선택
                        option(value="1") 직원
                        option(value="98") 관리자
                        option(value="99") 마스터
                
            .input-wrap
                p.label 이름
                input(type="text" name="name" :value="currentEmp?.name || '-' "  placeholder="이름을 입력해주세요." :readonly="disabled" disabled required)

            .input-wrap
                p.label 이메일
                input(type="email" name="email" :value="currentEmp?.email || '-' " placeholder="예) user@email.com" disabled)
                .icon(v-if="currentEmp?.email" @click="copy(currentEmp?.email)")
                    svg
                        use(xlink:href="@/assets/icon/material-icon.svg#icon-file-copy-fill")

            .input-wrap
                p.label 생년월일
                input(type="date" name="birthdate" :value="currentEmp?.birthdate" disabled style="width:100% !important")

            .input-wrap
                p.label 전화번호
                input(type="tel" name="phone_number" :value="currentEmp?.phone_number || '-' " placeholder="예) +821012345678" disabled)
                .icon(v-if="currentEmp?.phone_number")
                    a(:href="'tel:' + currentEmp?.phone_number")
                        svg
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-phone-call")

            .input-wrap
                p.label 주소
                input(type="text" name="address" :value="currentEmp?.address || '-' " placeholder="예) 서울시 마포구" disabled)

            .input-wrap.upload-stamp
                p.label 도장
                .main-stamp
                    img#stamp-img(:src="getStampImageSrc(mainStamp)" alt="도장 이미지")

            .input-wrap.upload-file(v-if="user.access_group > 98 || user.user_id === currentEmp?.user_id")
                p.label(style="margin-bottom: 0;") 기타자료
                template(v-if="!disabled")
                    .btn-upload-file
                        input#file(type="file" name="additional_data" multiple :disabled="disabled" @change="updateFileList" hidden)
                        label.btn.outline.btn-upload(for="file") 파일 추가
                        ul.upload-file-list
                            li.file-name(v-for="(name, index) in fileNames" :key="index") {{ name }}

                .file-wrap
                    ul.file-list
                        template(v-if="uploadFile.length === 0")
                            li.file-item(style="height: 36px;") 등록된 파일이 없습니다.
                        template(v-else)
                            li.file-item(v-for="(file, index) in uploadFile" :key="index" :class="{'remove': removeFileList.includes(file.record_id)}")
                                a.file-name(:href="file.url" target="_blank") {{ file.filename }}
                                template(v-if="!disabled")
                                    button.btn-cancel(v-if="removeFileList.includes(file.record_id)" type="button" @click="removeFileList = removeFileList.filter((id) => id !== file.record_id);")
                                        svg
                                            use(xlink:href="@/assets/icon/material-icon.svg#icon-undo")
                                    button.btn-remove(v-else type="button" @click="removeFileList.push(file.record_id);")
                                        svg
                                            use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")

            br
            br
            br

            .button-wrap
                template(v-if="user.access_group > 98")
                    template(v-if="disabled")
                        button.btn.bg-gray(type="button" @click="$router.push('/list-employee')") 이전
                        button.btn.btn-edit(type="button" @click="startEditEmp") 수정
                    template(v-else)
                        button.btn.bg-gray.btn-cancel(type="button" @click="cancelEdit") 취소
                        button.btn.btn-register(type="submit" @click="registerEmp") 저장
                template(v-else)
                    button.btn.bg-gray(type="button" @click="$router.push('/list-employee')") 이전


br  
br  
br  
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, nextTick } from 'vue';
import { skapi, mainPageLoading } from '@/main.ts';
import { user, makeSafe } from '@/user.ts';
import { divisionNameList, getDivisionNames } from '@/division.ts'
import { getEmpDivisionPosition, getUsers, employeeDict } from '@/employee.ts';
import { openGmailAppOrWeb } from '@/utils/mail.ts';
import { getStampList, uploadedStamp } from '@/stamp.ts';

const router = useRouter();
const route = useRoute();

let currentEmp = ref(null);
let currentEmpOriginal = {};
let currentEmpTags = ref({
  emp_dvs: '',
  emp_pst: ''
});
let uploadFile = ref([]);
let backupUploadFile = ref([]);
let disabled = ref(true);
let removeFileList = ref([]);
let fileNames = ref([]);
let access_group = {
  1: '직원',
  98: '관리자',
  99: '마스터'
};
let mainStamp = ref({}); // 대표 도장 정보

const userId = route.params.userId;
getUsers({ searchFor: 'user_id', value: userId })
  .then((li) => Promise.all(li.map((l) => getEmpDivisionPosition(l))))
  .then((res) => {
    if (res.length === 0) {
      window.alert('해당 직원을 찾을 수 없습니다.');
      router.push('/list-employee');
    }

    let emp = res[0];
    currentEmp.value = emp;

    currentEmpTags.value.emp_dvs = emp.division || '';
    currentEmpTags.value.emp_pst = emp.position || '';
  });

// 부서 목록 가져오기
getDivisionNames();

// 추가자료 가져오기
let getAdditionalData = () => {
  if (user.access_group < 99 && user.user_id !== userId) {
    return;
  }

  skapi
    .getRecords({
      table: {
        name: 'emp_additional_data',
        access_group: 99
      },
      reference: '[emp_additional_data]' + makeSafe(userId)
    })
    .then((res) => {
      if (res.list.length > 0) {
        let fileList = [];

        function getFileUserId(str) {
          if (!str) return '';

          return str.split('/')[3];
        }

        res.list.forEach((item) => {
          if (item.bin.additional_data && item.bin.additional_data.length > 0) {
            const result = item.bin.additional_data.map((el) => ({
              ...el,
              user_id: getFileUserId(el.path),
              record_id: item.record_id
            }));

            fileList.push(...result);
          }
        });

        uploadFile.value = fileList;
      }
    });
};
getAdditionalData();

// 부서 목록 옵션으로 가져오기 (회원 수정시 사용)
let displayDivisionOptions = () => {
  let divisionList = document.querySelector(`select[name="division"]`);

  // 기존 옵션을 제거하지 않고 새로운 옵션을 추가
  divisionList.innerHTML = ''; // 기존 옵션 초기화

  const allOption = document.createElement('option');
  const defaultOption = document.createElement('option');

  let matchFound = false;

  // 기본 옵션 추가
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.innerText = '부서 선택';
  divisionList.appendChild(defaultOption);

  // 동적으로 부서 옵션 추가
  for (let key in divisionNameList.value) {
    if (divisionNameList.value[key] !== '') {
      const option = document.createElement('option');
      option.value = key;
      option.innerText = divisionNameList.value[key];

      // 선택된 부서 처리
      if (key === currentEmp.value.division) {
        option.selected = true;
        matchFound = true;
      }

      divisionList.appendChild(option);
    }
  }

  // 일치하는 키가 없으면 기본 옵션에 selected 추가
  if (!matchFound) {
    defaultOption.selected = true;
  }

  // 선택박스 활성화
  divisionList.disabled = false;
};

let sendMail = async (mail) => {
  const maillink = encodeURIComponent(mail);

  openGmailAppOrWeb(maillink);
};

let copy = (text) => {
  let doc = document.createElement('textarea');
  doc.textContent = text;
  document.body.append(doc);
  doc.select();
  document.execCommand('copy');
  doc.remove();

  alert('이메일이 복사되었습니다.');
};

// 파일 업로드 리스트 업데이트
let updateFileList = (e) => {
  let target = e.target;
  if (target.files) {
    fileNames.value = Array.from(target.files).map((file) => file.name);
  }
};

// 수정 시작
let startEditEmp = async () => {
  disabled.value = false;
  currentEmpOriginal = { ...currentEmp.value };
  currentEmpOriginal.division = currentEmpTags.value.emp_dvs;
  currentEmpOriginal.position = currentEmpTags.value.emp_pst;
  fileNames.value = [];
  removeFileList.value = [];

  nextTick(() => {
    displayDivisionOptions();
  });

  if (uploadFile.value) {
    backupUploadFile.value = [...uploadFile.value];
  }
};

// 수정 취소
let cancelEdit = () => {
  disabled.value = true;
  currentEmp.value = { ...currentEmpOriginal };
  currentEmpTags.value.emp_dvs = currentEmpOriginal.division;
  currentEmpTags.value.emp_pst = currentEmpOriginal.position;
  fileNames.value = [];
  removeFileList.value = [];
  uploadFile.value = [...backupUploadFile.value];
};

// 수정사항 저장
let registerEmp = async (e) => {
  e.preventDefault();
  mainPageLoading.value = true;
  disabled.value = true;

  let user_id_safe = makeSafe(currentEmp.value.user_id);
  let needUpdate = false;

  // 부서, 직책 업데이트 (history/current)
  if (
    currentEmpOriginal.division !== currentEmpTags.value.emp_dvs ||
    currentEmpOriginal.position !== currentEmpTags.value.emp_pst
  ) {
    skapi
      .postRecord(null, {
        table: {
          name: 'emp_division' + user_id_safe,
          access_group: 1
        },
        tags: [
          '[emp_pst]' + currentEmpTags.value.emp_pst,
          '[emp_id]' + user_id_safe,
          '[emp_dvs]' + currentEmpTags.value.emp_dvs
        ]
      })
      .then((r) => {
        // console.log('history 부서직책업데이트', r);
      });

    await skapi
      .deleteRecords({ unique_id: '[emp_position_current]' + user_id_safe })
      .then((r) => {
        // console.log(r)
      })
      .catch((err) => err);

    await skapi
      .postRecord(
        {
          user_id: currentEmp.value.user_id
        },
        {
          unique_id: '[emp_position_current]' + user_id_safe,
          table: {
            name: 'emp_position_current',
            access_group: 1
          },
          index: {
            name: currentEmpTags.value.emp_dvs + '.' + currentEmpTags.value.emp_pst,
            value: currentEmp.value.name
          }
        }
      )
      .then((r) => {
        // console.log('current 부서직책업데이트', r);
      });

    needUpdate = true;
  }

  // 권한 업데이트
  if (currentEmpOriginal.access_group !== currentEmp.value.access_group) {
    skapi
      .grantAccess({
        user_id: currentEmp.value.user_id,
        access_group: currentEmp.value.access_group
      })
      .then((r) => {
        // console.log('권한업데이트' ,r)
      });
  }

  // 추가자료 업데이트
  let filebox = document.querySelector('input[name=additional_data]');

  if (filebox && filebox.files.length) {
    for (let file of filebox.files) {
      const formData = new FormData();

      formData.append('additional_data', file);

      await skapi.postRecord(formData, {
        table: {
          name: 'emp_additional_data',
          access_group: 99
        },
        reference: '[emp_additional_data]' + makeSafe(currentEmp.value.user_id)
      });
    }

    if (uploadFile.value && uploadFile.value.length) {
      backupUploadFile.value = [...uploadFile.value];
    }
  }

  if (removeFileList.value.length) {
    await skapi.deleteRecords({ record_id: removeFileList.value }).then((r) => {
      uploadFile.value = uploadFile.value.filter(
        (file) => !removeFileList.value.includes(file.record_id)
      );

      removeFileList.value = [];
    });
  }

  currentEmp.value.division = currentEmpTags.value.emp_dvs;
  currentEmp.value.position = currentEmpTags.value.emp_pst;

  employeeDict[currentEmp.value.user_id] = currentEmp.value;

  getAdditionalData();
  window.alert('직원 정보 수정이 완료되었습니다.');

  disabled.value = true;
  mainPageLoading.value = false;
};

// 도장 이미지 URL 가져오기
const getStampImageSrc = (mainStamp) => {
  // 도장 목록이 비어있으면 빈 문자열 반환
  if (uploadedStamp.value === undefined || uploadedStamp.value.length === 0) {
    return '';
  }

  // 레코드에서 로드된 도장인지 확인 (문자열인 경우)
  if (typeof mainStamp === 'string') {
    return mainStamp;
  }

  // 모달에서 선택된 도장인 경우 (객체로 url 속성을 가진 경우)
  else if (mainStamp && mainStamp.value && mainStamp.value.url) {
    return mainStamp.value.url;
  }

  // 객체 자체에 url 속성이 있는 경우
  else if (mainStamp && mainStamp.url) {
    return mainStamp.url;
  }

  // 아무 것도 없으면 빈 문자열 반환
  return '';
};

onMounted(async () => {
  window.scrollTo(0, 0);

  await getStampList();

  // 도장 목록이 비어있으면 대표 도장을 설정하지 않음
  if (uploadedStamp.value === undefined || uploadedStamp.value.length === 0) {
    console.log('도장 목록이 없어 대표 도장을 설정하지 않음');
    mainStamp.value = null;
    return;
  }

  // 각 직원에 대한 대표도장 가져오기
  skapi
    .getRecords({
      table: {
        name: 'main_stamp_' + makeSafe(userId),
        access_group: 1
      }
    })
    .then(async (res) => {
      console.log('== onMounted == 도장 res : ', res);
      if (res.list.length > 0) {
        mainStamp.value = await skapi.getFile(res.list[0].data, {
          dataType: 'endpoint'
        });
      } else {
        mainStamp.value = null;
      }
    })
    .catch((err) => {
      console.log('== getRecords == err : ', err);
    });
});
</script>

<style scoped lang="less">
.inner {
    max-width: 1600px;
    margin: 0 auto;
    padding: 2rem;
}

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

#_el_empDetail_form {
    .imgbtn-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .input-wrap {
        position: relative;
        margin-top: 16px;

        input {
            border-color: var(--primary-color-400);
            cursor: initial;

            &:read-only {
                border-color: var(--gray-color-200);
                cursor: default;

                &:hover {
                    border-color: var(--gray-color-200);
                }
            }

            &:hover {
                border-color: var(--primary-color-400);
            }
        }

        select {
            border-color: var(--primary-color-400);
        }

        .icon {
            position: absolute;
            bottom: 12px;
            right: 0px;
            cursor: pointer;

            &:hover {
                svg {
                    transform: scale(1.1);
                }
            }

            svg {
                width: 1.2rem;
                height: 1.2rem;
                fill: var(--primary-color-400-dark);
            }
        }
    }

    .util-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 0.5rem;

        .util-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;

            &.disabled {
                .click-btn {
                    background-color: var(--gray-color-200);
                    pointer-events: none;
                    cursor: not-allowed;
                    user-select: none;
                }

                span {
                    color: var(--gray-color-300);
                }
            }

            .click-btn {
                padding: 0.5rem;
                border-radius: 50%;
                background-color: var(--primary-color-400);

                svg {
                    width: 1.2rem;
                    height: 1.2rem;
                    fill: #fff;
                }
            }
            span {
                font-size: 0.8rem;
                color: var(--gray-color-400);
                user-select: none;
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
            content: 'No Image';
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
                content: 'No Image';
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

.upload-file {
    .file-item {
        &.remove {
            background-color: var(--warning-color-50);
            border: 1px dashed var(--warning-color-400);
            color: var(--warning-color-500);
        }
    }
}

.btn-upload-file {
    margin-top: 12px;
}

.input-wrap.upload-stamp {
    .main-stamp {
        #stamp-img {
            &:empty::before {
                content: '도장 등록';
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
    }
}

.main-stamp {
    width: fit-content;
    position: relative;
}

#stamp-img {
    width: 100px;
    height: 100px;
    border-radius: 30%;
    display: block;
    object-fit: contain;
    position: relative;
    background-color: #fff;
    border: 2px dashed var(--gray-color-200);
    margin-bottom: 0.5rem;

    &::before {
        content: '도장 등록';
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

@media (max-width: 768px) {
    .inner {
        padding: 1rem;
    }
}
</style>
