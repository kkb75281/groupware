import { ref, watch, type Ref } from 'vue';
import { skapi } from './main';
import { user } from './user';

export let divisions: Ref<{ [key: string]: any }> = ref({});

/**
 * divisionNameList =
 * {
 *  DVS_0: "부서명",
 *  DVS_1: "부서명",
 *  ...
 * }
 */
export let divisionNameList: Ref<{ [key: string]: string }> = ref({});
export let loading = ref(true);

export let getDivisionDataRunning: Promise<any> | null = null;
export let getDivisionNamesRunning: Promise<any> | null = null;

export async function getDivisionNames(refresh = false) {
    if(getDivisionNamesRunning instanceof Promise) { // 이미 실행중인 경우
        await getDivisionNamesRunning;
        return divisionNameList.value;
    }

    if (Object.keys(divisionNameList.value).length && !refresh) { // 받아온적 없거나, 데이터가 없는경우 + 새로고침을 요청하지 않은 경우
        loading.value = false;
        return divisionNameList.value; // 이미 데이터가 존재하면 불러오지 않음
    }

    loading.value = true;
    getDivisionNamesRunning = skapi.getRecords({
        unique_id: '[division_name_list]'
    }).finally(() => {
        
        getDivisionNamesRunning = null;

        if (getDivisionDataRunning instanceof Promise) {
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

    return divisionNameList.value;
}

export async function getDivisionData(refresh: boolean = false) {
    if(!refresh && getDivisionDataRunning instanceof Promise) { // 이미 실행중인 경우
        await getDivisionDataRunning
        return divisions.value;
    }

    if (Object.keys(divisions.value).length && !refresh) { // 받아온적 없거나, 데이터가 없는경우 + 새로고침을 요청하지 않은은 경우
        loading.value = false;
        return divisions.value; // 이미 데이터가 존재하면 불러오지 않음
    }

    loading.value = true;
    if (user.access_group === 99) {
        getDivisionDataRunning = skapi.getRecords({
            table: {
                name: 'divisions',
                access_group: 99
            }
        }).finally(() => {
            getDivisionDataRunning = null;

            if (getDivisionNamesRunning instanceof Promise) {
                getDivisionNamesRunning.finally(() => {
                    loading.value = false;
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

    return divisions.value;
}

watch(user, u => { // 로딩되고 로그인되면 무조건 실행
    if (u && Object.keys(u).length) {
        getDivisionNames();
        getDivisionData();
    }
}, { immediate: true });
