# Groupware

일반적인 기업에서 사용 할수 있는 그룹웨어 입니다.

## Database unique ID

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
```