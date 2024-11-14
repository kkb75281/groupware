<template lang="pug">
dialog(ref="dialog" @keydown.esc.prevent="closeDialog")
    .container
        h3 Image
        .img-container
            img(ref="image" :src="imageSrc" alt="Source Image")

        h3 Preview
        .img-container
            canvas(ref="canvas")

        .button-wrap
            button.btn.outline(@click="emit('close')") Close
            button.btn(@click="cropImage") Crop & Submit
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch, defineProps, defineEmits } from 'vue';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

const props = defineProps({
    open: Boolean,
    imageSrc: String,
});

const emit = defineEmits(['cropped', 'close']);

const dialog = ref(null);
const image = ref(null);
const canvas = ref(null);
let cropper = null;

// Cropper 초기화 함수
const startCropper = () => {
    if (cropper) {
        cropper.destroy();
    }
    cropper = new Cropper(image.value, {
        viewMode: 1,
        autoCrop: true,
        scalable: true,
        zoomable: true,
        movable: true,
        background: false,
    });
    console.log(cropper)
};

// 이미지 자르기 함수
const cropImage = () => {
    if (cropper) {
        const croppedCanvas = cropper.getCroppedCanvas();
        const ctx = canvas.value.getContext('2d');

        // 캔버스 크기 설정
        canvas.value.width = croppedCanvas.width;
        canvas.value.height = croppedCanvas.height;

        // 캔버스에 크롭된 이미지 그리기
        ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
        ctx.drawImage(croppedCanvas, 0, 0);

        // Blob 형태로 변환하여 부모 컴포넌트로 전달
        croppedCanvas.toBlob((blob) => {
            emit('cropped', blob);
        }, 'image/jpeg');
    }
};

// 다이얼로그 열고 닫힘 및 imageSrc 변경 감지
watch(() => props.open, (isOpen) => {
    if (isOpen) {
        dialog.value.showModal();

        if (image.value.complete) {
            startCropper();
        } else {
            image.value.onload = startCropper;
        }
    } else {
        dialog.value.close();
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    }
});

// imageSrc 변경 시 Cropper 초기화
// watch(() => props.imageSrc,(newSrc) => {
//     if (cropper) {
//         cropper.destroy();
//         cropper = null;
//     }
//     if (props.open && newSrc) {
//         if (image.value.complete) {
//             startCropper();
//         } else {
//             image.value.onload = startCropper;
//         }
//     }
// });

onUnmounted(() => {
    if (cropper) {
        cropper.destroy();
    }
});
</script>

<style scoped>
.container {
    max-width: 640px;
    margin: 20px auto;
}

img {
    max-width: 100%;
}

.img-container {
    margin-bottom: 20px;
}

.button-wrap {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
}

dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    padding: 20px;
    max-width: 80vw;
    max-height: 80vh;
    overflow: auto;
}
</style>  