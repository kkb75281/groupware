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
            .stamp(v-for="approver in auditUserList" :key="approver.user_id")
                span.approver {{ approver.user_info?.name }}
                template(v-if="approver.approved === 'approve'")
                    button.btn.outline.btn-approve(type="button") 완료
                template(v-else-if="approver.approved === 'reject'")
                    button.btn.outline.btn-approve(type="button") 반려
                template(v-else="!approver.approved || approver.approved === null")
                    button.btn.outline.btn-approve(type="button" @click="openModal(approver)") 결재
                
                //- button.btn.outline.btn-approve(v-if="auditDoContent.approved" type="button" @click="openModal") 결제

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
    form.modal-cont(@click.stop @submit.prevent="postApproval")
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
const auditId = route.params.auditId;

const disabled = ref(true);
const auditDoContent = ref([]);
const auditUserList = ref([]);
const isModalOpen = ref(false);

const openModal = (approver) => {
    if (approver && approver.user_id !== user.user_id) return;

    isModalOpen.value = true;
    disabled.value = false;
};

const closeModal = () => {
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

const getUserInfo = async (userId: string) => {
    const params = {
        searchFor: 'user_id',
        value: userId
    }

    return await skapi.getUsers(params)
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

        const approvalUserList = [];
        const newTags = auditDoc.tags.map(a => a.replaceAll('_', '-'))

        newTags.forEach((auditor) => {
            let oa_has_audited_str = null;

            approvals.forEach((approval) => {
                if (approval.user_id === auditor) {
                    oa_has_audited_str = approval.data.approved ? '결제함' : '반려함';

                    const result = {
                        user_id: auditor,
                        approved: approval.data.approved,
                        approved_str: oa_has_audited_str
                    }

                    approvalUserList.push(result);
                    return;
                }
            })

            if (!oa_has_audited_str) {
                const result = {
                    user_id: auditor,
                    approved: null,
                    approved_str: '결제대기중'
                }

                approvalUserList.push(result);
            }
        })

        const userList = await Promise.all(approvalUserList.map(async (auditor) => await getUserInfo(auditor.user_id)))
        const userInfoList = userList.map(user => user.list[0]);                     

        const newAuditUserList = approvalUserList.map((auditor) => ({
            ...auditor,
            user_info: userInfoList.find((user) => user.user_id === auditor.user_id)
        }))

        console.log('newAuditUserList : ', newAuditUserList);
        auditUserList.value = newAuditUserList;
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

// 결재 하기
const postApproval = async (e: SubmitEvent) => {
    e.preventDefault();

    try {
        if (!auditId) return;

        const userId = user.user_id;

        // 결재 하는 요청
        await skapi.postRecord(e, {
            table: {
                name: 'audit_approval',
                access_group: 'authorized'
            },
            reference: auditId,
            tags: [(userId as string).replaceAll('-', '_')], 
        }).then(res => {
            skapi.postRealtime(
                {
                    audit_approval: {
                        audit_doc_id: auditId,
                        approval: res.data.approved
                    }
                },
                userId
            );

            window.alert('결재가 완료되었습니다.');
            closeModal();
            getAuditDetail();
        })
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
        text-align: center;
        border-bottom: 1px solid var(--gray-color-300);
        color: var(--gray-color-500);
        width: 100%;
    }
}

@media (max-width: 768px) {

}
</style>