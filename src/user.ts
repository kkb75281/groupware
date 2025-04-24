import { reactive, ref, computed } from 'vue';

export let user: { [profile_attribute: string]: any } = reactive({});
export let verifiedEmail = computed(() => !user.email_verified);
export let encodedEmail = encodeURIComponent(user.email);
export let profileImage = ref(null);

export let googleAccountCheck = computed(() => !!localStorage.getItem('accessToken'));

export let makeSafe = (str:String) => {
    return str.replaceAll('.', '_').replaceAll('+', '_').replaceAll('@', '_').replaceAll('-', '_');
}