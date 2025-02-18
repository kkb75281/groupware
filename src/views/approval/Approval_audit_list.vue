<template lang="pug">
h1.title {{ currentPage === 'audit-list' ? '결재 수신함' : '수신참조' }}

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
				//- col(style="width: 2.4rem")
				col(style="width: 3rem")
				col
				template(v-if="currentPage === 'audit-list'")
					col(style="width: 12%")
				col(style="width: 12%")
				//- col(style="width: 12%")
				col(style="width: 10%")
			thead
				tr
					//- th(scope="col") 
					//-     label.checkbox
					//-         input(type="checkbox" name="checkbox")
					//-         span.label-checkbox
					th(scope="col") NO
					th.left(scope="col") 결재 사안
					template(v-if="currentPage === 'audit-list'")
						th(scope="col") 나의 현황
					th(scope="col") 결재 현황
					//- th(scope="col") 합의 현황
					th(scope="col") 기안자

			tbody
				template(v-if="auditListRunning")
					tr.nohover.loading
						td(colspan="6")
							Loading#loading
				template(v-else-if="!filterAuditList || !filterAuditList.length")
					tr.nohover
						td(colspan="6") {{ currentPage === 'audit-list' ? '결재 목록이 없습니다.' : '수신참조 목록이 없습니다.' }}
				template(v-else)
					tr(v-for="(audit, index) of filterAuditList" :key="audit.user_id" @click.stop="(e) => showAuditDoc(e, audit)" style="cursor: pointer;" :class="{ 'canceled': audit.isCanceled }" :style="audit.isCanceled ? 'cursor: not-allowed; opacity: 0.6;' : 'cursor: pointer;'")
						//- td 
						//-     label.checkbox
						//-         input(type="checkbox" name="checkbox")
						//-         span.label-checkbox
						td {{ index + 1 }}
						td.left(:class="audit.isCanceled") {{ audit.data.to_audit }}
						template(v-if="currentPage === 'audit-list'")
							td
								span.audit-state(:class="{ approve: audit.my_state === '결재함', reject: audit.my_state === '반려함', canceled: audit.my_state === '회수됨' }") {{ audit.my_state }}
						td
							span.audit-state(:class="{ approve: !audit.isCanceled && audit.referenced_count === ((JSON.parse(audit.data.auditors).approvers?.length || 0) + (JSON.parse(audit.data.auditors).agreers?.length || 0)), canceled: audit.isCanceled }") {{ audit.isCanceled ? '회수됨' : (audit.referenced_count === ((JSON.parse(audit.data.auditors).approvers?.length || 0) + (JSON.parse(audit.data.auditors).agreers?.length || 0)) ? '완료됨' : '진행중') }}
						//- td
							span.audit-state(:class="{ approve: JSON.parse(audit.data.auditors).agreers.length > 0 && audit.referenced_count === JSON.parse(audit.data.auditors).agreers.length }") {{ JSON.parse(audit.data.auditors).agreers.length > 0 && audit.referenced_count === JSON.parse(audit.data.auditors).agreers.length ? '완료됨' : audit.referenced_count + ' / ' + JSON.parse(audit.data.auditors).agreers.length }}
						td {{ audit.user_info?.name }}

</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { onMounted, computed } from 'vue';
import { skapi } from '@/main';
import { user } from '@/user';
import { auditList, auditListRunning, getAuditList, goToAuditDetail } from '@/audit';
import { readList, realtimes, readNoti } from '@/notifications';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

// 현재 페이지가 결재 수신함인지 수신참조인지 구분
const currentPage = computed(() => {
  	return route.path.includes('audit-list') ? 'audit-list' : 'reference';
});

const filterAuditList = computed(() => {
	if (!auditList.value) return [];

	// console.log('=== filterAuditList === auditList.value : ', auditList.value);
	
	return auditList.value.filter(audit => {
		const auditors = JSON.parse(audit.data.auditors);
		// console.log('=== filterAuditList === auditors : ', auditors);

		if (currentPage.value === 'audit-list') {
		// 결재 수신함: approvers나 agreers에 포함된 문서
		return auditors.approvers?.includes(user.user_id.replaceAll('-', '_')) || 
				auditors.agreers?.includes(user.user_id.replaceAll('-', '_'));
		} else {
		// 수신참조함: receivers에 포함된 문서
		return auditors.receivers?.includes(user.user_id.replaceAll('-', '_'));
		}
	});
});

const showAuditDoc = (e:Event, audit: any) => {
	const searchCurrentAuditNoti = realtimes.value.filter(rt => rt.audit_info.audit_doc_id === audit.record_id)[0];
	const checkCurrentAuditNotiRead = Object.keys(readList.value).includes(searchCurrentAuditNoti.noti_id);
	
	if(!checkCurrentAuditNotiRead) {
		readNoti(searchCurrentAuditNoti);
	}

	goToAuditDetail(e, audit.record_id, router);
}

onMounted(async () => {
    await getAuditList();
});
</script>

<style scoped lang="less">
.audit-state {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 1px 0.4rem;
    border-radius: 6px;
    border: 1px solid var(--gray-color-400);
    color: var(--gray-color-500);

    &.approve {
        color: var(--primary-color-400);
        border-color: var(--primary-color-400);
    }

    &.reject {
        color: var(--warning-color-400);
        border-color: var(--warning-color-400);
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
</style>