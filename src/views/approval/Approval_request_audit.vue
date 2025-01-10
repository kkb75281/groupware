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
                                template(v-if="auditor.data.user_id !== user.user_id")
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
import { useRoute, useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { skapi } from "@/main";
import { user } from "@/user";
import { getDivisionNames, divisionNameList } from "@/division";

const router = useRouter();
const route = useRoute();

let same_division_auditors = ref({});
let send_auditors = [];

async function init() {
    await getDivisionNames();
    let myDivisionTopLevel = divisionNameList.value[user.division].split("/")[0]; // 부서명/팀명/...
    let divToFetch = []; // DIV_1, DIV_2, ...
    for (let k in divisionNameList.value) {
        if (divisionNameList.value[k].startsWith(myDivisionTopLevel)) {
            divToFetch.push(k);
        }
    }

    divToFetch = await Promise.all(
        divToFetch.map((d) => {
            return skapi
                .getRecords(
                    {
                        table: {
                            name: "emp_position_current",
                            access_group: 1,
                        },
                        index: {
                            name: d + ".",
                            value: " ",
                            condition: ">",
                        },
                    },
                    { limit: 1000 }
                )
                .then((res) => res.list);
        })
    );

    let allUsers = [];
    for (let d of divToFetch) {
        allUsers = allUsers.concat(d);
    }

    same_division_auditors.value = allUsers;
}

init();

// 결재자 체크 박스
const checkAuditor = (userId: string) => {
    if (send_auditors.includes(userId)) {
        send_auditors = send_auditors.filter((auditor) => auditor !== userId);
    } else {
        send_auditors.push(userId);
    }
};

// 결재 서류 업로드
const postAuditDoc = async ({ to_audit, to_audit_content }) => {
    try {
        const params = {
            to_audit,
            auditors: send_auditors,
            to_audit_content,
        };

        const options = {
            readonly: true,
            table: {
                name: "audit_doc",
                access_group: "private",
            },
            index: {
                name: "to_audit",
                value: to_audit.replaceAll(".", "_"),
            },
            source: {
                prevent_multiple_referencing: true,
            },
            tags: [...new Set(send_auditors.map((u) => u.replaceAll("-", "_")))], // 중복 제거
        };

        const res = await skapi.postRecord(params, options);

        console.log("결재 서류 === postAuditDoc === res : ", res);
        return res;
    } catch (error) {
        console.error(error);
    }
};

// 결재자에게 권한을 부여하는 함수
const grantAuditorAccess = async ({ audit_id, auditor_id }) => {
    return skapi.grantPrivateRecordAccess({
        record_id: audit_id,
        user_id: auditor_id,
    });
};

// 결재 요청을 생성하고 알림을 보내는 함수
const createAuditRequest = async ({ audit_id, auditor_id }, send_auditors) => {
    if (!audit_id || !auditor_id) return;

	// 결재 요청
    const res = await skapi.postRecord(
        {
            audit_id,
            auditor: auditor_id,
        },
        {
            unique_id: `audit_request:${audit_id}:${auditor_id}`,
            readonly: true,
            table: {
                name: "audit_request",
                access_group: "authorized",
            },
            reference: `audit:${auditor_id}`,
            tags: [audit_id],
        }
    );

    console.log("요청1 === postRecord === res : ", res);

    skapi.grantPrivateRecordAccess({
        record_id: res.record_id,
        user_id: auditor_id,
    });

    let to_audit = (document.getElementById('to_audit') as HTMLInputElement).value;

	// 실시간 알림 보내기
    skapi
        .postRealtime(
            {
                audit_request: {
					audit_doc_id: audit_id,
                    audit_request_id: res.record_id,
                    send_auditors,
					audit_type: "request",
					to_audit: to_audit,
					send_user: user.user_id,
					send_date: new Date().getTime()
                },
            },
            auditor_id
        )
        .then((res) => {
            console.log("요청2 === postRealtime === res : ", res);
        });

	// 실시간 못 받을 경우 알림 기록 저장
	skapi
		.postRecord(
			{	
				audit_doc_id: audit_id,
				audit_request_id: res.record_id,
				send_auditors,
				to_audit,
				audit_type: "request",
				send_user: user.user_id,
				send_date: new Date().getTime()
			},
			{
				// unique_id: `realtime_request:${audit_id}:${auditor_id}`,
				readonly: true,
				table: {
					name: `realtime:${auditor_id.replaceAll('-', '_')}`,
					access_group: "authorized",
				},
				// reference: `realtime:${auditor_id}`,
				// tags: [auditor_id],
			}
		)
		.then((res) => {
            console.log("요청3 === postRecord === res : ", res);
        });

    return res;
};

// 결재 요청 Alarm
const poistAuditDocRecordId = async (audit_id) => {
    try {
        const uniqueAuditors = [...new Set(send_auditors)]; // 중복 제거
        const requests = uniqueAuditors.flatMap((auditor_id) => [
            grantAuditorAccess({ audit_id, auditor_id }),
            createAuditRequest({ audit_id, auditor_id }, uniqueAuditors),
        ]);

        return Promise.all(requests);
    } catch (error) {
        console.error(error);
    }
};

// 결재 요청
const requestAudit = async (e) => {
    e.preventDefault();

    try {
        const formData = new FormData(e.target);
        const formValues = Object.fromEntries(formData.entries());

        if (!formValues) return;

        const { to_audit, inp_content: to_audit_content } = formValues;

        if (send_auditors.length === 0) {
            alert("결재자를 1명 이상 선택해주세요.");
            return;
        }

        const auditDoc = await postAuditDoc({ to_audit, to_audit_content });

        const auditId = auditDoc.record_id;

        await poistAuditDocRecordId(auditId);

        alert("결재 요청이 완료되었습니다.");

        router.push({
            path: "/approval/audit-list",
        });
    } catch (error) {
        console.error(error);
    }
};
</script>

<style scoped lang="less">
// #same_division_auditors {
//     margin: 1rem 0;
// }
</style>
