<template lang="pug">
.title
    h1 도장 관리

hr

.form-wrap
    .form-inner
        //- .upload-button-wrap
            button.btn.outline.warning(:disabled="!selectedList.length") 삭제
            button.btn.outline 등록

        br
        //- form#_el_mystampForm
        .stamp-wrap
            .stamp-grid
                .stamp
                    #stamp-img.upload
                        svg.add-icon
                            use(xlink:href="@/assets/icon/material-icon.svg#icon-add-circle-fill")
                    .name(style="color:var(--primary-color-400)") 등록하기
            //- .stamp-grid
                .stamp
                    #stamp-img.upload
                    .name 서명 등록
            //- .stamp-grid
                .stamp
                    button.btn.outline 도장 등록
                    button.btn.outline 서명 등록
            .stamp-grid(v-for="stamp in uploadedStamp")
                .stamp
                    label.checkbox
                        input(type="checkbox" name="checkbox" :checked="selectedList.includes(stamp.url)" @click="toggleSelect(stamp.url)")
                        span.label-checkbox
                    img#stamp-img(:src="stamp.url" alt="도장 이미지")
                    .name {{ stamp.name }}

MakeStamp(v-if="openStampModal" @save="handleStampBlob" @close="closeStampDialog")
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { openStampModal, openStampDialog, closeStampDialog, handleStampBlob, uploadingStamp, stampImages, uploadingSrc } from '@/components/make_stamp';

import MakeStamp from '@/components/make_stamp.vue';

let uploadedStamp = ref([
    {
        name: '개인도장',
        url: 'https://via.placeholder.com/150',
    },
    {
        name: '회사직인',
        url: 'https://via.placeholder.com/250',
    },
    {
        name: '개인서명',
        url: 'https://via.placeholder.com/350',
    },
    {
        name: '회사직인2',
        url: 'https://via.placeholder.com/450',
    }
]);
let selectedList = ref([]);

let toggleSelect = (url) => {
    if (selectedList.value.includes(url)) {
        selectedList.value = selectedList.value.filter(itemUrl => itemUrl !== url);
    } else {
        selectedList.value.push(url);
    }
}
</script>

<style scoped lang="less">
.form-wrap {
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
    gap: 1rem;

    .stamp-grid {
        position: relative;
        width: 100%;
        border: 1px solid var(--gray-color-100);

        &::after {
            content: '';
            display: block;
            padding-bottom: 100%;
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
                z-index: 1;
                // display: block;
                // width: 1.5rem;
                // height: 1.5rem;
                // border: 1px solid var(--gray-color-100);
                // border-radius: 50%;
                // background-color: #fff;
                // cursor: pointer;

                // input {
                //     display: none;
                // }

                // .label-checkbox {
                //     display: block;
                //     width: 100%;
                //     height: 100%;
                //     background-color: var(--gray-color-100);
                //     border-radius: 50%;
                //     position: relative;

                //     &::before {
                //         content: '';
                //         display: block;
                //         width: 0.5rem;
                //         height: 0.5rem;
                //         background-color: #fff;
                //         border-radius: 50%;
                //         position: absolute;
                //         top: 50%;
                //         left: 50%;
                //         transform: translate(-50%, -50%);
                //         opacity: 0;
                //         transition: all 0.2s ease-in-out;
                //     }
                // }

                // input:checked + .label-checkbox {
                //     background-color: var(--primary-color-500);

                //     &::before {
                //         opacity: 1;
                //     }
                // }
            }

            .add-icon {
                position: absolute;
                width: 30px;
                height: 30px;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                // margin-bottom: 0.5rem;
                fill: var(--primary-color-400)
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

    &.upload {
        background-color: unset;

        &::before {
            content: url('@/assets/icon/material-icon.svg#icon-add-circle');
            background-color: unset;
            // background-image: url(@/assets/icon/material-icon.svg#icon-add-circle);
            fill: #000
        }
        &::after {
            
        }
    }
}
</style>