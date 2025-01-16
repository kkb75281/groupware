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

# 알람 관련

읽은 알람 리스트 (계정당 1개씩만 존재)
```typescript
{
	list: string[]
}
```

```java
table: {
	name: 'notification_read_list',
	access_group: 'private'
}
```

# 직원 관련

- ### 부서, 직책 업데이트 (history)

```java
{
	table: {
		name: 'emp_division',
		access_group: 1
	},
	tags: // ["[emp_pst]" + 직원 직책, "[emp_id]" + 직원 user_id_safe, "[emp_dvs]" +직원 부서]
}
```

- ### 부서, 직책 업데이트 (current)

```java
{
	table: {
		name: 'emp_position_current',
		access_group: 1
	},
	index: {
		name: // 현재 직원 부서 + '.' + 현재 직원 직책,
		value: // 직원 이름
	}
}
```

- ### 추가자료 업데이트

```java
table: {
	name: 'emp_additional_data',
	access_group: 99
},
reference: // "[emp_additional_data]" + 직원 user_id_safe,
```





