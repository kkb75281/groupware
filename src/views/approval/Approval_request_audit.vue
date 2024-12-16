<template lang="pug">
.title
    h1 결재 요청

hr

.form-wrap
    form#_el_request_form(@submit.prevent="requestAudit")
        .input-wrap
            p.label.essential 결재 사안
            input#to_audit(type="text" placeholder="결재 사안" required)

        br

        .input-wrap
            p.label 결재 내용
            textarea#inp_content(type="text" placeholder="결재 내용")

        br

        .input-wrap
            p.label.essential 결재자

            .table-wrap
                .tb-overflow
                    table.table#same_division_auditors
                        thead
                            tr
                                th NO
                                th 직급
                                th 이름
                                th 부서
                                th 결재자 여부

                        tbody
                            tr(v-for="(auditor, index) in same_division_auditors")
                                td {{ index + 1 }}
                                td {{ auditor.index.name.split('.')[1] }}
                                td {{ auditor.index.value }}
                                td {{ divisionNameList[auditor.index.name.split('.')[0]] }}
                                td
                                    label.checkbox
                                        input(type="checkbox" name="checkbox" :value="auditor.user_id" @change="checkAuditor(auditor.data.user_id)")
                                        span.label-checkbox

            //- input#inp_auditors(type="text" placeholder="결재자1, 결재자2, ..." required)
        
        br

        .button-wrap
            button.btn(type="submit") 결재요청

</template>

<script setup lang="ts">
import { ref } from 'vue';
import { skapi } from '@/main';
import { user } from '@/user';
import { divisionNameList, getDivisionNames } from '@/division'

let user_division_name = ref('');
let same_division_auditors = ref({});
let send_auditors = [];

getDivisionNames();

let getSameDivisionPeople = async () => {
    const wholeEmps = await skapi.getRecords({
        table: {
            name: 'emp_position_current',
            access_group: 1
        }
    });

    let wholeEmpsList = wholeEmps.list;

    for(let emp of wholeEmpsList) {
        if (emp.user_id === user.user_id) {
            user_division_name.value = emp.index.name.split('.')[0];
            break;
        }
    }

    same_division_auditors.value = wholeEmpsList.filter((emp) => {
        if (emp.index.name.split('.')[0] === user_division_name.value) {
            return emp;
        }
    });

    console.log(same_division_auditors.value)
}
getSameDivisionPeople();

// 결재자 체크 박스
let checkAuditor = (user_id) => {
    if (send_auditors.includes(user_id)) {
        send_auditors = send_auditors.filter(auditor => auditor !== user_id);
    } else {
        send_auditors.push(user_id);
    }

    console.log(send_auditors);
}

// 결재 요청
let requestAudit = async (e) => {
    e.preventDefault();

    if(send_auditors.length === 0) {
        alert('결재자를 1명 이상 선택해주세요.');
        return;
    }

    let to_audit_content = inp_content.value;

    // 결재 서류 업로드
    let audit_doc = await skapi.postRecord(
        {
            to_audit: to_audit.value, // 결제 사안 제목
            send_auditors, // 결제자 목록
            to_audit_content, // 결재 내용
            // ... 기타 등등 데이터
        },
        {
            readonly: true, // 결제 올리면 수정할수 없음. 수정하려면 새로 올려야 함. 이것은 교묘히 수정할 수 없게 하는 방법
            table: {
                name: 'audit_doc',
                access_group: 'private', // 프라빗으로 올려야 결제자만 접근 가능
            },
            index: {
                name: 'to_audit', // 결제 사안 제목. 제목별로 찾을때 위한 인덱싱
                value: to_audit.value,
            },
            source: {
                prevent_multiple_referencing: true, // 중복 결제 방지
            },
            tags: send_auditors.map(u => u.replaceAll('-', '_')) // 결제자 태그, 나중에 결제자 별로 찾을 때 사용
        }
    );
    
    // 결제 요청 서류 record_id
    let audit_id = audit_doc.record_id;

    let sendRequest = [];

    for (let i = 0; i < send_auditors.length; i++) {
        sendRequest.push( // 각각 결제자에게 결제 서류 접근 권한 부여
            skapi.grantPrivateRecordAccess({
                record_id: audit_id,
                user_id: send_auditors[i]
            })
        );

        sendRequest.push(
            // 각각 결제자에게 결제 창구 보내기
            skapi.postRecord(
                {
                    audit_id, // 결제 요청 서류 record_id
                    auditor: send_auditors[i], // 결제자
                },
                {
                    unique_id: `audit_request:${audit_id}:${send_auditors[i]}`,
                    readonly: true,
                    table: {
                        name: 'audit_request',
                        access_group: 'authorized', // 결제 요청 목록은 공개
                    },
                    reference: `audit:${send_auditors[i]}`, // 각 결제자에게게 결제 창구

                    tags: [audit_id]
                }
            ).then(res => {
                skapi.grantPrivateRecordAccess( // 결제자에게 결제 요청 record에도 접근 권한 부여해야 reference(결제) 가능
                    {
                        record_id: res.record_id,
                        user_id: res.data.auditor
                    }
                );

                skapi.postRealtime(  // realtime으로 결제 요청 알림
                    {
                        audit_request: {
                            audit_request_id: res.record_id,
                            send_auditors
                        }
                    },
                    send_auditors[i]
                );

                return res;
            })
        )
    }

    await Promise.all(sendRequest);

    alert('결제 요청이 완료되었습니다.');
}
</script>

<style scoped lang="less">
// #same_division_auditors {
//     margin: 1rem 0;
// }
</style>