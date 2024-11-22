import { reactive, ref, computed } from 'vue';

export let user: { [key: string]: any } = reactive({});
export let verifiedEmail = computed(() => !user.email_verified);
export let profileImage = ref(null);