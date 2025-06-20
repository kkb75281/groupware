<template lang="pug">
div(v-if="!system_worktime" style="text-align: center;line-height: 1.9;")
	template(v-if="user.access_group > 98")
		p 출퇴근 사용을 원하시면 시간을 먼저 설정해 주세요.
		button.btn(type="button" @click="router.push('/admin/edit-worktime')" style="margin:0 auto; margin-top: 0.7rem") 출퇴근 시간 설정
	template(v-else)
		p
		| 지정된 근무 시간이 없습니다. 
		br
		| 출퇴근 사용을 원하시는 경우 FGWORKS 관리자에게 문의 바랍니다.

template(v-else)
	.itembox
		.title-wrap(style="margin-bottom: 0;")
			//- h3.title 오늘의 출퇴근 기록을 남겨주세요.
			h3.title(style="line-height: 1.5;")
				template(v-if="todayWorkStarting && todayWorkEnding") 
					| 출/퇴근 기록이 완료되었습니다.
					br
					| 오늘도 수고 많으셨습니다.
				template(v-else-if="!todayWorkStarting && !todayWorkEnding") 출근을 기록해주세요.
				template(v-else-if="!todayWorkEnding") 퇴근을 기록해주세요.
			.button(v-if="system_worktime")
				button.btn.bg-gray(v-if="todayWorkStarting && todayWorkEnding" type="button" :disabled="todayWorkStarting && todayWorkEnding") 내일 봬요 :)
				button.btn(v-else-if="!todayWorkStarting" type="button" :disabled="todayWorkStarting && todayWorkEnding" @click="checkCommuteRecord") 출근 기록하기
				button.btn.bg-gray(v-else type="button" @click="checkCommuteRecord") 퇴근 기록하기
		br
		span.today 
			.icon
				svg
					use(xlink:href="@/assets/icon/material-icon.svg#icon-clock")
			| {{ getDate() }}

	.itembox(style="margin-top: 3rem; padding: 0; border-radius: 0; box-shadow: none;")
		.title-wrap
			span.title(style="font-size: 1.125rem; font-weight: 700; display: inline-block;") 이전 출퇴근 기록
		.table-wrap
			.tb-overflow
				table.table#tb-record-commute
					colgroup
						col(style="width: 8%;")
						col(style="width: 5%;")
						col(style="width: 5%;")
						col(style="width: 10%;")
						col(style="width: 10%;")
							
					thead
						tr
							th(scope="col") 날짜
							th(scope="col") 출근
							th(scope="col") 퇴근
							th(scope="col") 근무시간
							th(scope="col") 비고
					tbody
						template(v-if="!my_worktime_storage_data")
							tr
								td(colspan="5") 데이터가 없습니다.
						template(v-else)
							tr(v-for="record in my_worktime_storage_data")
								td.date {{ record.date }}
								td.start-time {{ extractTimeFromDateTime(record.startTime) }}
								td.end-time {{ extractTimeFromDateTime(record.endTime) }}
								td.work-time {{ record.dailyCommuteTime ? convertMsToTime(record.dailyCommuteTime) : '' }}
								td.remark
									.remark-wrap(style="display: flex; gap: 0.5rem;")
										.input-wrap
											input(type="text" placeholder="입력해주세요." v-model="record.remark")
										.btn-wrap
											button.btn-save(type="button" @click="saveDesc(record)")
												.icon
													svg
														use(xlink:href="@/assets/icon/material-icon.svg#icon-check-circle-fill")
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, onMounted, watch, nextTick } from 'vue';
import { skapi } from '@/main.ts';
import {
	getDate,
	getTime,
	convertToTimestamp,
	convertTimeToTimestamp,
	addTimeToTimestamp,
	extractTimeFromDateTime,
	convertMsToTime
} from '@/utils/time.ts';
import { user, makeSafe } from '@/user.ts';
import {
	system_worktime,
	getSystemWorktime,
	my_worktime_storage,
	my_worktime_storage_data,
	getMyWorktimeStorage,
	todayWorkStarting,
	todayWorkEnding,
	startWork,
	endWork
} from '@/views/commute/worktime.ts';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

