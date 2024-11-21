<template lang="pug">
dialog(ref="dialog" @keydown.esc.prevent="closeDialog")
    .container
        .image-wrap
            .image.crop
                img(ref="image" :src="imageSrc" alt="Source Image")
            .image.preview(ref="preview")
                canvas(ref="canvas")

        .button-wrap
            button.btn.outline(@click="closeDialog") 취소
            button.btn(@click="cropImage") 자르기
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
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
let preview = ref(null);
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
        aspectRatio: 1,
        cropBoxResizable: true,
        minContainerHeight: 200,
        minCanvasWidth: 200,
        minCanvasHeight: 200,
        maxCanvasWidth: 400,
        maxCanvasHeight: 400,
        maxCropBoxHeight: 200,
        preview: [preview.value],

        crop() {
            updatePreview();
        },
    });
};

// Cropper 및 Preview 초기화 함수
const resetCropper = () => {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    // 캔버스 내용 초기화
    const ctx = canvas.value.getContext('2d');
    ctx.clearRect(0, 0, 400, 400);
};

const closeDialog = () => {
    resetCropper(); // Cropper 초기화
    emit('close'); // 부모 컴포넌트에 닫기 이벤트 전달
};

// Preview 캔버스를 실시간 업데이트하는 함수
const updatePreview = () => {
    if (cropper) {
        const croppedCanvas = cropper.getCroppedCanvas();

        // Preview 캔버스 컨텍스트 가져오기
        const ctx = canvas.value.getContext('2d');

        // 캔버스 크기 설정
        canvas.value.width = croppedCanvas.width;
        canvas.value.height = croppedCanvas.height;

        // Preview 캔버스에 크롭된 이미지를 그리기
        ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
        ctx.drawImage(croppedCanvas, 0, 0);
    }
};

// 이미지 자르기 함수
const cropImage = () => {
    if (cropper) {
        const croppedCanvas = cropper.getCroppedCanvas();

        if (!croppedCanvas) {
            console.error("크롭된 이미지를 캔버스에 가져오는데 실패했습니다.");
            return;
        }

        const ctx = canvas.value.getContext('2d');

        // 캔버스 크기 설정
        canvas.value.width = croppedCanvas.width;
        canvas.value.height = croppedCanvas.height;

        // 캔버스에 크롭된 이미지 그리기
        ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
        ctx.drawImage(croppedCanvas, 0, 0);

        // Blob 형태로 변환하여 부모 컴포넌트로 전달
        croppedCanvas.toBlob((blob) => {
            if (blob) {
                const imageUrl = URL.createObjectURL(blob);
                // console.log("URL 생성 성공", imageUrl);
                emit('cropped', imageUrl);

                // 필요에 따라 Blob URL을 메모리에서 해제할 수도 있습니다.
                // URL.revokeObjectURL(imageUrl);  // 이 라인은 더 이상 필요하지 않을 때 해제하는 용도로 사용하세요.
            } else {
                console.error("Blob 생성에 실패했습니다.");
            }
        }, 'image/png');
    }
};

// 다이얼로그 열고 닫힘 및 imageSrc 변경 감지
watch(() => props.open, async (isOpen) => {
    if (isOpen) {
        dialog.value.showModal();
        await nextTick();
        startCropper();
    } else {
        dialog.value.close();
        resetCropper();
    }
});

// imageSrc 변경을 감지하여 Cropper 초기화
watch(() => props.imageSrc, (newSrc) => {
    if (newSrc) {
        resetCropper(); // 기존 Cropper 인스턴스 초기화
        startCropper(); // 새 이미지로 Cropper 설정
    }
});

onUnmounted(() => {
    if (cropper) {
        cropper.destroy();
    }
});
</script>

<style scoped lang="less">
.container {
    overflow: auto;
}

img {
    display: block;
    max-width: 100%;
}

.image-wrap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 1rem;

    .preview {
        position: relative;
        overflow: hidden;
        background-color: var(--gray-color-400);

        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.6); /* 어두운 필터 색상 */
            mask: radial-gradient(circle, transparent 70%, rgba(0,0,0,0.9) 71%);
            pointer-events: none;
            z-index: 1;
        }
    }
}

.cropper {
    width: 400px !important;
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

@media (max-width: 576px) {
    dialog {
        max-width: 100%;
        max-height: 100%;
        width: calc(100% - 32px);
        height: calc(100% - 32px);
    }
    .image-wrap {
        .preview {
            display: none;
        }
    }
}
</style>  