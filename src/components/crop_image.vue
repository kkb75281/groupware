<template lang="pug">
dialog(ref="dialog" @keydown.esc.prevent="emit('close')")
    .canvas-wrap
        canvas#canvas(ref="canvas")

    br

    .button-wrap
        button.btn.outline(@click="emit('close')") Close
        button.btn(@click="cropImage") Crop & Upload
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch, defineProps, defineEmits } from 'vue';

const props = defineProps({
  open: Boolean,
  imageSrc: String
});

const emit = defineEmits(['cropped', 'close']);

let dialog = ref(null);
let canvas = ref(null);
let ctx = ref(null);

let image = new Image();
let isResizing = false;
let isDragging = false;
let cropStartX = 50;
let cropStartY = 50;
let cropWidth = 100;
let cropHeight = 100;

let activeHandle = null;
let handleSize = 10;

let loadImage = (src) => {
    image.src = src;
    image.onload = drawImageOnCanvas;
}

let drawImageOnCanvas = () => {
    canvas.value.width = image.width;
    canvas.value.height = image.height;
    drawImage();
}

let drawImage = () => {
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
    ctx.value.drawImage(image, 0, 0);

    ctx.value.strokeStyle = 'red';
    ctx.value.lineWidth = 2;
    ctx.value.strokeRect(cropStartX, cropStartY, cropWidth, cropHeight);
    drawHandles();
}

let drawHandles = () => {
    ctx.value.fillStyle = 'blue';
    ctx.value.fillRect(cropStartX - handleSize / 2, cropStartY - handleSize / 2, handleSize, handleSize);
    ctx.value.fillRect(cropStartX + cropWidth - handleSize / 2, cropStartY - handleSize / 2, handleSize, handleSize);
    ctx.value.fillRect(cropStartX + cropWidth - handleSize / 2, cropStartY + cropHeight - handleSize / 2, handleSize, handleSize);
    ctx.value.fillRect(cropStartX - handleSize / 2, cropStartY + cropHeight - handleSize / 2, handleSize, handleSize);
}

function startAction(e) {
    const rect = canvas.value.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log(x, y)

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

    console.log(x, y)

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
    return x >= handleX - handleSize / 2 && x <= handleX + handleSize / 2 && y >= handleY - handleSize / 2 && y <= handleY + handleSize / 2;
}

function isInCropArea(x, y) {
    return x >= cropStartX && x <= cropStartX + cropWidth && y >= cropStartY && y <= cropStartY + cropHeight;
}

let cropImage = () => {
    if (canvas.value && ctx.value) {
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
        });
    }

    const croppedData = canvas.value.toDataURL('image/png');
    emit('cropped', croppedData);
    emit('close');
}

watch(() => props.open, (nv) => {
    if (nv) {
        dialog.value.showModal();
    } else {
        dialog.value.close();
    }

    if (nv && props.imageSrc) {
        loadImage(props.imageSrc);
    }
});

onMounted(() => {
    ctx.value = canvas.value.getContext('2d');
    if (props.imageSrc) {
        loadImage(props.imageSrc);
    }

    canvas.value.addEventListener("mousedown", startAction);
    canvas.value.addEventListener("mousemove", performAction);
    canvas.value.addEventListener("mouseup", endAction);
});
</script>

<style scoped lang="less">
dialog {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);

    max-width: 500px;
    width: 100%;
    padding: 1rem;

    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    outline: none;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
}

.canvas-wrap {
    position: relative;

    &:after {
        content: "";
        display: block;
        padding-bottom: 100%;
    }

    canvas {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 1px solid var(--gray-color-200);
        background-color: var(--gray-color-100);
    }
}

.button-wrap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 1rem;

    button {
        flex-grow: 1;
        min-width: 150px;
    }
}

@media (max-width: 768px) {
}

@media (max-width: 355px) {
    .button-wrap {
        flex-direction: column-reverse;

        button {
            width: 100%;
        }
    }
}
</style>