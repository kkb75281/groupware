import { ref } from 'vue';
import { skapi } from '@/main';
import { user, makeSafe } from '@/user';

export let uploadedStamp = ref([]);
export let uploadedRecordId = ref(null);
export let uploadGeneratedStamp = ref(null);
export let loading = ref(true);
export let getStampListRunning = ref(false);

export let getStampList = async (refresh = false) => {
  if (uploadedStamp.value && uploadedStamp.value.length && !refresh) return;

  getStampListRunning.value = true;

  try {
    let res = await skapi.getRecords({
      unique_id: '[stamp_images]' + makeSafe(user.user_id),
      table: {
        name: 'stamp_images',
        access_group: 1,
      },
    });

    console.log('도장 === getStampList === res : ', JSON.parse(JSON.stringify(res)));

    if (res.list.length) {
      uploadedStamp.value = res.list[0].bin.stamp_data;
      uploadedRecordId.value = res.list[0].record_id;
      getStampListRunning.value = false;
    }

    // if (res.list.length) {
    //   // URL에서 token 부분 제거
    //   const stampData = res.list[0].bin.stamp_data.map(stamp => {
    //     console.log('stamp.url : ', stamp.url);

    //     const urlWithoutToken = stamp.url.split('?')[0];
    //     return {
    //       ...stamp,
    //       url: urlWithoutToken
    //     };
    //   });

    //   uploadedStamp.value = stampData;
    //   uploadedRecordId.value = res.list[0].record_id;

    //   // 도장 URL에 대한 실제 접근 가능한 URL 가져오기
    //   for (let stamp of uploadedStamp.value) {
    //     try {
    //       const fileRes = await skapi.getFile(stamp.url);
    //       stamp.url = fileRes.url;
    //     } catch (error) {
    //       console.error('도장 URL 가져오기 실패:', error);
    //     }
    //   }
    // }
  } catch (e) {
    getStampListRunning.value = false;

    console.log({ e });

    if (e.code === 'NOT_EXISTS') {
      uploadedStamp.value = [];
      uploadedRecordId.value = null;
    } else {
      alert('도장 정보를 불러오는 중 오류가 발생했습니다.');
    }
  }
};
