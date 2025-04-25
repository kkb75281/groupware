import { ref } from "vue";
import { skapi } from "@/main.ts"
import { user, makeSafe } from "@/user.ts";
import {
	getDate,
	getTime,
	convertToTimestamp,
	convertTimeToTimestamp,
	addTimeToTimestamp,
	extractTimeFromDateTime,
	convertMsToTime
} from '@/utils/time.ts';

type Worktime = {
	date: string | null;
	startTime: string | null;
	endTime: string | null;
	startTimeStamp: number | null;
	endTimeStamp: number | null;
	dailyCommuteTime: number | null;
}

// 시스템 출퇴근 시간 가져오기
export let system_worktime = ref(null);
export let getSystemWorktimeId = ref(null);
export let getSystemWorktimeRunning: Promise<any> | null = null;
export let getSystemWorktime = async(refresh = false) => {
	if(getSystemWorktimeRunning instanceof Promise) {
		await getSystemWorktimeRunning;
		return system_worktime.value;
	}

	if (system_worktime.value && Object.keys(system_worktime.value).length && !refresh) {
		return system_worktime.value;
	}

	getSystemWorktimeRunning = skapi.getRecords({
		table: {
			name: "system_worktime",
			access_group: 1,
		}
	}).finally(() => {
		getSystemWorktimeRunning = null;
	});

	let res = await getSystemWorktimeRunning;

	if (res && res.list && res.list.length) {
		getSystemWorktimeId.value = res.list[0].record_id;

		if (res.list[0].data) {
			system_worktime.value = res.list[0].data;
		}

		system_worktime.value.start.minTimestamp = convertToTimestamp(
			`${getDate()} ${res.list[0].data.start.min}:00`
		);
		system_worktime.value.start.maxTimestamp = convertToTimestamp(
			`${getDate()} ${res.list[0].data.start.max}:00`
		);
		system_worktime.value.end.minTimestamp = convertToTimestamp(
			`${getDate()} ${res.list[0].data.end.min}:00`
		);
		system_worktime.value.end.maxTimestamp = convertToTimestamp(
			`${getDate()} ${res.list[0].data.end.max}:00`
		);
	}

	// console.log("getSystemWorktimeId", getSystemWorktimeId.value);
	// console.log("system_worktime", system_worktime.value);

	return system_worktime.value;
}

export let my_worktime_storage = ref(null);
export let todayWorkStarting = ref(false);
export let todayWorkEnding = ref(false);

// user 출퇴근 기록 조회
export let getMyWorktimeStorageRunning: Promise<any> | null = null;
export const getMyWorktimeStorage = async (refresh = false) => {
	if(getMyWorktimeStorageRunning instanceof Promise) {
		await getMyWorktimeStorageRunning;
		return my_worktime_storage.value;
	}

	if (my_worktime_storage.value && Object.keys(my_worktime_storage.value).length && !refresh) {
		return my_worktime_storage.value;
	}

	const query = {
		table: {
			name: 'commute_record',
			access_group: 98
		},
		reference: 'emp_id:' + makeSafe(user.user_id)
	};

	const fetchOptions = {
		// limit,
		ascending: false
	};

	getMyWorktimeStorageRunning = skapi.getRecords(query, fetchOptions).finally(() => {
		getMyWorktimeStorageRunning = null;
	});

	let res = await getMyWorktimeStorageRunning;

	if (res && res.list && res.list.length) {
		console.log("getMyWorktimeStorage", res);

		my_worktime_storage.value = [...res.list].sort((a, b) => b.uploaded - a.uploaded); // uploaded(레코드 최초 생성순) 기준으로 정렬해야 함.

		// 오늘 출근했는지 확인
		const todayStartRecord = my_worktime_storage.value.find(
			(record) => record.data.date === getDate() && record.data.startTime
		);
		if (todayStartRecord) {
			todayWorkStarting.value = true; // 이미 출근했으면 버튼 비활성화
		} else {
			todayWorkStarting.value = false;
		}

		// 오늘 퇴근했는지 확인 
		const todayEndRecord = my_worktime_storage.value.find(
			(record) => record.data.date === getDate() && record.data.endTime
		);
		if (todayStartRecord && todayEndRecord) {
			todayWorkEnding.value = true;
		} else {
			todayWorkEnding.value = false;
		}
	}

	console.log("todayWorkStarting", todayWorkStarting.value);
	console.log("my_worktime_storage", my_worktime_storage.value);
	
	return my_worktime_storage.value;
};

