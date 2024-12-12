import { ref } from "vue";

export let openCropModal = ref(false);
export let croppedImages = ref({});
export let uploadSrc = ref({});
export let currentImageSrc = ref('');
export let currentTargetId = ref('');
export let deleteList = ref([]);    // 한 폼에서 여러 이미지를 업로드할 때, 삭제할 이미지 목록

export let resetCropImage = () => {
    openCropModal.value = false;
    croppedImages.value = {};
    uploadSrc.value = {};
    currentImageSrc.value = '';
    currentTargetId.value = '';
    deleteList.value = [];
};

export let openCropImageDialog = (e) => {
    const file = e.target.files[0];

    deleteList.value.push(e.target.id);

    if (file) {
        const fileURL = URL.createObjectURL(file);
        currentImageSrc.value = fileURL;
        currentTargetId.value = e.target.id;
        uploadSrc.value[currentTargetId.value] = fileURL;
        openCropModal.value = true;
    }
    if(e.currentTarget) {
        e.currentTarget.value = ''; // 초기화
    }
}

export let closeCropImageDialog = () => {
    uploadSrc.value[currentTargetId.value] = null;
    openCropModal.value = false;
}

export let setCroppedImage = async(croppedImage) => {
    if(currentTargetId.value) {
        try {
            // 미리보기 이미지 경로 업데이트
            uploadSrc.value[currentTargetId.value] = croppedImage;

            // Blob URL에서 Blob 객체를 가져오기
            const response = await fetch(croppedImage);
            const blob = await response.blob();

            // Blob 객체를 저장 (서버 전송용)
            croppedImages.value[currentTargetId.value] = blob;

            openCropModal.value = false;
            currentImageSrc.value = '';
            currentTargetId.value = '';
        } catch (error) {
            console.error('Error processing Blob URL:', error);
        }
    }
}