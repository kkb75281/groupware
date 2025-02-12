import { ref } from "vue";
import { getStampList, uploadedStamp } from "@/stamp";

export let openStampModal = ref(false);
export let uploadingStamp = ref({});
export let stampImages = ref({});
export let stampName = ref('');
export let uploadingSrc = ref({});
export let onlyStamp = ref(false);
export let onlyStampFile = ref(null);
export let handleStampBlobComplete = ref(false);

export let openStampDialog = () => {
    openStampModal.value = true;
}
export let closeStampDialog = () => {
    openStampModal.value = false;
}
export let handleStampBlob = async (makeStampImage) => {
	handleStampBlobComplete.value = false;
	if(!stampName.value) {
		await getStampList();

		if(uploadedStamp.value && uploadedStamp.value.length) {
			// 도장 이미지가 있을때 각각의 도장 이름 중 generated-stamp-가 있는지 확인
			const stampNames = uploadedStamp.value.map(stamp => stamp.filename);
			console.log(stampNames);
			const generatedStamp = stampNames.filter(name => name.includes('generated-stamp-'));
			console.log(generatedStamp);
			
			// generatedStamp가 있으면 그 다음 숫자를 찾아서 도장 이름을 만들어줌
			if(generatedStamp.length) {
				const lastStampNumber = generatedStamp.map(stamp => parseInt(stamp.split('-')[2])).sort((a, b) => b - a)[0];
				stampName.value = `generated-stamp-${lastStampNumber + 1}`;
			} else {
				stampName.value = 'generated-stamp-1';
			}
		} else {
            stampName.value = 'generated-stamp-1';
        }
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
            onlyStampFile.value = new File([blob], stampName.value, { type: "image/png" });
        } else {
            // 도장 페이지에서 등록할때
            stampImages.value.name = stampName.value;
            stampImages.value.blob = blob;
        }

        console.log(onlyStampFile.value);
        console.log(stampImages.value);

        openStampModal.value = false;
		handleStampBlobComplete.value = true;
        stampName.value = '';
    } catch (error) {
        alert('이미지를 업로드하는 중 오류가 발생했습니다.');
        throw error;
    }
}