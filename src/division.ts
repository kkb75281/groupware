import { ref, watch, type Ref } from 'vue';
import { skapi } from '@/main.ts';
import { user } from '@/user.ts';

export let divisions: Ref<{ [key: string]: any }> = ref({});

/**
 * divisionNameList =
 * {
 *  DVS_0: "부서명",
 * 
 *  DVS_1: "부서명",
 *  ...
 * }
 */
export let divisionNameList: Ref<{ [DVS_NUMBER: string]: string }> = ref({});
export let loading = ref(true);

export let getDivisionDataRunning: Promise<any> | null = null;
export let getDivisionNamesRunning: Promise<any> | null = null;

export async function getDivisionNames(refresh = false) {
    if(getDivisionNamesRunning instanceof Promise) {
        await getDivisionNamesRunning;
        return divisionNameList.value;
    }

    if (Object.keys(divisionNameList.value).length && !refresh) {
        return divisionNameList.value;
    }

    loading.value = true;
    getDivisionNamesRunning = skapi.getRecords({
        unique_id: '[division_name_list]'
    }).catch(async(err)=>{
		console.log('err', err);
		console.log('errcode', err.code);
		if(err.code === 'NOT_EXISTS') {
			if(getDivisionDataRunning instanceof Promise){
				await getDivisionDataRunning;
			}

			if(Object.keys(divisions.value).length) {
				console.log('divisions', divisions.value);
				let updateData: any = {};

				const keys = Object.keys(divisions.value);

				for (let i = 0; i < keys.length; i++) {
					const key = keys[i];
					const value = divisions.value[key];

					updateData[`DVS_${i}`] = value.data.division_name;
				}

				return skapi.postRecord(updateData, {
					unique_id: '[division_name_list]',
					table: {
						name: 'divisionNames',
						access_group: 1
					}
				})
			} else {
                return;
            }
		}
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
    if (res && res.list && res.list.length) {
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
        }).catch((err) => {
			console.log('err', err);
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

		console.log('res', res);

        if (res.list.length) {
			divisions.value = {};
			
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
