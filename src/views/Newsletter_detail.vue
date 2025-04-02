<template lang="pug">
template(v-if="loading")
	Loading#loading
template(v-else)
	.title-wrap
		h1 {{ currentNewsletter?.subject }}
		span.date {{ convertTimestampToDateMillis(currentNewsletter?.timestamp) }}

	hr

	.content-wrap
		.content(v-html="htmlContent")

	br

	.button-wrap
		button.btn.bg-gray(@click="router.push('/newsletter')") 목록으로
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { skapi } from '@/main';
import { newsletterList } from '@/notifications'
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

	let findNewsletter = newsletterList.value.find((news) => news.message_id === message_id);

	if(findNewsletter) {
		currentNewsletter.value = findNewsletter;
		loading.value = false;
		return currentNewsletter.value;
	} else {
		await skapi.getNewsletters({
			searchFor: 'message_id',
			value: message_id,
			group: 'public'
		}).then((res) => {
			if(res && res.list.length > 0) {
				currentNewsletter.value = res.list[0];
			}

			loading.value = false;
		})
		return currentNewsletter.value;
	}
}

async function fetchHtml(url) {
	loading.value = true;

	try {
		const response = await fetch(url); // 여기에 원하는 URL 입력
		if (!response.ok) {
			loading.value = false;
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const html = await response.text(); // 응답을 텍스트로 변환
		// htmlContent.value = html; // 가져온 HTML을 반응형 변수에 할당
		
		// html 안에 <div dir="ltr"></div> 만 가져오기
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');
		const content = doc.querySelector('div[dir="ltr"]');
		htmlContent.value = content?.innerHTML || '<p>콘텐츠를 불러오는 데 실패했습니다.</p>';
	} catch (error) {
		loading.value = false;
		console.error('HTML을 가져오는 중 오류 발생:', error);
		htmlContent.value = '<p>콘텐츠를 불러오는 데 실패했습니다.</p>';
	}
	loading.value = false;
}

onMounted(async() => {
	await getCurrentNewsletter();
	fetchHtml(currentNewsletter.value?.url);
})
</script>

<style lang="less" scoped>
.title-wrap {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	align-items: flex-end;

	.date {
		font-size: 0.9rem;
		color: var(--gray-color-400);
	}
}

.content {
	min-height: 300px;
}

.button-wrap {
	display: flex;
	justify-content: end;
}
</style>