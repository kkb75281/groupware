<template lang="pug">
.title
    h1 도장 관리

hr

.form-wrap
    .form-inner
        .stamp-wrap
            input#stamp-file(ref="stamp_file_input" name="stamp_data" type="file" accept="image/*" @change="uploadStamp" style="display: none")

            .stamp-grid
                .stamp.upload-btn(ref="optionsBtn" :class="{'disabled': uploading}" @click="showOptions = !showOptions")
                    #stamp-img
                        svg.add-icon
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-add-circle-fill")
                    .name 등록하기
                ul.upload-options(v-if="showOptions" @click.stop)
                    li.option(@click="selectFile") 파일 등록
                    li.option(@click="showOptions = false; openStampModal = !openStampModal") 서명 등록

            template(v-if="getStampListRunning")
                .stamp-grid.loading
                    .stamp
                        Loading#loading

            template(v-else)
                .stamp-grid(v-for="stamp in uploadedStamp")
                    .stamp
                        img#stamp-img(:src="stamp.url" alt="도장 이미지")
                        .name {{ stamp.filename }}
                        svg.delete-icon(@click="selectedStamp=stamp")
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-delete")

                .stamp-grid(v-if="uploading && uploadingStamp.length")
                    .stamp.upload-preview
                        img#stamp-img(:src="uploadingStamp.url" alt="도장 미리보기")
                        .name {{ uploadingStamp.name }}
        
.modal(v-if="openStampModal" ref="dialog" @keydown.esc.prevent="closeStampDialog")
    .modal-cont(style="padding:1rem")
        MakeStamp(@upload="uploadStampImage" @save="handleStampBlob" @close="closeStampDialog")
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

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { skapi, mainPageLoading } from '@/main';
import { user, makeSafe } from '@/user';
import { uploadedStamp, uploadedRecordId, getStampListRunning, getStampList } from '@/stamp';
import { openStampModal, closeStampDialog, handleStampBlob, uploadingStamp, stampImages } from '@/components/make_stamp';

import MakeStamp from '@/components/make_stamp.vue';
import AlertModal from '@/components/alert_modal.vue';
import Loading from '@/components/loading.vue';

let showOptions = ref(false);
let stamp_file_input = ref(null);
let optionsBtn = ref(null);
let isSignImage = ref(false);
let selectedStamp = ref(null);
let uploading = ref(false);

let closeOptions = (e) => {
    if (showOptions.value && !optionsBtn.value.contains(e.target)) {
        showOptions.value = false;
    }
}

let selectFile = () => {
    showOptions.value = false;
    stamp_file_input.value.click();
}

let uploadStampImage = async(imageUrl) => {
    await handleStampBlob(imageUrl);

    if(!Object.keys(stampImages.value).length) return;

    isSignImage.value = true;
    uploadStamp();
}

let uploadStamp = async () => {
	mainPageLoading.value = true;
    uploading.value = true;

    let filebox = document.querySelector('input[name=stamp_data]');

    let stamp_postParams = {
        table: {
            name: 'stamp_images',
            access_group: 1,
        }
    }

    if(uploadedRecordId.value) {
        stamp_postParams.record_id = uploadedRecordId.value;
    } else {
        stamp_postParams.unique_id = '[stamp_images]' + makeSafe(user.user_id);
    }
    
    // 파일로 업로드 했을때
    if(!isSignImage.value && filebox && filebox.files.length) {
        let fileURL = URL.createObjectURL(filebox.files[0]);

        uploadingStamp.value.name = filebox.files[0].name;
        uploadingStamp.value.url = fileURL;

        let stampFileData = new FormData();

        stampFileData.append('stamp_data', filebox.files[0]);

        try {
            await skapi.postRecord(stampFileData, stamp_postParams);
        } catch(e) {
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
            } catch(e) {
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
}

let deleteStampRunning = ref(false);
let deleteStampStep = ref(1);

let deleteStamp = async(stamp: object) => {
    if(!uploadedRecordId.value) return;
    if(!selectedStamp.value) return;

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

    // // uploadedStamp.value.map((stamp, idx) => {
    // //     if(stamp.url === url) {
    // //         post_params.remove_bin.push(stamp);
    // //     }
    // // });
    deleteStampRunning.value = true;

    try {
        await skapi.postRecord(null, post_params);
        // getStampList();
        // alert('도장이 삭제되었습니다.');
        deleteStampStep.value++;
        uploadedStamp.value = uploadedStamp.value.filter(stamp => stamp.url !== deleteStampUrl);
    } catch(e) {
        console.log({e});
        deleteStampStep.value = 1;
        alert('도장 삭제 중 오류가 발생했습니다.');
    } finally {
        // selectedStamp.value = null;
        deleteStampRunning.value = false;
    }
}

onMounted(() => {
    document.addEventListener('click', closeOptions);
	getStampList();
});
onUnmounted(() => {
    document.removeEventListener('click', closeOptions);
});
</script>

<style scoped lang="less">
.form-wrap {
    max-width: unset;
    margin-top: 3rem;
}
.form-inner {
    max-width: 1200px;
    margin: 0 auto;
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
        border: 1px solid var(--gray-color-100);
        border-radius: 0.5rem;

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

            .delete-icon {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                width: 25px;
                height: 25px;
                fill: var(--gray-color-300);
                transition: all 0.3s;
                cursor: pointer;

                &:hover {
                    fill: var(--warning-color-400);
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
                    color:var(--primary-color-400);
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
                        color:var(--gray-color-300);
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

@media (max-width: 950px) {
    .stamp-wrap {
        grid-template-columns: repeat(3, 1fr);
    }
}
@media (max-width: 576px) {
    .stamp-wrap {
        grid-template-columns: repeat(2, 1fr);
    }
}
@media (max-width: 390px) {
    .stamp-wrap {
        grid-template-columns: repeat(1, 1fr);
    }
}
</style>