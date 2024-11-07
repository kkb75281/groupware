<template lang="pug">
h1 부서(회사) 목록

hr

ul#divisions_list
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import { skapi } from '@/main';

const router = useRouter();
const route = useRoute();

skapi.getRecords({
    table: {
        name: 'divisions',
        access_group: 99
    }
},
).then(response => displayDivisions(response.list));

function displayDivisions(divisions) {
    const container = document.getElementById('divisions_list');
    divisions.forEach(division => {
        window.sessionStorage.setItem(division.record_id, JSON.stringify(division));
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.style = 'text-underline-offset: .5rem;'
        a.href = `edit-divisions?record_id=${division.record_id}`;
        a.innerHTML = /*html*/ `
                <span>${division.data.division_name}</span>
            `;
        // a.innerHTML = /*html*/ `
        //         <img src="${division.bin.division_logo[0].url}" alt="Company Logo" class="division-logo">
        //         <span>${division.data.division_name}</span>
        //     `;

            li.appendChild(a);
        container.appendChild(li);
    });
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