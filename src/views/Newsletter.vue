<template lang="pug">
.title
	h1 공지사항

hr

.table-wrap
	.tb-head-wrap(v-if="user.access_group > 98")
		.tb-toolbar
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
				template(v-if="getNewsletterListRunning")
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
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { newsletterList, getNewsletterListRunning, getNewsletterList } from '@/notifications'
import { convertTimestampToDateMillis } from "@/utils/time";
import { skapi } from '@/main';
import { user } from '@/user';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

let sendAdminNewsletter = async() => {
	let endpoint = await skapi.adminNewsletterRequest();
	const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${endpoint}`;
    
    window.open(gmailUrl, "_blank"); // 새 탭에서 Gmail 열기

	// console.log(endpoint)
}

onMounted(() => {
	getNewsletterList();
})
</script>

<style lang="less" scoped>
.table-wrap {
    margin-top: 3rem;

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