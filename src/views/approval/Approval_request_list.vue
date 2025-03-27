<template lang="pug">
h1.title 결재 발신함

hr

.table-wrap
	//- .tb-head-wrap
		.input-wrap.search
			input(type="text" name="" placeholder="회원명, 직급, 아이디 검색")
			button.btn-search(type="button")

		.input-wrap
			select
				option(value="") 10개
				option(value="") 20개
				option(value="") 30개

		.tb-toolbar
			.btn-wrap
				button.btn.outline.md(type="button") 등록

	.tb-overflow
		table.table#tb-auditList
			colgroup
				col(style="width: 3rem")
				col
				col(:style="{ width: isDesktop ? '12%' : '24%' }")
				col(v-show="isDesktop" style="width: 10%")
			thead
				tr
					th(scope="col") NO
					th.left(scope="col") 결재 사안
					th(scope="col") 결재 현황
					th(v-show="isDesktop" scope="col") 기안자

			tbody
				template(v-if="fetching")
					tr.nohover.loading
						td(colspan="5")
							Loading#loading
				template(v-else-if="!sendAuditList || !sendAuditList.length")
					tr.nohover
						td(colspan="5") 결재 목록이 없습니다.
				template(v-else)
					tr(v-for="(audit, index) of sendAuditList" :key="audit.user_id" @click.stop="(e) => showSendAuditDoc(e, audit)" style="cursor: pointer;" :class="{ 'canceled': audit.isCanceled }")
						td {{ index + 1 + (10 * (currentPage - 1)) }}
						td.left
							.audit-title {{ audit.data.to_audit }}
						//- td
							span.audit-state(:class="{ approve: audit.referenced_count === ((JSON.parse(audit.data.auditors).approvers?.length || 0) + (JSON.parse(audit.data.auditors).agreers?.length || 0)) }") {{ audit.isCanceled ? '회수됨' : (audit.referenced_count === ((JSON.parse(audit.data.auditors).approvers?.length || 0) + (JSON.parse(audit.data.auditors).agreers?.length || 0)) ? '완료됨' : '진행중') }}
						td
							span.audit-state(:class="{ approve: audit.documentStatus === '완료됨', reject: audit.documentStatus === '반려됨', canceled: audit.documentStatus === '회수됨' }") {{ audit.documentStatus }}
						td.drafter(v-show="isDesktop") {{ user.name }}

.pagination
	button.btn-prev.icon(type="button" @click="currentPage--;" :class="{'nonClickable': fetching || currentPage <= 1 }")
		svg
			use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
		| Prev

	button.btn-next.icon(type="button" @click="currentPage++;" :class="{'nonClickable': fetching || endOfList && currentPage >= maxPage }") Next
		svg
			use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { skapi } from '@/main';
import { user } from '@/user';
import { sendAuditList, sendAuditListRunning, getSendAuditList, goToAuditDetail } from '@/audit';
import { readList, realtimes, readNoti } from '@/notifications';

import Loading from '@/components/loading.vue';
import Pager from '@/components/pager';

const router = useRouter();
const route = useRoute();

const isDesktop = ref(window.innerWidth > 768);
// const currentPageNum = ref(1);
// const totalPages = ref(0);

let pager = null;

const searchFor = ref('uploaded'); // 'uploaded' or 'to_audit'

const fetching = ref(false); // 데이터를 가져오는 중인지 여부
const maxPage = ref(0); // 최대 페이지 수
const currentPage = ref(1); // 현재 페이지
const endOfList = ref(false); // 리스트의 끝에 도달했는지 여부
const ascending = ref(false); // 오름차순 정렬 여부

const updateScreenSize = () => {
  isDesktop.value = window.innerWidth > 768;
};

