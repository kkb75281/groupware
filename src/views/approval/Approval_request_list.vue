<template lang="pug">
.title
    h1 결재 목록

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
                    tr(v-for="(audit, index) of auditList" :key="audit.user_id" @click.stop="(e) => goToAuditDetail(e, audit.record_id)" style="cursor: pointer;")
                        //- td 
                        //-     label.checkbox
                        //-         input(type="checkbox" name="checkbox")
                        //-         span.label-checkbox
                        td {{ index + 1 }}
                        td.left {{ audit.data.to_audit }}
                        td
                            span.audit-state(:class="{ approve: audit.approved === '결재함', reject: audit.approved === '반려함' }") {{ audit.approved }}
                        td {{ audit.user_info?.name }}

</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { skapi } from '@/main';
import { user, profileImage, verifiedEmail } from '@/user';

const router = useRouter();
const route = useRoute();

const auditList = ref([]);

const audit_doc_list = {};

// 내가 올린 결재 서류 가져오기
// skapi.getRecords({
//     table: {
//         name: 'audit_doc',
//         access_group: 'private',
//     },
//     reference: user.user_id // 본인 아이디 참조해야 가지고 와짐
// }).then(r => {
//     console.log({r})
// })

// 기안자 정보 가져오기
const getUserInfo = async (userId: string) => {
    const params = {
        searchFor: 'user_id',
        value: userId
    }

    return await skapi.getUsers(params);
}

onMounted(async () => {
    try {
        // 내가 받은 결재 요청건 가져오기
        const audits = await skapi.getRecords({
            table: {
                name: 'audit_request',
                access_group: 'authorized'
            },
            reference: `audit:${user.user_id}`
        }, {
            ascending: false,   // 최신순
        });

        const auditDocs = await Promise.all(audits.list.map(async (list) => {
            // 결재 서류 가져오기
            const audit_doc = (await skapi.getRecords({ 
                record_id: list.data.audit_id 
            })).list[0];

            // 다른 사람 결재 여부 확인
            const approvals = (await skapi.getRecords({
                table: {
                    name: 'audit_approval',
                    access_group: 'authorized'
                },
                reference: list.data.audit_id
            })).list;

            // 결재자 목록에서 각 결재자 ID 가져오기
            const auditors = audit_doc.tags.map(a => a.replaceAll('_', '-'));

            auditors.forEach((auditor) => {
                let oa_has_audited_str = null;

                approvals.forEach((approval) => {
                    if (approval.user_id === user.user_id) {
                        oa_has_audited_str = approval.data.approved === 'approve' ? '결재함' : '반려함';

                        audit_doc.approved = oa_has_audited_str;
                        audit_doc.user_id = auditor;
                        
                        return;
                    }
                })

                if (!oa_has_audited_str) {
                    audit_doc.approved = '대기중';
                    audit_doc.user_id = auditor;
                }
            })
            
            return {
                ...audit_doc,
                draftUserId: list.user_id
            };
        }));

        const userList = await Promise.all(auditDocs.map(async (auditor) => await getUserInfo(auditor.draftUserId)))
        const userInfoList = userList.map(user => user.list[0]).filter((user) => user)

        const newAuditUserList = auditDocs.map((auditor) => ({
            ...auditor,
            user_info: userInfoList.find((user) => user.user_id === auditor.draftUserId)
        }))

        auditList.value = newAuditUserList;        
    } catch (err) {
        console.error({err});
    }
});

// 결재 상세 페이지로 이동
const goToAuditDetail = (e, auditId) => {
    // if(e.target.classList.contains('label-checkbox')) return;
    router.push({ name: 'audit-detail', params: { auditId } });
};
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