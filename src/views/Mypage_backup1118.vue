<template lang="pug">
.wrap
	.title
		h1 마이페이지

	hr

	.form-wrap
		form#_el_pictureForm
			.image
				img#profile-img(:src="uploadProfileSrc" alt="profile image")
				.label(ref="optionsBtn" @click="showOptions = !showOptions")
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
					input(type="text" name="position" disabled)
				
				br

				.input-wrap
					p.label 권한
					input(type="text" name="authority" disabled)

			br

			.input-wrap
				p.label.essential 이름
				input(type="text" name="name"  placeholder="이름을 입력해주세요." required)
			
			br

			.input-wrap
				p.label.essential 이메일
				input(type="email" name="email"  placeholder="이메일을 입력해주세요." required)

			br

			.input-wrap
				p.label 생년월일
				input(type="date" name="birthdate")
				label.checkbox.public
					input(type="checkbox" name="birthdate_public" checked hidden)
					span.label-checkbox 공개여부

			br

			.input-wrap
				p.label 전화번호
				input(type="tel" name="phone_number" placeholder="+82000000000")
				//- label.checkbox.public
				//- 	input(type="checkbox" name="phone_number_public" checked hidden)
				//- 	span.label-checkbox 공개여부

			br

			.input-wrap
				p.label 주소
				input(type="text" name="address" placeholder="주소를 입력해주세요.")
				label.checkbox.public
					input(type="checkbox" name="address_public" checked hidden)
					span.label-checkbox 공개여부

			br

			.input-wrap.upload-file
				p.label 추가자료 #[span.text (ex. 계약서, 이력서)]
				input(type="file" name="additional_data" multiple)

			br

			.button-wrap
				button.btn.bg-gray(type="button" @click="$router.push('/')") 취소
				button.btn(type="submit") 등록

	br  
	br  
	br  
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted } from 'vue';
import { skapi, profileImage } from '@/main';
import { user } from '@/user';

const router = useRouter();
const route = useRoute();

let uploadProfileSrc = ref(null);
let getFileInfo = ref(null);

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

let showOptions = ref(false);

let selectFile = () => {
	showOptions.value = false;
	document.getElementById('_el_file_input').click();
}

let setToDefault = () => {
	showOptions.value = false;
	uploadProfileSrc.value = null;
	_el_file_input.value = '';
}

let optionsBtn = ref(null);

let closeOptions = (e) => {
	if (showOptions.value && !optionsBtn.value.contains(e.target)) {
		showOptions.value = false;
	}
};

onMounted(() => {
	document.addEventListener('click', closeOptions);

	skapi.getProfile().then(res => {
        let checkPublic = document.querySelectorAll('.checkbox.public');

        checkPublic.forEach((el) => {
            let checkboxName = el.querySelector('input').getAttribute('name');

            if (res[checkboxName] === true) {
                el.querySelector('input').checked = true;
            } else if (res[checkboxName] === false) {
                el.querySelector('input').checked = false;
            }
        });
    });
});

onUnmounted(() => {
	document.removeEventListener('click', closeOptions);
});

// 입력창을 비활성화한다.
document.querySelectorAll('form input').forEach((el) => (el.disabled = true));

async function main() {
	// 프로필 정보를 가져와서 입력창에 넣어준다.
	let profile = await skapi.getProfile();

	document.querySelector('[name=name]').value = profile.name || '';
	document.querySelector('[name=email]').value = profile.email || '';
	document.querySelector('[name=birthdate]').value = profile.birthdate || '';
	document.querySelector('[name=phone_number]').value = profile.phone_number || '';
	document.querySelector('[name=address]').value = profile.address || '';
	document.querySelector('[name=picture]').value = profile.picture || '';

	// 프로필 사진이 있으면...
	if (profile.picture) {
		// 프로필 사진 이미지를 보여준다. 보안키가 필요한 url 이니 skapi.getFile을 사용한다.
		skapi.getFile(profile.picture, {
			dataType: 'endpoint',
		}).then(res=>{
			document.getElementById('profile-img').src = res;
			profileImage.value = res;
			uploadProfileSrc.value = res;
			// console.log('=== getFile === profileImage.value : ', profileImage.value);
		}).catch(err=>{
			window.alert('프로필 사진을 불러오는데 실패했습니다.');
			throw err;	// 의도적으로 에러 전달
		})

		// 사용자가 올린 프로필 사진 레코드를 가져온다.
		skapi.getFile(profile.picture, {
			dataType: 'info',
		}).then(res => {
			// console.log('== getFile == res : ', res)
			getFileInfo.value = res;
			// previous_profile_pic = res.record_id;
		}).catch(err => {
			// console.log('== getFile == err : ', err)
		});
	}

	// 프로필 정보를 가져왔으므로 입력창을 활성화한다.
	document.querySelectorAll('form input').forEach((el) => (el.disabled = false));

	let access_group = {
		1: '직원',
		98: '관리자',
		99: '마스터',
	};

	let division = await skapi.getRecords({
		table: {
			name: 'emp_division',
			access_group: 'authorized',
		},
		tag: profile.user_id.replaceAll('-', '_'),
	});

	document.querySelector('input[name="position"]').value = division?.list[0]?.data?.position;
	document.querySelector('input[name="authority"]').value = access_group[profile.access_group];
	// document.getElementById('position').innerText = '직책 : ' + division.list[0].data.position + ' , 권한 : ' + access_group[profile.access_group];
}
main();

let registerMypage = (e) => {
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

	async function post() {
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

		// 프로필 정보를 업데이트한다.
		await skapi.updateProfile(e);
		window.alert('등록완료');
		router.push('/');
	}
	post();
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
</style>