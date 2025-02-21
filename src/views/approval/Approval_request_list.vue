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
				template(v-if="sendAuditListRunning")
					tr.nohover.loading
						td(colspan="5")
							Loading#loading
				template(v-else-if="!sendAuditList || !sendAuditList.length")
					tr.nohover
						td(colspan="5") 결재 목록이 없습니다.
				template(v-else)
					tr(v-for="(audit, index) of sendAuditList" :key="audit.user_id" @click.stop="(e) => showSendAuditDoc(e, audit)" style="cursor: pointer;" :class="{ 'canceled': audit.isCanceled }")
						td {{ index + 1 }}
						td.left
							.audit-title {{ audit.data.to_audit }}
						td
							span.audit-state(:class="{ approve: audit.referenced_count === ((JSON.parse(audit.data.auditors).approvers?.length || 0) + (JSON.parse(audit.data.auditors).agreers?.length || 0)) }") {{ audit.isCanceled ? '회수됨' : (audit.referenced_count === ((JSON.parse(audit.data.auditors).approvers?.length || 0) + (JSON.parse(audit.data.auditors).agreers?.length || 0)) ? '완료됨' : '진행중') }}
						td.drafter(v-show="isDesktop") {{ user.name }}

</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted } from 'vue';
import { skapi } from '@/main';
import { user } from '@/user';
import { sendAuditList, sendAuditListRunning, getSendAuditList, goToAuditDetail } from '@/audit';
import { readList, realtimes, readNoti } from '@/notifications';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

const isDesktop = ref(window.innerWidth > 768);

const updateScreenSize = () => {
  isDesktop.value = window.innerWidth > 768;
};

let showSendAuditDoc = (e:Event, audit: any) => {
	let searchCurrentAuditNotis = realtimes.value.filter(rt => rt?.audit_info?.audit_doc_id === audit.record_id);

	// 읽지 않은 알람만 필터링
	let unreadNotis = searchCurrentAuditNotis.filter(noti => 
		!Object.keys(readList.value).includes(noti.noti_id)
	);

	console.log({unreadNotis})

	// 모든 읽지 않은 알람을 병렬로 처리
	Promise.all(unreadNotis.map(noti => readNoti(noti)));

	goToAuditDetail(e, audit.record_id, router)
}

onMounted(async () => {
	await getSendAuditList();

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