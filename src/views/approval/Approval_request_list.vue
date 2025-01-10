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
				//- col(style="width: 2.4rem")
				col(style="width: 3rem")
				col
				col(style="width: 20%")
				col(style="width: 10%")
			thead
				tr
					//- th(scope="col") 
					//-     label.checkbox
					//-         input(type="checkbox" name="checkbox")
					//-         span.label-checkbox
					th(scope="col") NO
					th.left(scope="col") 결재 사안
					th(scope="col") 결재 현황
					th(scope="col") 기안자

			tbody
				template(v-if="sendAuditList.length")
					tr(v-for="(audit, index) of sendAuditList" :key="audit.user_id" @click.stop="(e) => goToAuditDetail(e, audit.record_id, router)" style="cursor: pointer;")
						//- td 
						//-     label.checkbox
						//-         input(type="checkbox" name="checkbox")
						//-         span.label-checkbox
						td {{ index + 1 }}
						td.left {{ audit.data.to_audit }}
						td
							span.audit-state(:class="{ approve: audit.approved === '결재함', reject: audit.approved === '반려함' }") {{ audit.referenced_count + ' / ' + audit.data.auditors.length }}
						td {{ user.name }}
				template(v-else)
					tr.nohover
						td(colspan="4") 결재 목록이 없습니다.

</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { skapi } from '@/main';
import { user, profileImage, verifiedEmail } from '@/user';
import { sendAuditList, getSendAuditList, goToAuditDetail } from '@/notifications';

const router = useRouter();
const route = useRoute();

// const auditList = ref([]);

const audit_doc_list = {};

// 기안자 정보 가져오기
const getUserInfo = async (userId: string) => {
    const params = {
        searchFor: 'user_id',
        value: userId
    }

    return await skapi.getUsers(params);
}

onMounted(async () => {
	await getSendAuditList();

	console.log('!!!!!sendAuditList', sendAuditList.value);


	try {
		const results = await Promise.all(
			sendAuditList.value.map(async (audit) => {
				console.log('!!!!!audit', audit);
				const response = await skapi.getRecords({
					table: {
						name: 'audit_approval',
						access_group: 'authorized',
					},
					reference: audit.record_id,
				});

				console.log('!!!!!rerere', response);
				return response;
			})
		);

		console.log('All audit records fetched:', results);
		return results; // 필요에 따라 반환
	} catch (error) {
		console.error('Error fetching audit records:', error);
		throw error; // 필요에 따라 에러를 다시 던짐
	}
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
</style>