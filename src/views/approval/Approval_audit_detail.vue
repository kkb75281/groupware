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
    form#_el_approved_form
        .stamp-wrap
            p.label 결재
            .stamp
                span.approver 1
                template(v-if="auditDoContent.approved")
                    button.btn.outline.btn-approve(type="button" @click="openModal") 결제
                template(v-else)
                    button.btn.outline.btn-approve(type="button" @click="openModal") 완료
                //- button.btn.outline.btn-approve(v-if="auditDoContent.approved" type="button" @click="openModal") 결제
            .stamp
                span.approver 2
            .stamp
                span.approver 3

        h3.audit-title(v-if="auditDoContent.data?.to_audit") {{ auditDoContent.data.to_audit }}

        br

        //- p.drafter(v-if="auditDoContent?.record_id") {{ auditDoContent.record_id }}

        p.audit-content(v-if="auditDoContent.data?.to_audit_content") {{ auditDoContent.data.to_audit_content }}

        br
        br
        br

        .button-wrap
            button.btn.bg-gray.btn-cancel(type="button" @click="$router.push('/approval/audit-list')") 이전
            //- button.btn.warning.btn-cancel(type="button" @click="rejectAudit") 반려
            //- button.btn.btn-register(type="submit" @click="approveAudit") 승인

//- 결재 모달
#modal.modal(v-if="isModalOpen")
    form.modal-cont(@click.stop @submit.prevent="approvedAudit")
        .modal-header
            h2.modal-title 결재
            button.btn-close(@click="closeModal")
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
        .modal-body
            label.radio-button
                input(type="radio" name="approved" value="reject" checked)
                span.label-radio 반려
            label.radio-button
                input(type="radio" name="approved" value="approve")
                span.label-radio 결재
        .modal-footer
            button.btn.btn-edit(type="submit") 확인


</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { skapi } from '@/main';
import { user } from '@/user';

const router = useRouter();
const route = useRoute();

const disabled = ref(true);
const auditDoContent = ref([]);
let isModalOpen = ref(false);
const auditId = route.params.auditId;

let openModal = () => {
    isModalOpen.value = true;
    disabled.value = false;
};

let closeModal = () => {
    isModalOpen.value = false;
    disabled.value = true;
};

// 다른 사람 결재 여부 확인
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
    
    isModalOpen.value = false;
}

// 결재 서류 가져오기
const getAuditDetail = async () => {
    try {
        const auditDoc = (await skapi.getRecords({
            record_id: auditId
        })).list[0];

        if (auditDoc) {
            auditDoContent.value = auditDoc;
        }
        
        const approvals = await approvedAudit();

        console.log('=== approvals === ', approvals);
        console.log('=== auditDoc === ', auditDoc.tags);

        let auditor = auditDoc.tags[0].replaceAll('_', '-');

        let oa_has_audited_str = null;

        if(approvals[0].user_id === auditor) {
            oa_has_audited_str = approvals[0].data.approved ? '결제함' : '반려함';
            auditDoContent.value.approved = approvals[0].data.approved;
            // console.log('== auditDoContent.value == ', auditDoContent.value);
        }



        // let oa_has_audited_str = '';

        // for (let auditor of auditDoc.tags.map(a => a.replaceAll('_', '-'))) { // audit_doc.tags: 결제자 목록
        //     console.log('== auditDoc.tags == ', auditDoc.tags);
        //     console.log('== auditor == ', auditor);

        //     let oa_has_audited_str = null;

        //     for (let approval of approvals) {
        //         console.log('== approval == ', approval);

        //         if (approval.user_id === auditor) {
        //             oa_has_audited_str = approval.data.approved ? '결제함' : '반려함';
        //             console.log('== oa_has_audited_str == ', oa_has_audited_str);
        //             // audit_requests.innerHTML += `---${auditor}:${oa_has_audited_str}---\n`; // 결제 서류 화면에 보여주기
        //             auditDoContent.value.approved = approval.data.approved;
        //             console.log('== auditDoContent.value == ', auditDoContent.value);
        //             break;
        //         }
        //     }
        //     if (!oa_has_audited_str) {
        //         // audit_requests.innerHTML += `---${auditor}:결제대기중---\n`; // 결제 서류 화면에 보여주기
        //     }
        // }

        // audit_requests.innerHTML += JSON.stringify(auditDoc, null, 2) + '\n'; // 결제 서류 화면에 보여주기
    } catch (error) {
        console.error(error);
    }
}

// 결재 반려
// const rejectAudit = () => {
//     console.log('rejectAudit');
// }

// 결재 승인
// const approveAudit = () => {
//     console.log('approveAudit');
// }

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
        text-align: center;
        border-bottom: 1px solid var(--gray-color-300);
        color: var(--gray-color-500);
        width: 100%;
    }
}

@media (max-width: 768px) {

}
</style>