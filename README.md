# Groupware

일반적인 기업에서 사용 할수 있는 그룹웨어 입니다.





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
```typescript
: { [DVS_NUMBER: string]: string }
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
```typescript
: { [DVS_RECORD_ID: string]: {
    bin?: { [division_logo: string]: {
        access_group: number | 'private' | 'public' | 'authorized' | 'admin';
        filename string;
        getFile: () => Promise;
        path: string;
        size: number;
        uploaded: number;
        url: string;
    }[] };
    data: {
        division_name: string;
        division_address?: string;
        division_business_code?: string;
        division_business_item?: string;
        division_business_type?: string;
        division_ceo_name?: string;
        division_corporate_number?: number;
        division_description?: string;
        division_email?: string;
        division_establishment_date?: number;
        division_fax?: string;
        division_homepage?: string;
        division_phone_number?: number;
    };
    ip: string;
    readonly: boolean;
    record_id: string;
    referenced_count: number;
    source?: {
        allow_referencing_to_feed?: boolean;
        can_remove_referencing_records?: boolean;
        only_granted_can_reference?: boolean;
        prevent_multiple_referencing?: boolean;
        referencing_limit?: number || null;
    };
    table: {
        name: string;
        access_group?: number | 'private' | 'public' | 'authorized' | 'admin';
        subscription?: {
            group: number;
            exclude_from_feed?: boolean;
            notify_subscribers?: boolean;
        };
    };
    updated: number;
    uploaded: number;
    user_id: string;
} }
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
```typescript
: {
    division_name: string;
    division_key: string;
    division_startTime: {
        min: string;
        max: string;
    },
    division_endTime: {
        min: string;
        max: string;
    }
}
```




# 결재 관련

- ### 결재 서류 저장

```javascript
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
```typescript
: {
    to_audit: string; // 결재 사안 제목
    auditors: string[]; // 결재자(들)의 user_id
    to_audit_content: string; // 결재 내용
}
```

- ### 결재 요청 보내기

```javascript
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
```typescript
: {
    audit_id: string; // 결재 서류 record_id
    auditor: string; // 결재자 user_id
}
```

- ### 결재 승인/거절 보내기

```javascript
{
    table: {
        name: 'audit_approval',
        access_group: 'authorized'
    },
    reference: audit_id, // 결재 서류 record_id
    tags: user_id_safe, // 결재자 user_id
}	
```
```typescript
: {}
```





# 알람 관련

- ### 읽은 알람 업데이트

```javascript
{
     table: {
        name: 'notification_read_list',
        access_group: 'private'
    }
}
```
```typescript
: {
    list: string[] // [읽은 알람 id, ...]
}
```

- ### 실시간 못 받은 알람 저장

```javascript
{
    readonly: true,
    table: {
        name: `realtime:${sender_user_id_safe)}`,
        access_group: "authorized",
    },
}
```
```typescript
// 결재 요청 알람 경우
: {
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

// 결재 승인/거절 알람 경우
: {
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





# 직원 관련

- ### 부서, 직책 업데이트 (history)

```javascript
{
    table: {
        name: 'emp_division' + user_id_safe,
        access_group: 1
    },
    tags: tag_data // "[emp_pst]" + 직책, "[emp_id]" + user_id_safe, "[emp_dvs]" + 부서
}
```
```typescript
{
    bin: {}
    ip: string;
    readonly: boolean;
    record_id: string;
    referenced_count: number;
    source: {
        referencing_limit: number || null,
        prevent_multiple_referencing: boolean;
        can_remove_referencing_records: boolean;
        only_granted_can_reference: boolean;
        allow_referencing_to_feed: boolean;
    }
    table: {
        name: string; // Table name
        access_group: number | 'private' | 'public' | 'authorized' | 'admin';
        subscription?: {
            user_id: string;
            group: number;
        }
    }
    tags?: string[];
    unique_id?: string;
    updated: number;
    uploaded: number;
    user_id: string;
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




