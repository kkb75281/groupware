<template lang="pug">
main#main
  h1 안녕하세요. 메인입니다.
</template>

<script setup lang="ts">

</script>

<style scoped lang="less">
#main {
    padding-top: var(--header-height);
    padding-left: var(--navbar-width);
    transition: padding-left 0.15s linear;
}
</style>