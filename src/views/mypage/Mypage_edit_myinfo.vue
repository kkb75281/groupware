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

	form#_el_myinfoForm(@submit.prevent="registerMypage")
		input(type="text" name="picture" id='_el_picture_input' hidden)
		#position
			.input-wrap
				p.label 부서
				input(v-model="userPosition" type="text" name="position" disabled)

			.input-wrap
				p.label 권한
				input(v-model="access_group[user.access_group]" type="text" name="authority" disabled)

		.input-wrap
			p.label 이름
			input(v-model="editUserProfile.name" type="text" name="name" placeholder="이름을 입력해주세요." :key="'name-input'" disabled required)

		.input-wrap
			p.label 이메일
			input(v-model="editUserProfile.email" type="email" name="email" placeholder="예) user@email.com" :disabled="(googleAccountCheck || verifiedEmail || disabled) && !onlyEmail" required)

		template(v-if="verifiedEmail && !onlyEmail")
			button.btn.outline.warning(type="button" style="width: 100%; margin-top:8px" :disabled="onlyEmail" @click="onlyEmail = true") 이메일만 변경
			button.btn.warning(type="button" style="width: 100%; margin-top:8px" :disabled="onlyEmail" @click="sendEmail") 이메일 인증
		
		//- .input-wrap
		//-     p.label 비밀번호
		//-     button.btn.outline(type="button" style="width: 100%" :disabled="verifiedEmail || disabled" @click="router.push('change-password')") 비밀번호 변경

		//- br

		.input-wrap
			p.label 생년월일
			input(v-model="editUserProfile.birthdate" type="date" name="birthdate" :disabled="verifiedEmail || disabled")
			label.checkbox.public(:class="{'disabled': verifiedEmail || disabled}")
				input(:checked="editUserProfile.birthdate_public" @change ="editUserProfile.birthdate_public = !editUserProfile.birthdate_public" type="checkbox" name="birthdate_public" hidden :disabled="verifiedEmail || disabled")
				span.label-checkbox 공개여부

		.input-wrap
			p.label 전화번호
			.item-wrap.tel
				.select-wrap(@click="showLocale = !showLocale")
					input.selectbox(type="text" placeholder="국가코드를 선택하세요." v-model="selectedCountry.key" name="locale" readonly :disabled="verifiedEmail || disabled")
					Locale(v-model="selectedCountry.key" :showLocale="showLocale" @close="showLocale=false" @select-country="handleCountrySelect")
				input(v-model="showPhoneNumber" type="tel" name="phone_number" placeholder="예) 01012345678" :disabled="verifiedEmail || disabled")

		.input-wrap
			p.label 주소
			input(v-model="editUserProfile.address" type="text" name="address" placeholder="예) 서울시 마포구" :disabled="verifiedEmail || disabled")
			label.checkbox.public(:class="{'disabled': verifiedEmail || disabled}")
				input(:checked="editUserProfile.address_public" @change ="editUserProfile.address_public = !editUserProfile.address_public" type="checkbox" name="address_public" hidden :disabled="verifiedEmail || disabled")
				span.label-checkbox 공개여부

		.input-wrap.upload-stamp
			p.label 도장
			.main-stamp
				img#stamp-img(:src="getStampImageSrc(mainStamp)" alt="도장 이미지")
				button.btn-select-stamp(type="button" @click="openStampListModal")
					.icon.white
						svg
							use(xlink:href="@/assets/icon/material-icon.svg#icon-edit")

		.input-wrap.upload-file
			p.label 자료 관리
			.file-wrap
				.btn-upload-file
					input#file(type="file" name="additional_data" multiple :disabled="verifiedEmail || disabled" @change="updateFileList" hidden)
					label.btn.outline.btn-upload(for="file") 파일 올리기

				ul.upload-file-list
					li.file-name(v-for="(name, index) in fileNames" :key="index") {{ name }}
				
				ul.file-list
					template(v-if="uploadedFile.length > 0")
						li.file-item(v-for="(file, index) in uploadedFile" :key="index" :class="{'remove': removeFileList.includes(file.record_id), 'disabled': disabled}")
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

		.button-wrap(v-if="(verifiedEmail && !onlyEmail) ? false : true" style="margin-top: 2rem")
			button.btn.bg-gray(type="button" :disabled="disabled" @click="cancelEdit") 취소
			button.btn(type="submit" :disabled="disabled") 저장

	CropImage(:open="openCropModal" :imageSrc="currentImageSrc" @cropped="setCroppedImage" @close="closeCropImageDialog")