const checkCommuteRecord = async () => {
	if (todayWorkStarting.value) {
		await endWork(router);
	} else {
		await startWork(router);
	}
};

// 비고 저장 함수
const saveDesc = async (record) => {
	console.log('record : ', record);
	console.log('my_worktime_storage.value : ', my_worktime_storage.value);

	if (!record.remark || record.remark.trim() === '') {
		alert('비고를 입력해주세요.');
		return;
	}

	try {
		// 해당 날짜의 원본 레코드들을 my_worktime_storage에서 찾기
		const targetRecords = my_worktime_storage.value.filter(
			(originalRecord) => originalRecord.data.date === record.date
		);
		console.log('targetRecords : ', targetRecords);

		if (!targetRecords || targetRecords.length === 0) {
			alert('해당 날짜의 기록을 찾을 수 없습니다.');
			return;
		}

		// 각 레코드에 remark 업데이트
		const updatePromises = targetRecords.map(async (targetRecord) => {
			const config = {
				table: {
					name: 'commute_record',
					access_group: 98
				},
				record_id: targetRecord.record_id,
				tags: ['[emp_id]' + makeSafe(user.user_id)],
				reference: 'emp_id:' + makeSafe(user.user_id)
			};

			// 기존 데이터에 remark 추가
			const updateData = {
				...targetRecord.data,
				remark: record.remark.trim()
			};

			console.log('config : ', config);
			console.log('updateData : ', updateData);

			return await skapi.postRecord(updateData, config);
		});

		await Promise.all(updatePromises).then((res) => {
			console.log('promise = res : ', res);
		});

		alert('비고가 저장되었습니다.');
		await nextTick();
		await getMyWorktimeStorage(true);
	} catch (error) {
		console.error('비고 저장 에러:', error);
		alert('비고 저장에 실패했습니다.');
	}
};

onMounted(() => {
	getSystemWorktime();
	getMyWorktimeStorage();
});
</script>

<style scoped lang="less">
.table-wrap {
	position: relative;

	#loading {
		position: absolute;
		top: 126px;
		left: 50%;
		transform: translateX(-50%);
	}

	#searchForm {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.table {
		min-width: 35rem;

		tbody {
			tr {
				&:hover {
					background-color: transparent;
				}
			}
		}
	}
}

.itembox-wrap {
	display: flex;
	gap: 0 24px;
	flex-wrap: wrap;
}

.itembox {
	box-shadow: 1px 1px 10px 0px rgba(0, 0, 0, 0.15);
	border-radius: 16px;
	padding: 1.5rem;
	line-height: 1.2;
	flex: 1;

	.time {
		display: flex;
		flex-wrap: wrap;
		width: 100%;
		font-size: 1.25rem;
		font-weight: 600;
		color: #2c3e50;
		border-bottom: 1px solid #ccc;
		padding-bottom: 1.5rem;

		.value {
			flex: 1;
			margin-left: 8px;
		}
	}

	.btn-work {
		width: 100%;
		margin-top: 1.5rem;

		&.disabled {
			background-color: var(--primary-color-200);
			border: 1px solid var(--primary-color-200);
			cursor: default;
		}
	}

	.title-wrap {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 20px;
	}
}

.today {
	font-size: 1rem;
	color: #777;
	margin-top: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.25rem;

	.icon {
		padding: 0;
	}
}

.remark {
	.btn-wrap {
		flex-wrap: nowrap;

		button {
			width: 1.5rem;
			height: 1.5rem;
			display: flex;
			justify-content: center;
			align-items: center;

			&:hover {
				.icon {
					svg {
						fill: var(--primary-color-400);
					}
				}
			}
		}

		.icon {
			padding: 0;
		}
	}
}

@media (max-width: 768px) {
	.itembox-wrap {
		flex-direction: column;
	}
}
</style>
