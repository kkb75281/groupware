<template lang="pug">
dialog.dialog(ref="dialog" @keydown.esc.prevent="emit('close')")
    h2 사진 편집기

    canvas#canvas(ref="canvas")
    button(@click="cropImage") Crop
</template>

<script setup>
import { onMounted, ref, watch, defineProps, defineEmits } from 'vue';

const props = defineProps({
  open: Boolean,
  imageSrc: String
});

const emit = defineEmits(['cropped', 'close']);

// ref를 사용해 DOM 요소를 참조
const dialog = ref(null);
const canvas = ref(null);
const ctx = ref(null);

let image = new Image();
let croppedImage = null;
let isResizing = false;
let isDragging = false;
let cropStartX = 50;
let cropStartY = 50;
let cropWidth = 100;
let cropHeight = 100;
let isCropped = false;
let activeHandle = null;
const handleSize = 10;

function loadImage(src) {
    image.src = src;
    image.onload = drawImageOnCanvas;
}

function drawImageOnCanvas() {
    croppedImage = null;
    canvas.value.width = image.width;
    canvas.value.height = image.height;
    resetCropArea();
    drawImage();
}

function drawImage() {
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
    if (croppedImage) {
        ctx.value.putImageData(croppedImage, 0, 0);
    } else {
        ctx.value.drawImage(image, 0, 0);
    }
    ctx.value.strokeStyle = 'red';
    ctx.value.lineWidth = 2;
    ctx.value.strokeRect(cropStartX, cropStartY, cropWidth, cropHeight);
    drawHandles();
}

function drawHandles() {
    ctx.value.fillStyle = 'blue';
    ctx.value.fillRect(cropStartX - handleSize / 2, cropStartY - handleSize / 2, handleSize, handleSize);
    ctx.value.fillRect(cropStartX + cropWidth - handleSize / 2, cropStartY - handleSize / 2, handleSize, handleSize);
    ctx.value.fillRect(cropStartX - handleSize / 2, cropStartY + cropHeight - handleSize / 2, handleSize, handleSize);
    ctx.value.fillRect(cropStartX + cropWidth - handleSize / 2, cropStartY + cropHeight - handleSize / 2, handleSize, handleSize);
}

// 마우스 이벤트
function startAction(e) {
    const rect = canvas.value.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isInHandle(x, y, cropStartX, cropStartY)) {
        activeHandle = 'top-left';
        isResizing = true;
    } else if (isInHandle(x, y, cropStartX + cropWidth, cropStartY)) {
        activeHandle = 'top-right';
        isResizing = true;
    } else if (isInHandle(x, y, cropStartX, cropStartY + cropHeight)) {
        activeHandle = 'bottom-left';
        isResizing = true;
    } else if (isInHandle(x, y, cropStartX + cropWidth, cropStartY + cropHeight)) {
        activeHandle = 'bottom-right';
        isResizing = true;
    } else if (isInCropArea(x, y)) {
        isDragging = true;
    }
}

function performAction(e) {
    const rect = canvas.value.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isResizing) {
        switch (activeHandle) {
            case 'top-left':
                cropWidth += cropStartX - x;
                cropHeight += cropStartY - y;
                cropStartX = x;
                cropStartY = y;
                break;
            case 'top-right':
                cropWidth = x - cropStartX;
                cropHeight += cropStartY - y;
                cropStartY = y;
                break;
            case 'bottom-left':
                cropWidth += cropStartX - x;
                cropHeight = y - cropStartY;
                cropStartX = x;
                break;
            case 'bottom-right':
                cropWidth = x - cropStartX;
                cropHeight = y - cropStartY;
                break;
        }
        drawImage();
    } else if (isDragging) {
        cropStartX = x - cropWidth;
        cropStartY = y - cropHeight;
        drawImage();
    }
}

function endAction() {
    isResizing = false;
    isDragging = false;
    activeHandle = null;
}

function isInHandle(x, y, handleX, handleY) {
    return x >= handleX - handleSize / 2 && x <= handleX + handleSize / 2 &&
           y >= handleY - handleSize / 2 && y <= handleY + handleSize / 2;
}

function isInCropArea(x, y) {
    return x >= cropStartX && x <= cropStartX + cropWidth &&
           y >= cropStartY && y <= cropStartY + cropHeight;
}

function cropImage() {
    if (canvas.value && ctx.value && !isCropped) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = cropWidth;
        tempCanvas.height = cropHeight;

        tempCtx.drawImage(
            image,
            cropStartX, cropStartY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );

        tempCanvas.toBlob((blob) => {
            const croppedFile = new File([blob], 'cropped_image.png', { type: 'image/png' });
            console.log(croppedFile); // 업로드 등 필요 시 사용 가능

            canvas.value.width = cropWidth;
            canvas.value.height = cropHeight;
            ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
            ctx.value.drawImage(tempCanvas, 0, 0);

            canvas.value.removeEventListener("mousedown", startAction);
            canvas.value.removeEventListener("mousemove", performAction);
            canvas.value.removeEventListener("mouseup", endAction);

            isCropped = true;
        });
    }

    const croppedData = canvas.value.toDataURL('image/png');
    emit('cropped', croppedData);
    emit('close');
    resetState();
}

function resetState() {
    cropStartX = 50;
    cropStartY = 50;
    cropWidth = 100;
    cropHeight = 100;
    isCropped = false;
    activeHandle = null;
    croppedImage = null;
    if (props.imageSrc) loadImage(props.imageSrc);
}

function resetCropArea() {
    cropStartX = 50;
    cropStartY = 50;
    cropWidth = 100;
    cropHeight = 100;
}

onMounted(() => {
    ctx.value = canvas.value.getContext('2d'); // canvas가 마운트된 후 ctx를 설정
    if (props.imageSrc) loadImage(props.imageSrc);

    canvas.value.addEventListener("mousedown", startAction);
    canvas.value.addEventListener("mousemove", performAction);
    canvas.value.addEventListener("mouseup", endAction);
});

watch(() => props.open, (nv) => {
    if (nv) {
        dialog.value.showModal();
        resetState();
    } else {
        dialog.value.close();
    }

    if (nv && props.imageSrc) {
        loadImage(props.imageSrc);
    }
});
</script>

<style scoped lang="less">
canvas {
    border: 1px solid black;
}
</style>