// 도장 관리 모달
.modal.stamp-list(v-if="showStampList")
	.modal-cont(@click.stop)
		.modal-header
			h2.modal-title 대표 도장 선택
			button.btn-close(@click="closeStampListModal")
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-close")

		.modal-body
			button.btn.outline.refresh-icon(:disabled="loading" @click="refresh")
				svg(:class="{'rotate' : loading}")
					use(xlink:href="@/assets/icon/material-icon.svg#icon-refresh")
			.stamp-wrap
				input#stamp-file(ref="stamp_file_input" name="stamp_data" type="file" accept="image/*" @change="uploadStamp" style="display: none")

				.stamp-grid
					.stamp.upload-btn(ref="stampOptionsBtn" :class="{'disabled': uploading}" @click="showStampOptions = !showStampOptions")
						#stamp-img
							svg.add-icon
								use(xlink:href="@/assets/icon/material-icon.svg#icon-add-circle-fill")
						.name 등록하기
					ul.upload-options(v-if="showStampOptions" @click.stop)
						li.option(@click="selectStampFile") 파일 등록
						li.option(@click="showStampOptions = false; openStampModal = !openStampModal") 서명 등록

				template(v-if="getStampListRunning")
					.stamp-grid.loading
						.stamp
							Loading#loading

				template(v-else)
					.stamp-grid(v-for="stamp in uploadedStamp")
						//- .stamp(:class="{'selected': mainStamp && (mainStamp === stamp.url || (mainStamp.url && mainStamp.url.split('?')[0] === stamp.url.split('?')[0]))}")
						.stamp(:class="{'selected': mainStamp && (mainStamp === stamp.url || (mainStamp.url && mainStamp.url.split('?')[0] === stamp.url.split('?')[0]))}")
							img#stamp-img(:src="stamp.url" alt="도장 이미지")
							.name {{ stamp.filename }}
							.btn-wrap
								svg.btn-select(@click="selectAsMainStamp(stamp)")
									use(xlink:href="@/assets/icon/material-icon.svg#icon-check")
								svg.btn-delete(@click="selectedStamp=stamp")
									use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")

					.stamp-grid(v-if="uploading && uploadingStamp.length")
						.stamp.upload-preview
							img#stamp-img(:src="uploadingStamp.url" alt="도장 미리보기")
							.name {{ uploadingStamp.name }}
        
.modal(v-if="openStampModal" ref="dialog" @keydown.esc.prevent="closeStampDialog")
	.modal-cont(style="padding:1rem")
		MakeStamp(@upload="uploadStampImage" @save="handleStampBlob" @close="closeStampDialog")

AlertModal(:open="stampSelectedAlert")
	.content-wrap
		h4.title.success 도장 선택
		p.desc 대표 도장으로 선택되었습니다.
	.button-wrap
		button.btn(@click="stampSelectedAlert = false") 확인

AlertModal(:open="!!selectedStamp")
	.content-wrap
		template(v-if="deleteStampStep === 1")
			h4.title.warning 도장 삭제
			p.desc 도장을 삭제하시겠습니까?
		template(v-if="deleteStampStep === 2")
			h4.title.success 삭제 완료
			p.desc 도장이 삭제되었습니다.
	.button-wrap
		template(v-if="deleteStampStep === 1")
			button.btn.bg-gray(:disabled="deleteStampRunning" @click="selectedStamp=null") 취소
			button.btn.warning(:disabled="deleteStampRunning" @click="deleteStamp(selectedStamp)") 삭제
		template(v-if="deleteStampStep === 2")
			button.btn(@click="selectedStamp=null;deleteStampStep=1") 확인
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted } from 'vue';
import { skapi, mainPageLoading } from '@/main.ts';
import { user, profileImage, verifiedEmail } from '@/user.ts';
import { divisionNameList } from '@/division.ts';
import {
  openCropModal,
  croppedImages,
  uploadSrc,
  currentImageSrc,
  resetCropImage,
  openCropImageDialog,
  closeCropImageDialog,
  setCroppedImage
} from '@/components/crop_image.ts';
import { uploadedStamp, uploadedRecordId, getStampListRunning, getStampList } from '@/stamp.ts';
import {
  openStampModal,
  closeStampDialog,
  handleStampBlob,
  uploadingStamp,
  stampImages
} from '@/components/make_stamp.ts';
import { Countries } from '@/components/countries.ts';

