# Groupware

일반적인 기업에서 사용 할수 있는 그룹웨어 입니다.

<!-- ## Database unique ID

`audit:${user.user_id}`
referencing 으로 결제 요청을 받을수 있는 창구
```
table: {
    name: 'audit',
    access_group: 'authorized',
},
source: {
    can_remove_referencing_records: true,
}
``` -->





# 부서 관련

- ### 부서 이름 업데이트

```javascript
{
	unique_id: '[division_name_list]',
	table: {
		name: 'divisionNames',
		access_group: 1
	}
}
```

- ### 부서 정보 업데이트

```javascript
{
	table: {
		name: 'divisions',
		access_group: 99
	}
}
```

- ### 부서 출근시간 업데이트

```javascript
{
	unique_id: `dvs_workTime_${division.record_id_safe}`
	table: {
		name: 'dvs_workTime_setting',
		access_group: 1
	},
}
```




# 결재 관련

- ### 결재 서류 저장

```typescript
data: {
	to_audit: string; // 결재 사안 제목
	auditors: string[]; // 결재자(들)의 user_id
	to_audit_content: string; // 결재 내용
}
```
```javascript
data,
{
	readonly: true,
	table: {
		name: "audit_doc",
		access_group: "private",
	},
	index: {
		name: "to_audit",
		value: to_audit.replaceAll(".", "_"), // 결재 사안 제목
	},
	source: {
		prevent_multiple_referencing: true,
	},
	tags: [] // 결재자(들)의 user_id_safe 
}
```

- ### 결재 요청 보내기

```typescript
data: {
	audit_id: string; // 결재 서류 record_id
	auditor: string; // 결재자 user_id
},
```
```javascript
data,
{
	unique_id: `audit_request:${결재 서류 record_id}:${결재자 user_id}`,
	readonly: true,
	table: {
		name: "audit_request",
		access_group: "authorized",
	},
	reference: `audit:${결재자 user_id}`,
	tags: [결재자 user_id],
}
```

- ### 결재 승인/거절 보내기

```typescript
audit_id: string;
user_id_safe: string;
```
```javascript
{
	table: {
		name: 'audit_approval',
		access_group: 'authorized'
	},
	reference: audit_id,
	tags: user_id_safe, 
}	
```





# 알람 관련

- ### 읽은 알람 업데이트

```typescript
data: {
	list: string[] // [읽은 알람 id, ...]
}
```
```javascript
data, {
	table: {
		name: 'notification_read_list',
		access_group: 'private'
	}
}
```

- ### 실시간 못 받은 알람 저장

```typescript
// 결재 요청 알람
data: {
	noti_id: string; // 결재 요청 레코드 record_id
	noti_type: 'audit';
	send_date: new Date().getTime();
	send_user: user.user_id;
	audit_info: {
		audit_type: 'request';
		to_audit: string; // 결재 사안 제목
		audit_doc_id: string; // 결재 문서 레코드 record_id
		audit_request_id: string; // 결재 요청 레코드 record_id
		send_auditors: string[]; // 결재자(들)의 user_id
	}
}

// 결재 승인/거절 알람
data: {
	noti_id: string; // 결재 승인/거절 레코드 record_id
	noti_type: 'audit';
	send_date: new Date().getTime();
	send_user: user.user_id;
	audit_info: {
		audit_type: 'approved';
		to_audit: string; // 결재 사안 제목
		audit_doc_id: string; // 결재 문서 레코드 record_id
		approval: 'approved' || 'rejected'; // 승인 여부
	}
}
```
```javascript
data, 
{
	readonly: true,
	table: {
		name: `realtime:${sender_user_id_safe)}`,
		access_group: "authorized",
	},
}
```





# 직원 관련

- ### 부서, 직책 업데이트 (history)

```typescript
tag_data: string[] // "[emp_pst]" + 직책, "[emp_id]" + user_id_safe, "[emp_dvs]" + 부서
```
```javascript
{
	unique_id: "[emp_division]" + user_id_safe,
	table: {
		name: 'emp_division',
		access_group: 1
	},
	tags: tag_data
}
```

- ### 부서, 직책 업데이트 (current)

```typescript
index_data: {
	name: string; // 현재 직원 부서 + '.' + 현재 직원 직책
	value: string; // 직원 이름
}
```
```javascript
{
	unique_id: "[emp_position_current]" + user_id_safe,
	table: {
		name: 'emp_position_current',
		access_group: 1
	},
	index: index_data
}
```

- ### 추가자료 업데이트

```typescript
reference_data: string; // [emp_additional_data]" + 직원 user_id_safe
```
```javascript
{
	unique_id: "[emp_additional_data]" + user_id_safe,
	table: {
		name: 'emp_additional_data',
		access_group: 99
	},
	reference: reference_data
}
```

- ### 도장 저장

```javascript
{
	unique_id: '[stamp_images]' + user_id_safe;
	table: {
		name: 'stamp_images',
		access_group: 1,
	}
}
```

- ### 출퇴근 저장소

```javascript
{
	unique_id: `emp_id:${user_id_safe}`,
	table: {
		name: 'commute_records',
		access_group: 98
	},
}
```

- ### 출퇴근 기록

```typescript
type IWorkFormat {
	date: string | null;
	startTime: string | null;
	endTime: string | null;
	startTimeStamp: number | null;
	endTimeStamp: number | null;
	dailyCommuteTime: number | null;
}

data: {
	...initWorkFormat: IWorkFormat;	// 기존 출퇴근 기록 템플릿 복사
	date: number;
	startTime: string;
	startTimeStamp: number;
	endTime?: string;
	endTimeStamp?: number;
	dailyCommuteTime: '',
}
```
```javascript
data,
{
	table: {
		name: 'commute_record',
		access_group: 98,
	},
	tags: ["[emp_id]" + user_id_safe],
	reference: "emp_id:" + user_id_safe,
}
```




