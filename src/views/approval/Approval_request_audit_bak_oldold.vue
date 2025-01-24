<template lang="pug">
.title
    h1 결재 요청

hr

.form-wrap
    form#_el_request_form(@submit.prevent="requestAudit")
        .input-wrap
            p.label.essential 결재 사안
            input#to_audit(type="text" placeholder="결재 사안" required name="to_audit")

        br

        .input-wrap
            p.label 결재 내용
            textarea#inp_content(type="text" placeholder="결재 내용" name="inp_content")

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
import { useRoute, useRouter } from 'vue-router';
import { onMounted, ref } from 'vue';
import { skapi } from '@/main';
import { user, makeSafe } from '@/user';
import { divisionNameList, getDivisionNames } from '@/division'

const router = useRouter();
const route = useRoute();

let user_division_name = ref('');
let same_division_auditors = ref({});
let send_auditors = [];

const toAuditContent = ref('');

const getWholeEmps = async () => {
    const wholeEmps = await skapi.getRecords({
        table: {
            name: 'emp_position_current',
            access_group: 1
        }
    });

    return wholeEmps.list;
}

const getUserEmp = async () => {
    const userEmp = await skapi.getRecords({
        table: {
            name: 'emp_position_current',
            access_group: 1
        },
        unique_id: "[emp_position_current]" + makeSafe(user.user_id)
    })

    return userEmp.list[0];
}

const getSameDivisionPeople = async () => {
    try {
        const wholeEmpsList = await getWholeEmps();
        const userEmp = await getUserEmp();

        user_division_name.value = userEmp.index.name.split('.')[0];

        same_division_auditors.value = wholeEmpsList.filter((emp) => {
            if (emp.index.name.split('.')[0] === user_division_name.value) {
                return emp;
            }
        });

        // console.log(same_division_auditors.value)
    } catch (error) {
        console.error(error);
    }
}

// 결재자 체크 박스
const checkAuditor = (userId: string) => {
    if (send_auditors.includes(userId)) {
        send_auditors = send_auditors.filter(auditor => auditor !== userId);
    } else {
        send_auditors.push(userId);
    }
}

// 결재 서류 업로드
const postAuditDoc = async ({ to_audit, to_audit_content }) => {
	console.log('결재 서류 === postAuditDoc; send_auditors : ', send_auditors);
    try {

        const params = {
            to_audit, // 결재 사안 제목
            auditors: send_auditors, // 결재자 목록
            to_audit_content, // 결재 내용
        }

        const options = {
            readonly: true, // 결재 올리면 수정할수 없음. 수정하려면 새로 올려야 함. 이것은 교묘히 수정할 수 없게 하는 방법
            table: {
                name: 'audit_doc',
                access_group: 'private', // 프라빗으로 올려야 결재자만 접근 가능
            },
            index: {
                name: 'to_audit', // 결재 사안 제목. 제목별로 찾을때 위한 인덱싱
                value: to_audit.replaceAll('.', '_'),
            },
            source: {
                prevent_multiple_referencing: true, // 중복 결재 방지
            },
            tags: send_auditors.map(u => u.replaceAll('-', '_')) // 결재자 태그, 나중에 결재자 별로 찾을 때 사용
        }

		console.log('결재 서류 === postAuditDoc; params : ', params);
		console.log('결재 서류 === postAuditDoc; options : ', options);

        // const res = await skapi.postRecord(params, options);

        // console.log('결재 서류 === postAuditDoc; postRecord === res : ', res);

        // return res;


    } catch (error) {
        console.error(error);
    }
}

// 결재자에게 권한을 부여하는 함수
const grantAuditorAccess = async ({ audit_id, auditor_id }) => {
  return skapi.grantPrivateRecordAccess({
    record_id: audit_id,
    user_id: auditor_id
  });
};

// 결재 요청을 생성하고 알림을 보내는 함수
const createAuditRequest = async ({ audit_id, auditor_id }, send_auditors) => {
  const res = await skapi.postRecord(
    {
      audit_id,
      auditor: auditor_id,
    },
    {
      unique_id: `audit_request:${audit_id}:${auditor_id}`,
      readonly: true,
      table: {
        name: 'audit_request',
        access_group: 'authorized',
      },
      reference: `audit:${auditor_id}`,
      tags: [audit_id]
    }
  ).then(res => {
    console.log('요청1 === postRecord === res : ', res);
    return res;
  });

  // 결재자에게 접근 권한 부여
  await skapi.grantPrivateRecordAccess({
    record_id: res.record_id,
    user_id: res.data.auditor
  });

  // 실시간 알림 전송
  await skapi.postRealtime(
    {
      audit_request: {
        audit_request_id: res.record_id,
        send_auditors
      }
    },
    auditor_id
  ).then(res => {
    console.log('요청2 === postRealtime === res : ', res);
  });

  console.log('요청A === postRecord === res : ', res);

  return res;
};

// 결재 요청 Alarm
const poistAuditDocRecordId = async (audit_id) => {
    try {
        const requests = send_auditors.flatMap(auditor_id => [
            grantAuditorAccess({ audit_id, auditor_id }),
            createAuditRequest({ audit_id, auditor_id }, send_auditors)
        ]);

      return Promise.all(requests);
    } catch (error) {
        console.error(error);
    }
}

// 결재 요청
const requestAudit = async (e: SubmitEvent) => {
    e.preventDefault();

    try {
        const formData = new FormData(e.target as HTMLFormElement);

        const formValues = Object.fromEntries(formData.entries());
        
        if (!formValues) return;

        const { to_audit, inp_content: to_audit_content } = formValues;

        if(send_auditors.length === 0) {
            alert('결재자를 1명 이상 선택해주세요.');
            return;
        }

        // 결재 서류 업로드
        const auditDoc = await postAuditDoc({ to_audit, to_audit_content });

        // 결재 요청 서류 record_id
        // const auditId = auditDoc.record_id;

        // await poistAuditDocRecordId(auditId);
        
        // alert('결재 요청이 완료되었습니다.');

        // router.push({
        //     path: '/approval/audit-list',
        // });
    } catch (error) {
        console.error(error);
    }
}

onMounted(() => {
    getDivisionNames();
    getSameDivisionPeople();
})

</script>

<style scoped lang="less">
// #same_division_auditors {
//     margin: 1rem 0;
// }
</style>