import CropImage from '@/components/crop_image.vue';
import Locale from '@/components/locale.vue';
import MakeStamp from '@/components/make_stamp.vue';
import AlertModal from '@/components/alert_modal.vue';
import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

const googleAccountCheck = ref(localStorage.getItem('accessToken') ? true : false);

let optionsBtn = ref(null);
let getFileInfo = ref(null);
let userPosition = ref(null);
let uploadedFile = ref([]);
let backupUploadFile = ref([]);
let removeFileList = ref([]);
// let originUserProfile = {};
let access_group = {
  1: '직원',
  98: '관리자',
  99: '마스터'
};
let disabled = ref(false);
let onlyEmail = ref(false);
let showOptions = ref(false);
let fileNames = ref([]);
let stampNames = ref([]);
let showLocale = ref(false); // 전화번호 국가 코드 선택창
let selectedCountry = ref({
  key: '', // 국가코드
  dialCode: '' // 국가번호
});
let showPhoneNumber = ref(''); // 포맷된 전화번호
let originUserProfile = {
  name: user.name,
  email: user.email,
  birthdate: user.birthdate,
  address: user.address,
  phone_number: user.phone_number,
  birthdate_public: user.birthdate_public,
  address_public: user.address_public,
  phone_number_public: user.phone_number_public
};
let editUserProfile = ref({
  name: user.name,
  email: user.email,
  birthdate: user.birthdate,
  address: user.address,
  phone_number: user.phone_number,
  birthdate_public: user.birthdate_public,
  address_public: user.address_public,
  phone_number_public: user.phone_number_public
});

// 도장 관리
let loading = ref(false);
let showStampOptions = ref(false);
let stamp_file_input = ref(null);
let stampOptionsBtn = ref(null);
let isSignImage = ref(false);
let selectedStamp = ref(null);
let uploading = ref(false);
let showStampList = ref(false);
let mainStamp = ref({}); // 대표 도장 정보
let stampSelectedAlert = ref(false); // 도장 선택 알림 표시 여부

function makeSafe(str) {
  return str.replaceAll('.', '_').replaceAll('+', '_').replaceAll('@', '_').replaceAll('-', '_');
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
          name: 'emp_division',
          access_group: 1
        },
        tag: '[emp_id]' + makeSafe(user.user_id)
      },
      {
        limit: 1,
        ascending: false
      }
    )
    .then((r) => {
      let result = r.list[0];

      if (result) {
        let emp_dvs = result.tags
          .filter((t) => t.includes('[emp_dvs]'))[0]
          .replace('[emp_dvs]', '');
        let emp_id = result.tags
          .filter((t) => t.includes('[emp_id]'))[0]
          .replace('[emp_id]', '')
          .replaceAll('_', '-');
        let emp_pst = result.tags
          .filter((t) => t.includes('[emp_pst]'))[0]
          .replace('[emp_pst]', '');

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
        name: 'emp_additional_data',
        access_group: 99
      },
      reference: '[emp_additional_data]' + makeSafe(user.user_id)
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
              if (!str) return '';
              return str.split('/')[3];
            }

            const result = item.bin.additional_data.map((el) => ({
              ...el,
              user_id: getFileUserId(el.path),
              record_id: item.record_id
            }));

            fileList.push(...result);
          }
        });
        uploadedFile.value = fileList;
      }
    })
    .catch((err) => {
      console.log('== getRecords == err : ', err);
    });
};

if (user && !user.approved.includes('by_master')) {
  getAdditionalData();
}

let getProfileImage = async () => {
  try {
    let res = await skapi.getFile(user.picture, {
      dataType: 'endpoint'
    });

    profileImage.value = res;
    uploadSrc.value.profile_pic = res;
  } catch (err) {
    window.alert('프로필 사진을 불러오는데 실패했습니다.');
    throw err;
  }
};

let sendEmail = async () => {
  try {
    await skapi.verifyEmail();
  } catch (err) {
    window.alert(err.message);
  }
  router.push('/verification');
};

let profile_pic_input = ref(null);

let selectFile = () => {
  showOptions.value = false;
  profile_pic_input.value.click();
};

let setToDefault = () => {
  showOptions.value = false;
  uploadSrc.value.profile_pic = null;
  profile_pic.value = '';
};

