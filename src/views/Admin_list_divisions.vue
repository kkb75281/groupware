<template lang="pug">
h1 부서(회사) 목록

hr

.table-wrap
    .tb-overflow
        table.table#divisions_list
            colgroup
                col(style="width: 5rem")
                col
                col(style="width: 10%")
                col(style="width: 10%")
            thead
                tr
                    th(scope="col") NO
                    th.left(scope="col") 회사명
                    th(scope="col") 미결
                    th(scope="col") 수신참조

            tbody
                tr(v-for="(division, key, index) in divisions")
                    td.list-num {{ index + 1 }}
                    td.left 
                        router-link.go-detail(:to="{ name: 'edit-divisions', query: { record_id: division.record_id } }")
                            .img-wrap
                                img(v-if="division.bin && division.bin.division_logo" :src="division.bin['division_logo'][0].url")
                            span {{ division.data.division_name }}
                    td.pending
                    td.received

    .pagination
        button.btn-prev.icon(type="button") 
            svg
                use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
            | Prev
        button.btn-next.icon(type="button" @click="currentPage++;" :class="{'nonClickable': endOfList && currentPage >= maxPage }") Next
            svg
                use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import { skapi } from '@/main';

const router = useRouter();
const route = useRoute();

let divisions = ref(null);
let listNum = ref(1);
let currentPage = ref(1);

let sessionDivisions = JSON.parse(window.sessionStorage.getItem('divisions'));

if(!sessionDivisions || Object.keys(sessionDivisions).length < 1) {
    skapi.getRecords({
        table: {
            name: 'divisions',
            access_group: 99
        }
    },
    ).then(response => {
        divisions.value = response.list;
        displayDivisions(response.list)
    });
} else {
    divisions.value = sessionDivisions;
}

function displayDivisions(divisions) {
    let saveSession = {};

    divisions.forEach(division, index => {
        saveSession[division.record_id] = division;
    });

    window.sessionStorage.setItem('divisions', JSON.stringify(saveSession));
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
    margin-top: 3rem;
}

.go-detail {
    display: flex;
    align-items: center;
    gap: 16px;
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
        object-fit: cover;
    }
}
</style>