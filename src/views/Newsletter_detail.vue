<template lang="pug">
template(v-if="loading")
	Loading#loading
template(v-else)
	.title
		h1 {{ currentNewsletter?.subject }}

	hr

	.content(v-html="htmlContent")

	br

	.btn-wrap
		button.btn.bg-gray(@click="router.push('/newsletter')") 목록으로
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
let htmlContent = ref('');

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

async function fetchHtml(url: string) {
  try {
    const response = await fetch(url); // 여기에 원하는 URL 입력
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text(); // 응답을 텍스트로 변환
    htmlContent.value = html; // 가져온 HTML을 반응형 변수에 할당
  } catch (error) {
    console.error('HTML을 가져오는 중 오류 발생:', error);
    htmlContent.value = '<p>콘텐츠를 불러오는 데 실패했습니다.</p>';
  }
}

onMounted(async() => {
	await getCurrentNewsletter();
	fetchHtml(currentNewsletter.value?.url);
})
</script>

<style lang="less" scoped>
.content {
	min-height: 300px;
}

.btn-wrap {
	display: flex;
	justify-content: end;
}
</style>