let closeOptions = (e) => {
  if (showOptions.value && !optionsBtn.value.contains(e.target)) {
    showOptions.value = false;
  }
};

let cancelEdit = () => {
  editUserProfile.value = {
    name: originUserProfile.name,
    email: originUserProfile.email,
    birthdate: originUserProfile.birthdate,
    address: originUserProfile.address,
    phone_number: originUserProfile.phone_number,
    birthdate_public: originUserProfile.birthdate_public,
    address_public: originUserProfile.address_public,
    phone_number_public: originUserProfile.phone_number_public
  };

  if (verifiedEmail.value && onlyEmail.value) {
    onlyEmail.value = false;
    return;
  }

  removeFileList.value = [];
  uploadedFile.value = [...backupUploadFile.value];
  router.push('/mypage');
};

// 국가코드 변경 시 처리 함수
const handleCountrySelect = (country) => {
  selectedCountry.value.key = country.key;
  selectedCountry.value.dialCode = country.dialCode;
};

// 도장 이미지 URL 가져오기
const getStampImageSrc = (mainStamp) => {
  console.log('uploadedStamp.value : ', uploadedStamp.value);
  console.log('mainStamp : ', mainStamp);

  // 도장 목록이 비어있으면 빈 문자열 반환
  if (uploadedStamp.value === undefined || uploadedStamp.value.length === 0) {
    console.log('1111');
    return '';
  }

  // 레코드에서 로드된 도장인지 확인 (문자열인 경우)
  if (typeof mainStamp === 'string') {
    console.log('2222');
    return mainStamp;
  }

  // 모달에서 선택된 도장인 경우 (객체로 url 속성을 가진 경우)
  else if (mainStamp && mainStamp.value && mainStamp.value.url) {
    console.log('3333');
    return mainStamp.value.url;
  }

  // 객체 자체에 url 속성이 있는 경우
  else if (mainStamp && mainStamp.url) {
    console.log('4444');
    return mainStamp.url;
  }

  // 대표 도장이 없고 도장 목록이 있는 경우, 첫 번째 도장을 기본값으로 사용
  else if (uploadedStamp.value && uploadedStamp.value.length > 0) {
    console.log('5555 - 첫 번째 도장을 기본값으로 사용');
    // mainStamp 객체에 첫 번째 도장 정보 할당 (참조 변경)
    if (mainStamp !== uploadedStamp.value[0]) {
      mainStamp = uploadedStamp.value[0];
    }
    return uploadedStamp.value[0].url;
  }

  console.log('6666');
  // 아무 것도 없으면 빈 문자열 반환
  return '';
};

let oldNumber = '';

