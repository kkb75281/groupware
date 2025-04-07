<template lang="pug">
table(:class="`table-${col}x${row}`")
    tr(v-for="i in row")
        td(v-for="j in col") {{ i }} - {{ j }}
</template>

<script setup>
    import { defineProps } from 'vue';

    const props = defineProps({
        col: Number,
        row: Number,
    });
</script>

<style scoped lang="less">
    td {
        border: 1px solid black;
    }
</style>