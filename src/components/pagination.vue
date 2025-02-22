<template lang="pug">
.pagination
  button.btn-prev.icon(type="button") 
      svg
          use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-back-ios")
      | Prev
  button.num 1
  button.num 2
  button.num 3
  button.num 4
  button.num 5
  button.btn-next.icon(type="button" @click="currentPage++;" :class="{'nonClickable': endOfList && currentPage >= maxPage }") Next
      svg
          use(xlink:href="@/assets/icon/material-icon.svg#icon-arrow-forward-ios")
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { skapi } from '@/main';
</script>

<style lang="less" scoped></style>