let registerMypage = async (e) => {
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
        name: 'profile_picture',
        access_group: 'authorized'
      }
    };
  }

  if (uploadSrc.value.profile_pic) {
    _el_picture_input.value = uploadSrc.value.profile_pic.split('?')[0]; // 사진 수정 안할때 기존 사진을 그대로 넣어줌
  }

  if (croppedImages.value['profile_pic']) {
    // 사진 수정할때 새로운 사진을 넣어줌
    // 새로 선택한 사진이 있고 본인이 이전에 올린 사진이 있을 경우 레코드에서 이전 사진을 삭제하는 파라미터를 추가한다.
    if (samePerson && getFileInfo.value?.uploader === user.user_id) {
      profile_pic_postParams.remove_bin = null;
    }

    const croppedFile = new File([croppedImages.value['profile_pic']], 'profile_pic.png', {
      type: croppedImages.value['profile_pic'].type
    });

    const imgFormData = new FormData();
    imgFormData.append('profile_pic', croppedFile);

    // 새 이미지를 레코드에 업로드하고 보안키를 제외한 이미지 주소를 userprofile의 picture에 넣어준다.
    let picRec = await skapi.postRecord(imgFormData, profile_pic_postParams);
    _el_picture_input.value = picRec.bin.profile_pic.at(-1).url.split('?')[0];
  }

  // 기존 사진을 기본 이미지로 변경했을 경우
  if (uploadSrc.value.profile_pic === null && samePerson) {
    _el_picture_input.value = null;
    await skapi.deleteRecords({ record_id: getFileInfo.value.record_id });
  } else if (uploadSrc.value.profile_pic === null && !samePerson) {
    _el_picture_input.value = null;
    await skapi.postRecord(document.getElementById('profile_pic'), profile_pic_postParams);
  }

  // 전화번호에 국가코드 추가하기
  if (showPhoneNumber.value) {
    if (showPhoneNumber.value.startsWith('+')) {
      // 코드 수정 전 번호를 저장하신 분들
      alert('전화번호에는 국가코드를 제외하고 입력해주세요.');
      disabled.value = false;
      mainPageLoading.value = false;
      return;
    }

    if (selectedCountry.value.key) {
      let formattedNumber = showPhoneNumber.value;

      if (formattedNumber.startsWith('0')) {
        formattedNumber = formattedNumber.substring(1);
      }

      // 국가 코드 추가
      const fullPhoneNumber = selectedCountry.value.dialCode.replace(/\s+/g, '') + formattedNumber;

      // 폼 데이터 업데이트
      showPhoneNumber.value = fullPhoneNumber;
    } else {
      alert('전화번호 국가코드를 선택해주세요.');
      disabled.value = false;
      mainPageLoading.value = false;
      return;
    }
  }

  let filebox = document.querySelector('input[name=additional_data]');

  if (filebox && filebox.files.length) {
    for (let file of filebox.files) {
      const additionalFormData = new FormData();

      additionalFormData.append('additional_data', file);

      await skapi.postRecord(additionalFormData, {
        table: {
          name: 'emp_additional_data',
          access_group: 99
        },
        reference: '[emp_additional_data]' + makeSafe(user.user_id)
      });

      if (uploadedFile.value && uploadedFile.value.length) {
        backupUploadFile.value = [...uploadedFile.value];
      }
    }

    document.querySelector('input[name="additional_data"]').value = '';
    fileNames.value = [];
  }

  if (removeFileList.value.length) {
    await skapi.deleteRecords({ record_id: removeFileList.value }).then((r) => {
      removeFileList.value = [];
    });
  }

  // 대표 도장 레코드 저장
  if (mainStamp.value && mainStamp.value.url) {
    const data = mainStamp.value.url.split('?')[0];

    const config = {
      table: {
        name: 'main_stamp_' + makeSafe(user.user_id),
        access_group: 1
      }
    };

    console.log('data : ', data);
    console.log('config : ', config);

    try {
      // 기존 대표 도장 레코드 삭제
      await skapi.deleteRecords({
        table: {
          name: 'main_stamp_' + makeSafe(user.user_id),
          access_group: 1
        }
      });

      // 새 대표 도장 저장
      const saveMainStamp = await skapi.postRecord(data, config);
      console.log('대표 도장 저장 완료:', saveMainStamp);
    } catch (error) {
      console.error('대표 도장 저장 중 오류:', error);
    }
  } else if (uploadedStamp.value === undefined || uploadedStamp.value.length === 0) {
    console.log('도장 목록이 비어있어 대표 도장 레코드 삭제');
    // 도장 목록이 비어있으면 대표 도장 레코드 삭제
    try {
      await skapi.deleteRecords({
        table: {
          name: 'main_stamp_' + makeSafe(user.user_id),
          access_group: 1
        }
      });
      console.log('도장 목록이 비어있어 대표 도장 레코드 삭제');
    } catch (error) {
      console.error('대표 도장 레코드 삭제 중 오류:', error);
    }
  }

  console.log({ e });

  // 프로필 정보를 업데이트
  await skapi
    .updateProfile(e)
    .catch(() => {
      window.alert('프로필 정보를 업데이트하는데 실패했습니다.');
      editUserProfile.value = {
        name: originUserProfile.name,
        email: originUserProfile.email,
        birthdate: originUserProfile.birthdate,
        address: originUserProfile.address,
        phone_number: originUserProfile.phone_number,
        birthdate_public: originUserProfile.birthdate_public,
        address_public: originUserProfile.address_public,
        phone_number_public: originUserProfile.phone_number_public
      };
      disabled.value = false;
      mainPageLoading.value = false;
      return;
    })
    .finally(() => {
      if (user.phone_number) {
        let dialCodeLength = selectedCountry.value.dialCode.replace(/\s+/g, '').length;
        showPhoneNumber.value = '010' + user.phone_number.slice(dialCodeLength).slice(2);
      }
    });

  // misc 업데이트 -  국가코드
  let misc = JSON.parse(user.misc || '{}');

  // 국가코드 추가
  misc.country = selectedCountry.value;

  await skapi.updateProfile({ misc: JSON.stringify(misc) }).catch((err) => err);

  console.log({ user });

  getAdditionalData();

  window.alert('회원정보가 수정되었습니다.');
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

