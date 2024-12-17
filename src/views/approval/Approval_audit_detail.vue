<template lang="pug">
.title
    h1 결재

hr

//- <input type="text" id="audit_record_id" placeholder="결제서류id" required>

//- <label>
//- 	결제/반려:
//- 	<input type="checkbox" name="approved">
//- </label>

//- <input type="submit" value="확인">

.form-wrap
    form#_el_approved_form(@submit.prevent="approvedAudit")
        .stamp-wrap
            p.label 결재
            .stamp
                span.approver 1
            .stamp
                span.approver 2
            .stamp
                span.approver 3

        .input-wrap
            p.label 제목
            input(type="text" readonly)

        .input-wrap
            p.label 기안자
            input(type="text" readonly)

        .input-wrap
            p.label 내용
            input(type="text" readonly)

        .button-wrap
            button.btn.bg-gray.btn-cancel(type="button" @click="cancelEdit") 반려
            button.btn.btn-register(type="submit" @click="registerEmp") 승인

</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { skapi } from '@/main';
import { user } from '@/user';

const router = useRouter();
const route = useRoute();
const auditId = route.params.id;

let disabled = ref(true);
const auditDocList = ref([]);

// 다른 사람 결제 여부 확인
const approvedAudit = async () => {
    try {
        const res = await skapi.getRecords({
            table: {
                name: 'audit_approval',
                access_group: 'authorized'
            },
            reference: auditId
        })

        return res.list;
    } catch (error) {
        console.error(error);
    }
}

// 결제 서류 가져오기
const getAuditDetail = async () => {
    try {
        const auditDoc = (await skapi.getRecords({
            record_id: auditId
        })).list[0];

        if (auditDoc) {
            auditDocList.value = auditDoc;
        }

        const approvals = await approvedAudit();

        console.log('== auditDoc ', auditDoc);
        console.log('== approvals ', approvals);

        let oa_has_audited_str = '';

        for (let auditor of auditDoc.tags.map(a => a.replaceAll('_', '-'))) { // audit_doc.tags: 결제자 목록
            let oa_has_audited_str = null;

            for (let approval of approvals) {
                if (approval.user_id === auditor) {
                    oa_has_audited_str = approval.data.approved ? '결제함' : '반려함';
                    // audit_requests.innerHTML += `---${auditor}:${oa_has_audited_str}---\n`; // 결제 서류 화면에 보여주기
                    break;
                }
            }
            if (!oa_has_audited_str) {
                // audit_requests.innerHTML += `---${auditor}:결제대기중---\n`; // 결제 서류 화면에 보여주기
            }
        }

        // audit_requests.innerHTML += JSON.stringify(auditDoc, null, 2) + '\n'; // 결제 서류 화면에 보여주기
    } catch (error) {
        console.error(error);
    }
}

onMounted(() => {
    getAuditDetail();
});

</script>

<style scoped lang="less">
.wrap {
    padding: 3rem 2.4rem 0;
}

.title {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 1rem;

    span {
        color: var(--gray-color-400);
        line-height: 1.4;
    }
}

.stamp-wrap {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;

    .stamp {
        width: 4rem;
        height: 4rem;
        border: 1px solid var(--gray-color-300);
    }

    .approver {
        display: inline-block;
        border-bottom: 1px solid var(--gray-color-300);
        color: var(--gray-color-500);
        width: 100%;
    }
}

@media (max-width: 768px) {

}
</style>