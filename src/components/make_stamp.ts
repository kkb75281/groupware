import { ref } from "vue";

export let openStampModal = ref(false);
export let uploadingStamp = ref({});
export let stampImages = ref({});
export let stampName = ref('');
export let uploadingSrc = ref({});
export let onlyStamp = ref(false);
export let onlyStampFile = ref(null);

export let openStampDialog = () => {
    openStampModal.value = true;
}
export let closeStampDialog = () => {
    openStampModal.value = false;
}
export let handleStampBlob = async (makeStampImage) => {
    if (!onlyStamp.value && !stampName.value) { 
        alert('도장 이름을 입력해주세요.');
    }
    
    try {
        // 미리보기 이미지 경로
        uploadingStamp.value.name = stampName.value;
        uploadingStamp.value.url = makeStampImage;

        // Blob URL에서 Blob 객체를 가져오기
        const response = await fetch(makeStampImage);
        const blob = await response.blob();

        // 서버로 보낼 blob 객체
        if(onlyStamp.value) {
            // 결재 페이지에서 서명하면서 도장을 등록할때
            onlyStampFile.value = new File([blob], "generated-stamp.png", { type: "image/png" });
        } else {
            // 도장 페이지에서 등록할때
            stampImages.value.name = stampName.value;
            stampImages.value.blob = blob;
        }

        console.log(onlyStampFile.value);
        console.log(stampImages.value);

        openStampModal.value = false;
        stampName.value = '';
    } catch (error) {
        alert('이미지를 업로드하는 중 오류가 발생했습니다.');
        throw error;
    }
}