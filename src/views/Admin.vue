<template lang="pug">
.wrap
    router-view
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
</script>

<style scoped lang="less">

</style>