<template lang="pug">
.modal(ref="dialog" @keydown.esc.prevent="closeDialog")
    .modal-cont
        //- template(v-if="uploadingStamp && Object.keys(uploadingStamp).length")
            .upload-preview
                img#stamp-img(:src="uploadingStamp.url" alt="도장 이미지")
                .name {{ uploadingStamp.name }}

            .button-wrap
                button.btn.outline(@click="closeDialog") 취소
                button.btn(@click="upload") 등록
        //- template(v-else)
        .input-wrap.canvas-wrap
            p.label.essential(style="margin-bottom: 8px;") 서명란
            canvas#stampCanvas(ref="canvas")

        .input-wrap
            p.label.essential 도장명
            input(v-model="stampName" type="text" name="fileName" placeholder="도장명을 입력해주세요. 예) 회사직인, 개인직인 등")

        .button-wrap
            button.btn.bg-gray(@click="closeDialog") 취소
            button.btn.outline(@click="reset") 초기화
            button.btn(@click="sendStampBlob") 등록
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { openStampModal, uploadingStamp, handleStampBlob, stampName } from '@/components/make_stamp';

const emit = defineEmits(['close', 'save', 'upload']);

let step = ref('options');

let canvas = ref(null);
let ctx = null;
let painting = false;

// 마우스 좌표를 캔버스에 맞게 조정
function getMousePos(canvas, event) {
    let rect = canvas.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

// 캔버스 크기 설정
const resizeCanvas = () => {
    const width = canvas.value.offsetWidth;
    const height = canvas.value.offsetHeight;
    
    canvas.value.width = width;
    canvas.value.height = height;

    // 기존 서명 복원 (리사이즈 시 데이터 손실 방지)
    if (ctx) ctx.clearRect(0, 0, width, height);
};

// 서명 시작
function startPosition(e) {
    painting = true;
    draw(e);
}

// 서명 끝
function endPosition() {
    painting = false;
    ctx.beginPath(); // 새로운 경로 시작
}

// 서명 그리기
function draw(e) {
    if (!painting) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    let pos = getMousePos(canvas.value, e);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

let reset = () => {
    stampName.value = '';

    if (ctx && canvas.value) {
        ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
    }
}

let upload = () => {
    reset();
    emit('upload');
    // openStampModal.value = false;
}

let closeDialog = () => {
    reset();        // stamp maker 초기화
    emit('close');  // 부모 컴포넌트에 닫기 이벤트 전달
    document.querySelector('body').style.overflow = '';
};

let sendStampBlob = () => {
    // 서명 이미지 바로 저장할때 사용
    // let dataURL = canvas.value.toDataURL('image/png');
    // let link = document.createElement('a');

    // link.href = dataURL;
    // link.download = 'signature.png';
    // link.click();
    if (!canvas.value) return;

    let fileName = document.querySelector('input[name="fileName"]');
    let imageData = ctx.getImageData(0, 0, canvas.value.width, canvas.value.height, { willReadFrequently: true });
    let isCanvasEmpty = !imageData.data.some((pixelValue) => pixelValue !== 0);

    if (isCanvasEmpty) {
        alert('서명란에 서명을 입력해주세요.');
        return;
    }
    if (!fileName.value) {
        alert('도장명을 입력해주세요.');
        fileName.focus();
        return;
    }

    canvas.value.toBlob((blob) => {
        if (blob) {
            const imageUrl = URL.createObjectURL(blob);
            emit("upload", imageUrl); // Blob 전달
            // handleStampBlob(imageUrl);
        }
    }, "image/png");
}

onMounted(() =>{
    if (!canvas.value) return;

    document.querySelector('body').style.overflow = 'hidden';

    resizeCanvas();

    ctx = canvas.value.getContext("2d");

    reset();
    
    // Pointer 이벤트로 마우스/터치 통합 처리
    canvas.value.addEventListener("pointerdown", startPosition);
    canvas.value.addEventListener("pointermove", draw);
    canvas.value.addEventListener("pointerup", endPosition);

    // 윈도우 리사이즈 시 캔버스 크기 재조정
    window.addEventListener("resize", resizeCanvas);
})

onUnmounted(() => {
    if (!canvas.value) return;

    document.querySelector('body').style.overflow = 'auto';

    // Pointer 이벤트로 마우스/터치 통합 처리
    canvas.value.removeEventListener("pointerdown", startPosition);
    canvas.value.removeEventListener("pointermove", draw);
    canvas.value.removeEventListener("pointerup", endPosition);

    window.removeEventListener("resize", resizeCanvas);
})
</script>

<style scoped lang="less">
#stamp-img {
    width: 100px;
    height: 100px;
    border-radius: 30%;
    display: block;
    margin: 0 auto;
    object-fit: contain;
    position: relative;
    background-color: #fff;
    border: 2px dashed var(--gray-color-100);

    &::before {
        content: "미리보기";
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

.modal-cont {
    margin: auto;
}

.option-wrap {
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

.preview-wrap {
    text-align: center;
}

.canvas-wrap {
    margin: 0;
}

canvas {
    width: 100%;
    height: 100%;
    border: 1px solid var(--gray-color-200);
    border-radius: 0.5rem;
}

.button-wrap {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
}

@media (max-width: 576px) {
    .modal-cont {
        width: 100%;
        height: 100%;
        min-width: 100%;
        border-radius: 0;
        padding-top: 3rem;
        // display: flex;
        // flex-wrap: nowrap;
        // align-items: center;
        // justify-content: center;
        // flex-direction: column;

        .canvas-wrap {
            width: 100%;
        }
    }
}
</style>