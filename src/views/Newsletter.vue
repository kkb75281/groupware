<template lang="pug">
.title
	h1 공지사항

hr

.table-wrap
	.tb-head-wrap(v-if="user.access_group > 98")
		form#searchForm(@submit.prevent="searchNewsletter")
			.input-wrap.what
				select(v-model="searchFor" :disabled="loading || !newsletterList")
					option(value="subject") 제목
					//- option(value="timestamp") 작성일
					//- option(value="message_id") 
					//- option(value="read") 
					//- option(value="complaint") 
			.input-wrap.search(v-if="searchFor == 'subject'")
				input(v-model="searchValue.subject" type="text" placeholder="검색어를 입력하세요" :disabled="loading || !newsletterList")
				button.btn-search
			.input-wrap.date(v-else-if="searchFor == 'timestamp'")
				input(v-model="searchValue.timestamp.start" type="date" :disabled="loading || !newsletterList")
				span ~
				input(v-model="searchValue.timestamp.end" type="date" :disabled="loading || !newsletterList")
		.tb-toolbar(v-if="user.access_group > 98")
			.btn-wrap
				button.btn.outline.refresh-icon(:disabled="loading" @click="getNewsletterList(true)")
					svg(:class="{'rotate' : loading}")
						use(xlink:href="@/assets/icon/material-icon.svg#icon-refresh")
				button.btn.outline.md(type="button" @click="sendAdminNewsletter") 등록
	.tb-overflow
		table.table#newsletter_list
			colgroup
				col(style="width:5%")
				col(style="width: 50%")
				col(style="width: 10%")
			thead
				tr
					th NO
					th.left 제목
					th 작성일
			tbody
				template(v-if="loading")
					tr.nohover.loading
						td(colspan="10")
							Loading#loading
				template(v-else-if="!newsletterList || newsletterList.length === 0")
					tr.nohover
						td(colspan="4") 등록된 공지사항이 없습니다.
				template(v-else)
					tr.hover(v-for="(news, index) in newsletterList" :key="news.message_id" @click="router.push('/newsletter-detail/' + news.message_id)")
						td {{ newsletterList.length - index }}
						td.left {{ news.subject }}
						td {{ convertTimestampToDateMillis(news.timestamp) }}
</template>

<script lang="ts" setup>
import { type Ref, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { newsletterList, getNewsletterList } from '@/notifications'
import { convertTimestampToDateMillis } from "@/utils/time";
import { skapi } from '@/main';
import { user } from '@/user';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

let loading = ref(false);
let searchFor: Ref<"subject" | "timestamp" | "message_id" | "read" | "complaint"> = ref('subject');
let searchValue: Ref<{
	subject: string;
	timestamp: {
		start: string;
		end: string;
	}
}> = ref({
	subject: '',
	timestamp: {
		start: '',
		end: ''
	}
});

let searchNewsletter = async() => {
	loading.value = true;

	if(searchValue.value.subject === '') {
		await getNewsletterList(true);
		loading.value = false;
		return;
	}

	let params = {
		searchFor: searchFor.value,
		value: '',
		group: 'public',
		condition: '>='
	};

	if(searchFor.value === 'subject') {
		params.value = searchValue.value.subject;
	} else {
		params.value = searchValue.value.timestamp.start;
	}

	let res = await skapi.getNewsletters(params);

	if(res && res.list.length > 0) {
		newsletterList.value = res.list;
	} else {
		newsletterList.value = [];
	}

	loading.value = false;

	// if(searchValue.value.subject === '') {
	// 	await getNewsletterList(true);
	// 	loading.value = false;
	// } else {
	// 	newsletterList.value = newsletterList.value.filter((news: any) => {
	// 		return news.subject.includes(searchValue.value);
	// 	});
	// 	loading.value = false;
	// }
}

let sendAdminNewsletter = async() => {
	let endpoint = await skapi.adminNewsletterRequest();

    // Gmail 앱용 딥 링크
    const gmailAppUrlIOS = `googlegmail:///co?to=${endpoint}`;
    const gmailAppUrlAndroid = `intent://co?to=${endpoint}#Intent;scheme=googlegmail;package=com.google.android.gm;end`;
    // 웹용 Gmail 링크
    const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${endpoint}`;

    try {
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            // iOS: Gmail 앱 딥 링크 호출
            window.location.href = gmailAppUrlIOS;
        } else if (/Android/i.test(navigator.userAgent)) {
            // Android: Gmail 앱 딥 링크 호출
            const fallbackTimeout = 1000; // 1초 대기 시간
            let appOpened = false;

            // Gmail 앱 딥 링크 호출
            window.location.href = gmailAppUrlAndroid;

            // Gmail 앱이 열리지 않으면 웹 버전으로 폴백
            setTimeout(() => {
                if (!appOpened) {
                    console.log("Gmail app not opened, redirecting to web version...");
                    window.open(gmailWebUrl, "_blank");
                }
            }, fallbackTimeout);

            // Gmail 앱이 열렸는지 확인 (사용자 정의 플래그)
            window.addEventListener("blur", () => {
                appOpened = true;
            });
        } else {
            // 기타 플랫폼에서는 웹 버전으로 이동
            window.open(gmailWebUrl, "_blank");
        }
    } catch (error) {
        console.error("Failed to open Gmail app, redirecting to web version...", error);
        // 에러 발생 시 웹 버전으로 이동
        window.open(gmailWebUrl, "_blank");
    }

	// let endpoint = await skapi.adminNewsletterRequest();
	// const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${endpoint}`;
    
    // window.open(gmailUrl, "_blank"); // 새 탭에서 Gmail 열기
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

		if(nv === 'timestamp') {
			searchValue.value.timestamp.start = new Date().toISOString().substring(0, 10);
			searchValue.value.timestamp.end = new Date().toISOString().substring(0, 10);
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