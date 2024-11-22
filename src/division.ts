import { ref, type Ref } from 'vue';
import { skapi } from '@/main';

export let divisions: Ref<{[key: string]: any} | 'no data'> = ref({});
export let divisionNameList: Ref<{[key: string]: string}> = ref({});
export let loading = ref(false);

let sessionDivisions = window.sessionStorage.getItem('divisions');

if(!sessionDivisions || Object.keys(sessionDivisions).length < 1) {
    loading.value = true;

    skapi.getRecords({
        table: {
            name: 'divisions',
            access_group: 99
        }
    },
    ).then(response => {
        divisions.value = response.list;
        displayDivisions(response.list);
        loading.value = false;
    });
} else {
    if(sessionDivisions === 'no data') {
        divisions.value = 'no data';
    } else {
        divisions.value = JSON.parse(sessionDivisions);
    }
}

if(Object.keys(divisions.value)) {
    Object.keys(divisions.value).forEach((key, index) => {
        let specialKey = `DVS_${index}`;
        divisionNameList.value[specialKey] = divisions.value[key].data.division_name;
    });
}

export let displayDivisions = (divisions: any) => {
    let saveSession:any = {};

    if (!divisions.length) {
        window.sessionStorage.setItem('divisions', 'no data');

        return;
    }

    divisions.forEach((division: any) => {
        saveSession[division.record_id] = division;
    });

    window.sessionStorage.setItem('divisions', JSON.stringify(saveSession));
}