<template lang="pug">
.title
    h1 결재 문서

hr

.form-wrap
    form#_el_approved_form
        .table-wrap
            .tb-overflow
                table.table#tb-auditDetail
                    colgroup
                        col(style="width: 10%")
                        col
                        col(style="width: 10%")
                        col
                    tbody
                        tr
                            th 결재 사안
                            td.left.audit-title(v-if="auditDoContent.data?.to_audit") {{ auditDoContent.data.to_audit }}
                            th 기안자
                            td.left.drafter {{ senderUser?.name || '' }}

                        tr(style="height: 140px")
                            th 결재선
                            td.audit-state.left(colspan="3" style="padding: 0")
                                .stamp-wrap
                                    .stamp-list(v-for="approver in auditUserList" :key="approver.user_id")
                                        span.approver {{ approver.user_info?.name }}
                                        .stamp
                                            template(v-if="approver.approved === 'approve'")
                                                span.approved 승인
                                            template(v-else-if="approver.approved === 'reject'")
                                                span.rejected 반려
                                            template(v-else="!approver.approved || approver.approved === null")
                                                template(v-if="approver.user_id === user.user_id")
                                                    button.btn.sm.outline.btn-approve(type="button" @click="openModal(approver)") 결재
                                                template(v-else)
                                                    span.waitting 대기

                        tr
                            th 결재 내용
                            td.left.audit-content(colspan="3" v-if="auditDoContent.data?.to_audit_content") {{ auditDoContent.data.to_audit_content }}

        br
        br
        br

        .button-wrap
            button.btn.bg-gray.btn-cancel(type="button" @click="$router.push('/approval/audit-list')") 이전

//- 결재 모달
#modal.modal(v-if="isModalOpen")
    form.modal-cont(@click.stop @submit.prevent="postApproval")
        .modal-header
            h2.modal-title 결재
            button.btn-close(@click="closeModal")
                svg
                    use(xlink:href="@/assets/icon/material-icon.svg#icon-close")
        .modal-body
            label.radio-button(style="width: 50%")
                input(type="radio" name="approved" value="approve" checked)
                span.label-radio 결재
            label.radio-button
                input(type="radio" name="approved" value="reject")
                span.label-radio 반려
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
const auditId = ref('');

const disabled = ref(true);
const auditDoContent = ref([]);
const auditUserList = ref([]);
const isModalOpen = ref(false);
const senderUser = ref({});

watch(() => (route.params.auditId as string), async(nv, ov) => {
	if(nv !== ov) {
		auditId.value = nv;
		await getAuditDetail();
	}
});

watch(auditDoContent, () => {
	console.log('!!!!!auditDoContent 변경:', auditDoContent.value.data.to_audit);
	let userId = auditDoContent.value?.user_id;

	if (userId) {
		getUserInfo(userId).then((res) => {
			senderUser.value = res.list[0] || {};
		})
		.catch((err) => {
			console.error('Failed to fetch user info:', err);
			senderUser.value = {};
		});
	} else {
		senderUser.value = {};
	}
})

let isPosting = false;

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
            reference: auditId.value
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
            record_id: auditId.value
        })).list[0];

        if (auditDoc) {
            auditDoContent.value = auditDoc;
			console.log('auditDoContent : ', auditDoContent.value);
        }
        
        const approvals = await approvedAudit();

        const approvalUserList = [];
        const newTags = auditDoc.tags.map(a => a.replaceAll('_', '-'))

        newTags.forEach((auditor) => {
            let oa_has_audited_str = null;

			approvals.forEach((approval) => {
				if (approval.user_id === auditor) {
					oa_has_audited_str = approval.data.approved ? '결재함' : '반려함';

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

// 결재 하기
const postApproval = async (e: SubmitEvent) => {
    if (isPosting) return; // 중복 호출 방지
    isPosting = true;
  
    e.preventDefault();

    try {
        if (!auditId.value) return;

        const userId = user.user_id;

        // 결재 하는 요청
        const res = await skapi.postRecord(e, {
            table: {
                name: 'audit_approval',
                access_group: 'authorized'
            },
            reference: auditId.value,
            tags: [(userId as string).replaceAll('-', '_')], 
        });

		console.log('결재 === postRecord === res : ', res);
		
		// 실시간 알림 보내기
		skapi.postRealtime(
			{
				audit_approval: {
					audit_doc_id: auditId.value,
					approval: res.data.approved,
					to_audit: auditDoContent.value?.data?.to_audit,
					audit_type: "approval",
					send_user: user.user_id,
					send_date: new Date().getTime()
				}
			},
			auditDoContent.value.user_id
		).then(res => {
			console.log('결재알림 === postRealtime === res : ', res);
		});

		// 실시간 못 받을 경우 알림 기록 저장
		skapi.postRecord(
			{
				audit_doc_id: auditId.value,
				approval: res.data.approved,
				to_audit: auditDoContent.value?.data?.to_audit,
				audit_type: "approval",
				send_user: user.user_id,
				send_date: new Date().getTime()
			},
			{
				// unique_id: `realtime_approval:${auditId}:${senderUser.value.user_id}`,
				readonly: true,
				table: {
					name: `realtime:${senderUser.value.user_id.replaceAll('-', '_')}`,
					access_group: "authorized",
				},
				// reference: `realtime:${senderUser.value.user_id}`,
				// tags: [senderUser.value.user_id],
			}
		)
		.then((res) => {
            console.log("결재알림기록 === postRecord === res : ", res);
        });

		window.alert('결재가 완료되었습니다.');
		closeModal();
		getAuditDetail();
    } catch (error) {
        console.error(error);
    }
}

onMounted(() => {
	auditId.value = (route.params.auditId as string);
    getAuditDetail();
});

</script>

<style scoped lang="less">
.wrap {
    padding: 3rem 2.4rem;
}

.form-wrap {
    max-width: 100%;
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

.table-wrap {
    tbody {
        tr {
            &:hover {
                background-color: transparent;
            }
        }

        th {
            border: 1px solid var(--gray-color-300);

            &:first-of-type {
                border-left: none;
            }
        }

        td {
            border: 1px solid var(--gray-color-300);

            &:last-of-type {
                border-right: none;
            }
        }
    }
}

.stamp-wrap {
    display: flex;
    flex-wrap: wrap;
    text-align: center;
    height: 100%;

    .stamp-list {
        display: flex;
        flex-direction: column;
        width: 6rem;
        min-height: 7rem;
        border-right: 1px solid var(--gray-color-300);
    }

    .approver {
        display: inline-block;
        border-bottom: 1px solid var(--gray-color-300);
        color: var(--gray-color-500);
        width: 100%;
        padding: 8px;
    }

    .stamp {
        padding: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;

        > span {
            display: inline-block;
            padding: 8px;
        }
    }

    .approved {
        color: var(--primary-color-400);
    }

    .rejected {
        color: var(--warning-color-400);
    }

    .waitting {
        color: var(--gray-color-500);
    }

    .btn {
        &.outline {
            &:focus,
            &:active {
                border: 1px solid var(--primary-color-400);
            }
        }
    }
}

@media (max-width: 768px) {

}
</style>