<template lang="pug">
h1 부서(회사) 목록

hr

.table-wrap
    .tb-head-wrap
        .input-wrap.search
            input(type="text" placeholder="검색어를 입력하세요")
            button.btn-search

        .tb-toolbar
            .btn-wrap
                button.btn.outline.warning(:disabled="!selectedList.length" @click="deleteDivision") 삭제
                button.btn.outline(@click="router.push('/admin/add-divisions')") 등록
    .tb-overflow
        template(v-if="loading")
            Loading#loading
        table.table#divisions_list
            colgroup
                col(style="width: 3rem")
                col(style="width: 3rem")
                col
                col(style="width: 10%")
                col(style="width: 10%")
            thead
                tr
                    th(scope="col")
                        label.checkbox
                            input(type="checkbox" name="checkbox" :checked="isAllSelected" @change="toggleSelectAll")
                            span.label-checkbox
                    th(scope="col") NO
                    th.left(scope="col") 회사명
                    th(scope="col") 미결
                    th(scope="col") 수신참조

            tbody
                template(v-if="loading")
                    tr(v-for="i in 4")
                template(v-else-if="divisions === 'no data' || !divisions || Object.keys(divisions).length === 0")
                    tr
                        td(colspan="5") 데이터가 없습니다.
                template(v-else)
                    tr(v-for="(division, index) in Object.values(divisions)" :key="division.record_id")
                        td 
                            label.checkbox
                                input(type="checkbox" name="checkbox" :checked="selectedList.includes(division.record_id)" @click="toggleSelect(division.record_id)")
                                span.label-checkbox
                        td.list-num {{ index + 1 }}
                        td.left 
                            router-link.go-detail(:to="{ name: 'edit-divisions', query: { record_id: division.record_id } }")
                                .img-wrap
                                    img(v-if="division.bin && division.bin.division_logo" :src="division.bin['division_logo'][0].url")
                                span {{ division.data.division_name }}
                        td.pending
                        td.received

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
import { ref, computed, onMounted } from 'vue';
import { skapi } from '@/main';

import Loading from '@/components/loading.vue';

const router = useRouter();
const route = useRoute();

let loading = ref(false);
let divisions = ref([]);
let currentPage = ref(1);
let selectedList = ref([]);
let isAllSelected = computed(() => {
    let keys = Object.keys(divisions.value);
    return keys.length > 0 && keys.every(key => selectedList.value.includes(key));
});

onMounted(() => {
    let sessionDivisions = window.sessionStorage.getItem('divisions');

    if(!sessionDivisions || Object.keys(sessionDivisions).length < 1) {
        loading.value = true;

        skapi.getRecords({
            table: {
                name: 'divisions',
                access_group: 99
            }
        },
        ).then(response => {
            divisions.value = response.list;
            displayDivisions(response.list);
            loading.value = false;
        });
    } else {
        if(sessionDivisions === 'no data') {
            divisions.value = 'no data';
        } else {
            divisions.value = JSON.parse(sessionDivisions);
        }
    }
});



let displayDivisions = (divisions) => {
    let saveSession = {};

    if (!divisions.length) {
        window.sessionStorage.setItem('divisions', 'no data');

        return;
    }

    divisions.forEach((division, index) => {
        saveSession[division.record_id] = division;
    });

    window.sessionStorage.setItem('divisions', JSON.stringify(saveSession));
}

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

let deleteDivision = async () => {
    let userId = Object.values(selectedList.value);

    let isSuccess = [];
    let isFail = [];

    await Promise.all(userId.map(el => {
        return skapi.deleteRecords({record_id: el}).then(res => {
            isSuccess.push(el);
        }).catch(err => {
            // console.log('== err == : ', err)
            isFail.push(el);
        });
    }));

    skapi.getRecords({
        table: {
            name: 'divisions',
            access_group: 99
        }
    },
    ).then(response => {
        divisions.value = response.list;
        displayDivisions(response.list);
    });

    if (isSuccess.length > 0) {
        alert(`${isSuccess.length}개의 부서(회사)가 삭제되었습니다.`);
    } else {
        alert('부서(회사) 삭제에 실패하였습니다.');
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