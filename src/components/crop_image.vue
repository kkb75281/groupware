<template lang="pug">
dialog(ref="dialog" :class="{'mobile': mobileCloseBtn}" @keydown.esc.prevent="emit('close')")
    div(v-if="mobileCloseBtn" style="text-align: right;")
        button.mobile-close(@click="emit('close')")
            .icon
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
        br
        br
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
let mobileCloseBtn = ref(false);

watch(() => props.open, (nv) => {
    if (nv) {
        dialog.value.showModal();
    } else {
        dialog.value.close();
    }
});

// resize event listener
onMounted(() => {
    window.addEventListener('resize', checkScreenWidth);
    checkScreenWidth();
});

let checkScreenWidth = () => {
    if (window.innerWidth < 576) {
        mobileCloseBtn.value = true;
    } else {
        mobileCloseBtn.value = false;
    }
}

onUnmounted(() => {
    window.removeEventListener('resize', checkScreenWidth);
});
</script>

<style scoped lang="less">
dialog {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);

  max-width: 500px;
  max-height: 600px;
  width: 100%;
  height: 100%;
  padding: 1rem;

  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  outline: none;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
}

canvas {
    width: 500px;
    height: calc(600px - 3rem - 2.5rem);
    border: 1px solid var(--gray-color-200);
    background-color: var(--gray-color-100);
}

.button-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;

    button {
        flex-grow: 1;
    }
}

.mobile-close {
    // position: absolute;
    // right: 1rem;
    // top: 1rem;
    background-color: var(--gray-color-300);
    border-radius: 50%;
    padding: 4px;

    .icon {
        padding: 0;

        svg {
            fill: #fff;
        }
    }
}

@media (max-width: 768px) {
}

@media (max-width: 576px) {
    .mobile {
        max-width: 100%;
        max-height: 100%;
    }
    .button-wrap {
        .outline {
            display: none;
        }
    }
}
</style>