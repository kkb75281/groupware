import { useRouter } from 'vue-router';
import { reactive, ref } from 'vue';
import { skapi } from '@/main';

export let user: { [key: string]: any } = reactive({});
// export let loginState = computed(() => !!user?.user_id);
export let profileImage = ref('');

export let updateUser = () => {
  return skapi.getProfile().then((u: any) => {
    console.log('=== user.ts === u : ', u);
    for (let k in user) {
      delete user[k];
    }
    if (u) {
      for (let k in u) {
        user[k] = u[k];
      }

      if (user.picture) {
        skapi
          .getFile(user.picture, {
            dataType: 'endpoint',
          })
          .then((res) => {
            profileImage.value = res;
          })
          .catch((err) => {
            window.alert('프로필 사진을 불러오는데 실패했습니다.');
            throw err; // 의도적으로 에러 전달
          });
      } else {
        profileImage.value = '';
      }
    } else {
      user = {};
    }
  });
};
