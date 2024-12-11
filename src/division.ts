import { ref, type Ref } from 'vue';
import { skapi } from '@/main';

export let divisions: Ref<{[key: string]: any} | 'no data'> = ref({});
export let divisionNameList: Ref<{[key: string]: string}> = ref({});
export let loading = ref(false);

export async function getDivisionNames() {
    let res;
    try {
        res = await skapi.getRecords({
            unique_id: '[division_name_list]',
            table: {
                name: 'divisionNames',
                access_group: 1
            },
        });
    }
    catch(e) {
        alert('부서 이름 정보를 불러오는 중 오류가 발생했습니다.');
        throw e;
    }
    if(res.list.length) {
        divisionNameList.value = res.list[0].data;
    }
}
