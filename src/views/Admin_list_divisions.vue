<template lang="pug">
h1 부서(회사) 목록

hr

ul#divisions_list
    li(v-for="(division, i) in divisions")
        router-link(:to="{ name: 'edit-divisions', query: { record_id: division.record_id } }")
            img(v-if="division.bin && division.bin.division_logo" :src="division.bin['division_logo'][0].url")
            span {{ division.data.division_name }}
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import { skapi } from '@/main';

const router = useRouter();
const route = useRoute();

let divisions = ref(null);

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

    divisions.forEach(division => {
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
</style>