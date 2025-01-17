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

- ### 결재 요청 보내기
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