// 도장 관리 :: s
const openStampListModal = () => {
  showStampList.value = true;
};

const closeStampListModal = () => {
  showStampList.value = false;
};

let closeStampOptions = (e) => {
  if (showStampOptions.value && !stampOptionsBtn.value.contains(e.target)) {
    showStampOptions.value = false;
  }
};

let selectStampFile = () => {
  showStampOptions.value = false;
  stamp_file_input.value.click();
};

let uploadStampImage = async (imageUrl) => {
  await handleStampBlob(imageUrl);

  if (!Object.keys(stampImages.value).length) return;

  isSignImage.value = true;
  uploadStamp();
};

let uploadStamp = async () => {
  mainPageLoading.value = true;
  uploading.value = true;

  let filebox = document.querySelector('input[name=stamp_data]');

  let stamp_postParams = {
    table: {
      name: 'stamp_images',
      access_group: 1
    }
  };

  if (uploadedRecordId.value) {
    stamp_postParams.record_id = uploadedRecordId.value;
  } else {
    stamp_postParams.unique_id = '[stamp_images]' + makeSafe(user.user_id);
  }

  // 파일로 업로드 했을때
  if (!isSignImage.value && filebox && filebox.files.length) {
    let fileURL = URL.createObjectURL(filebox.files[0]);

    uploadingStamp.value.name = filebox.files[0].name;
    uploadingStamp.value.url = fileURL;

    let stampFileData = new FormData();

    stampFileData.append('stamp_data', filebox.files[0]);

    try {
      await skapi.postRecord(stampFileData, stamp_postParams);
    } catch (e) {
      mainPageLoading.value = false;
      alert('도장 등록 중 오류가 발생했습니다.');
      throw e;
    }

    filebox.value = '';
  } else {
    // 서명으로 업로드 했을때
    if (Object.keys(stampImages.value).length) {
      let stampImageData = new FormData();
      stampImageData.append('stamp_data', stampImages.value.blob, stampImages.value.name);

      try {
        await skapi.postRecord(stampImageData, stamp_postParams);
      } catch (e) {
        mainPageLoading.value = false;
        alert('도장 등록 중 오류가 발생했습니다.');
        throw e;
      }

      stampImages.value = {};
    }
  }

  // 이미지 업로드 후 도장 정보 다시 불러오기
  uploadingStamp.value = {};
  alert('도장 등록이 완료되었습니다.');
  getStampList(true);
  uploading.value = false;
  mainPageLoading.value = false;
};

let deleteStampRunning = ref(false);
let deleteStampStep = ref(1);

let deleteStamp = async (stamp) => {
  if (!uploadedRecordId.value) return;
  if (!selectedStamp.value) return;

  let post_params = {
    table: {
      name: 'stamp_images',
      access_group: 1
    },
    record_id: uploadedRecordId.value,
    remove_bin: []
  };

  let deleteStampUrl = stamp.url;

  post_params.remove_bin.push(stamp);

  deleteStampRunning.value = true;

  try {
    // 도장 삭제
    await skapi.postRecord(null, post_params);

    // 삭제된 도장이 대표 도장인지 확인 (간단한 URL 비교)
    if (
      mainStamp.value &&
      mainStamp.value.url &&
      mainStamp.value.url.split('?')[0] === stamp.url.split('?')[0]
    ) {
      // 대표 도장 레코드 삭제
      await skapi.deleteRecords({
        table: {
          name: 'main_stamp_' + makeSafe(user.user_id),
          access_group: 1
        }
      });

      // mainStamp 값 초기화
      mainStamp.value = null;
    }

    // 목록에서 도장 제거
    deleteStampStep.value++;
    uploadedStamp.value = uploadedStamp.value.filter((s) => s.url !== deleteStampUrl);
  } catch (e) {
    deleteStampStep.value = 1;
    alert('도장 삭제 중 오류가 발생했습니다.');
  } finally {
    deleteStampRunning.value = false;
  }

  //   try {
  //     await skapi.postRecord(null, post_params);
  //     // getStampList();
  //     // alert('도장이 삭제되었습니다.');
  //     deleteStampStep.value++;
  //     uploadedStamp.value = uploadedStamp.value.filter((stamp) => stamp.url !== deleteStampUrl);
  //   } catch (e) {
  //     // console.log({e});
  //     deleteStampStep.value = 1;
  //     alert('도장 삭제 중 오류가 발생했습니다.');
  //   } finally {
  //     // selectedStamp.value = null;
  //     deleteStampRunning.value = false;
  //   }
};

