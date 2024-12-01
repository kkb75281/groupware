import { ref, type Ref } from 'vue';
import { skapi } from '@/main';

export let divisions: Ref<{[key: string]: any} | 'no data'> = ref({});
export let divisionNameList: Ref<{[key: string]: string}> = ref({});
export let loading = ref(false);

export function getDivisionNames() {
    skapi.getRecords({
        table: {
            name: 'divisionNames',
            access_group: 1
        },
    }).then(r => {
        divisionNameList.value = r.list[0].data;
    })
}
