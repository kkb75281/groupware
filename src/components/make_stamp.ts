import { ref } from "vue";

export let openStampModal = ref(false);
export let uploadStamp = ref({});
export let stampImages = ref({});
export let stampName = ref('');

export let openStampDialog = () => {
    openStampModal.value = true;
}
export let closeStampDialog = () => {
    openStampModal.value = false;
}
export let handleStampBlob = async (makeStamp) => {
    if (stampName.value) {
        uploadStamp.value[stampName.value] = makeStamp;

        // Blob URL에서 Blob 객체를 가져오기
        const response = await fetch(makeStamp);
        const blob = await response.blob();

        stampImages.value[stampName.value] = blob;

        console.log(uploadStamp.value)
        console.log(stampImages.value)

        openStampModal.value = false;
        stampName.value = '';
    }
}