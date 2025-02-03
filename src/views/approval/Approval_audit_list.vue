? '완료됨' : '진행중'<template lang="pug">
h1.title 결재 수신함

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
				col(style="width: 12%")
				col(style="width: 12%")
				col(style="width: 12%")
				col(style="width: 10%")
			thead
				tr
					//- th(scope="col") 
					//-     label.checkbox
					//-         input(type="checkbox" name="checkbox")
					//-         span.label-checkbox
					th(scope="col") NO
					th.left(scope="col") 결재 사안
					th(scope="col") 나의 현황
					th(scope="col") 결재 현황
					th(scope="col") 합의 현황
					th(scope="col") 기안자

			tbody
				template(v-if="auditListRunning")
					tr.loading
						td(colspan="6")
							Loading#loading
				template(v-else-if="!auditList || !auditList.length")
					tr.nohover
						td(colspan="6") 결재 목록이 없습니다.
				template(v-else)
					tr(v-for="(audit, index) of auditList" :key="audit.user_id" @click.stop="(e) => goToAuditDetail(e, audit.record_id, router)" style="cursor: pointer;")
						//- td 
						//-     label.checkbox
						//-         input(type="checkbox" name="checkbox")
						//-         span.label-checkbox
						td {{ index + 1 }}
						td.left {{ audit.data.to_audit }}
						td
							span.audit-state(:class="{ approve: audit.my_state === '결재함', reject: audit.my_state === '반려함' }") {{ audit.my_state }}
						td
							span.audit-state(:class="{ approve: audit.referenced_count === JSON.parse(audit.data.auditors).approvers.length }") {{ audit.referenced_count === JSON.parse(audit.data.auditors).approvers.length ? '완료됨' : audit.referenced_count + ' / ' + JSON.parse(audit.data.auditors).approvers.length }}
						td
							span.audit-state(:class="{ approve: JSON.parse(audit.data.auditors).agreers.length > 0 && audit.referenced_count === JSON.parse(audit.data.auditors).agreers.length }") {{ JSON.parse(audit.data.auditors).agreers.length > 0 && audit.referenced_count === JSON.parse(audit.data.auditors).agreers.length ? '완료됨' : audit.referenced_count + ' / ' + JSON.parse(audit.data.auditors).agreers.length }}
						td {{ audit.user_info?.name }}

</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, watch } from 'vue';
import { skapi } from '@/main';
import { user, profileImage, verifiedEmail } from '@/user';
import { auditListRunning, auditList, sendAuditList, goToAuditDetail, getAuditList } from '@/notifications';
import type { Ref } from 'vue';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

const audit_doc_list = {};

onMounted(async () => {
    await getAuditList();
});

// 결재 상세 페이지로 이동
// const goToAuditDetail = (e, auditId) => {
//     // if(e.target.classList.contains('label-checkbox')) return;
//     router.push({ name: 'audit-detail', params: { auditId } });
// };
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