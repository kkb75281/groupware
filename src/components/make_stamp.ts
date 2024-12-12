import { ref } from "vue";

export let openStampModal = ref(false);
export let uploadingStamp = ref([]);
export let stampImages = ref({});
export let stampName = ref('');
export let uploadingSrc = ref({});

export let openStampDialog = () => {
    openStampModal.value = true;
}
export let closeStampDialog = () => {
    openStampModal.value = false;
}
export let handleStampBlob = async (makeStampImage) => {
    if (stampName.value) {
        try {
            // 미리보기 이미지 경로
            // uploadStamp.value[stampName.value] = makeStampImage;
            let previewObj = {
                name: stampName.value,
                url: makeStampImage
            }
            uploadingStamp.value.push(previewObj);
    
            // Blob URL에서 Blob 객체를 가져오기
            const response = await fetch(makeStampImage);
            const blob = await response.blob();
    
            // 서버로 보낼 blob 객체
            stampImages.value[stampName.value] = blob;
    
            openStampModal.value = false;
            stampName.value = '';
        } catch (error) {
            alert('이미지를 업로드하는 중 오류가 발생했습니다.');
            throw error;
        }
    }
}