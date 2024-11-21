import { useRouter } from 'vue-router';
import { reactive, ref, computed } from 'vue';
import { skapi } from '@/main';

export let user: { [key: string]: any } = reactive({});
export let verifiedEmail = computed(() => !user.email_verified);
export let profileImage = ref(null);