<template lang="pug">
h1.title 직원 상세

hr

p 사용자 ID: {{userId}}


br
br
br
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import { skapi } from '@/main';

import Loading from '@/components/loading.vue';

let router = useRouter();
let route = useRoute();

let loading = ref(false);

const props = defineProps(['userId']);

</script>

<style scoped lang="less">

</style>