const selectAsMainStamp = (stamp) => {
  mainStamp.value = stamp;
  showStampList.value = false;
  stampSelectedAlert.value = true;
};

const refresh = async () => {
  getStampList(true);
};

// 도장 관리 :: e

onMounted(async () => {
  console.log('AA == onMounted == user : ', user);

  document.addEventListener('click', closeOptions);

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
        dataType: 'info'
      })
      .then((res) => {
        getFileInfo.value = res;
      })
      .catch((err) => {
        console.log('== getFile == err : ', err);
      });
  } else {
    uploadSrc.value.profile_pic = null;
    getFileInfo.value = null;
  }

  if (user.phone_number) {
    let misc = JSON.parse(user.misc || '{}');

    if (misc?.country) {
      selectedCountry.value = misc.country;

      let dialCodeLength = selectedCountry.value.dialCode.replace(/\s+/g, '').length;

      showPhoneNumber.value = '010' + user.phone_number.slice(dialCodeLength).slice(2);
    } else {
      showPhoneNumber.value = user.phone_number; // 코드 수정 전 번호를 저장하신 분들
    }
  }

  document.addEventListener('click', closeStampOptions);

  await getStampList();

  // 도장 목록이 비어있으면 대표 도장을 설정하지 않음
  if (uploadedStamp.value === undefined || uploadedStamp.value.length === 0) {
    mainStamp.value = null;
    return;
  }

  // 대표 도장 가져오기
  skapi
    .getRecords({
      table: {
        name: 'main_stamp_' + makeSafe(user.user_id),
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
        // 대표 도장이 설정되어 있지 않다면 첫 번째 도장을 기본값으로 사용
        if (uploadedStamp.value && uploadedStamp.value.length > 0) {
          mainStamp.value = uploadedStamp.value[0].url;
        } else {
          mainStamp.value = null;
        }
      }
    })
    .catch((err) => {
      console.log('== getRecords == err : ', err);

      // 오류 발생 시에도 기본값 설정
      if (uploadedStamp.value && uploadedStamp.value.length > 0) {
        mainStamp.value = uploadedStamp.value[0].url;
      } else {
        mainStamp.value = null;
      }
    });

  console.log('BB == onMounted == user : ', user);
});

