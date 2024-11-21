import { useRouter } from 'vue-router';
import { reactive, ref, computed } from 'vue';
import { skapi } from '@/main';

const router = useRouter();
export let iwaslogged = ref(false);
export let user: { [key: string]: any } = reactive({});
export let verifiedEmail = computed(() => !user.email_verified);
export let profileImage = ref('');

export const loginCheck = (profile: object | null, router: any) => {
  if (profile) {
    Object.assign(user, profile);

    // 브라우저 저장소에 로그인 상태 저장
    localStorage.setItem('user', JSON.stringify(profile));
    localStorage.setItem('iwaslogged', 'true');

    iwaslogged.value = true;
  } else {
    if (iwaslogged.value) {
      Object.assign(user, {});
      router.push({ name: 'login' });
    }

    // 브라우저 저장소 상태 초기화
    localStorage.removeItem('user');
    localStorage.removeItem('iwaslogged');

    iwaslogged.value = false;
  }
};

// 초기화 함수
export const initializeUserState = () => {
  const storedUser = localStorage.getItem('user');
  const storedLoggedIn = localStorage.getItem('iwaslogged') === 'true';

  if (storedUser) {
    Object.assign(user, JSON.parse(storedUser));
  }

  iwaslogged.value = storedLoggedIn;
};