const showSendAuditDoc = (e, audit) => {
	let searchCurrentAuditNotis = realtimes.value.filter(rt => rt?.audit_info?.audit_doc_id === audit.record_id);

	// 읽지 않은 알람만 필터링
	let unreadNotis = searchCurrentAuditNotis.filter(noti => 
		!Object.keys(readList.value).includes(noti.noti_id)
	);

	// console.log({unreadNotis})

	// 모든 읽지 않은 알람을 병렬로 처리
	Promise.all(unreadNotis.map(noti => readNoti(noti)));

	goToAuditDetail(e, audit.record_id, router)
}

const listDisplay = ref([]);

const getPage = async(refresh = false) => {
	if(refresh) {
        endOfList.value = false;
    }

	if (refresh && searchFor.value) {
        pager = await Pager.init({
            id: 'record_id',
            resultsPerPage: 10,
            sortBy: searchFor.value,
            order: ascending.value ? 'asc' : 'desc',
        });
    }

 	if (!refresh && maxPage.value >= currentPage.value || endOfList.value) {
        // if is not refresh and has page data
        sendAuditList.value = pager.getPage(currentPage.value).list;
		console.log('sendAuditList : ', sendAuditList.value);
        return;
    }

	else if (!endOfList.value || refresh) {
        // if page data needs to be fetched
        fetching.value = true;

        // fetch from server
        // let fetchedData = await skapi.getNewsletters(callParams.value.params, Object.assign({ fetchMore: !refresh }, callParams.value.options));
		let fetchOptions = Object.assign({ fetchMore: !refresh }, { limit: 10, ascending: false })
		let fetchedData = await getSendAuditList(fetchOptions);
		console.log('fetchedData : ', fetchedData);

        // save endOfList status
        endOfList.value = fetchedData.endOfList;

        // insert data in pager
        if (fetchedData.list.length > 0) {
            await pager.insertItems(fetchedData.list);
        }

		console.log('pager : ', pager);
		console.log('currentPage : ', currentPage.value);

        // get page from pager
        let disp = pager.getPage(currentPage.value);
		console.log('disp : ', disp);

        // set maxpage
        maxPage.value = disp.maxPage;

        // render data
        sendAuditList.value = disp.list;
        fetching.value = false;
    }

}

watch(currentPage, (n, o) => {
	console.log('currentPage : ', currentPage.value);
	console.log('n : ', n);
	console.log('o : ', o);
	
    if (
        n !== o &&
        n > 0 &&
        (n <= maxPage.value || (n > maxPage.value && !endOfList.value))
    ) {
        getPage();
    } else {
        currentPage.value = o;
    }
});

onMounted(async () => {
	// await getSendAuditList();
	getPage(true);

	const auditors = sendAuditList.value[0]?.data?.auditors ? JSON.parse(sendAuditList.value[0]?.data?.auditors) : null;

	try {
		const results = await Promise.all(
			sendAuditList.value.map(async (audit) => {
				// console.log('audit : ', audit);
				const response = await skapi.getRecords({
					table: {
						name: 'audit_approval',
						access_group: 'authorized',
					},
					reference: audit.record_id,
				});

				return response;
			})
		);

		return results; // 필요에 따라 반환
	} catch (error) {
		console.error('Error fetching audit records:', error);
		throw error; // 필요에 따라 에러를 다시 던짐
	}
});

onMounted(async () => {
	window.addEventListener('resize', updateScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenSize);
});
</script>

<style scoped lang="less">
.audit-title {
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.audit-state {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 1px 0.4rem;
    border-radius: 6px;
    border: 1px solid var(--gray-color-400);
    color: var(--gray-color-500);
	display: inline-flex;
	justify-content: center;
	align-items: center;

    &.approve {
        color: var(--primary-color-400);
        border-color: var(--primary-color-400);
    }

    &.reject {
        color: var(--warning-color-400);
        border-color: var(--warning-color-400);
    }

	&.canceled {
		color: var(--gray-color-300);
		border-color: var(--gray-color-300);
	}
}

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

.canceled {
	.audit-title,
	.drafter {
		color: var(--gray-color-300);
	}

	.audit-state {
		color: var(--gray-color-300);
		border-color: var(--gray-color-300);
	}
}
</style>