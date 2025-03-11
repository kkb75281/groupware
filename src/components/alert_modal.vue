<template lang="pug">
dialog.alert-modal(ref='dialog' @keydown.esc.prevent="emit('close')")
    template(v-if='props.alertError')
        .content-wrap
            h4.title 에러 발생
            p {{ props.alertMessage }}
        .button-wrap
            button.btn.bg-gray(@click="emit('close')") 확인
    template(v-else)
        slot
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';

let props = defineProps({
    open: Boolean,
    alertError: Boolean,
    alertMessage: String,
});
let emit = defineEmits(['close']);

let dialog = ref(null);

onMounted(() => {
    if (props.open) {
        dialog.value.showModal();
    }
});

watch(() => props.open, nv => {
    if (nv) {
        dialog.value.showModal();
    }
    else {
        dialog.value.close();
    }
});
</script>

<style scoped lang="less">
dialog {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    // margin: 0 auto;
    // margin-top: 1rem;
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    outline: none;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
}
</style>