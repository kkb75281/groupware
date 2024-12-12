<template lang="pug">
.modal(ref="dialog" @keydown.esc.prevent="closeDialog")
    .modal-cont
        //- .modal-inner
        .input-wrap.canvas-wrap
            p.label.essential(style="margin-bottom: 8px;") 서명란
            canvas#stampCanvas(ref="canvas")

        .input-wrap
            p.label.essential 도장명
            input(v-model="stampName" type="text" name="fileName" placeholder="도장명을 입력해주세요. 예) 회사직인, 개인직인 등")

        .button-wrap
            button.btn.outline(@click="closeDialog") 취소
            button.btn(@click="reset") 지우기
            button.btn(@click="sendStampBlob") 저장
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { stampName } from '@/components/make_stamp';

const emit = defineEmits(['close', 'save']);
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
    if (ctx && canvas.value) {
        ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
    }
}

let closeDialog = () => {
    reset();        // stamp maker 초기화
    emit('close');  // 부모 컴포넌트에 닫기 이벤트 전달
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
            emit("save", blob); // Blob 전달
        }
    }, "image/png");
}

onMounted(() =>{
    if (!canvas.value) return;

    // CSS 크기 가져오기
    let width = canvas.value.offsetWidth;
    let height = canvas.value.offsetHeight;

    // 실제 크기 동기화
    canvas.value.width = width;
    canvas.value.height = height;

    ctx = canvas.value.getContext("2d");

    reset();

    canvas.value.addEventListener('mousedown', startPosition);
    canvas.value.addEventListener('mouseup', endPosition);
    canvas.value.addEventListener('mousemove', draw);
})

onUnmounted(() => {
    if (!canvas.value) return;

    canvas.value.removeEventListener('mousedown', startPosition);
    canvas.value.removeEventListener('mouseup', endPosition);
    canvas.value.removeEventListener('mousemove', draw);
})
</script>

<style scoped lang="less">
.modal-cont {
    margin: auto;
}

.canvas-wrap {
    margin: 0;
}

canvas {
    width: 100%;
    height: 100%;
    border: 1px solid var(--gray-color-400);
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
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: center;
        flex-direction: column;

        .canvas-wrap {
            width: 100%;
        }
    }
}
</style>