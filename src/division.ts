import { ref, type Ref } from 'vue';
import { skapi } from '@/main';

export let divisions: Ref<{[key: string]: any} | 'no data'> = ref({});
export let divisionNameList: Ref<{[key: string]: string}> = ref({});
export let loading = ref(false);
