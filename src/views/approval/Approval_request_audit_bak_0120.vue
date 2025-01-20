<template lang="pug">
.title
    h1 결재 요청

hr

.form-wrap
    form#_el_request_form(@submit.prevent="requestAudit")
        .input-wrap
            p.label 작성 일자
            input#inp_date(type="date" name="inp_date" v-model="dateValue")

        .input-wrap
            p.label 기안자
            input#inp_auditors(type="text" name="inp_auditors" placeholder="기안자" readonly :value="user.name")

        .input-wrap
            p.label.essential 제목
            input#to_audit(type="text" placeholder="제목" required name="to_audit")

        .input-wrap
            p.label 결재 내용
            textarea#inp_content(type="text" placeholder="결재 내용" name="inp_content")

        button.btn.outline(type="button") + 사항 추가

        .form-item
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
                                th 수신 참조
                                th 결재 여부
                                th 합의 여부

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
                                    td
                                        label.checkbox
                                            input(type="checkbox" name="checkbox" :value="auditor.user_id" @change="checkAuditor(auditor.data.user_id)")
                                            span.label-checkbox
                                    td
                                        label.checkbox
                                            input(type="checkbox" name="checkbox" :value="auditor.user_id" @change="checkAuditor(auditor.data.user_id)")
                                            span.label-checkbox

            //- input#inp_auditors(type="text" placeholder="결재자1, 결재자2, ..." required)
            
            .selected-wrap.reference
                p.label 수신 / 참조
                ul
                    //- li.selected(v-for="auditor in send_auditors") {{ auditor }}
                    li.selected ㅇㅇㅇ
                    li.selected 오민아
            
            .selected-wrap
                p.label 결재
                ul
                    //- li.selected(v-for="auditor in send_auditors") {{ auditor }}
                    li.selected
                        span.num 1
                        span.name ㅇㅇㅇ

                    li.selected
                        span.num 2
                        span.name 오민아

            .selected-wrap
                p.label 합의
                ul
                    li.selected(v-for="auditor in send_auditors") {{ auditor }}
                

        .button-wrap
            button.btn(type="submit" style="margin-top: 0;") 결재요청

</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { skapi } from "@/main";
import { user, makeSafe } from "@/user";
import { getDivisionNames, divisionNameList } from "@/division";

const router = useRouter();
const route = useRoute();

let same_division_auditors = ref({});
let send_auditors = [];

let getEmpDivision = async(userId: string) => {
    if(!userId) return;

    await skapi.getRecords({
        table: {
            name: 'emp_position_current',
            access_group: 1
        },
        unique_id: "[emp_position_current]" + makeSafe(userId)
    }).then(r => {
        if (r.list.length === 0) return;

		user.division = r.list[0].index.name.split(".")[0];
		user.position = r.list[0].index.name.split(".")[1];
    });
}

async function init() {
    await getDivisionNames();
	await getEmpDivision(user.user_id);
	skapi.getUsers().then((res) => {
		console.log('!!!!!!!!!',res)
	});
	console.log('=== init === divisionNameList : ', divisionNameList.value);
	console.log('=== init === user : ', user);
	let divisionFullName = divisionNameList.value[user.division];
	let myDivisionTopLevel = divisionFullName.includes("/") ? divisionFullName.split("/")[0] : divisionFullName;
    // let myDivisionTopLevel = divisionNameList.value[user.division].split("/")[0]; // 부서명/팀명/...
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
					noti_id: res.record_id,
					noti_type: 'audit',
					send_date: new Date().getTime(),
					send_user: user.user_id,
					audit_info: {
						audit_type: 'request',
						to_audit: to_audit,
						audit_doc_id: audit_id,
						audit_request_id: res.record_id,
						send_auditors: send_auditors,
					}
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
				noti_id: res.record_id,
				noti_type: 'audit',
				send_date: new Date().getTime(),
				send_user: user.user_id,
				audit_info: {
					audit_type: 'request',
					to_audit: to_audit,
					audit_doc_id: audit_id,
					audit_request_id: res.record_id,
					send_auditors: send_auditors,
				}
			},
			{
				readonly: true,
				table: {
					name: `realtime:${auditor_id.replaceAll('-', '_')}`,
					access_group: "authorized",
				},
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
            path: "/approval/request-list",
        });
    } catch (error) {
        console.error(error);
    }
};

const dateValue = ref(new Date().toISOString().substring(0, 10));
</script>

<style scoped lang="less">
.input-wrap,
.selected-wrap {
    margin-top: 1rem;

    &:first-of-type {
        margin-top: 0;
    }

    input[readonly] {
        &:hover {
            cursor: default;
            border-color: var(--gray-color-200);
        }
    }
}

.button-wrap {
    margin-top: 2rem;
}

.btn {
    margin-top: 1rem;
}

.form-item {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--gray-color-200);
}

.selected-wrap {
    &.reference {
        .selected {
            display: inline-block;
            padding: 4px 8px;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
            border: 1px solid var(--gray-color-200);
            border-radius: 4px;
            background-color: var(--gray-color-100);
            color: var(--gray-color-600);
            width: auto;
            height: auto;
        }
    }

    ul {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .selected {
        display: inline-flex;
        flex-direction: column;
        flex-wrap: wrap;
        border: 1px solid var(--gray-color-200);
        border-radius: 30px;
        background-color: #fff;
        color: var(--gray-color-600);
        width: 100px;
        height: 100px;

        span {
            display: block;
            text-align: center;
            padding: 4px;

            &.num {
                color: var(--gray-color-400);
                border-bottom: 1px solid var(--gray-color-200);
            }

            &.name {
                flex: 1;
                display: flex;
                justify-content: center;
                align-items: center;
            }
        }
    }
}
</style>
