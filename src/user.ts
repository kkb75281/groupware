import { useRouter } from 'vue-router';
import { reactive, ref, computed } from 'vue';
import { skapi } from '@/main';

export let iwaslogged = ref(false);
export let user: { [key: string]: any } = reactive({});
export let verifiedEmail = computed(() => !user.email_verified);
export let profileImage = ref('');

export const loginCheck = (profile: object | null, router: any) => {
  if (profile) {
    Object.assign(user, profile);

    // 브라우저 저장소에 로그인 상태 저장
    sessionStorage.setItem('user', JSON.stringify(profile));
    sessionStorage.setItem('iwaslogged', 'true');

    iwaslogged.value = true;
  } else {
    // if (iwaslogged.value) {
    //   Object.assign(user, {});
    //   router.push({ name: 'login' });
    // }

    // 브라우저 저장소 상태 초기화
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('iwaslogged');

    iwaslogged.value = false;
  }
};

// 초기화 함수
export const initializeUserState = async() => {
  const storedUser = sessionStorage.getItem('user');
  const storedLoggedIn = sessionStorage.getItem('iwaslogged') === 'true';

  if (storedUser) {
    Object.assign(user, JSON.parse(storedUser));
  }

  iwaslogged.value = storedLoggedIn;
};
