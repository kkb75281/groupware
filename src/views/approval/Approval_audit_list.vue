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
			col(style="width: 3rem")
			col
			template(v-if="currentPage === 'audit-list'")
				col(:style="{ width: isDesktop ? '12%' : '24%' }")
			col(v-show="isDesktop" style="width: 12%")
			col(v-show="isDesktop" style="width: 10%")
		thead
			tr
				th(scope="col") NO
				th.left(scope="col") 결재 사안
				template(v-if="currentPage === 'audit-list'")
					th(scope="col") 나의 현황
				th(v-show="isDesktop" scope="col") 결재 현황
				th(v-show="isDesktop" scope="col") 기안자

		tbody
			template(v-if="auditListRunning")
				tr.nohover.loading(style="border-bottom: unset;")
					td(colspan="6")
						Loading#loading
			template(v-else-if="!filterAuditList || !filterAuditList.length")
				tr.nohover
					td(colspan="6") {{ currentPage === 'audit-list' ? '결재 목록이 없습니다.' : '수신참조 목록이 없습니다.' }}
			template(v-else)
				tr(v-for="(audit, index) of filterAuditList" :key="audit.user_id" @click.stop="(e) => showAuditDoc(e, audit)" style="cursor: pointer;" :class="{ 'canceled': audit.isCanceled }")
					td {{ filterAuditList.length - index }}
					td.left
						.audit-title {{ audit.data.to_audit }}
					template(v-if="currentPage === 'audit-list'")
						td
							span.audit-state(:class="{ approve: audit.my_state === '결재함', reject: audit.my_state === '반려함', canceled: audit.my_state === '회수됨' }") {{ audit.my_state }}
					td(v-show="isDesktop")
						span.audit-state(:class="{ approve: audit.referenced_count === ((JSON.parse(audit.data.auditors).approvers?.length || 0) + (JSON.parse(audit.data.auditors).agreers?.length || 0)), canceled: audit.isCanceled }") {{ audit.isCanceled ? '회수됨' : (audit.referenced_count === ((JSON.parse(audit.data.auditors).approvers?.length || 0) + (JSON.parse(audit.data.auditors).agreers?.length || 0)) ? '완료됨' : '진행중') }}
					td.drafter(v-show="isDesktop") {{ audit.user_info?.name }}

</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { skapi } from '@/main';
import { user } from '@/user';
import { auditList, auditListRunning, getAuditList, goToAuditDetail } from '@/audit';
import { readList, realtimes, readNoti } from '@/notifications';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

const isDesktop = ref(window.innerWidth > 768);

const updateScreenSize = () => {
  isDesktop.value = window.innerWidth > 768;
};

// 현재 페이지가 결재 수신함인지 수신참조인지 구분
const currentPage = computed(() => {
	return route.path.includes('audit-list') ? 'audit-list' : 'reference';
});

const filterAuditList = computed(() => {
	if (!auditList.value) return [];

	return auditList.value.filter(audit => {
		const auditors = JSON.parse(audit.data.auditors);

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
	// if(audit.isCanceled) return;

	const searchCurrentAuditNoti = realtimes.value.filter(rt => rt.audit_info.audit_doc_id === audit.record_id)[0];
	const checkCurrentAuditNotiRead = Object.keys(readList.value).includes(searchCurrentAuditNoti.noti_id);

	if(!checkCurrentAuditNotiRead) {
		readNoti(searchCurrentAuditNoti);
	}

	goToAuditDetail(e, audit.record_id, router);
}

onMounted(async () => {
	await getAuditList();
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