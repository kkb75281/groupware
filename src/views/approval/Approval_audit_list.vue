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
                    col(style="width: 2.4rem")
                    col(style="width: 3rem")
                    col
                    col(style="width: 10%")
                thead
                    tr
                        th(scope="col") 
                            label.checkbox
                                input(type="checkbox" name="checkbox")
                                span.label-checkbox
                        th(scope="col") NO
                        th.left(scope="col") 결재 서류
                        th(scope="col") 결재 현황

                tbody
                    tr(v-for="(audit, index) of auditList")
                        td 
                            label.checkbox
                                input(type="checkbox" name="checkbox")
                                span.label-checkbox
                        td {{ index + 1 }}
                        td.left {{ audit.data.to_audit }}
                        td {{ audit.data.approved }}

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
skapi.getRecords({
    table: {
        name: 'audit_doc',
        access_group: 'private',
    },
    reference: user.user_id // 본인 아이디 참조해야 가지고 와짐
}).then(r => {
    console.log({r})
})

onMounted(async () => {
    let audits = await skapi.getRecords( // 내가 결제해야할 결제 요청 가져오기
        {
            table: {
                name: 'audit_request',
                access_group: 'authorized'
            },
            reference: `audit:${user.user_id}`
        },
        {
            ascending: false, // 최신순
        }
    );

    console.log('audits.list : ', audits.list);

    // auditList.value = audits.list;


    for (let a of audits.list) {
        console.log('a : ', a);

        // 결제 서류 가져오기
        let audit_doc = (await skapi.getRecords({
            record_id: a.data.audit_id
        })).list[0];

        // console.log('audit_doc : ', audit_doc);

        

        // console.log('auditList.value : ', auditList.value);

        // audit_doc_list[audit_doc.record_id] = audit_doc; // 결제 서류 저장

        // console.log('audit_doc_list : ', audit_doc_list);

        // 다른 사람 결제 여부 확인
        let approvals = (await skapi.getRecords({
            table: {
                name: 'audit_approval',
                access_group: 'authorized'
            },
            reference: a.data.audit_id
        })).list;

        console.log('approvals : ', approvals);

        audit_doc.approved = approvals;

        auditList.value.push(audit_doc); // 결제 서류 저장

        console.log('audit_doc : ', audit_doc);

        let oa_has_audited_str = '';

        for (let auditor of audit_doc.tags.map(a => a.replaceAll('_', '-'))) { // audit_doc.tags: 결제자 목록
            console.log('auditor : ', auditor);

            let oa_has_audited_str = null;

            // console.log('approvals : ', approvals);

            for (let approval of approvals) {
                // console.log('approval : ', approval);

                if (approval.user_id === auditor) {
                    oa_has_audited_str = approval.data.approved ? '결제함' : '반려함';
                    // auditList.value += `---${auditor}:${oa_has_audited_str}---\n`; // 결제 서류 화면에 보여주기
                    // auditList.value += audit_doc.data.to_audit;
                    break;
                }
            }

            if (!oa_has_audited_str) {
                // auditList.value += `---${auditor}:결제대기중---\n`; // 결제 서류 화면에 보여주기
            }
        }

        // auditList.value += JSON.stringify(audit_doc, null, 2) + '\n'; // 결제 서류 화면에 보여주기
        // auditList.value += `\n--- ${JSON.stringify(audit_doc, null, 2)} ---`;
    }
});
</script>

<style scoped lang="less">

</style>