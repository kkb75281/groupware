import { reactive, ref, computed } from 'vue';
import { skapi } from '@/main.ts';

export let user: { [profile_attribute: string]: any } = reactive({});
export let verifiedEmail = computed(() => !user.email_verified);
export let encodedEmail = encodeURIComponent(user.email);
export let profileImage = ref(null);
export let googleAccountCheck = computed(() => !!localStorage.getItem('accessToken'));

export let makeSafe = (str: String) => {
  return str.replaceAll('.', '_').replaceAll('+', '_').replaceAll('@', '_').replaceAll('-', '_');
};

let getUserPositionCurrentRunning: Promise<any> | null = null;
export let userPositionCurrent = ref([]);
export async function getUserPositionCurrent(refresh = false) {
  if (getUserPositionCurrentRunning instanceof Promise) {
    await getUserPositionCurrentRunning;
    return userPositionCurrent.value;
  }

  if (Object.keys(userPositionCurrent.value).length && !refresh) {
    return userPositionCurrent.value;
  }

  // 모든 현재 부서/직책 정보 가져오기
  getUserPositionCurrentRunning = skapi
    .getUniqueId({
      unique_id: `[emp_position_current]${makeSafe(user.user_id)}`,
      condition: '>='
    })
    .finally(() => {
      getUserPositionCurrentRunning = null;
    });

  let res = await getUserPositionCurrentRunning;

  if (res && res.list && res.list.length) {
    res.list.map(async (r: any) => {
      if (r && r.unique_id) {
        const parts = r.unique_id.split(':');
        if (parts.length) {
          const divisionId = parts[1];
          console.log('divisionId', divisionId);

          const getPosition = await skapi.getRecords({
            unique_id: `[emp_position_current]${makeSafe(user.user_id)}:${divisionId}`
          });
          const position = getPosition.list[0].index?.name?.split('.')[1] || '';

          let info = {
            recordData: getPosition.list[0],
            divisionId,
            position
          };

          userPositionCurrent.value.push(info);
        }
      }
    });
  } else {
    userPositionCurrent.value = [];
  }

  //   console.log('userPositionCurrent', userPositionCurrent.value);

  return userPositionCurrent.value;
}