const saveCommuteRecord = async (data: Worktime) => {
	try {
		const config = {
			table: {
				name: 'commute_record',
				access_group: 98
			},
			tags: ['[emp_id]' + makeSafe(user.user_id)],
			reference: 'emp_id:' + makeSafe(user.user_id)
		};

		const res = await skapi.postRecord(data, config);

		return res.list ? res.list[0] : res; // list가 있으면 첫 번째 항목 반환, 아니면 res 그대로 반환
	} catch (error) {
		throw error;
	}
};

// 출근 기록
export let startWork = async(router?: any) => {
	// 출근을 이미 했을 경우
	if(todayWorkStarting.value) {
		return;
	}

	// 출근 기록 데이터
	let data:Worktime = {
		date: getDate(),
		startTime: `${getDate()} ${getTime()}`,
		startTimeStamp: convertToTimestamp(`${getDate()} ${getTime()}`),
		endTime: null,
		endTimeStamp: null,
		dailyCommuteTime: null,
	}

	let isLate = false;

	// 출근 시간이 시스템 출근 시간보다 늦을 경우
	if (system_worktime.value && system_worktime.value.start && system_worktime.value.start.maxTimestamp) {
		if (system_worktime.value.start.maxTimestamp < data.startTimeStamp) {
			isLate = true;
		}
	}

	try {
		// DB에 저장
		const savedRecord = await saveCommuteRecord({
			...data
		});
	
		// 상태 업데이트
		// my_worktime_storage.value = [...my_worktime_storage.value, savedRecord].sort(
		// 	(a, b) => b.data.startTimeStamp - a.data.startTimeStamp
		// );
		getMyWorktimeStorage(true);
	
		// todayWorkStarting.value = true;
		alert('출근 기록이 저장되었습니다.');

		// 지각일 경우, 지각한 사유 적기 위해 저장 후 출퇴근 관리 페이지로 이동
		if (isLate && router) {
			alert('지각하셨습니다. 지각 사유를 적어주세요.');
			router.push('/commute/commute-record');
		}
	} catch (error) {
		alert('출근 기록 저장에 실패했습니다.');
		todayWorkStarting.value = false;
	}
}

// 퇴근 기록
export let endWork = async(router?: any) => {
	// 퇴근을 이미 했을 경우
	if(!todayWorkStarting.value) {
		return;
	}

	// 퇴근 기록 데이터
	let data:Worktime = {
		date: getDate(),
		startTime: null,
		startTimeStamp: null,
		endTime: `${getDate()} ${getTime()}`,
		endTimeStamp: convertToTimestamp(`${getDate()} ${getTime()}`),
		dailyCommuteTime: null,
	}

	let isOvertime = false;

	// 퇴근 시간이 시스템 퇴근 시간보다 늦을 경우
	if (system_worktime.value && system_worktime.value.end && system_worktime.value.end.maxTimestamp) {
		if (system_worktime.value.end.maxTimestamp < data.endTimeStamp) {
			isOvertime = true;
		}
	}

	try {
		// DB에 저장
		const savedRecord = await saveCommuteRecord({
			...data
		});
	
		// 상태 업데이트
		// my_worktime_storage.value = [...my_worktime_storage.value, savedRecord].sort(
		// 	(a, b) => b.data.startTimeStamp - a.data.startTimeStamp
		// );
		getMyWorktimeStorage(true);
	
		// todayWorkStarting.value = false;
		alert('퇴근 기록이 저장되었습니다.');

		// 야근일 경우, 야근한 사유 적기 위해 저장 후 출퇴근 관리 페이지로 이동
		if (isOvertime && router) {
			alert('야근하셨습니다. 야근 사유를 적어주세요.');
			router.push('/commute/commute-record');
		}
	} catch (error) {
		alert('퇴근 기록 저장에 실패했습니다.');
		todayWorkStarting.value = true;
	}

}

