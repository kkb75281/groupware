<template lang="pug">
h1 직원 목록

hr

.table-wrap
    .tb-head-wrap
        .input-wrap.search
            input(type="text" placeholder="검색어를 입력하세요")
            button.btn-search

        .tb-toolbar
            .btn-wrap
                button.btn.bg-gray.outline(:disabled="!selectedList.length" @click="removeDivision") 삭제
                button.btn.outline(@click="router.push('/admin/add-employee')") 등록
    .tb-overflow
        template(v-if="loading")
            Loading#loading
        table.table#employee_list
            colgroup
                col(style="width: 3rem")
                col(style="width: 3rem")
                col(style="width: 10%")
                col(style="width: 10%")
                col
                col(style="width: 10%")
                col(style="width: 10%")
                col
            thead
                tr
                    th(scope="col")
                        label.checkbox
                            input(type="checkbox" name="checkbox" :checked="isAllSelected" @change="toggleSelectAll")
                            span.label-checkbox
                    th(scope="col") NO
                    th(scope="col") 직책(직급)
                    th(scope="col") 이름
                    th(scope="col") 이메일
                    th(scope="col") 생년월일
                    th(scope="col") 전화번호
                    th(scope="col") 주소

            tbody
                template(v-if="loading")
                    tr(v-for="i in 4")
                template(v-else-if="!employee_divisions || Object.keys(employee_divisions).length === 0")
                    tr
                        td(colspan="8") 데이터가 없습니다.
                template(v-else)
                    tr(v-for="(division, key, index) in employee_divisions")
                        td 
                            label.checkbox
                                input(type="checkbox" name="checkbox" :checked="selectedList.includes(division.record_id)" @click="toggleSelect(division.record_id)")
                                span.label-checkbox
                        td.list-num {{ index + 1 }}
                        td 
                        td
                            router-link.go-detail(:to="{ name: 'edit-divisions', query: { record_id: division.record_id } }")
                                span {{ division.data.division_name }}
                        td
                        td
                        td
                        td

    //- .pagination
        button.btn-prev.icon(type="button") 
            svg
                use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
            | Prev
        button.btn-next.icon(type="button" @click="currentPage++;" :class="{'nonClickable': endOfList && currentPage >= maxPage }") Next
            svg
                use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")

br
br
br
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, computed } from 'vue';
import { skapi } from '@/main';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

let loading = ref(false);
let employee = ref(null);
let currentPage = ref(1);
let selectedList = ref([]);
let isAllSelected = computed(() => {
    let keys = selectedList.value ? Object.keys(selectedList.value) : [];
    return keys.length > 0 && keys.every(key => selectedList.value.includes(key));
});

let sessionEmployee = JSON.parse(window.sessionStorage.getItem('employee'));
console.log('== sessionEmployee ==', sessionEmployee);

skapi.getInvitations().then(res => {
    console.log('=== getInvitations === res.list : ', res.list);
});

skapi.inviteUser().then(res => {
    console.log('=== inviteUser === res : ', res);
}).catch(err => {
    console.log('=== inviteUser === err : ', err);
})

skapi.getRecords().then(res => {
    console.log('=== getRecords === res : ', res);
}).catch(err => {
    console.log('=== getRecords === err : ', err);
})

let getInvitations = () => {
	console.log('click')
	// _el_prevInv.innerHTML = '';

	skapi.getInvitations().then(response => {
		console.log('과거인비테이션', response.list);

		// response.list.forEach(inv => {
		// 	const li = document.createElement('li');
		// 	li.innerHTML = /*html*/ `
		// 		<p>이메일: ${inv.email} 권한: ${inv.access_group} 이름: ${inv.name}</p>
		// 		<button onclick="skapi.resendInvitation({email: '${inv.email}' }).then(m=>alert(m))">재전송</button>
		// 		<button onclick="skapi.cancelInvitation({email: '${inv.email}' }).then(m=>{alert(m); getInvitations()})">초청취소</button>
		// 	`
		// 	_el_prevInv.appendChild(li);
		// });
	});
}
// getInvitations();

// skapi.getRecords({
//     table: {
//         name: 'invitations', // 관리자가 직원의 초청기록 등록할 때 사용하는 테이블
//         access_group: 99,
//     },
//     tag: email_tag
// },
// ).then(response => {
//     console.log('== response ==', response);
//     // divisions.value = response.list;
//     // displayDivisions(response.list);
//     loading.value = false;
// });


// function displayDivisions(divisions) {
//     let saveSession = {};

//     divisions.forEach((division, index) => {
//         saveSession[division.record_id] = division;
//     });

//     window.sessionStorage.setItem('employee', JSON.stringify(saveSession));
// }

let toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedList.value = [];
    } else {
        selectedList.value = Object.keys(divisions.value);
    }
}

let toggleSelect = (id) => {
    if (selectedList.value.includes(id)) {
        selectedList.value = selectedList.value.filter(itemId => itemId !== id);
    } else {
        selectedList.value.push(id);
    }
}
</script>

<style scoped lang="less">
#divisions_list>a>* {
    vertical-align: middle;
}

.division-logo {
    width: 2rem;
    height: 2rem;
    object-fit: contain;
}

.table-wrap {
    position: relative;
    margin-top: 3rem;

    #loading {
        position: absolute;
        top: 126px;
        left: 50%;
        transform: translateX(-50%);
    }
}

.go-detail {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 16px;

    span {
        white-space: nowrap;
    }
}

.img-wrap {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid var(--gray-color-300);
    border-radius: 50%;

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
}
</style>