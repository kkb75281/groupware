import { ref, watch, type Ref } from 'vue';
import { skapi } from './main';
import { user } from './user';

export let divisions: Ref<{ [key: string]: any }> = ref({});
export let divisionNameList: Ref<{ [key: string]: string }> = ref({});
export let loading = ref(true);

export let getDivisionDataRunning: Promise<any> | null = null;
export let getDivisionNamesRunning: Promise<any> | null = null;

export async function getDivisionNames(refresh = false) {
  if (Object.keys(divisionNameList.value).length && !refresh) { // 받아온적 없거나, 데이터가 없는경우 + 새로고침을 요청하지 않은 경우
    loading.value = false;
    return; // 이미 데이터가 존재하면 불러오지 않음
  }

  // try {
  loading.value = true;
  getDivisionNamesRunning = skapi.getRecords({
    unique_id: '[division_name_list]'
  }).finally(() => {
    if (getDivisionDataRunning) {
      getDivisionDataRunning.finally(() => {
        loading.value = false;
      });
    } else {
      loading.value = false;
    }
  });
  let res = await getDivisionNamesRunning;
  if (res.list.length) {
    if (res.list[0].data) {
      divisionNameList.value = res.list[0].data;
    }
  }
}

export async function getDivisionData(refresh: boolean = false) {
  if (Object.keys(divisions.value).length && !refresh) { // 받아온적 없거나, 데이터가 없는경우 + 새로고침을 요청하지 않은은 경우
    loading.value = false;
    return; // 이미 데이터가 존재하면 불러오지 않음
  }

  loading.value = true;
  if (user.access_group === 99) {
    getDivisionDataRunning = skapi.getRecords({
      table: {
        name: 'divisions',
        access_group: 99
      }
    }).finally(() => {
      if (getDivisionNamesRunning) {
        getDivisionNamesRunning.finally(() => {
          loading.value = false
        });
      } else {
        loading.value = false;
      }
    });
    let res = await getDivisionDataRunning;
    if (res.list.length) {
      res.list.forEach((div: any) => {
        divisions.value[div.record_id] = div;
      })
    }
  }
  else {
    loading.value = false;
  }
}

watch(user, u => {
  if (u && Object.keys(u).length) {
    getDivisionNames();
    getDivisionData();
  }
}, { immediate: true });
