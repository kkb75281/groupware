<template lang="pug">
template(v-if="loading")
	Loading#loading
template(v-else)
	.title
		h1 {{ currentNewsletter?.subject }}

	hr

	
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { skapi } from '@/main';
import { newsletterList, getNewsletterListRunning, getNewsletterList } from '@/notifications'
import { convertTimestampToDateMillis } from "@/utils/time";

import Loading from '../components/loading.vue';

const router = useRouter();
const route = useRoute();

let loading = ref(false);
let message_id = route.params.messageId;
let currentNewsletter = ref({});

let getCurrentNewsletter = async() => {
	if(!message_id) {
		router.push('/newsletter');
		return;
	};

	loading.value = true;

	let findNewsletter = newsletterList.value.find((news: { message_id: string; }) => news.message_id === message_id);

	if(findNewsletter) {
		currentNewsletter.value = findNewsletter;
		loading.value = false;
		return currentNewsletter.value;
	} else {
		await skapi.getNewsletters({
			searchFor: 'message_id',
			value: message_id,
			group: 'public'
		}).then((res: any) => {
			if(res && res.list.length > 0) {
				currentNewsletter.value = res.list[0];
			}

			loading.value = false;
		})
		return currentNewsletter.value;
	}
}

onMounted(() => {
	getCurrentNewsletter();
})
</script>

<style lang="less" scoped>

</style>