onUnmounted(() => {
  // 이벤트 리스너 제거
  document.removeEventListener('click', closeOptions);
  document.removeEventListener('click', closeStampOptions);

  // 도장 관련 데이터 정리
  mainStamp.value = null;
  uploadedStamp.value = [];
  uploadingStamp.value = {};
  showStampList.value = false;
  showStampOptions.value = false;
  selectedStamp.value = null;
  isSignImage.value = false;

  // 스탬프 이미지 관련 데이터 정리
  if (stampImages.value && Object.keys(stampImages.value).length > 0) {
    stampImages.value = {};
  }

  // 업로드 관련 상태 초기화
  uploading.value = false;
  loading.value = false;
  deleteStampStep.value = 1;
  deleteStampRunning.value = false;
  stampSelectedAlert.value = false;
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

.input-wrap {
  margin-top: 1rem;

  &:last-of-type {
    margin-bottom: 0;
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

.item-wrap {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.tel {
  .select-wrap {
    position: relative;

    .selectbox {
      width: 12rem;
      padding-right: 2.25rem;
      vertical-align: middle;
      background-repeat: no-repeat;
      background-size: 1.25rem 1.25rem;
      background-position: center right 0.5rem;
      background-image: url('@/assets/img/icon_arrow_bottom.svg');
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
    }
  }
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

.btn-select-stamp {
  position: absolute;
  right: 0;
  bottom: 0;
  background-color: var(--primary-color-400);
  border-radius: 50%;
  cursor: pointer;
  right: -3px;

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

.modal.stamp-list {
  .modal-cont {
    min-width: 950px;
    max-width: 950px;
  }

  .modal-header {
    margin-bottom: 0;
  }

  .modal-body {
    padding: 1.5rem 1.5rem 2rem;
  }
}

.upload-button-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  // background-color: var(--gray-color-50) !important;
}

.stamp-wrap {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  // grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  // grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 1rem;

  .stamp-grid {
    position: relative;
    width: 100%;
    border: 1px solid var(--gray-color-200);
    border-radius: 0.5rem;
    overflow: hidden;

    &:first-of-type {
      overflow: visible;
    }

    &::after {
      content: '';
      display: block;
      padding-bottom: 100%;
    }

    &.loading {
      border: 0;
    }

    .stamp {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      &.selected {
        background-color: var(--primary-color-50);
        border: 4px solid var(--primary-color-400);
        border-radius: 0.5rem;

        #stamp-img {
          border-color: var(--primary-color-400);
          border-width: 3px;
        }
      }

      .checkbox {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
      }

      .name {
        width: 80%;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
      }

      .add-icon {
        position: absolute;
        width: 30px;
        height: 30px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        fill: var(--primary-color-400);
        // transition: all 0.3s;
        // fill: var(--gray-color-300);
      }

      .btn-wrap {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        position: absolute;
        top: 12px;
        right: 12px;
      }

      svg {
        width: 25px;
        height: 25px;
        fill: var(--gray-color-300);
        transition: all 0.3s;
        cursor: pointer;

        &.btn-select {
          &:hover {
            fill: var(--primary-color-400);
          }
        }

        &.btn-delete {
          &:hover {
            fill: var(--warning-color-400);
          }
        }
      }

      &.upload-btn {
        cursor: pointer;

        #stamp-img {
          background-color: unset;
          // transition: all 0.3s;
          border-color: var(--primary-color-300);

          &::before {
            content: '';
            background-color: unset;
          }
        }
        .name {
          // transition: all 0.3s;
          // color: var(--gray-color-300);
          color: var(--primary-color-400);
        }

        &.disabled {
          cursor: default;
          pointer-events: none;

          #stamp-img {
            border-color: var(--gray-color-300);
          }
          .add-icon {
            fill: var(--gray-color-300);
          }
          .name {
            color: var(--gray-color-300);
          }
        }

        // &:hover {
        //     #stamp-img {
        //         border-color: var(--primary-color-300);
        //     }
        //     .add-icon {
        //         fill: var(--primary-color-400);
        //     }
        //     .name {
        //         color:var(--primary-color-400);
        //     }
        // }
      }

      &.upload-preview {
        background-color: var(--primary-color-25);

        #stamp-img {
          background-color: var(--primary-color-25);
          border-color: var(--gray-color-200);
          opacity: 0.3;

          &::before {
            content: '미리보기';
            background-color: var(--primary-color-25);
          }
        }
        .name {
          opacity: 0.3;
        }
      }
    }

    .upload-options {
      position: absolute;
      top: 50%;
      left: 50%;
      // transform: translateX(-50% + 50px) translateY(-50% + 25px);
      transform: translateX(11%) translateY(-16%);
      // right: -113px;
      // bottom: -40px;
      z-index: 9;
      background-color: var(--gray-color-100);
      border: 1px solid var(--gray-color-300);
      padding: 5px;
      border-radius: 4px;

      li {
        font-size: 0.8rem;
        text-align: left;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 4px;
        white-space: nowrap;

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

#options-modal {
  .modal-cont {
    margin: auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 1rem;

    button {
      min-width: 150px;
      flex-grow: 1;
    }
  }
}

.refresh-icon {
  margin-bottom: 1rem;
  margin-left: auto;
}

@media (max-width: 950px) {
  .stamp-wrap {
    grid-template-columns: repeat(3, 1fr);
  }

  .modal.stamp-list {
    .modal-cont {
      min-width: 100%;
      max-width: 100%;
    }
  }
}

@media (max-width: 768px) {
  .stamp-wrap {
    grid-template-columns: repeat(2, 1fr);

    .stamp-grid {
      .upload-options {
        transform: translateX(10%) translateY(-12%);

        li {
          font-size: 0.875rem;
          padding: 10px 8px;
        }
      }
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

@media (max-width: 576px) {
  #stamp-img {
    width: 80px;
    height: 80px;
  }

  .stamp-wrap {
    grid-template-columns: repeat(2, 1fr);

    .stamp-grid {
      .stamp {
        .btn-wrap {
          right: 8px;
        }
      }
    }
  }

  // .stamp-wrap {
  //     grid-template-columns: repeat(1, 1fr);

  //     .stamp-grid {
  //         .upload-options {
  //             transform: translateX(10%) translateY(-12%);

  //             li {
  //                 font-size: 1rem;
  //                 padding: 10px 14px;
  //             }
  //         }
  //     }
  // }
}
</style>
