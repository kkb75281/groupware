<template lang="pug">
.title
	h1 공지사항

hr

.table-wrap
	.tb-head-wrap(v-if="user.access_group > 98")
		form#searchForm(@submit.prevent="searchNewsletter")
			.input-wrap.what
				select(v-model="searchFor" :disabled="loading || !newsletterList || newsletterList.length === 0")
					option(value="subject") 제목
					option(value="timestamp") 작성일
					//- option(value="message_id") 
					//- option(value="read") 
					//- option(value="complaint") 
			.input-wrap.search(v-if="searchFor == 'subject'")
				input(v-model="searchValue.subject" type="text" placeholder="검색어를 입력하세요" :disabled="loading || !newsletterList || newsletterList.length === 0")
				button.btn-search
			.input-wrap.date(v-else-if="searchFor == 'timestamp'")
				input(v-model="searchValue.timestamp.start" type="date" :disabled="loading || !newsletterList || newsletterList.length === 0")
				span ~
				input(v-model="searchValue.timestamp.end" type="date" :disabled="loading || !newsletterList || newsletterList.length === 0")
		.tb-toolbar(v-if="user.access_group > 98")
			.btn-wrap
				button.btn.outline.md(type="button" @click="sendAdminNewsletter") 등록
	.tb-overflow
		table.table#newsletter_list
			colgroup
				col(style="width: 5%")
				col(style="width: 50%")
				col(style="width: 10%")
			thead
				tr
					th NO
					th 제목
					th 작성일
			tbody
				template(v-if="loading")
					tr.loading
						td(colspan="10")
							Loading#loading
				template(v-else-if="!newsletterList || newsletterList.length === 0")
					tr.nohover
						td(colspan="4") 등록된 공지사항이 없습니다.
				template(v-else)
					tr.hover(v-for="(news, index) in newsletterList" :key="news.message_id" @click="router.push('/newsletter-detail/' + news.message_id)")
						td {{ index + 1 }}
						td {{ news.subject }}
						td {{ convertTimestampToDateMillis(news.timestamp) }}
</template>

<script lang="ts" setup>
import { type Ref, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { newsletterList, getNewsletterListRunning, getNewsletterList } from '@/notifications'
import { convertTimestampToDateMillis } from "@/utils/time";
import { skapi } from '@/main';
import { user } from '@/user';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

let loading = ref(false);
let searchFor: Ref<"subject" | "timestamp" | "message_id" | "read" | "complaint"> = ref('subject');
let searchValue = ref({
	subject: '',
	timestamp: {
		start: '',
		end: ''
	}
});

let searchNewsletter = async() => {
	// loading.value = true;

	console.log(searchValue.value);

	// await skapi.getNewsletters({
	// 	searchFor: 'message_id' | 'timestamp' | 'read' | 'complaint' | 'subject';
    //     value: string | number;
    //     group: 'public' | 'authorized' | number;
    //     range?: string | number;
	// })

	// if(searchValue.value === '') {
	// 	await getNewsletterList();
	// 	searching.value = false;
	// } else {
	// 	newsletterList.value = newsletterList.value.filter((news: any) => {
	// 		return news.subject.includes(searchValue.value);
	// 	});
	// 	searching.value = false;
	// }
}

let sendAdminNewsletter = async() => {
	let endpoint = await skapi.adminNewsletterRequest();
	const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${endpoint}`;
    
    window.open(gmailUrl, "_blank"); // 새 탭에서 Gmail 열기

	// console.log(endpoint)
}

watch(searchFor, (nv, ov) => {
	if(nv && nv !== ov) {
		searchValue.value = {
			subject: '',
			timestamp: {
				start: '',
				end: ''
			}
		}
	}
})

onMounted(async() => {
	loading.value = true;
	await getNewsletterList();
	loading.value = false;
})
</script>

<style lang="less" scoped>
.table-wrap {
    margin-top: 3rem;

	#searchForm {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

		.what {
			flex: 1;
			min-width: 100px;
		}
		.date {
			flex: 1;
			display: flex;
			align-items: center;
			gap: 8px;
		}
    }

	.loading {
		position: relative;
		border-bottom: unset;

		#loading {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
		}
	}
}
</style>