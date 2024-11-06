import { computed, reactive } from "vue";
import { skapi } from "@/main";

export let user: { [key: string]: any } = reactive({});
export let loginState = computed(() => !!user?.user_id);

export let updateUser = () => {
    return skapi.getProfile().then((u: any) => {
        console.log(u)
        for (let k in user) {
            delete user[k]
        }
        if (u) {
            for (let k in u) {
                user[k] = u[k];
            }
        }
    })
}